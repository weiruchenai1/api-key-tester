import { useState, useCallback, useRef, useMemo } from 'react';
import { useWebWorker, type KeyStatusUpdate, type LogEventPayload, type WorkerConfig } from './useWebWorker';
import type { KeyResult, KeyStatus } from '@/components/cards/KeyResultRow';
import type { KeyLog, LogEvent } from '@/types/log';

const VALID_KEY_STATUS: KeyStatus[] = ['valid', 'paid'];
const isStatus = (s: string): s is KeyStatus =>
  ['valid', 'invalid', 'rate-limited', 'paid', 'pending', 'retrying', 'cancelled'].includes(s);

const STAGE_MAP: Record<string, LogEvent['stage']> = {
  testStart: 'request',
  retryWait: 'retry',
  retryScheduled: 'retry',
  paidDetection: 'paidCheck',
  cancelled: 'error',
  final: 'final',
};

function toStage(s: string): LogEvent['stage'] {
  return STAGE_MAP[s] || 'response';
}

interface ConfigState {
  results: KeyResult[];
  logs: KeyLog[];
}

export function useApiTester(activeConfigId: string | null) {
  const [configStates, setConfigStates] = useState<Record<string, ConfigState>>({});
  const [testingConfigs, setTestingConfigs] = useState<Set<string>>(() => new Set());

  const stateKey = activeConfigId ?? '__none__';
  const current = configStates[stateKey] ?? { results: [], logs: [] };
  const isTesting = testingConfigs.has(stateKey);

  // ── Batching buffers ─────────────────────────────────────────────

  const keyUpdatesRef = useRef<Map<string, KeyStatusUpdate>>(new Map());
  const logBufferRef = useRef<LogEventPayload[]>([]);
  const rafIdRef = useRef<number | null>(null);
  const lastFlushRef = useRef(0);
  const activeConfigRef = useRef(stateKey);
  activeConfigRef.current = stateKey;
  // Locked to the config that started the current test — worker messages
  // route here regardless of which config the user navigates to mid-run.
  const testingConfigRef = useRef<string | null>(null);

  const markTesting = useCallback((cid: string, on: boolean) => {
    setTestingConfigs((prev) => {
      if (on === prev.has(cid)) return prev;
      const next = new Set(prev);
      if (on) next.add(cid);
      else next.delete(cid);
      return next;
    });
  }, []);

  const flushUpdates = useCallback((force = false) => {
    rafIdRef.current = null;
    if (!force) {
      const now = Date.now();
      if (now - lastFlushRef.current < 16) return;
    }
    lastFlushRef.current = Date.now();

    const updates = new Map(keyUpdatesRef.current);
    const logs = [...logBufferRef.current];
    keyUpdatesRef.current.clear();
    logBufferRef.current = [];

    if (updates.size === 0 && logs.length === 0) return;

    const cid = testingConfigRef.current ?? activeConfigRef.current;
    setConfigStates((prev) => {
      const existing = prev[cid] ?? { results: [], logs: [] };

      // Apply key updates
      let newResults = existing.results;
      if (updates.size > 0) {
        newResults = existing.results.map((r) => {
          const upd = updates.get(r.key);
          if (!upd) return r;
          return {
            ...r,
            status: isStatus(upd.status) ? upd.status : 'pending',
            statusCode: upd.statusCode,
          };
        });
      }

      // Apply log events
      let newLogs = existing.logs;
      if (logs.length > 0) {
        newLogs = [...existing.logs];
        for (const event of logs) {
          const entry: LogEvent = {
            id: crypto.randomUUID(),
            keyId: event.key,
            timestamp: Date.now(),
            stage: toStage(event.stage),
            attempt: event.attempt,
            message: event.message,
            requestUrl: event.requestUrl,
            responseBody: event.responseBody,
            duration: event.durationMs,
            statusCode: event.statusCode,
          };
          const idx = newLogs.findIndex((l) => l.keyId === event.key);
          if (idx >= 0) {
            newLogs[idx] = { ...newLogs[idx], events: [...newLogs[idx].events, entry] };
          } else {
            newLogs.push({ keyId: event.key, events: [entry] });
          }
        }
      }

      return { ...prev, [cid]: { results: newResults, logs: newLogs } };
    });
  }, []);

  const scheduleFlush = useCallback(() => {
    if (rafIdRef.current != null) return;
    rafIdRef.current = requestAnimationFrame(() => flushUpdates());
  }, [flushUpdates]);

  const setCurrent = useCallback(
    (patch: Partial<ConfigState> | ((prev: ConfigState) => ConfigState)) => {
      setConfigStates((prev) => {
        const existing = prev[activeConfigRef.current] ?? { results: [], logs: [] };
        const next = typeof patch === 'function' ? patch(existing) : { ...existing, ...patch };
        return { ...prev, [activeConfigRef.current]: next };
      });
    },
    [],
  );

  // Initialize results from keys for current config
  const initResults = useCallback(
    (keys: string[]) => {
      keyUpdatesRef.current.clear();
      logBufferRef.current = [];
      if (rafIdRef.current != null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      setCurrent({
        results: keys.map((key) => ({
          id: crypto.randomUUID(),
          key,
          status: 'pending' as const,
        })),
        logs: [],
      });
    },
    [setCurrent],
  );

  // Handle key status updates — batch them
  const handleKeyUpdate = useCallback((update: KeyStatusUpdate) => {
    keyUpdatesRef.current.set(update.key, update);
    scheduleFlush();
  }, [scheduleFlush]);

  // Handle log events — batch them
  const handleLogEvent = useCallback((event: LogEventPayload) => {
    logBufferRef.current.push(event);
    scheduleFlush();
  }, [scheduleFlush]);

  // Handle completion — flush immediately then clear the testing flag
  const handleComplete = useCallback(() => {
    if (rafIdRef.current != null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    flushUpdates(true);
    const cid = testingConfigRef.current;
    testingConfigRef.current = null;
    if (cid !== null) markTesting(cid, false);
  }, [flushUpdates, markTesting]);

  const { startTesting: startWorker, cancelTesting: cancelWorker } = useWebWorker({
    onKeyUpdate: handleKeyUpdate,
    onLogEvent: handleLogEvent,
    onComplete: handleComplete,
  });  // Start testing for current config
  const startTesting = useCallback(
    (config: WorkerConfig) => {
      // Single-worker invariant: refuse if a test is already in progress.
      if (testingConfigRef.current !== null) return;
      const cid = activeConfigRef.current;
      testingConfigRef.current = cid;
      initResults(config.keys);
      markTesting(cid, true);
      try {
        startWorker(config);
      } catch {
        testingConfigRef.current = null;
        markTesting(cid, false);
      }
    },
    [initResults, startWorker, markTesting],
  );  // Cancel testing — flush remaining then stop
  const cancelTesting = useCallback(() => {
    cancelWorker();
    if (rafIdRef.current != null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    flushUpdates(true);
    const cid = testingConfigRef.current;
    testingConfigRef.current = null;
    if (cid !== null) markTesting(cid, false);
  }, [cancelWorker, flushUpdates, markTesting]);

  // Clear current config's results and logs
  const clearResults = useCallback(() => {
    setCurrent({ results: [], logs: [] });
    const activeCid = activeConfigRef.current;
    // Only tear down shared worker state if we own the worker for THIS config;
    // otherwise another config's in-flight buffers must not be dropped.
    if (testingConfigRef.current === activeCid) {
      keyUpdatesRef.current.clear();
      logBufferRef.current = [];
      if (rafIdRef.current != null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      cancelWorker();
      testingConfigRef.current = null;
      markTesting(activeCid, false);
    }
  }, [setCurrent, cancelWorker, markTesting]);

  // Update a single result for current config
  const updateResult = useCallback(
    (key: string, patch: Partial<KeyResult>) => {
      setCurrent((prev) => ({
        ...prev,
        results: prev.results.map((r) => (r.key === key ? { ...r, ...patch } : r)),
      }));
    },
    [setCurrent],
  );

  // Derived stats from current config
  const stats = useMemo(
    () => ({
      total: current.results.length,
      valid: current.results.filter((r) => VALID_KEY_STATUS.includes(r.status as KeyStatus)).length,
      invalid: current.results.filter((r) => r.status === 'invalid').length,
      rateLimited: current.results.filter((r) => r.status === 'rate-limited').length,
      paid: current.results.filter((r) => r.status === 'paid').length,
    }),
    [current.results],
  );

  const progress = useMemo(
    () => ({
      testing: current.results.filter((r) => r.status === 'pending' || r.status === 'retrying').length,
      retrying: current.results.filter((r) => r.status === 'retrying').length,
    }),
    [current.results],
  );

  return {
    results: current.results,
    isTesting,
    logs: current.logs,
    stats,
    progress,
    startTesting,
    cancelTesting,
    clearResults,
    updateResult,
  };
}

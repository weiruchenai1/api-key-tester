import { useState, useEffect, useRef, useCallback } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { ProxyAndModelCard } from '@/components/cards/ProxyAndModelCard';
import { KeyListCard } from '@/components/cards/KeyListCard';
import { ActionButtons } from '@/components/cards/ActionButtons';
import { UsageNote } from '@/components/cards/UsageNote';
import { AdvancedSettingsTrigger } from '@/components/cards/AdvancedSettingsTrigger';
import { StatsCards } from '@/components/cards/StatsCards';
import { ProgressCards } from '@/components/cards/ProgressCards';
import { ResultsCard } from '@/components/cards/ResultsCard';
import { KeyLogModal } from '@/components/cards/KeyLogModal';
import { AdvancedSettingsModal, type AdvancedSettings } from '@/components/modals/AdvancedSettingsModal';
import { useConfig } from '@/hooks/useConfig';
import { useFileHandler } from '@/hooks/useFileHandler';
import { useModelFetcher } from '@/hooks/useModelFetcher';
import { useApiTester } from '@/hooks/useApiTester';
import { fetchBalance } from '@/services/api/tester';
import { useLanguage } from '@/hooks/useLanguage';
import { toast } from '@/lib/toast';
import { DEFAULT_ADVANCED } from '@/constants/defaults';
import type { KeyLog } from '@/types/log';

function parseExtraHeaders(raw: string): Record<string, string> {
  if (!raw?.trim()) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

export default function App() {
  const { t } = useLanguage();
  const { configs, activeConfig, activeConfigId, setActiveConfig, updateConfig } = useConfig();

  // ── API Tester ────────────────────────────────────────────────────

  const {
    results, isTesting, logs, stats, progress,
    startTesting, cancelTesting, clearResults, updateResult,
  } = useApiTester(activeConfigId);

  // ── Local working state ──────────────────────────────────────────

  const [proxyUrl, setProxyUrl] = useState(activeConfig?.proxyUrl || activeConfig?.baseUrl || '');
  const [model, setModel] = useState(activeConfig?.model ?? 'gpt-4o-mini');
  const [keysText, setKeysText] = useState(activeConfig?.apiKeys ?? '');
  const [advanced, setAdvanced] = useState<AdvancedSettings>(
    { ...DEFAULT_ADVANCED, ...(activeConfig?.advanced || {}) },
  );
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [detectedModels, setDetectedModels] = useState<string[]>([]);

  // ── Log state ────────────────────────────────────────────────────

  const [selectedLogKey, setSelectedLogKey] = useState<string | null>(null);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const selectedLog: KeyLog | null = logs.find((l) => l.keyId === selectedLogKey) ?? null;

  // ── File handler ─────────────────────────────────────────────────

  const { fileInputRef, handleFileUpload, handleFileChange, handlePaste } =
    useFileHandler({ onKeysLoaded: setKeysText, t });

  // ── Model fetcher ────────────────────────────────────────────────

  const { fetchModels, isFetching: isFetchingModels } = useModelFetcher({ t });

  const handleFetchModels = useCallback(async () => {
    const baseUrl = (proxyUrl || activeConfig?.baseUrl || '').trim();
    if (!baseUrl) { toast.error(t('emptyBaseUrl')); return; }
    const queryParamAuth = activeConfig?.queryParamAuth ?? false;
    const authHeader = (advanced.authHeader || '').trim();
    if (!queryParamAuth && !authHeader) { toast.error(t('emptyAuthHeader')); return; }
    // Use first key from the list for auth
    const firstKey = keysText.split('\n').map((l) => l.trim()).filter(Boolean)[0] || '';
    const models = await fetchModels(
      baseUrl, firstKey,
      authHeader,
      advanced.authPrefix ?? '',
      queryParamAuth,
    );
    if (models.length > 0) {
      setDetectedModels((prev) => Array.from(new Set([...prev, ...models])));
    }
  }, [activeConfig, proxyUrl, keysText, advanced, fetchModels, t]);

  const skipSaveRef = useRef(false);
  const lastConfigIdRef = useRef(activeConfigId);

  // ── Auto-select first config ─────────────────────────────────────

  useEffect(() => {
    if (configs.length > 0 && !activeConfigId) {
      setActiveConfig(configs[0].id);
    }
  }, [configs, activeConfigId, setActiveConfig]);

  // ── Sync config → local ──────────────────────────────────────────
  // Fires both on switch (activeConfigId change) and on content change of the
  // active config (e.g. user edits it in ConfigEditorModal). Uses primitive
  // values + a stringified advanced as deps so it doesn't re-fire on identity-only
  // changes from the reducer.
  const advancedSig = JSON.stringify(activeConfig?.advanced ?? null);
  useEffect(() => {
    if (activeConfig) {
      skipSaveRef.current = true;
      setProxyUrl(activeConfig.baseUrl || activeConfig.proxyUrl || '');
      setModel(activeConfig.model);
      setKeysText(activeConfig.apiKeys);
      setAdvanced({ ...DEFAULT_ADVANCED, ...(activeConfig.advanced || {}) });
      setIsCustomModel(false);
      // Reset detected models only when actually switching to a different config,
      // not when the same config's content changes (e.g. via ConfigEditorModal).
      if (lastConfigIdRef.current !== activeConfigId) {
        setDetectedModels([]);
        lastConfigIdRef.current = activeConfigId;
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeConfigId,
    activeConfig?.baseUrl,
    activeConfig?.proxyUrl,
    activeConfig?.model,
    activeConfig?.apiKeys,
    advancedSig,
  ]);

  // ── Debounce-save local → config ─────────────────────────────────

  useEffect(() => {
    if (!activeConfigId) return;
    if (skipSaveRef.current) { skipSaveRef.current = false; return; }
    const timer = setTimeout(() => {
      updateConfig(activeConfigId, { proxyUrl, model, apiKeys: keysText, advanced, baseUrl: proxyUrl });
    }, 300);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proxyUrl, model, keysText, advanced]);

  // ── Balance query after testing completes ────────────────────────

  // Keep latest refs for balance query effect
  const balanceRef = useRef({ proxyUrl, activeConfig, advanced, results, updateResult });
  balanceRef.current = { proxyUrl, activeConfig, advanced, results, updateResult };

  const prevTestingRef = useRef(isTesting);
  useEffect(() => {
    const { proxyUrl: pu, activeConfig: ac, advanced: adv, results: res, updateResult: upd } = balanceRef.current;
    const balanceEp = adv.balanceEndpoint;
    const baseUrl = pu || ac?.baseUrl || '';
    let abortController: AbortController | null = null;

    if (prevTestingRef.current && !isTesting && balanceEp && baseUrl) {
      const validKeys = res.filter(
        (r) => r.status === 'valid' || r.status === 'paid',
      );
      if (validKeys.length > 0) {
        abortController = new AbortController();
        const signal = abortController.signal;

        (async () => {
          for (const r of validKeys) {
            if (signal.aborted) return;
            try {
              const result = await fetchBalance(
                r.key,
                baseUrl,
                balanceEp,
                adv.authHeader,
                adv.authPrefix,
                signal,
              );
              if (signal.aborted) return;
              if (result.success && result.balance) {
                upd(r.key, { balance: result.balance });
              }
            } catch { /* skip */ }
          }
        })();
      }
    }
    prevTestingRef.current = isTesting;

    return () => {
      abortController?.abort();
    };
  }, [isTesting]);

  // ── Handlers ─────────────────────────────────────────────────────

  const handleStart = () => {
    if (isTesting) {
      cancelTesting();
      return;
    }
    const lines = keysText.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) { toast.error(t('enterApiKeysFirst')); return; }

    const baseUrl = (proxyUrl || activeConfig?.baseUrl || '').trim();
    if (!baseUrl) { toast.error(t('emptyBaseUrl')); return; }

    const endpoint = (advanced.testEndpoint || '').trim();
    if (!endpoint) { toast.error(t('emptyEndpoint')); return; }

    const queryParamAuth = activeConfig?.queryParamAuth ?? false;
    const authHeader = (advanced.authHeader || '').trim();
    if (!queryParamAuth && !authHeader) { toast.error(t('emptyAuthHeader')); return; }

    const extraHeaders = parseExtraHeaders(activeConfig?.extraHeaders ?? '');

    startTesting({
      keys: lines,
      config: {
        baseUrl,
        endpoint,
        model,
        authHeader,
        authPrefix: advanced.authPrefix ?? '',
        extraHeaders,
        queryParamAuth,
        provider: activeConfig?.provider,
        maxRetries: advanced.retries,
        concurrency: advanced.concurrency,
        enablePaidDetection: advanced.paidCheck,
        verboseLog: advanced.verboseLog,
      },
    });
  };

  const handleClear = () => {
    setKeysText('');
    setDetectedModels([]);
    clearResults();
    toast.success(t('cleared'));
  };

  const handleDedupe = () => {
    const lines = keysText.split('\n').map((l) => l.trim()).filter(Boolean);
    const unique = Array.from(new Set(lines));
    const removed = lines.length - unique.length;
    if (removed > 0) {
      setKeysText(unique.join('\n'));
      toast.success(t('dedupeSuccess', { removed, kept: unique.length }));
    } else {
      toast(t('noDuplicatesFound'));
    }
  };

  const handleStatusClick = useCallback((keyId: string) => {
    if (!advanced.verboseLog) return;
    setSelectedLogKey(keyId);
    setLogModalOpen(true);
  }, [advanced.verboseLog]);

  const showPaid = activeConfig?.provider === 'gemini' && advanced.paidCheck;

  return (
    <AppShell>
      <input ref={fileInputRef} type="file" accept=".txt" className="hidden" onChange={handleFileChange} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 xl:gap-8 max-w-[1376px] mx-auto">
        <div className="flex flex-col gap-4 min-w-0">
          <ProxyAndModelCard
            proxyUrl={proxyUrl}
            onProxyUrlChange={setProxyUrl}
            model={model}
            onModelChange={setModel}
            providerType={activeConfig?.provider ?? 'openai'}
            presetModels={activeConfig?.presetModels}
            detectedModels={detectedModels.join(', ')}
            isCustomModel={isCustomModel}
            onCustomize={() => setIsCustomModel((v) => !v)}
            onFetchModels={handleFetchModels}
            isFetchingModels={isFetchingModels}
          />
          <KeyListCard value={keysText} onChange={setKeysText} onUpload={handleFileUpload} onCopy={handlePaste} />
          <ActionButtons isTesting={isTesting} onStart={handleStart} onDedupe={handleDedupe} onClear={handleClear} />
          <UsageNote />
          <AdvancedSettingsTrigger onClick={() => setAdvancedOpen(true)} />
        </div>

        <div className="flex flex-col gap-4 min-w-0">
          <StatsCards values={stats} showPaid={showPaid} />
          <ProgressCards values={progress} />
          <ResultsCard
            results={results}
            onStatusClick={handleStatusClick}
            showPaidTab={showPaid}
          />
        </div>
      </div>

      <AdvancedSettingsModal
        open={advancedOpen} onClose={() => setAdvancedOpen(false)}
        settings={advanced} onChange={setAdvanced}
        provider={activeConfig?.provider}
      />

      {advanced.verboseLog && (
        <KeyLogModal open={logModalOpen} onClose={() => setLogModalOpen(false)} log={selectedLog} />
      )}
    </AppShell>
  );
}

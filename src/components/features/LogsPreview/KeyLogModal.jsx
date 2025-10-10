import React, { useEffect, useMemo, useState } from 'react';
import { useAppState } from '../../../contexts/AppStateContext';
import { useLanguage } from '../../../hooks/useLanguage';
import { getLogEntryByKey } from '../../../utils/logStorage';
import Modal from '../../common/Modal';
import Card from '../../common/Card';
import EmptyState from '../../common/EmptyState';

const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  try {
    return new Date(timestamp).toLocaleString();
  } catch (error) {
    return String(timestamp);
  }
};

const formatDuration = (ms) => {
  if (!ms && ms !== 0) return '';
  if (ms < 1000) return ms + ' ms';
  return (ms / 1000).toFixed(2) + ' s';
};

const tryParseJson = (str) => {
  try {
    return JSON.parse(str);
  } catch (error) {
    return null;
  }
};

const normalizePayload = (input) => {
  if (input == null) return input;

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      const parsed = tryParseJson(trimmed);
      if (parsed !== null) {
        return normalizePayload(parsed);
      }
    }
    return input;
  }

  if (Array.isArray(input)) {
    return input.map((item) => normalizePayload(item));
  }

  if (typeof input === 'object') {
    const result = {};
    Object.entries(input).forEach(([key, value]) => {
      result[key] = normalizePayload(value);
    });
    return result;
  }

  return input;
};

const stringify = (value) => {
  if (value == null) return '';

  const normalized = normalizePayload(value);

  if (typeof normalized === 'string') {
    return normalized;
  }

  try {
    return JSON.stringify(normalized, null, 2);
  } catch (error) {
    return String(normalized);
  }
};
const stageLabel = (stage, t) => {
  const labels = {
    test_start: t('logViewer.stages.testStart') || '开始测试',
    attempt_start: t('logViewer.stages.attemptStart') || '开始尝试',
    attempt_result: t('logViewer.stages.attemptResult') || '尝试结果',
    retry_wait: t('logViewer.stages.retryWait') || '等待重试',
    retry_scheduled: t('logViewer.stages.retryScheduled') || '准备重试',
    retry: t('logViewer.stages.retry') || '重试',
    attempt_exception: t('logViewer.stages.attemptException') || '尝试异常',
    paid_detection: t('logViewer.stages.paidDetection') || '付费检测',
    final: t('logViewer.stages.final') || '最终结果',
    cancelled: t('logViewer.stages.cancelled') || '已取消'
  };
  return labels[stage] || stage;
};

const statusLabel = (status, t) => {
  const map = {
    valid: t('statusValid') || '有效',
    success: t('statusValid') || '有效',
    paid: t('paidKeys') || '付费',
    free: t('logViewer.freeKey') || '免费',
    invalid: t('statusInvalid') || '无效',
    error: t('logViewer.errorStatus') || '错误',
    retrying: t('statusRetrying') || '重试中',
    testing: t('statusTesting') || '测试中',
    'rate-limited': t('statusRateLimit') || '速率限制',
    cancelled: t('logViewer.cancelled') || '已取消'
  };
  return map[status] || status;
};

const KeyLogModal = () => {
  const { state, dispatch } = useAppState();
  const { t } = useLanguage();

  const [persistedLog, setPersistedLog] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const isOpen = state.isLogModalOpen && state.showDetailedLogs;
  const activeKey = state.activeLogKey;
  const stateLogEntry = useMemo(() => {
    if (!activeKey) return null;
    const sourceLogs = state.logs || [];
    return sourceLogs.find((log) => log.key === activeKey || log.keyId === activeKey) || null;
  }, [activeKey, state.logs]);

  const logEntry = stateLogEntry || persistedLog;

  const events = useMemo(() => {
    if (!logEntry || !logEntry.events) return [];
    return [...(logEntry.events || [])]
      .filter((event) => event.stage !== 'test_start')
      .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  }, [logEntry]);

  useEffect(() => {
    let cancelled = false;

    if (!isOpen || !activeKey) {
      setPersistedLog(null);
      setIsLoading(false);
      return;
    }

    if (stateLogEntry) {
      setPersistedLog(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    getLogEntryByKey(activeKey)
      .then((entry) => {
        if (!cancelled) {
          setPersistedLog(entry || null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPersistedLog(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, activeKey, stateLogEntry]);

  if (!isOpen) return null;

  const handleClose = () => {
    dispatch({ type: 'CLOSE_LOG_MODAL' });
  };

  const finalStatus = logEntry && (logEntry.finalStatus || logEntry.status);
  const metadata = (logEntry && logEntry.metadata) || {};

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <>
          <div className="text-lg font-semibold text-primary">{t('logViewer.title') || '日志详情'}</div>
          <div className="text-secondary text-sm font-mono break-all">{activeKey}</div>
        </>
      }
      maxWidth="max-w-2xl"
      className="log-modal-content"
    >
      <div className="log-modal-body p-lg space-y-lg">
        {isLoading ? (
          <EmptyState message={t('loading') || '加载中...'} />
        ) : logEntry ? (
          <>
            <div className="grid gap-md grid-cols-1 md:grid-cols-2">
              <Card variant="base" padding="md">
                <div className="text-sm text-secondary mb-xs">{t('logViewer.summary.status') || '最终状态'}</div>
                <div className="text-base font-semibold">{statusLabel(finalStatus, t) || '-'}</div>
                {logEntry.totalDurationMs ? (
                  <div className="text-xs text-secondary mt-xs">
                    {(t('logViewer.summary.duration') || '总耗时') + ': ' + formatDuration(logEntry.totalDurationMs)}
                  </div>
                ) : null}
                <div className="text-xs text-secondary mt-xs">
                  {(t('logViewer.summary.attempts') || '尝试次数') + ': ' + (logEntry.attempts || events.length || 0)}
                </div>
                {logEntry.lastError && logEntry.lastError.message ? (
                  <div className="text-xs text-error mt-xs">{logEntry.lastError.message}</div>
                ) : null}
              </Card>

              <Card variant="base" padding="md">
                <div className="text-sm text-secondary mb-xs">{t('logViewer.summary.context') || '上下文'}</div>
                <div className="text-xs text-secondary">
                  {(t('selectApi') || '选择 API 类型') + ': ' + (logEntry.apiType || '-')}
                </div>
                <div className="flex items-center gap-md text-xs text-secondary">
                  <span>{(t('selectModel') || '测试模型') + ': ' + (logEntry.model || '-')}</span>
                  {metadata.enablePaidDetection ? (
                    <span>{t('paidDetectionEnabled') || '已开启付费检测'}</span>
                  ) : null}
                </div>
                {metadata.proxyUrl ? (
                  <div className="text-xs text-secondary">Proxy: {metadata.proxyUrl}</div>
                ) : null}
              </Card>
            </div>

            <div className="space-y-md">
              {events.length === 0 ? (
                <EmptyState message={t('logViewer.noEvents') || '暂无事件记录'} />
              ) : (
                events.map((event) => (
                  <Card key={event.id || event.timestamp} variant="base" padding="md">
                    <div className="flex items-center justify-between mb-sm">
                      <div>
                        <div className="text-sm font-semibold text-primary">{stageLabel(event.stage, t)}</div>
                        <div className="text-xs text-secondary">{formatTimestamp(event.timestamp)}</div>
                      </div>
                      <div className="text-xs text-secondary text-right">
                        {event.attempt ? (t('logViewer.attempt') || '尝试') + ' #' + event.attempt : null}
                        {event.durationMs != null ? <div>{(t('logViewer.duration') || '耗时') + ': ' + formatDuration(event.durationMs)}</div> : null}
                        {event.status ? <div>{statusLabel(event.status, t)}</div> : null}
                      </div>
                    </div>

                    {event.message ? (
                      <div className="text-sm text-secondary mb-sm whitespace-pre-wrap">{event.message}</div>
                    ) : null}

                    {event.error ? (
                      <div className="text-sm text-error mb-sm whitespace-pre-wrap">
                        {typeof event.error === 'string' ? event.error : stringify(event.error)}
                      </div>
                    ) : null}

                    {event.request ? (
                      <details className="mb-sm">
                        <summary className="text-sm font-semibold cursor-pointer">{t('logViewer.request') || '请求'}</summary>
                        <pre className="bg-surface mt-xs p-sm rounded text-xs overflow-x-auto whitespace-pre-wrap">{stringify(event.request)}</pre>
                      </details>
                    ) : null}

                    {event.response ? (
                      <details>
                        <summary className="text-sm font-semibold cursor-pointer">{t('logViewer.response') || '响应'}</summary>
                        <pre className="bg-surface mt-xs p-sm rounded text-xs overflow-x-auto whitespace-pre-wrap">{stringify(event.response)}</pre>
                      </details>
                    ) : null}
                  </Card>
                ))
              )}
            </div>
          </>
        ) : (
          <EmptyState message={t('logViewer.noData') || '暂无日志数据'} />
        )}
      </div>
    </Modal>
  );
};

export default KeyLogModal;

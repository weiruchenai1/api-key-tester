import React, { useMemo } from 'react';
import { useAppState } from '../../../contexts/AppStateContext';
import { useLanguage } from '../../../hooks/useLanguage';

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

const stringify = (value) => {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    return String(value);
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

  const isOpen = state.isLogModalOpen;
  const activeKey = state.activeLogKey;
  const logEntry = useMemo(() => {
    if (!activeKey) return null;
    const sourceLogs = state.logs || [];
    return sourceLogs.find((log) => log.key === activeKey || log.keyId === activeKey) || null;
  }, [activeKey, state.logs]);

  const events = useMemo(() => {
    if (!logEntry || !logEntry.events) return [];
    return [...logEntry.events].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  }, [logEntry]);

  if (!isOpen) return null;

  const handleClose = () => {
    dispatch({ type: 'CLOSE_LOG_MODAL' });
  };

  const finalStatus = logEntry && (logEntry.finalStatus || logEntry.status);
  const metadata = (logEntry && logEntry.metadata) || {};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex: 10000 }} onClick={handleClose}>
      <div className="card-base w-full max-w-4xl max-h-90vh overflow-y-auto m-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-lg border-b">
          <div>
            <h3 className="text-lg font-semibold text-primary">{t('logViewer.title') || '日志详情'}</h3>
            <div className="text-secondary text-sm font-mono break-all">{activeKey}</div>
          </div>
          <button
            className="btn-base btn-ghost btn-sm w-8 h-8 flex items-center justify-center"
            onClick={handleClose}
            aria-label={t('close') || '关闭'}
          >
            ×
          </button>
        </div>

        <div className="p-lg space-y-lg">
          {logEntry ? (
            <>
              <div className="grid gap-md grid-cols-1 md:grid-cols-2">
                <div className="card-base card-padding">
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
                </div>

                <div className="card-base card-padding">
                  <div className="text-sm text-secondary mb-xs">{t('logViewer.summary.context') || '上下文'}</div>
                  <div className="text-xs text-secondary">
                    {(t('selectApi') || '选择 API 类型') + ': ' + (logEntry.apiType || '-')}
                  </div>
                  <div className="text-xs text-secondary">
                    {(t('selectModel') || '测试模型') + ': ' + (logEntry.model || '-')}
                  </div>
                  {metadata.proxyUrl ? (
                    <div className="text-xs text-secondary">Proxy: {metadata.proxyUrl}</div>
                  ) : null}
                  {metadata.enablePaidDetection ? (
                    <div className="text-xs text-secondary">{t('paidDetectionEnabled') || '已开启付费检测'}</div>
                  ) : null}
                </div>
              </div>

              <div className="space-y-md">
                {events.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-text">{t('logViewer.noEvents') || '暂无事件记录'}</div>
                  </div>
                ) : (
                  events.map((event) => (
                    <div key={event.id || event.timestamp} className="card-base card-padding">
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
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-state-text">{t('logViewer.noData') || '暂无日志数据'}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KeyLogModal;

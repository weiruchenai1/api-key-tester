import React, { useState } from 'react';
import { useLanguage } from '../../../hooks/useLanguage';
import { useAppState } from '../../../contexts/AppStateContext';
import Modal from '../../common/Modal';

const PaidDetectionControl = () => {
  const { t } = useLanguage();
  const { state, dispatch } = useAppState();
  const [showResetModal, setShowResetModal] = useState(false);

  const handleTogglePaidDetection = () => {
    const newValue = !state.enablePaidDetection;
    dispatch({ type: 'SET_PAID_DETECTION', payload: newValue });

    // 同时更新本地存储
    localStorage.setItem('enablePaidDetection', JSON.stringify(newValue));

    // 如果用户之前设置了不再提示，更新默认设置
    const promptDisabled = localStorage.getItem('geminiPaidDetectionPromptDisabled') === 'true';
    if (promptDisabled) {
      localStorage.setItem('geminiPaidDetectionDefault', newValue.toString());
    }
  };

  // 重置弹窗提示设置
  const handleResetPrompt = () => {
    setShowResetModal(true);
  };

  const confirmResetPrompt = () => {
    localStorage.removeItem('geminiPaidDetectionPromptDisabled');
    localStorage.removeItem('geminiPaidDetectionDefault');
    setShowResetModal(false);
  };

  return (
    <div className="space-y-lg">
      <div className="space-y-sm">
        <label className="text-sm font-medium text-primary">
          Gemini付费检测
        </label>
        <div className="space-y-sm">
          <div className="flex items-center gap-sm">
            <label className="switch-base">
              <input
                type="checkbox"
                checked={state.enablePaidDetection}
                onChange={handleTogglePaidDetection}
                className="switch-input"
              />
              <span className="switch-slider"></span>
            </label>
            <span className="text-sm text-secondary">
              {state.enablePaidDetection ? t('paidDetectionEnabled') : t('paidDetectionDisabled')}
            </span>
          </div>
          <p className="text-xs text-tertiary">
            启用后将使用Cache API检测Gemini密钥的付费功能，会消耗额外配额
          </p>
        </div>
      </div>

      {/* 弹窗设置重置 */}
      <div className="space-y-sm">
        <label className="text-sm font-medium text-primary">
          弹窗提示设置
        </label>
        <div className="space-y-sm">
          <button
            className="btn-base btn-sm btn-ghost"
            onClick={handleResetPrompt}
          >
            重置弹窗提示
          </button>
          <p className="text-xs text-tertiary">
            重置后，下次选择Gemini时将重新显示付费检测询问弹窗
          </p>
        </div>
      </div>

      {/* 当前状态显示 */}
      {state.apiType === 'gemini' && (
        <div className="card-base card-padding-sm bg-secondary">
          <div className="flex items-center justify-between mb-xs">
            <span className="text-xs text-tertiary">当前API类型:</span>
            <span className="text-xs font-medium text-primary">Gemini</span>
          </div>
          <div className="flex items-center justify-between mb-xs">
            <span className="text-xs text-tertiary">付费检测状态:</span>
            {state.enablePaidDetection ? (
              <span className="text-xs text-success flex items-center gap-xs">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 12 2 2 4-4" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
                {t('paidDetectionEnabled')}
              </span>
            ) : (
              <span className="text-xs text-error flex items-center gap-xs">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="m15 9-6 6" />
                  <path d="m9 9 6 6" />
                </svg>
                {t('paidDetectionDisabled')}
              </span>
            )}
          </div>
          {state.enablePaidDetection && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-tertiary">固定模型:</span>
              <span className="text-xs font-medium text-primary">gemini-2.5-flash</span>
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={confirmResetPrompt}
        title="重置弹窗提示设置"
        message="确定要重置弹窗提示设置吗？重置后，下次选择Gemini时将重新显示付费检测询问弹窗。"
        confirmText="确定"
        cancelText="取消"
      />
    </div>
  );
};

export default PaidDetectionControl;

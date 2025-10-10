import React, { useState } from 'react';
import { useLanguage } from '../../../hooks/useLanguage';
import { useAppState } from '../../../contexts/AppStateContext';
import { PAID_DETECTION_KEYS } from '../../../constants/localStorage';
import Modal from '../../common/Modal';
import Button from '../../common/Button';
import Card from '../../common/Card';

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
    const promptDisabled = localStorage.getItem(PAID_DETECTION_KEYS.GEMINI_PROMPT_DISABLED) === 'true';
    if (promptDisabled) {
      localStorage.setItem(PAID_DETECTION_KEYS.GEMINI_DEFAULT_SETTING, newValue.toString());
    }
  };

  // 重置弹窗提示设置
  const handleResetPrompt = () => {
    setShowResetModal(true);
  };

  const confirmResetPrompt = () => {
    localStorage.removeItem(PAID_DETECTION_KEYS.GEMINI_PROMPT_DISABLED);
    localStorage.removeItem(PAID_DETECTION_KEYS.GEMINI_DEFAULT_SETTING);
    setShowResetModal(false);
  };

  return (
    <div className="space-y-lg">
      <div className="space-y-sm">
        <label className="text-sm font-medium text-primary">
          {t('paidDetection')}
        </label>
        <div className="space-y-sm">
          <div className="flex items-center gap-sm">
            <label className="switch-base">
              <input
                type="checkbox"
                checked={state.enablePaidDetection}
                onChange={handleTogglePaidDetection}
                disabled={state.isTesting}
                className="switch-input"
              />
              <span className="switch-slider"></span>
            </label>
            <span className="text-sm text-secondary">
              {state.enablePaidDetection ? t('paidDetectionEnabled') : t('paidDetectionDisabled')}
            </span>
          </div>
          <p className="text-xs text-tertiary">
            {t('paidDetectionSettings.description')}
          </p>
        </div>
      </div>

      {/* 弹窗设置重置 */}
      <div className="space-y-sm">
        <label className="text-sm font-medium text-primary">
          {t('paidDetectionSettings.popupSettings')}
        </label>
        <div className="space-y-sm">
          <Button
            variant="ghost"
            size="small"
            onClick={handleResetPrompt}
            disabled={state.isTesting}
          >
            {t('paidDetectionSettings.resetPopup')}
          </Button>
          <p className="text-xs text-tertiary">
            {t('paidDetectionSettings.resetDescription')}
          </p>
        </div>
      </div>

      {/* 当前状态显示 */}
      {state.apiType === 'gemini' && (
        <Card variant="base" padding="sm" className="bg-secondary">
          <div className="flex items-center justify-between mb-xs">
            <span className="text-xs text-tertiary">{t('paidDetectionSettings.currentApiType')}:</span>
            <span className="text-xs font-medium text-primary">Gemini</span>
          </div>
          <div className="flex items-center justify-between mb-xs">
            <span className="text-xs text-tertiary">{t('paidDetectionSettings.detectionStatus')}:</span>
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
              <span className="text-xs text-tertiary">{t('paidDetectionSettings.fixedModel')}:</span>
              <span className="text-xs font-medium text-primary">gemini-2.5-flash</span>
            </div>
          )}
        </Card>
      )}

      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={confirmResetPrompt}
        title={t('paidDetectionSettings.resetModalTitle')}
        message={t('paidDetectionSettings.resetModalMessage')}
        confirmText={t('paidDetectionSettings.confirm')}
        cancelText={t('paidDetectionSettings.cancel')}
        type="confirm"
      />
    </div>
  );
};

export default PaidDetectionControl;

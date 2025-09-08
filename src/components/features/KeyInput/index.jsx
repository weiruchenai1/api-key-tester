import React from 'react';
import { useAppState } from '../../../contexts/AppStateContext';
import FileImport from './FileImport';
import PasteButton from './PasteButton';
import { useLanguage } from '../../../hooks/useLanguage';

const KeyInput = () => {
  const { t } = useLanguage();
  const { state, dispatch } = useAppState();

  const handleTextareaChange = (e) => {
    dispatch({ type: 'SET_API_KEYS_TEXT', payload: e.target.value });
  };

  return (
    <div className="space-y-sm">
      <div className="flex items-center justify-between">
        <label htmlFor="apiKeys" className="text-sm font-medium text-primary">{t('apiKeys')}</label>
        <div className="flex items-center gap-xs">
          <FileImport />
        </div>
      </div>
      <div className="relative">
        <textarea
          id="apiKeys"
          className="form-field min-h-32 pr-12"
          placeholder={t('apiKeysPlaceholder')}
          value={state.apiKeysText}
          onChange={handleTextareaChange}
          disabled={state.isTesting}
        />
        <PasteButton />
      </div>
    </div>
  );
};

export default KeyInput;

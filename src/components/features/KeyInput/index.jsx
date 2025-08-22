import React from 'react';
import TextareaInput from './TextareaInput';
import FileImport from './FileImport';
import PasteButton from './PasteButton';
import { useLanguage } from '../../../hooks/useLanguage';

const KeyInput = () => {
  const { t } = useLanguage();

  return (
    <div className="input-group">
      <div className="label-with-import">
        <label htmlFor="apiKeys">{t('apiKeys')}</label>
        <FileImport />
      </div>
      <div className="textarea-wrapper">
        <TextareaInput />
        <PasteButton />
      </div>
    </div>
  );
};

export default KeyInput;

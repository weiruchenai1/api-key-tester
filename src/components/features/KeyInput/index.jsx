import React from 'react';
import TextareaInput from './TextareaInput';
import FileImport from './FileImport';
import PasteButton from './PasteButton';
import { useLanguage } from '../../../hooks/useLanguage';
import styles from './KeyInput.module.css';

const KeyInput = () => {
  const { t } = useLanguage();

  return (
    <div className="input-group">
      <div className={styles.labelWithControls}>
        <label htmlFor="apiKeys">{t('apiKeys')}</label>
        <div className={styles.inputControls}>
          <FileImport />
        </div>
      </div>
      <div className={styles.textareaWrapper}>
        <TextareaInput />
        <PasteButton />
      </div>
    </div>
  );
};

export default KeyInput;

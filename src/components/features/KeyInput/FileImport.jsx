import React, { useRef } from 'react';
import { useLanguage } from '../../../hooks/useLanguage';
import { useAppState } from '../../../contexts/AppStateContext';
import { useFileHandler } from '../../../hooks/useFileHandler';
import styles from './KeyInput.module.css';

const FileImport = () => {
  const { t } = useLanguage();
  const { state } = useAppState();
  const { importFile } = useFileHandler();
  const fileInputRef = useRef(null);

  const handleImportClick = () => {
    if (state.isTesting) return;
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      importFile(file);
    }
    e.target.value = '';
  };

  return (
    <>
      <button
        className={`${styles.controlBtn} ${styles.importBtn}`}
        onClick={handleImportClick}
        disabled={state.isTesting}
        title={t('importFile')}
      >
        📁
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
    </>
  );
};

export default FileImport;

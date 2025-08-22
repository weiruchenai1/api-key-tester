import React, { useRef } from 'react';
import { useLanguage } from '../../../hooks/useLanguage';
import { useAppState } from '../../../contexts/AppStateContext';
import { useFileHandler } from '../../../hooks/useFileHandler';

const FileImport = () => {
  const { t } = useLanguage();
  const { state } = useAppState();
  const { importFile } = useFileHandler(); // 移除isImporting，因为它没被使用
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
        className="import-btn"
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

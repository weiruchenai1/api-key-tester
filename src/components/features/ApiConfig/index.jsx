import React from 'react';
import ApiTypeSelector from './ApiTypeSelector';
import ModelSelector from './ModelSelector';
import ProxySettings from './ProxySettings';
import styles from './ApiConfig.module.css';

const ApiConfig = () => {
  return (
    <div className={styles.apiConfig}>
      <ApiTypeSelector />
      <div className={styles.urlModelRow}>
        <ProxySettings />
        <ModelSelector />
      </div>
    </div>
  );
};

export default ApiConfig;

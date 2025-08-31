import React from 'react';
import ModelSelector from './ModelSelector';
import ProxySettings from './ProxySettings';
import styles from './ApiConfig.module.css';

const ApiConfig = () => {
  return (
    <div className={styles.apiConfig}>
      <div className={styles.urlModelRow}>
        <ProxySettings />
        <ModelSelector />
      </div>
    </div>
  );
};

export default ApiConfig;

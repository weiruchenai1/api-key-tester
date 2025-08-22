import React from 'react';
import ApiTypeSelector from './ApiTypeSelector';
import ModelSelector from './ModelSelector';
import ProxySettings from './ProxySettings';
import './ApiConfig.module.css';

const ApiConfig = () => {
  return (
    <div className="api-config">
      <ApiTypeSelector />
      <ModelSelector />
      <ProxySettings />
    </div>
  );
};

export default ApiConfig;

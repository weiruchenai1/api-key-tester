import React from 'react';
import ModelSelector from './ModelSelector';
import ProxySettings from './ProxySettings';

const ApiConfig = () => {
  return (
    <div className="space-y-md">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
        <ProxySettings />
        <ModelSelector />
      </div>
    </div>
  );
};

export default ApiConfig;

import React, { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { AppStateProvider } from './contexts/AppStateContext';
import AppLayout from './components/layout/AppLayout';
import ApiConfig from './components/features/ApiConfig';
import KeyInput from './components/features/KeyInput';
import Controls from './components/features/Controls';
import Results from './components/features/Results';
import AdvancedSettings from './components/features/AdvancedSettings';
import { useLanguage } from './hooks/useLanguage';

const AppContent = () => {
  const { t } = useLanguage();
  const [isAdvancedSettingsOpen, setIsAdvancedSettingsOpen] = useState(false);

  // 左侧功能区
  const leftPanel = (
    <div>
      <div className="function-card">
        <ApiConfig />
      </div>
      
      <div className="function-card">
        <KeyInput />
      </div>

      <div className="function-card">
        <Controls />
      </div>

      <div className="function-card usage-card">
        <strong>{t('usageTitle')}</strong>
        <br />{t('usage1')}
        <br />{t('usage2')}
      </div>

      <div className="function-card settings-card">
        <button 
          className="settings-button"
          onClick={() => setIsAdvancedSettingsOpen(true)}
        >
          高级设置
          <span className="settings-icon">⚙️</span>
        </button>
      </div>
    </div>
  );

  // 右侧状态区
  const rightPanel = (
    <Results />
  );

  return (
    <>
      <AppLayout>
        {{
          leftPanel,
          rightPanel
        }}
      </AppLayout>
      <AdvancedSettings 
        isOpen={isAdvancedSettingsOpen}
        onClose={() => setIsAdvancedSettingsOpen(false)}
      />
    </>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppStateProvider>
          <AppContent />
        </AppStateProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;

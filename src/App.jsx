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
    <div className="input-section">
      <ApiConfig />
      
      <div style={{marginTop: '20px'}}>
        <KeyInput />
      </div>

      <div style={{marginTop: '20px'}}>
        <Controls />
      </div>

      <div className="alert" style={{marginTop: '20px'}}>
        <strong>{t('usageTitle')}</strong>
        <br />{t('usage1')}
        <br />{t('usage2')}
      </div>

      <button 
        style={{
          marginTop: '20px',
          padding: '12px 0', 
          fontSize: '18px', 
          fontWeight: '600',
          color: 'var(--text-color)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          borderRadius: '8px',
          transition: 'background-color 0.2s ease'
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-secondary)'}
        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
        onClick={() => setIsAdvancedSettingsOpen(true)}
      >
        高级设置
        <span style={{fontSize: '12px'}}>⚙️</span>
      </button>
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

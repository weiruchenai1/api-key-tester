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
import ToastProvider from './components/common/ToastProvider';
import Card from './components/common/Card';
import { useLanguage } from './hooks/useLanguage';

const AppContent = () => {
  const { t } = useLanguage();
  const [isAdvancedSettingsOpen, setIsAdvancedSettingsOpen] = useState(false);

  const leftPanel = (
    <div>
      <Card variant="function">
        <ApiConfig />
      </Card>

      <Card variant="function">
        <KeyInput />
      </Card>

      <Controls />

      <Card variant="usage">
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" />
            <path d="m9 12 2 2 4-4" />
          </svg>
          <strong>{t('usageTitle')}</strong>
        </div>
        <div>{t('usage1')}</div>
        <div>{t('usage2')}</div>
      </Card>

      <button
        className="btn--settings"
        onClick={() => setIsAdvancedSettingsOpen(true)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="m12 1v6m0 6v6" />
          <path d="m17.196 6.804 4.243-4.243" />
          <path d="m6.804 17.196-4.243 4.243" />
          <path d="m6.804 6.804-4.243-4.243" />
          <path d="m17.196 17.196 4.243 4.243" />
          <path d="m1 12h6m6 0h6" />
        </svg>
        {t('advancedSettings')}
      </button>
    </div>
  );

  const rightPanel = <Results />;

  return (
    <>
      <ToastProvider />
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

import React from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { AppStateProvider } from './contexts/AppStateContext';
import AppLayout from './components/layout/AppLayout';
import ApiConfig from './components/features/ApiConfig';
import KeyInput from './components/features/KeyInput';
import ConcurrencyControl from './components/features/ConcurrencyControl';
import RetryControl from './components/features/RetryControl';
import Controls from './components/features/Controls';
import Results from './components/features/Results';
import { useLanguage } from './hooks/useLanguage';

const AppContent = () => {
  const { t } = useLanguage();

  return (
    <AppLayout>
      <div className="input-section">
        <ApiConfig />
        <KeyInput />
        <ConcurrencyControl />
        <RetryControl />

        <div className="alert">
          <strong>{t('usageTitle')}</strong>
          <br />{t('usage1')}
          <br />{t('usage2')}
        </div>

        <Controls />
      </div>

      <Results />
    </AppLayout>
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

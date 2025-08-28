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

  // 左侧功能区
  const leftPanel = (
    <>
      <div className="input-section">
        <ApiConfig />
      </div>

      <div className="input-section">
        <KeyInput />
      </div>

      <Controls />

      <div className="input-section">
        <div className="alert">
          <strong>{t('usageTitle')}</strong>
          <br />{t('usage1')}
          <br />{t('usage2')}
        </div>
      </div>

      <div className="input-section">
        <details style={{cursor: 'pointer'}}>
          <summary style={{
            padding: '12px 0', 
            fontSize: '18px', 
            fontWeight: '600',
            color: 'var(--text-color)',
            listStyle: 'none',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            高级设置
            <span style={{fontSize: '12px', transition: 'transform 0.3s ease'}}>▼</span>
          </summary>
          <div style={{paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px'}}>
            <div>
              <h4 style={{margin: '0 0 12px 0', color: 'var(--text-color)', fontSize: '16px', fontWeight: '500'}}>
                并发控制
              </h4>
              <ConcurrencyControl />
            </div>
            <div>
              <h4 style={{margin: '0 0 12px 0', color: 'var(--text-color)', fontSize: '16px', fontWeight: '500'}}>
                重试控制
              </h4>
              <RetryControl />
            </div>
          </div>
        </details>
      </div>
    </>
  );

  // 右侧状态区
  const rightPanel = (
    <Results />
  );

  return (
    <AppLayout>
      {{
        leftPanel,
        rightPanel
      }}
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

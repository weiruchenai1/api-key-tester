import React from 'react';
import { useTheme } from '../../../hooks/useTheme';
import { useLanguage } from '../../../hooks/useLanguage';
import styles from './ThemeToggle.module.css';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage } = useLanguage();

  return (
    <div className={styles.themeControls}>
      <button
        type="button"
        className={styles.controlBtn}
        onClick={toggleLanguage}
        title={language === 'zh' ? 'Switch to English' : '切换到中文'}
      >
        🌐
      </button>
      <button
        type="button"
        className={styles.controlBtn}
        onClick={toggleTheme}
        title={theme === 'light' ? '切换到深色模式' : '切换到浅色模式'}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
    </div>
  );
};

export default ThemeToggle;

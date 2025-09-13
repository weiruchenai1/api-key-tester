import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../../hooks/useTheme';
import { useLanguage } from '../../../hooks/useLanguage';
import styles from './NavBar.module.css';

const NavBar = ({ onSidebarToggle, isSidebarCollapsed }) => {
  const { theme, toggleTheme, setTheme, actualTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const languageRef = useRef(null);
  const themeRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (languageRef.current && !languageRef.current.contains(event.target)) {
        setShowLanguageMenu(false);
      }
      if (themeRef.current && !themeRef.current.contains(event.target)) {
        setShowThemeMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleThemeChange = (newTheme) => {
    if (setTheme) {
      setTheme(newTheme);
    } else {
      toggleTheme();
    }
    setShowThemeMenu(false);
  };

  const handleSidebarToggle = () => {
    if (onSidebarToggle) {
      onSidebarToggle(!isSidebarCollapsed);
    }
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.navbarContent}>
        {/* Left side - Sidebar Toggle + Project Identity */}
        <div className={styles.leftSection}>
          <button
            className={styles.sidebarToggle}
            onClick={handleSidebarToggle}
            aria-label={isSidebarCollapsed ? t('ui.expandSidebar') : t('ui.collapseSidebar')}
            title={isSidebarCollapsed ? t('ui.expandSidebar') : t('ui.collapseSidebar')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>

          <div className={styles.brandSection}>
            <div className={styles.brandIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.keyIcon}>
                <circle cx="7.5" cy="15.5" r="5.5" />
                <path d="m21 2-9.6 9.6" />
                <path d="m15.5 7.5 3 3L22 7l-3-3" />
              </svg>
            </div>
            <span className={styles.brandText}>{t('appTitle')}</span>
          </div>
        </div>

        {/* Right side - Action Group */}
        <div className={styles.actionGroup}>
          {/* GitHub Link */}
          <button className={styles.actionBtn}>
            <a
              href="https://github.com/weiruchenai1/api-key-tester"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.githubLink}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                <path d="M9 18c-4.51 2-5-2-7-2" />
              </svg>
            </a>
          </button>

          {/* Language Switcher */}
          <div className={styles.dropdown} ref={languageRef}>
            <button
              type="button"
              className={styles.comboboxBtn}
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                <path d="M2 12h20" />
              </svg>
              <span>{language === 'zh' ? t('ui.chineseName') : t('ui.englishName')}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.chevron}>
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            {showLanguageMenu && (
              <div className={styles.dropdownMenu}>
                <button
                  className={`${styles.dropdownItem} ${language === 'en' ? styles.active : ''}`}
                  onClick={() => {
                    if (language !== 'en') toggleLanguage();
                    setShowLanguageMenu(false);
                  }}
                >
                  <span>{t('ui.englishName')}</span>
                  {language === 'en' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={styles.checkIcon}>
                      <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
                    </svg>
                  )}
                </button>
                <button
                  className={`${styles.dropdownItem} ${language === 'zh' ? styles.active : ''}`}
                  onClick={() => {
                    if (language !== 'zh') toggleLanguage();
                    setShowLanguageMenu(false);
                  }}
                >
                  <span>{t('ui.chineseName')}</span>
                  {language === 'zh' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={styles.checkIcon}>
                      <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
                    </svg>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Theme Switcher */}
          <div className={styles.dropdown} ref={themeRef}>
            <button
              type="button"
              className={styles.comboboxBtn}
              onClick={() => setShowThemeMenu(!showThemeMenu)}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`${styles.sunIcon} ${actualTheme === 'dark' ? styles.hidden : styles.visible}`}
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 3v1" />
                <path d="M12 20v1" />
                <path d="M3 12h1" />
                <path d="M20 12h1" />
                <path d="m18.364 5.636-.707.707" />
                <path d="m6.343 17.657-.707.707" />
                <path d="m5.636 5.636.707.707" />
                <path d="m17.657 17.657.707.707" />
              </svg>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`${styles.moonIcon} ${actualTheme === 'dark' ? styles.visible : styles.hidden}`}
              >
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.chevron}>
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            {showThemeMenu && (
              <div className={styles.dropdownMenu}>
                <button
                  className={`${styles.dropdownItem} ${theme === 'light' ? styles.active : ''}`}
                  onClick={() => handleThemeChange('light')}
                >
                  <div className={styles.themeItem}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="4" />
                      <path d="M12 3v1" />
                      <path d="M12 20v1" />
                      <path d="M3 12h1" />
                      <path d="M20 12h1" />
                      <path d="m18.364 5.636-.707.707" />
                      <path d="m6.343 17.657-.707.707" />
                      <path d="m5.636 5.636.707.707" />
                      <path d="m17.657 17.657.707.707" />
                    </svg>
                    <span>{t('lightMode')}</span>
                  </div>
                  {theme === 'light' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={styles.checkIcon}>
                      <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
                    </svg>
                  )}
                </button>
                <button
                  className={`${styles.dropdownItem} ${theme === 'dark' ? styles.active : ''}`}
                  onClick={() => handleThemeChange('dark')}
                >
                  <div className={styles.themeItem}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                    </svg>
                    <span>{t('darkMode')}</span>
                  </div>
                  {theme === 'dark' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={styles.checkIcon}>
                      <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
                    </svg>
                  )}
                </button>
                <button
                  className={`${styles.dropdownItem} ${theme === 'system' ? styles.active : ''}`}
                  onClick={() => handleThemeChange('system')}
                >
                  <div className={styles.themeItem}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <rect x="2" y="3" width="20" height="14" rx="2" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                    <span>{t('systemMode')}</span>
                  </div>
                  {theme === 'system' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={styles.checkIcon}>
                      <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
                    </svg>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
export default NavBar;
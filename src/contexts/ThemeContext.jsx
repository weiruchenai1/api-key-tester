import React, { createContext, useState, useEffect, useCallback } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('system');
  const [actualTheme, setActualTheme] = useState('light');

  // Function to get system theme preference
  const getSystemTheme = useCallback(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }, []);

  // Function to resolve the actual theme based on user preference
  const resolveActualTheme = useCallback((userTheme) => {
    if (userTheme === 'system') {
      return getSystemTheme();
    }
    return userTheme;
  }, [getSystemTheme]);

  useEffect(() => {
    // Load theme setting from local storage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setTheme(savedTheme);
    } else {
      setTheme('system');
    }
  }, []);

  useEffect(() => {
    // Update actual theme when user theme changes or system preference changes
    const newActualTheme = resolveActualTheme(theme);
    setActualTheme(newActualTheme);
  }, [theme, resolveActualTheme]); // 现在 resolveActualTheme 被 useCallback 包装，可以安全添加

  // 其余代码保持不变...
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        setActualTheme(getSystemTheme());
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme, getSystemTheme]);

  useEffect(() => {
    if (actualTheme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
    localStorage.setItem('theme', theme);
  }, [actualTheme, theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const value = {
    theme,
    setTheme,
    toggleTheme,
    actualTheme,
    isDark: actualTheme === 'dark'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

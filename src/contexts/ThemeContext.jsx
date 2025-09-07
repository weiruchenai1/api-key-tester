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
  // 优化系统主题监听器，确保兼容性和正确清理
  useEffect(() => {
    if (theme !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      setActualTheme(e.matches ? 'dark' : 'light');
    };
    
    // 设置初始值
    setActualTheme(mediaQuery.matches ? 'dark' : 'light');
    
    // 现代浏览器优先使用addEventListener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // 兼容旧浏览器
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [theme]);

  useEffect(() => {
    if (actualTheme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
    localStorage.setItem('theme', theme);
  }, [actualTheme, theme]);

  // 修复后的主题切换逻辑，支持三个选项循环
  const toggleTheme = () => {
    setTheme(prev => {
      const themes = ['light', 'dark', 'system'];
      const currentIndex = themes.indexOf(prev);
      return themes[(currentIndex + 1) % themes.length];
    });
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

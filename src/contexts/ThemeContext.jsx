import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('system'); // Default to system
  const [actualTheme, setActualTheme] = useState('light'); // The actual applied theme

  // Function to get system theme preference
  const getSystemTheme = () => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  // Function to resolve the actual theme based on user preference
  const resolveActualTheme = (userTheme) => {
    if (userTheme === 'system') {
      return getSystemTheme();
    }
    return userTheme;
  };

  useEffect(() => {
    // Load theme setting from local storage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setTheme(savedTheme);
    } else {
      // Default to system theme
      setTheme('system');
    }
  }, []);

  useEffect(() => {
    // Update actual theme when user theme changes or system preference changes
    const newActualTheme = resolveActualTheme(theme);
    setActualTheme(newActualTheme);
  }, [theme]);

  useEffect(() => {
    // Listen for system theme changes only when theme is set to 'system'
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        setActualTheme(getSystemTheme());
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  useEffect(() => {
    // Apply theme to body class
    if (actualTheme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }

    // Save to local storage
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

import React, { createContext, useState, useEffect } from 'react';
import { TRANSLATIONS } from '../constants/translations';

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('zh');

  useEffect(() => {
    // 从本地存储加载语言设置
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && ['zh', 'en'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    } else {
      // 检测浏览器语言
      const browserLang = navigator.language.toLowerCase();
      const detectedLang = browserLang.startsWith('zh') ? 'zh' : 'en';
      setLanguage(detectedLang);
    }
  }, []);

  useEffect(() => {
    // 保存到本地存储
    localStorage.setItem('language', language);

    // 更新HTML lang属性
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'zh' ? 'en' : 'zh');
  };

  const t = (key, params = {}) => {
    let translation = TRANSLATIONS[language]?.[key] || key;

    // 简单的参数替换
    Object.keys(params).forEach(param => {
      translation = translation.replace(`{${param}}`, params[param]);
    });

    return translation;
  };

  const value = {
    language,
    toggleLanguage,
    t,
    isZh: language === 'zh'
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

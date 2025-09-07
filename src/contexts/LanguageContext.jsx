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
      // 增强的浏览器语言检测
      const detectLanguageFromBrowser = () => {
        // 检查多个可能的语言来源
        const languages = [
          navigator.language,
          navigator.languages?.[0],
          navigator.userLanguage, // IE
          navigator.browserLanguage, // IE
          'en' // 最终fallback
        ].filter(Boolean);
        
        // 查找第一个匹配的语言
        for (const lang of languages) {
          const normalizedLang = lang.toLowerCase();
          if (normalizedLang.startsWith('zh')) {
            return 'zh';
          }
          if (normalizedLang.startsWith('en')) {
            return 'en';
          }
        }
        
        return 'en'; // 默认英文
      };
      
      setLanguage(detectLanguageFromBrowser());
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

  // 增强的翻译函数，支持嵌套键和错误处理
  const t = (key, params = {}) => {
    try {
      let translation;
      
      // 支持嵌套键访问，例如 'common.button.save'
      if (key.includes('.')) {
        const keys = key.split('.');
        translation = TRANSLATIONS[language];
        
        for (const k of keys) {
          if (translation && typeof translation === 'object') {
            translation = translation[k];
          } else {
            translation = undefined;
            break;
          }
        }
      } else {
        // 简单键访问
        translation = TRANSLATIONS[language]?.[key];
      }
      
      // 如果没找到翻译，使用fallback
      if (translation === undefined || translation === null) {
        translation = key; // 返回原始key作为fallback
      }
      
      // 参数替换
      if (typeof translation === 'string' && Object.keys(params).length > 0) {
        Object.keys(params).forEach(param => {
          const placeholder = new RegExp(`\\{${param}\\}`, 'g');
          translation = translation.replace(placeholder, params[param]);
        });
      }
      
      return translation;
    } catch (error) {
      console.warn(`Translation error for key: ${key}`, error);
      return key; // 发生错误时返回原始key
    }
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

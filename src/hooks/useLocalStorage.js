import { useState } from 'react';

/**
 * 自定义Hook用于本地存储
 * @param {string} key - localStorage的键名
 * @param {*} initialValue - 初始值
 * @returns {[value, setValue]} - 返回值和设置函数
 */
export const useLocalStorage = (key, initialValue) => {
  // 从localStorage获取初始值
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`读取localStorage失败 (key: ${key}):`, error);
      return initialValue;
    }
  });

  // 设置值到state和localStorage
  const setValue = (value) => {
    try {
      // 允许值为函数形式，类似useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);

      // 保存到localStorage
      if (valueToStore === undefined) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`保存到localStorage失败 (key: ${key}):`, error);
    }
  };

  return [storedValue, setValue];
};

/**
 * 用户配置管理Hook
 */
export const useUserConfig = () => {
  // API配置
  const [apiType, setApiType] = useLocalStorage('apiType', 'openai');
  const [proxyUrl, setProxyUrl] = useLocalStorage('proxyUrl', '');
  const [testModel, setTestModel] = useLocalStorage('testModel', 'gpt-4o');
  const [customModel, setCustomModel] = useLocalStorage('customModel', '');
  const [isCustomModel, setIsCustomModel] = useLocalStorage('isCustomModel', false);

  // 高级设置
  const [concurrency, setConcurrency] = useLocalStorage('concurrency', 3);
  const [maxRetries, setMaxRetries] = useLocalStorage('maxRetries', 2);
  const [retryDelay, setRetryDelay] = useLocalStorage('retryDelay', 1000);

  // 主题和语言设置
  const [theme, setTheme] = useLocalStorage('theme', 'system');
  const [language, setLanguage] = useLocalStorage('language', 'zh');

  // Gemini付费检测设置
  const [enablePaidDetection, setEnablePaidDetection] = useLocalStorage('enablePaidDetection', false);

  // API密钥历史记录（最多保存10个最近使用的代理URL）
  const [recentProxyUrls, setRecentProxyUrls] = useLocalStorage('recentProxyUrls', []);

  // 添加到最近使用的代理URL
  const addRecentProxyUrl = (url) => {
    if (!url || url.trim() === '') return;

    setRecentProxyUrls(prev => {
      const filtered = prev.filter(item => item !== url);
      const updated = [url, ...filtered].slice(0, 10); // 最多保存10个
      return updated;
    });
  };

  // 清除所有配置
  const clearAllConfig = () => {
    const keys = [
      'apiType', 'proxyUrl', 'testModel', 'customModel', 'isCustomModel',
      'concurrency', 'maxRetries', 'retryDelay', 'theme', 'language',
      'enablePaidDetection', 'recentProxyUrls'
    ];

    keys.forEach(key => {
      try {
        window.localStorage.removeItem(key);
      } catch (error) {
        console.warn(`清除配置失败 (key: ${key}):`, error);
      }
    });

    // 重新加载页面以应用默认设置
    window.location.reload();
  };

  // 导出配置
  const exportConfig = () => {
    const config = {
      apiType, proxyUrl, testModel, customModel, isCustomModel,
      concurrency, maxRetries, retryDelay, theme, language,
      enablePaidDetection, recentProxyUrls,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };

    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `api-key-tester-config-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 导入配置
  const importConfig = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const config = JSON.parse(e.target.result);

          // 验证配置格式
          if (!config.version) {
            throw new Error('无效的配置文件格式');
          }

          // 应用配置
          if (config.apiType) setApiType(config.apiType);
          if (config.proxyUrl !== undefined) setProxyUrl(config.proxyUrl);
          if (config.testModel) setTestModel(config.testModel);
          if (config.customModel !== undefined) setCustomModel(config.customModel);
          if (config.isCustomModel !== undefined) setIsCustomModel(config.isCustomModel);
          if (config.concurrency) setConcurrency(config.concurrency);
          if (config.maxRetries !== undefined) setMaxRetries(config.maxRetries);
          if (config.retryDelay) setRetryDelay(config.retryDelay);
          if (config.theme) setTheme(config.theme);
          if (config.language) setLanguage(config.language);
          if (config.enablePaidDetection !== undefined) setEnablePaidDetection(config.enablePaidDetection);
          if (config.recentProxyUrls) setRecentProxyUrls(config.recentProxyUrls);

          resolve('配置导入成功');
        } catch (error) {
          reject('配置文件格式错误: ' + error.message);
        }
      };
      reader.onerror = () => reject('文件读取失败');
      reader.readAsText(file);
    });
  };

  return {
    // API配置
    apiType, setApiType,
    proxyUrl, setProxyUrl,
    testModel, setTestModel,
    customModel, setCustomModel,
    isCustomModel, setIsCustomModel,

    // 高级设置
    concurrency, setConcurrency,
    maxRetries, setMaxRetries,
    retryDelay, setRetryDelay,

    // 主题和语言
    theme, setTheme,
    language, setLanguage,

    // Gemini付费检测
    enablePaidDetection, setEnablePaidDetection,

    // 代理URL历史
    recentProxyUrls,
    addRecentProxyUrl,

    // 配置管理
    clearAllConfig,
    exportConfig,
    importConfig
  };
};

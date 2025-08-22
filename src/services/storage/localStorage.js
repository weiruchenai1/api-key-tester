export const storage = {
  // 获取数据
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn('localStorage get error:', error);
      return defaultValue;
    }
  },

  // 设置数据
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn('localStorage set error:', error);
      return false;
    }
  },

  // 删除数据
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('localStorage remove error:', error);
      return false;
    }
  },

  // 清空所有数据
  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.warn('localStorage clear error:', error);
      return false;
    }
  },

  // 检查是否支持localStorage
  isSupported() {
    try {
      const testKey = '__localStorage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }
};

// 应用特定的存储方法
export const appStorage = {
  // 保存主题设置
  saveTheme(theme) {
    return storage.set('theme', theme);
  },

  // 获取主题设置
  getTheme() {
    return storage.get('theme', 'light');
  },

  // 保存语言设置
  saveLanguage(language) {
    return storage.set('language', language);
  },

  // 获取语言设置
  getLanguage() {
    return storage.get('language', 'zh');
  },

  // 保存用户配置
  saveConfig(config) {
    return storage.set('config', config);
  },

  // 获取用户配置
  getConfig() {
    return storage.get('config', {});
  },

  // 保存测试历史
  saveTestHistory(history) {
    try {
      // 只保留最近的100条记录
      const limitedHistory = history.slice(-100);
      return storage.set('testHistory', limitedHistory);
    } catch (error) {
      console.warn('保存测试历史失败:', error);
      return false;
    }
  },

  // 获取测试历史
  getTestHistory() {
    return storage.get('testHistory', []);
  }
};

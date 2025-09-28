/**
 * localStorage 键名常量
 * 统一管理所有localStorage键名，避免硬编码和拼写错误
 */

export const STORAGE_PREFIX = 'akt';
const k = (s) => `${STORAGE_PREFIX}:${s}`;

// 付费检测相关
export const PAID_DETECTION_KEYS = Object.freeze({
  // Gemini付费检测弹窗是否已禁用
  GEMINI_PROMPT_DISABLED: k('gemini:promptDisabled'),
  // Gemini付费检测默认设置
  GEMINI_DEFAULT_SETTING: k('gemini:defaultSetting'),
});

// 用户配置相关
export const USER_CONFIG_KEYS = Object.freeze({
  // 主题设置
  THEME: k('user:theme'),
  // 语言设置
  LANGUAGE: k('user:language'),
  // 并发设置
  CONCURRENCY: k('user:concurrency'),
  // 重试设置
  RETRY_SETTINGS: k('user:retrySettings'),
});

// 测试结果相关
export const TEST_RESULT_KEYS = Object.freeze({
  // 测试历史
  TEST_HISTORY: k('test:history'),
  // 最后一次测试结果
  LAST_TEST_RESULTS: k('test:lastResults'),
});

// 高级设置相关
export const ADVANCED_SETTINGS_KEYS = Object.freeze({
  // 日志设置
  LOG_SETTINGS: k('advanced:logSettings'),
  // 代理设置
  PROXY_SETTINGS: k('advanced:proxySettings'),
});
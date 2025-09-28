/**
 * localStorage 键名常量
 * 统一管理所有localStorage键名，避免硬编码和拼写错误
 */

// 付费检测相关
export const PAID_DETECTION_KEYS = {
  // Gemini付费检测弹窗是否已禁用
  GEMINI_PROMPT_DISABLED: 'geminiPaidDetectionPromptDisabled',
  // Gemini付费检测默认设置
  GEMINI_DEFAULT_SETTING: 'geminiPaidDetectionDefault',
};

// 用户配置相关
export const USER_CONFIG_KEYS = {
  // 主题设置
  THEME: 'theme',
  // 语言设置
  LANGUAGE: 'language',
  // 并发设置
  CONCURRENCY: 'concurrency',
  // 重试设置
  RETRY_SETTINGS: 'retrySettings',
};

// 测试结果相关
export const TEST_RESULT_KEYS = {
  // 测试历史
  TEST_HISTORY: 'testHistory',
  // 最后一次测试结果
  LAST_TEST_RESULTS: 'lastTestResults',
};

// 高级设置相关
export const ADVANCED_SETTINGS_KEYS = {
  // 日志设置
  LOG_SETTINGS: 'logSettings',
  // 代理设置
  PROXY_SETTINGS: 'proxySettings',
};
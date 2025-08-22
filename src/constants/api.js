export const MODEL_OPTIONS = {
  openai: [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo',
    'gpt-4',
    'gpt-3.5-turbo'
  ],
  claude: [
    'claude-3-5-sonnet-20241022',
    'claude-3-5-haiku-20241022',
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307'
  ],
  gemini: [
    'gemini-2.0-flash',
    'gemini-2.5-flash',
    'gemini-2.5-pro'
  ]
};

export const PROXY_EXAMPLES = {
  openai: 'https://openai.weiruchenai.me/v1',
  claude: 'https://claude.weiruchenai.me/v1',
  gemini: 'https://gemini.weiruchenai.me/v1beta'
};

export const DEFAULT_PROXIES = {
  openai: 'https://openai.weiruchenai.me/v1',
  claude: 'https://claude.weiruchenai.me/v1',
  gemini: 'https://gemini.weiruchenai.me/v1beta'
};

export const API_ENDPOINTS = {
  openai: {
    chat: '/chat/completions',
    models: '/models'
  },
  claude: {
    messages: '/messages'
  },
  gemini: {
    generateContent: (model) => `/models/${model}:generateContent`,
    models: '/models'
  }
};

export const CONCURRENCY_PRESETS = [
  { key: 'slow', value: 1 },
  { key: 'normal', value: 5 },
  { key: 'fast', value: 10 },
  { key: 'ultra', value: 20 }
];

export const RETRY_PRESETS = [
  { key: 'noRetry', value: 0 },
  { key: 'lightRetry', value: 2 },
  { key: 'normalRetry', value: 3 },
  { key: 'heavyRetry', value: 5 }
];

export const STATUS_COLORS = {
  valid: '#28a745',
  invalid: '#dc3545',
  'rate-limited': '#ffc107',
  testing: '#6f42c1',
  retrying: '#fd7e14',
  pending: '#6c757d'
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR: '网络连接失败',
  TIMEOUT_ERROR: '请求超时',
  PARSE_ERROR: 'JSON解析失败',
  AUTH_ERROR: '认证失败',
  RATE_LIMIT_ERROR: '速率限制',
  QUOTA_ERROR: '配额不足',
  PERMISSION_ERROR: '权限不足',
  INVALID_MODEL_ERROR: '无效模型',
  UNKNOWN_ERROR: '未知错误'
};

export const HTTP_STATUS_MESSAGES = {
  400: '请求参数错误',
  401: '认证失败',
  403: '权限不足',
  404: '接口不存在',
  429: '请求过于频繁',
  500: '服务器内部错误',
  502: '网关错误',
  503: '服务不可用',
  504: '网关超时'
};

export const REQUEST_CONFIG = {
  timeout: 30000, // 30秒超时
  retryDelay: {
    min: 300,
    max: 800
  },
  maxRetries: 10,
  retryableStatusCodes: [403, 429, 502, 503, 504]
};

export const PERFORMANCE_CONFIG = {
  virtualListItemHeight: 80,
  virtualListOverscan: 5,
  batchUpdateSize: 50,
  debounceDelay: 300,
  throttleLimit: 100
};

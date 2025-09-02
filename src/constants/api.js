export const MODEL_OPTIONS = {
  openai: [
    'gpt-4o-mini',
    'gpt-4.1-mini',
    'gpt-4.1-nano',
    'gpt-5',
    'gpt-5-mini',
    'gpt-5-nano'
  ],
  claude: [
    'claude-3-5-haiku-20241022',
    'claude-3-7-sonnet-20250219',
    'claude-sonnet-4-20250514',
    'claude-opus-4-20250514',
    'claude-opus-4-1-20250805'
  ],
  gemini: [
    'gemini-2.0-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.5-pro'
  ],
  deepseek: [
    'deepseek-chat',
    'deepseek-reasoner'
  ],
  siliconcloud: [
    'deepseek-ai/DeepSeek-V3',
    'deepseek-ai/DeepSeek-R1',
    'Qwen/QwQ-32B',
    'Qwen/Qwen3-235B-A22B'
  ],
  xai: [
    'grok-2-1212',
    'grok-2-vision-1212',
    'grok-3',
    'grok-3-fast',
    'grok-3-mini',
    'grok-3-mini-fast',
    'grok-4-0709'
  ],
  openrouter: [
    'deepseek/deepseek-chat-v3.1:free'
  ]
};

export const PROXY_EXAMPLES = {
  openai: 'https://openai.weiruchenai.me/v1',
  claude: 'https://claude.weiruchenai.me/v1',
  gemini: 'https://gemini.weiruchenai.me/v1beta',
  deepseek: 'https://api.deepseek.com/v1',
  siliconcloud: 'https://api.siliconflow.cn/v1',
  xai: 'https://api.x.ai/v1',
  openrouter: 'https://openrouter.ai/api/v1'
};

export const DEFAULT_PROXIES = {
  openai: 'https://openai.weiruchenai.me/v1',
  claude: 'https://claude.weiruchenai.me/v1',
  gemini: 'https://gemini.weiruchenai.me/v1beta',
  deepseek: 'https://api.deepseek.com/v1',
  siliconcloud: 'https://api.siliconflow.cn/v1',
  xai: 'https://api.x.ai/v1',
  openrouter: 'https://openrouter.ai/api/v1'
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
  },
  deepseek: {
    chat: '/chat/completions',
    models: '/models'
  },
  siliconcloud: {
    chat: '/chat/completions',
    models: '/models'
  },
  xai: {
    chat: '/chat/completions',
    models: '/models'
  },
  openrouter: {
    chat: '/chat/completions',
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

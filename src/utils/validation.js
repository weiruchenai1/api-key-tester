export const validateApiKey = (key, apiType) => {
  if (!key || typeof key !== 'string') {
    return { valid: false, error: 'API密钥不能为空' };
  }

  const trimmedKey = key.trim();

  if (trimmedKey.length === 0) {
    return { valid: false, error: 'API密钥不能为空' };
  }

  // 基本长度检查
  if (trimmedKey.length < 15) {
    return { valid: false, error: 'API密钥长度过短' };
  }

  // API类型特定验证
  switch (apiType) {
    case 'openai':
    case 'claude':
      if (!trimmedKey.startsWith('sk-')) {
        return { valid: false, error: 'OpenAI/Claude API密钥必须以sk-开头' };
      }
      if (trimmedKey.length < 40) {
        return { valid: false, error: 'OpenAI/Claude API密钥长度不足' };
      }
      break;
    case 'gemini':
      if (!trimmedKey.startsWith('AIzaSy')) {
        return { valid: false, error: 'Gemini API密钥必须以AIzaSy开头' };
      }
      if (trimmedKey.length < 35) {
        return { valid: false, error: 'Gemini API密钥长度不足' };
      }
      break;
    default:
      return { valid: false, error: '不支持的API类型' };
  }

  // 检查是否包含非法字符
  const validPattern = /^[a-zA-Z0-9\-_]+$/;
  if (!validPattern.test(trimmedKey)) {
    return { valid: false, error: 'API密钥包含非法字符' };
  }

  return { valid: true, key: trimmedKey };
};

export const validateProxyUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return { valid: true }; // 代理URL可以为空
  }

  const trimmedUrl = url.trim();
  if (trimmedUrl === '') {
    return { valid: true };
  }

  try {
    const urlObj = new URL(trimmedUrl);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { valid: false, error: '代理URL必须使用HTTP或HTTPS协议' };
    }
    return { valid: true, url: trimmedUrl };
  } catch {
    return { valid: false, error: '代理URL格式无效' };
  }
};

export const validateModel = (model, apiType) => {
  if (!model || typeof model !== 'string') {
    return { valid: false, error: '模型名称不能为空' };
  }

  const trimmedModel = model.trim();
  if (trimmedModel === '') {
    return { valid: false, error: '模型名称不能为空' };
  }

  // 模型名称基本验证
  const validPattern = /^[a-zA-Z0-9\-_.]+$/;
  if (!validPattern.test(trimmedModel)) {
    return { valid: false, error: '模型名称包含非法字符' };
  }

  return { valid: true, model: trimmedModel };
};

export const validateConcurrency = (concurrency) => {
  const num = parseInt(concurrency);

  if (isNaN(num)) {
    return { valid: false, error: '并发数必须为数字' };
  }

  if (num < 1) {
    return { valid: false, error: '并发数不能小于1' };
  }

  if (num > 100) {
    return { valid: false, error: '并发数不能大于100' };
  }

  return { valid: true, concurrency: num };
};

export const validateRetryCount = (retryCount) => {
  const num = parseInt(retryCount);

  if (isNaN(num)) {
    return { valid: false, error: '重试次数必须为数字' };
  }

  if (num < 0) {
    return { valid: false, error: '重试次数不能小于0' };
  }

  if (num > 10) {
    return { valid: false, error: '重试次数不能大于10' };
  }

  return { valid: true, retryCount: num };
};

export const validateBatchSize = (batchSize) => {
  const num = parseInt(batchSize);

  if (isNaN(num)) {
    return { valid: false, error: '批次大小必须为数字' };
  }

  if (num < 1) {
    return { valid: false, error: '批次大小不能小于1' };
  }

  if (num > 1000) {
    return { valid: false, error: '批次大小不能大于1000' };
  }

  return { valid: true, batchSize: num };
};

export const validateFormData = (formData) => {
  const errors = {};

  // 验证API类型
  if (!formData.apiType) {
    errors.apiType = 'API类型不能为空';
  }

  // 验证模型
  const modelValidation = validateModel(formData.model, formData.apiType);
  if (!modelValidation.valid) {
    errors.model = modelValidation.error;
  }

  // 验证代理URL
  const proxyValidation = validateProxyUrl(formData.proxyUrl);
  if (!proxyValidation.valid) {
    errors.proxyUrl = proxyValidation.error;
  }

  // 验证并发数
  const concurrencyValidation = validateConcurrency(formData.concurrency);
  if (!concurrencyValidation.valid) {
    errors.concurrency = concurrencyValidation.error;
  }

  // 验证重试次数
  const retryValidation = validateRetryCount(formData.retryCount);
  if (!retryValidation.valid) {
    errors.retryCount = retryValidation.error;
  }

  // 验证API密钥
  if (!formData.apiKeysText || formData.apiKeysText.trim() === '') {
    errors.apiKeysText = 'API密钥列表不能为空';
  } else {
    const keys = formData.apiKeysText.split('\n').filter(k => k.trim());
    if (keys.length === 0) {
      errors.apiKeysText = '未找到有效的API密钥';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

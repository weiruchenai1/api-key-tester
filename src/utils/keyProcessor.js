export const deduplicateAndCleanKeys = (keys) => {
  const seen = new Set();
  const uniqueKeys = [];
  const duplicates = [];

  keys.forEach(key => {
    const cleanKey = key.trim();
    if (cleanKey && !seen.has(cleanKey)) {
      seen.add(cleanKey);
      uniqueKeys.push(cleanKey);
    } else if (cleanKey && seen.has(cleanKey)) {
      duplicates.push(cleanKey);
    }
  });

  return { uniqueKeys, duplicates };
};

export const validateApiKey = (key, apiType) => {
  if (!key || typeof key !== 'string') {
    return { valid: false, reason: 'empty' };
  }

  const trimmedKey = key.trim();

  if (trimmedKey.length === 0) {
    return { valid: false, reason: 'empty' };
  }

  // 基本长度检查
  if (trimmedKey.length < 15) {
    return { valid: false, reason: 'too_short' };
  }

  // API类型特定验证
  switch (apiType) {
    case 'openai':
    case 'claude':
      if (!trimmedKey.startsWith('sk-')) {
        return { valid: false, reason: 'invalid_format' };
      }
      break;
    case 'gemini':
      if (!trimmedKey.startsWith('AIzaSy')) {
        return { valid: false, reason: 'invalid_format' };
      }
      break;
    default:
      // 未知API类型
      return { valid: false, reason: 'unknown_api_type' };
  }

  return { valid: true, key: trimmedKey };
};

export const parseApiKeysText = (text) => {
  if (!text || typeof text !== 'string') {
    return [];
  }

  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
};

export const formatKeyForDisplay = (key, maxLength = 20) => {
  if (!key || typeof key !== 'string') {
    return '';
  }

  if (key.length <= maxLength) {
    return key;
  }

  const start = Math.ceil(maxLength / 2) - 2;
  const end = Math.floor(maxLength / 2) - 2;

  return key.substring(0, start) + '...' + key.substring(key.length - end);
};

export const countKeysByStatus = (keyResults) => {
  const counts = {
    total: keyResults.length,
    valid: 0,
    invalid: 0,
    rateLimited: 0,
    testing: 0,
    retrying: 0,
    pending: 0
  };

  keyResults.forEach(keyResult => {
    switch (keyResult.status) {
      case 'valid':
        counts.valid++;
        break;
      case 'invalid':
        counts.invalid++;
        break;
      case 'rate-limited':
        counts.rateLimited++;
        break;
      case 'testing':
        counts.testing++;
        break;
      case 'retrying':
        counts.retrying++;
        break;
      case 'pending':
        counts.pending++;
        break;
      default:
        // 添加这个 default case
        console.warn('Unknown status:', keyResult.status);
        break;
    }
  });

  return counts;
};


export const filterKeysByStatus = (keyResults, status) => {
  if (status === 'all') {
    return keyResults;
  }

  return keyResults.filter(keyResult => keyResult.status === status);
};

export const exportKeysAsText = (keyResults, status = 'all') => {
  const filteredKeys = filterKeysByStatus(keyResults, status);
  return filteredKeys.map(keyResult => keyResult.key).join('\n');
};

export const generateTestReport = (keyResults) => {
  const counts = countKeysByStatus(keyResults);
  const timestamp = new Date().toISOString();

  const report = {
    timestamp,
    summary: counts,
    details: keyResults.map(keyResult => ({
      key: formatKeyForDisplay(keyResult.key),
      status: keyResult.status,
      error: keyResult.error,
      retryCount: keyResult.retryCount || 0
    }))
  };

  return report;
};

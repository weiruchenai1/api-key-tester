export const extractApiKeys = (content) => {
  const keys = [];

  if (!content || typeof content !== 'string') {
    return keys;
  }

  // 直接从原始内容中提取API密钥，不要预先清理
  const extractedKeys = extractKeysFromContent(content);

  // 对每个提取的密钥进行清理和验证
  for (let key of extractedKeys) {
    const cleanedKey = cleanApiKey(key);
    if (cleanedKey && cleanedKey.length >= 15) {
      keys.push(cleanedKey);
    }
  }

  // 去重并返回
  const uniqueKeys = [...new Set(keys)];

  // 按长度排序，长的密钥优先 (通常更可能是有效的)
  return uniqueKeys.sort((a, b) => b.length - a.length);
};

const extractKeysFromContent = (content) => {
  const keys = [];

  // 简化正则表达式，移除可能的转义问题
  const openaiPattern = /sk-[a-zA-Z0-9_-]{30,}/g;
  const geminiPattern = /AIzaSy[a-zA-Z0-9_-]{30,}/g;
  const genericPattern = /(?:sk-|gsk_|api_|key_|token_|pk-)[a-zA-Z0-9_-]{20,}/g;

  let matches;

  // 检查OpenAI/Claude密钥
  matches = content.match(openaiPattern);
  if (matches) {
    keys.push(...matches);
  }

  // 检查Gemini密钥
  matches = content.match(geminiPattern);
  if (matches) {
    keys.push(...matches);
  }

  // 如果没有找到特定格式的密钥，尝试通用模式
  if (keys.length === 0) {
    matches = content.match(genericPattern);
    if (matches) {
      keys.push(...matches);
    }
  }

  // 最后尝试匹配长字符串
  if (keys.length === 0) {
    const longStringPattern = /[a-zA-Z0-9_-]{25,}/g;
    matches = content.match(longStringPattern);
    if (matches) {
      const filteredMatches = matches.filter(match => {
        return !/^[0-9]+$/.test(match) && !/^[a-zA-Z]+$/.test(match);
      });
      keys.push(...filteredMatches);
    }
  }

  return keys;
};

const cleanApiKey = (key) => {
  // 移除中文字符和特殊符号，只保留英文字母、数字、短横线、下划线
  let cleaned = key.replace(/[^\w-]/g, '');

  // 进一步验证清理后的密钥
  if (cleaned.length < 15) {
    return null; // 太短的密钥可能不是有效的API密钥
  }

  // 检查是否包含足够的字母数字组合
  const hasLetters = /[a-zA-Z]/.test(cleaned);
  const hasNumbers = /[0-9]/.test(cleaned);

  if (!hasLetters || !hasNumbers) {
    return null; // API密钥通常包含字母和数字
  }

  return cleaned;
};

export const validateFileType = (file) => {
  if (!file) {
    return { valid: false, reason: 'no_file' };
  }

  const fileName = file.name.toLowerCase();
  const isTextFile = fileName.endsWith('.txt') ||
    file.type === 'text/plain' ||
    file.type === '';

  if (!isTextFile) {
    return { valid: false, reason: 'invalid_type' };
  }

  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { valid: false, reason: 'too_large' };
  }

  return { valid: true };
};

export const readFileAsText = (file) => {
  return new Promise((resolve, reject) => {
    const validation = validateFileType(file);
    if (!validation.valid) {
      reject(new Error(`文件验证失败: ${validation.reason}`));
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      resolve(e.target.result);
    };

    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };

    reader.readAsText(file, 'UTF-8');
  });
};

export const exportResultsAsJson = (keyResults, summary) => {
  const data = {
    timestamp: new Date().toISOString(),
    summary,
    results: keyResults
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json'
  });

  return blob;
};

export const downloadFile = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const TRANSLATIONS = {
  zh: {
    // 页面标题
    title: '🔑 API Key 测活工具',
    subtitle: '批量检测 Gemini、Claude、GPT API 密钥有效性',

    // API配置
    selectApi: '选择 API 类型',
    selectModel: '测试模型',
    customModel: '自定义',
    presetModel: '预设',
    modelHelp: '可以选择预设模型或输入自定义模型名',
    modelInputPlaceholder: '输入自定义模型名',
    detectedModelsTitle: '检测到的可用模型',
    proxyUrl: '代理服务器 URL (可选)',
    proxyHelp: '留空使用默认代理，建议使用自己的反向代理以提高成功率',

    // 控制设置
    concurrencyControl: '并发控制',
    retryControl: '重试控制',
    retryHelp: '遇到临时错误(如403)时重试次数，有助于提高检测准确性',
    slow: '慢速',
    normal: '正常',
    fast: '快速',
    ultra: '极速',
    noRetry: '不重试',
    lightRetry: '轻度',
    normalRetry: '正常',
    heavyRetry: '重度',

    // 输入相关
    apiKeys: 'API 密钥列表 (每行一个)',
    apiKeysPlaceholder: '请输入API密钥，每行一个：\nsk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nsk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n...',
    import: '导入',
    importing: '导入中',
    importFile: '导入文件',
    paste: '粘贴',
    pasting: '粘贴中',

    // 操作按钮
    detectModels: '检测模型',
    startTest: '开始测试',
    cancelTest: '取消测试',
    dedupeKeys: '去重密钥',
    clear: '清空',

    // 状态显示
    testing: '正在测试 API 密钥...',
    detecting: '正在检测可用模型...',
    completed: '测试完成',
    total: '总计',
    valid: '有效',
    invalid: '无效',
    rateLimited: '速率限制',  // 添加这个缺失的翻译
    testingLabel: '测试中',
    retrying: '重试中',
    pending: '等待中',

    // 结果标签
    all: '全部',
    validKeys: '有效密钥',
    invalidKeys: '无效密钥',
    rateLimitedKeys: '速率限制',
    copyResults: '复制结果',
    copyAll: '复制全部',
    copyValid: '复制有效密钥',
    copyInvalid: '复制无效密钥',
    copyRateLimited: '复制速率限制密钥',

    // 状态文本
    statusValid: '有效',
    statusInvalid: '无效',
    statusRateLimit: '速率限制',
    statusRateLimited: '速率限制',
    statusTesting: '测试中',
    statusRetrying: '重试中',
    statusPending: '等待中',

    // 消息提示
    enterApiKeys: '请输入API密钥！',
    enterValidKeys: '请输入有效的API密钥！',
    enterApiKeysFirst: '请先输入API密钥！',
    noKeysToCopy: '没有可复制的密钥！',
    keysCopied: '已复制 {count} 个密钥到剪贴板！',
    duplicatesRemoved: '发现 {duplicates} 个重复密钥，已自动去除。将测试 {unique} 个唯一密钥。',
    dedupeSuccess: '已去除 {removed} 个重复密钥，保留 {kept} 个唯一密钥。',
    noDuplicatesFound: '未发现重复密钥。',
    cannotDedupeWhileTesting: '测试正在进行中，无法去重！',
    cannotClearWhileTesting: '测试正在进行中，无法清空！',
    cleared: '已清空所有内容。',
    importSuccess: '成功导入 {count} 个API密钥',
    noValidKeysFound: '未找到有效的API密钥',
    importFailed: '文件导入失败，请检查文件格式',
    selectTextFile: '请选择一个.txt文件',
    fileTooLarge: '文件过大，请选择小于10MB的文件',
    clipboardError: '无法读取剪贴板内容，请确保已授权访问剪贴板',

    // 空状态
    noKeys: '暂无密钥',
    noValidKeys: '暂无有效密钥',
    noInvalidKeys: '暂无无效密钥',
    noRateLimitedKeys: '暂无速率限制密钥',

    // 错误信息
    authFailed: '认证失败',
    permissionDenied: '权限不足',
    networkFailed: '网络连接失败',
    retry: '重试',

    // 使用说明
    usageTitle: '💡 使用说明：',
    usage1: '• 强烈建议使用自定义代理URL，公共代理可能不稳定',
    usage2: '• 测试过程中密钥仅用于验证，不会被存储',

    // 通用
    ok: '确定',
    cancel: '取消',
    confirm: '确认',
    close: '关闭',
    save: '保存',
    loading: '加载中...',
    error: '错误',
    warning: '警告',
    success: '成功',
    info: '提示'
  },
  en: {
    // Page titles
    title: '🔑 API Key Tester',
    subtitle: 'Batch test Gemini, Claude, GPT API key validity',

    // API configuration
    selectApi: 'Select API Type',
    selectModel: 'Test Model',
    customModel: 'Custom',
    presetModel: 'Preset',
    modelHelp: 'Choose preset model or enter custom model name',
    modelInputPlaceholder: 'Enter custom model name',
    detectedModelsTitle: 'Detected Available Models',
    proxyUrl: 'Proxy Server URL (Optional)',
    proxyHelp: 'Leave empty to use default proxy, recommend using your own reverse proxy for better success rate',

    // Control settings
    concurrencyControl: 'Concurrency Control',
    retryControl: 'Retry Control',
    retryHelp: 'Number of retries when encountering temporary errors (like 403), helps improve detection accuracy',
    slow: 'Slow',
    normal: 'Normal',
    fast: 'Fast',
    ultra: 'Ultra',
    noRetry: 'No Retry',
    lightRetry: 'Light',
    normalRetry: 'Normal',
    heavyRetry: 'Heavy',

    // Input related
    apiKeys: 'API Key List (one per line)',
    apiKeysPlaceholder: 'Enter API keys, one per line:\nsk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nsk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n...',
    import: 'Import',
    importing: 'Importing',
    importFile: 'Import File',
    paste: 'Paste',
    pasting: 'Pasting',

    // Action buttons
    detectModels: 'Detect Models',
    startTest: 'Start Test',
    cancelTest: 'Cancel Test',
    dedupeKeys: 'Dedupe Keys',
    clear: 'Clear',

    // Status display
    testing: 'Testing API keys...',
    detecting: 'Detecting available models...',
    completed: 'Test completed',
    total: 'Total',
    valid: 'Valid',
    invalid: 'Invalid',
    rateLimited: 'Rate Limited',  // 添加这个缺失的翻译
    testingLabel: 'Testing',
    retrying: 'Retrying',
    pending: 'Pending',

    // Result tabs
    all: 'All',
    validKeys: 'Valid Keys',
    invalidKeys: 'Invalid Keys',
    rateLimitedKeys: 'Rate Limited',
    copyResults: 'Copy Results',
    copyAll: 'Copy All',
    copyValid: 'Copy Valid Keys',
    copyInvalid: 'Copy Invalid Keys',
    copyRateLimited: 'Copy Rate Limited Keys',

    // Status text
    statusValid: 'Valid',
    statusInvalid: 'Invalid',
    statusRateLimit: 'Rate Limited',
    statusRateLimited: 'Rate Limited',
    statusTesting: 'Testing',
    statusRetrying: 'Retrying',
    statusPending: 'Pending',

    // Message prompts
    enterApiKeys: 'Please enter API keys!',
    enterValidKeys: 'Please enter valid API keys!',
    enterApiKeysFirst: 'Please enter API keys first!',
    noKeysToCopy: 'No keys to copy!',
    keysCopied: 'Copied {count} keys to clipboard!',
    duplicatesRemoved: 'Found {duplicates} duplicate keys, automatically removed. Will test {unique} unique keys.',
    dedupeSuccess: 'Removed {removed} duplicate keys, kept {kept} unique keys.',
    noDuplicatesFound: 'No duplicate keys found.',
    cannotDedupeWhileTesting: 'Testing in progress, cannot dedupe!',
    cannotClearWhileTesting: 'Testing in progress, cannot clear!',
    cleared: 'All content cleared.',
    importSuccess: 'Successfully imported {count} API keys',
    noValidKeysFound: 'No valid API keys found',
    importFailed: 'File import failed, please check file format',
    selectTextFile: 'Please select a .txt file',
    fileTooLarge: 'File too large, please select a file smaller than 10MB',
    clipboardError: 'Cannot read clipboard content, please ensure clipboard access is authorized',

    // Empty states
    noKeys: 'No keys',
    noValidKeys: 'No valid keys',
    noInvalidKeys: 'No invalid keys',
    noRateLimitedKeys: 'No rate limited keys',

    // Error messages
    authFailed: 'Auth Failed',
    permissionDenied: 'Permission Denied',
    networkFailed: 'Network Failed',
    retry: 'Retry',

    // Usage instructions
    usageTitle: '💡 Usage Instructions:',
    usage1: '• Strongly recommend using custom proxy URL, public proxies may be unstable',
    usage2: '• Keys are only used for validation during testing, not stored',

    // General
    ok: 'OK',
    cancel: 'Cancel',
    confirm: 'Confirm',
    close: 'Close',
    save: 'Save',
    loading: 'Loading...',
    error: 'Error',
    warning: 'Warning',
    success: 'Success',
    info: 'Info'
  }
};

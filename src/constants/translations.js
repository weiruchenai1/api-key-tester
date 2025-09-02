export const TRANSLATIONS = {
  zh: {
    // API配置
    selectApi: '选择 API 类型',
    selectModel: '测试模型',
    customModel: '自定义',
    presetModel: '预设',
    modelHelp: '可以选择预设模型或输入自定义模型名',
    modelInputPlaceholder: '输入自定义模型名',
    detectedModelsTitle: '检测到的模型',
    detecting: '检测中',
    detected: '检测到',
    proxyUrl: '代理服务器 URL (可选)',
    proxyHelp: '留空使用默认代理',

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
    detectModels: '获取模型',
    startTest: '开始测试',
    cancelTest: '取消测试',
    dedupeKeys: '去重密钥',
    clear: '清空',

    // 状态显示
    testing: '测试中',
    completed: '测试完成',
    total: '总计',
    valid: '有效',
    invalid: '无效',
    rateLimited: '速率限制',
    testingLabel: '测试中',
    retrying: '重试中',
    pending: '等待中',
    models: '个模型',

    // Gemini付费检测
    enablePaidDetection: '启用付费检测',
    enablePaidKeyDetection: '检测付费key',
    paidDetection: '付费检测',
    paidDetectionHelp: '启用后将固定使用 gemini-2.5-flash 模型，通过 cacheContent API 检测付费密钥，会消耗额外配额',
    paidDetectionWarning: '⚠️ 启用付费检测会消耗额外的API配额并锁定模型为 gemini-2.5-flash',
    paidKeys: '付费密钥',
    copyPaidKeys: '复制付费密钥',
    paidDetectionEnabled: '已开启付费检测',
    paidDetectionDisabled: '未开启付费检测',

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

    // 状态信息翻译
    validKeyInfo: '有效密钥',
    paidKeyInfo: '付费密钥',
    freeKeyInfo: '免费密钥',
    invalidKeyInfo: 'API密钥无效',

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
    resultsWillShow: '检测结果将显示在这里',

    // 错误信息
    authFailed: '认证失败',
    permissionDenied: '权限不足',
    networkFailed: '网络连接失败',
    retry: '重试',
    freeKey: '免费密钥',
    validKey: '有效密钥',

    // 使用说明
    usageTitle: '使用说明：',
    usage1: '• 建议使用自己的反向代理URL，公共代理可能不稳定',
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
    info: '提示',

    // 主题控制
    control: '控制台',
    lightMode: '浅色',
    darkMode: '深色',
    systemMode: '跟随系统',

    // 界面元素
    advancedSettings: '高级设置',
    addProvider: '添加服务商',
    appTitle: 'API Key 测活工具'
  },
  en: {
    // API configuration
    selectApi: 'Select API Type',
    selectModel: 'Test Model',
    customModel: 'Custom',
    presetModel: 'Preset',
    modelHelp: 'Choose preset model or enter custom model name',
    modelInputPlaceholder: 'Enter custom model name',
    detectedModelsTitle: 'Detected Models',
    detecting: 'Detecting...',
    detected: 'Detected',
    proxyUrl: 'Proxy Server URL (Optional)',
    proxyHelp: 'Leave empty to use default proxy',

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
    detectModels: 'Get Models',
    startTest: 'Start Test',
    cancelTest: 'Cancel Test',
    dedupeKeys: 'Dedupe Keys',
    clear: 'Clear',

    // Status display
    testing: 'Testing API keys...',
    completed: 'Test completed',
    total: 'Total',
    valid: 'Valid',
    invalid: 'Invalid',
    rateLimited: 'Throttled',
    testingLabel: 'Testing',
    retrying: 'Retrying',
    pending: 'Pending',
    models: 'models',

    // Gemini Paid Detection
    enablePaidDetection: 'Enable Paid Detection',
    enablePaidKeyDetection: 'Enable Paid Key Detection',
    paidDetection: 'Paid Detection',
    paidDetectionHelp: 'When enabled, will lock model to gemini-2.5-flash and use cacheContent API to detect paid keys, consumes extra quota',
    paidDetectionWarning: '⚠️ Enabling paid detection will consume additional API quota and lock model to gemini-2.5-flash',
    paidKeys: 'Paid Keys',
    copyPaidKeys: 'Copy Paid Keys',
    paidDetectionEnabled: 'Paid detection enabled',
    paidDetectionDisabled: 'Paid detection disabled',

    // Result tabs
    all: 'All',
    validKeys: 'Valid Keys',
    invalidKeys: 'Invalid Keys',
    rateLimitedKeys: 'Throttled Keys',
    copyResults: 'Copy Results',
    copyAll: 'Copy All',
    copyValid: 'Copy Valid Keys',
    copyInvalid: 'Copy Invalid Keys',
    copyRateLimited: 'Copy Throttled Keys',

    // Status text
    statusValid: 'Valid',
    statusInvalid: 'Invalid',
    statusRateLimit: 'Throttled',
    statusRateLimited: 'Throttled',
    statusTesting: 'Testing',
    statusRetrying: 'Retrying',
    statusPending: 'Pending',

    // Status info translations
    validKeyInfo: 'Valid Key',
    paidKeyInfo: 'Paid Key',
    freeKeyInfo: 'Free Key',
    invalidKeyInfo: 'Invalid API Key',

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
    noRateLimitedKeys: 'No throttled keys',
    resultsWillShow: 'Detection results will be displayed here',

    // Error messages
    authFailed: 'Auth Failed',
    permissionDenied: 'Permission Denied',
    networkFailed: 'Network Failed',
    retry: 'Retry',

    // Key status messages
    freeKey: 'Free Key',
    validKey: 'Valid Key',

    // Usage instructions
    usageTitle: 'Usage Instructions:',
    usage1: '• Recommend using your own reverse proxy URL, public proxies may be unstable',
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
    info: 'Info',

    // Theme Control
    control: 'Controls',
    lightMode: 'Light',
    darkMode: 'Dark',
    systemMode: 'System',

    // UI Elements
    advancedSettings: 'Advanced Settings',
    addProvider: 'Add Provider',
    appTitle: 'API Key Tester'
  }
};

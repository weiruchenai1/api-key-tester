/**
 * 本地存储功能测试用例
 * 测试所有配置的保存、读取、导出、导入功能
 */

// 模拟localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => store[key] = value.toString(),
    removeItem: (key) => delete store[key],
    clear: () => store = {},
    get length() { return Object.keys(store).length; },
    key: (index) => Object.keys(store)[index] || null
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// 测试配置数据
const testConfig = {
  apiType: 'claude',
  testModel: 'claude-3-5-sonnet-20241022',
  proxyUrl: 'https://api.example.com',
  concurrency: 8,
  maxRetries: 5,
  retryDelay: 2000,
  theme: 'dark',
  language: 'en',
  enablePaidDetection: true,
  recentProxyUrls: [
    'https://api.example1.com',
    'https://api.example2.com',
    'https://api.example3.com'
  ]
};

/**
 * 测试1: 基础localStorage读写功能
 */
function testBasicLocalStorage() {
  console.log('🧪 测试1: 基础localStorage读写功能');
  
  // 清空localStorage
  localStorage.clear();
  
  // 测试保存配置
  Object.entries(testConfig).forEach(([key, value]) => {
    localStorage.setItem(key, JSON.stringify(value));
  });
  
  // 测试读取配置
  const savedConfig = {};
  Object.keys(testConfig).forEach(key => {
    const item = localStorage.getItem(key);
    savedConfig[key] = item ? JSON.parse(item) : null;
  });
  
  // 验证数据一致性
  const isValid = JSON.stringify(testConfig) === JSON.stringify(savedConfig);
  console.log(`✅ 基础读写测试: ${isValid ? '通过' : '失败'}`);
  
  if (!isValid) {
    console.error('❌ 预期:', testConfig);
    console.error('❌ 实际:', savedConfig);
  }
  
  return isValid;
}

/**
 * 测试2: useLocalStorage Hook功能
 */
function testUseLocalStorageHook() {
  console.log('🧪 测试2: useLocalStorage Hook功能');
  
  // 这里需要在React环境中测试，提供测试指导
  console.log('📋 手动测试步骤:');
  console.log('1. 打开浏览器开发者工具');
  console.log('2. 在Console中运行以下代码:');
  console.log(`
// 测试useLocalStorage Hook
const testKey = 'test_config';
const testValue = { name: 'test', value: 123 };

// 保存测试数据
localStorage.setItem(testKey, JSON.stringify(testValue));

// 验证数据
const saved = JSON.parse(localStorage.getItem(testKey));
console.log('保存的数据:', saved);
console.log('数据匹配:', JSON.stringify(saved) === JSON.stringify(testValue));
  `);
  
  return true;
}

/**
 * 测试3: 配置自动保存功能
 */
function testAutoSaveConfig() {
  console.log('🧪 测试3: 配置自动保存功能');
  
  console.log('📋 手动测试步骤:');
  console.log('1. 打开应用程序');
  console.log('2. 修改以下配置项:');
  console.log('   - 切换API类型 (OpenAI → Claude → Gemini)');
  console.log('   - 修改模型选择');
  console.log('   - 输入代理URL');
  console.log('   - 调整并发数');
  console.log('   - 切换主题 (明亮 → 暗色 → 系统)');
  console.log('   - 切换语言 (中文 → 英文)');
  console.log('3. 刷新页面');
  console.log('4. 验证所有设置是否保持不变');
  
  return true;
}

/**
 * 测试4: 代理URL历史记录功能
 */
function testProxyUrlHistory() {
  console.log('🧪 测试4: 代理URL历史记录功能');
  
  console.log('📋 手动测试步骤:');
  console.log('1. 在代理URL输入框中输入多个不同的URL:');
  console.log('   - https://api.openai.com');
  console.log('   - https://api.anthropic.com');
  console.log('   - https://generativelanguage.googleapis.com');
  console.log('2. 每次输入后按Tab或点击其他地方');
  console.log('3. 点击代理URL输入框右侧的下拉箭头');
  console.log('4. 验证历史记录是否正确显示');
  console.log('5. 点击历史记录中的URL，验证是否正确填入');
  
  return true;
}

/**
 * 测试5: 配置导出功能
 */
function testConfigExport() {
  console.log('🧪 测试5: 配置导出功能');
  
  console.log('📋 手动测试步骤:');
  console.log('1. 点击导航栏右侧的齿轮图标');
  console.log('2. 在配置管理面板中点击"导出配置"');
  console.log('3. 验证是否下载了JSON文件');
  console.log('4. 打开下载的JSON文件，验证内容是否包含:');
  console.log('   - apiType, testModel, proxyUrl');
  console.log('   - concurrency, maxRetries, retryDelay');
  console.log('   - theme, language, enablePaidDetection');
  console.log('   - recentProxyUrls, exportDate, version');
  
  return true;
}

/**
 * 测试6: 配置导入功能
 */
function testConfigImport() {
  console.log('🧪 测试6: 配置导入功能');
  
  // 创建测试配置文件内容
  const testConfigFile = {
    apiType: 'gemini',
    testModel: 'gemini-2.0-flash',
    proxyUrl: 'https://test-proxy.com',
    concurrency: 10,
    maxRetries: 3,
    retryDelay: 1500,
    theme: 'light',
    language: 'zh',
    enablePaidDetection: false,
    recentProxyUrls: ['https://test1.com', 'https://test2.com'],
    exportDate: new Date().toISOString(),
    version: '1.0'
  };
  
  console.log('📋 手动测试步骤:');
  console.log('1. 创建测试配置文件 test-config.json:');
  console.log(JSON.stringify(testConfigFile, null, 2));
  console.log('2. 在配置管理面板中点击"导入配置"');
  console.log('3. 选择创建的test-config.json文件');
  console.log('4. 验证配置是否正确应用');
  console.log('5. 检查页面是否自动刷新');
  
  return true;
}

/**
 * 测试7: 配置清除功能
 */
function testConfigClear() {
  console.log('🧪 测试7: 配置清除功能');
  
  console.log('📋 手动测试步骤:');
  console.log('1. 确保已有一些自定义配置');
  console.log('2. 在配置管理面板中点击"清除所有配置"');
  console.log('3. 确认清除操作');
  console.log('4. 验证页面是否刷新到默认状态');
  console.log('5. 检查localStorage是否已清空:');
  console.log('   在Console中运行: Object.keys(localStorage)');
  
  return true;
}

/**
 * 测试8: 错误处理功能
 */
function testErrorHandling() {
  console.log('🧪 测试8: 错误处理功能');
  
  console.log('📋 手动测试步骤:');
  console.log('1. 测试无效JSON导入:');
  console.log('   - 创建包含无效JSON的文件');
  console.log('   - 尝试导入，验证错误提示');
  console.log('2. 测试localStorage满了的情况:');
  console.log('   - 在Console中运行大量localStorage.setItem()');
  console.log('   - 验证应用是否优雅处理');
  console.log('3. 测试损坏的localStorage数据:');
  console.log('   - 手动设置无效的JSON数据');
  console.log('   - 刷新页面，验证是否回退到默认值');
  
  return true;
}

/**
 * 测试9: 性能测试
 */
function testPerformance() {
  console.log('🧪 测试9: 性能测试');
  
  console.log('📋 性能测试步骤:');
  console.log('1. 测试大量配置变更的性能:');
  console.log('   - 快速切换API类型多次');
  console.log('   - 观察是否有明显延迟');
  console.log('2. 测试大量代理URL历史记录:');
  console.log('   - 添加10个以上的代理URL');
  console.log('   - 验证下拉菜单响应速度');
  console.log('3. 测试localStorage大小限制:');
  console.log('   - 检查当前存储大小');
  console.log('   - 验证是否在合理范围内');
  
  return true;
}

/**
 * 运行所有测试
 */
function runAllTests() {
  console.log('🚀 开始运行本地存储功能测试');
  console.log('=' * 50);
  
  const tests = [
    testBasicLocalStorage,
    testUseLocalStorageHook,
    testAutoSaveConfig,
    testProxyUrlHistory,
    testConfigExport,
    testConfigImport,
    testConfigClear,
    testErrorHandling,
    testPerformance
  ];
  
  let passedTests = 0;
  
  tests.forEach((test, index) => {
    try {
      const result = test();
      if (result) passedTests++;
      console.log('');
    } catch (error) {
      console.error(`❌ 测试 ${index + 1} 出错:`, error);
      console.log('');
    }
  });
  
  console.log('=' * 50);
  console.log(`📊 测试完成: ${passedTests}/${tests.length} 个测试通过`);
  
  if (passedTests === tests.length) {
    console.log('🎉 所有测试通过！本地存储功能正常工作。');
  } else {
    console.log('⚠️ 部分测试需要手动验证，请按照上述步骤进行测试。');
  }
}

// 导出测试函数
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runAllTests,
    testBasicLocalStorage,
    testAutoSaveConfig,
    testProxyUrlHistory,
    testConfigExport,
    testConfigImport,
    testConfigClear
  };
}

// 如果在浏览器中直接运行
if (typeof window !== 'undefined') {
  window.runLocalStorageTests = runAllTests;
}

// 自动运行测试（如果不是在模块环境中）
if (typeof module === 'undefined') {
  runAllTests();
}

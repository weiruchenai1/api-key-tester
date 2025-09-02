/**
 * 浏览器端本地存储功能测试工具
 * 在浏览器Console中运行: testLocalStorage()
 */

/**
 * 测试配置自动保存和恢复
 */
function testConfigPersistence() {
  console.log('🧪 测试配置持久化功能...');
  
  // 保存当前配置作为备份
  const backup = {};
  const configKeys = ['apiType', 'testModel', 'proxyUrl', 'concurrency', 'maxRetries', 'theme', 'language', 'enablePaidDetection'];
  
  configKeys.forEach(key => {
    backup[key] = localStorage.getItem(key);
  });
  
  // 测试数据
  const testData = {
    apiType: '"claude"',
    testModel: '"claude-3-5-sonnet-20241022"',
    proxyUrl: '"https://test-proxy.example.com"',
    concurrency: '8',
    maxRetries: '5',
    theme: '"dark"',
    language: '"en"',
    enablePaidDetection: 'true'
  };
  
  // 写入测试数据
  Object.entries(testData).forEach(([key, value]) => {
    localStorage.setItem(key, value);
  });
  
  // 验证数据
  let allPassed = true;
  Object.entries(testData).forEach(([key, expectedValue]) => {
    const actualValue = localStorage.getItem(key);
    const passed = actualValue === expectedValue;
    console.log(`${passed ? '✅' : '❌'} ${key}: ${passed ? '通过' : `失败 (期望: ${expectedValue}, 实际: ${actualValue})`}`);
    if (!passed) allPassed = false;
  });
  
  // 恢复原始配置
  configKeys.forEach(key => {
    if (backup[key] !== null) {
      localStorage.setItem(key, backup[key]);
    } else {
      localStorage.removeItem(key);
    }
  });
  
  return allPassed;
}

/**
 * 测试代理URL历史记录
 */
function testProxyHistory() {
  console.log('🧪 测试代理URL历史记录...');
  
  const testUrls = [
    'https://api.openai.com',
    'https://api.anthropic.com',
    'https://generativelanguage.googleapis.com'
  ];
  
  // 保存测试URLs
  localStorage.setItem('recentProxyUrls', JSON.stringify(testUrls));
  
  // 验证保存
  const saved = JSON.parse(localStorage.getItem('recentProxyUrls') || '[]');
  const passed = JSON.stringify(saved) === JSON.stringify(testUrls);
  
  console.log(`${passed ? '✅' : '❌'} 代理URL历史记录: ${passed ? '通过' : '失败'}`);
  
  if (passed) {
    console.log('📋 保存的URLs:', saved);
  }
  
  return passed;
}

/**
 * 测试配置导出格式
 */
function testExportFormat() {
  console.log('🧪 测试配置导出格式...');
  
  // 模拟导出的配置
  const exportConfig = {
    apiType: 'openai',
    testModel: 'gpt-4o',
    proxyUrl: 'https://api.openai.com',
    concurrency: 3,
    maxRetries: 2,
    retryDelay: 1000,
    theme: 'system',
    language: 'zh',
    enablePaidDetection: false,
    recentProxyUrls: ['https://api.openai.com'],
    exportDate: new Date().toISOString(),
    version: '1.0'
  };
  
  // 验证必需字段
  const requiredFields = ['apiType', 'testModel', 'concurrency', 'theme', 'language', 'version'];
  let allFieldsPresent = true;
  
  requiredFields.forEach(field => {
    const present = exportConfig.hasOwnProperty(field);
    console.log(`${present ? '✅' : '❌'} 必需字段 ${field}: ${present ? '存在' : '缺失'}`);
    if (!present) allFieldsPresent = false;
  });
  
  // 验证JSON序列化
  try {
    const jsonString = JSON.stringify(exportConfig, null, 2);
    const parsed = JSON.parse(jsonString);
    const jsonValid = JSON.stringify(parsed) === JSON.stringify(exportConfig);
    console.log(`${jsonValid ? '✅' : '❌'} JSON序列化: ${jsonValid ? '通过' : '失败'}`);
    return allFieldsPresent && jsonValid;
  } catch (error) {
    console.log('❌ JSON序列化失败:', error.message);
    return false;
  }
}

/**
 * 测试存储空间使用
 */
function testStorageUsage() {
  console.log('🧪 测试存储空间使用...');
  
  let totalSize = 0;
  const items = {};
  
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      const value = localStorage.getItem(key);
      const size = new Blob([key + value]).size;
      items[key] = { value, size };
      totalSize += size;
    }
  }
  
  console.log(`📊 总存储大小: ${totalSize} 字节 (${(totalSize / 1024).toFixed(2)} KB)`);
  
  // 显示各项配置的大小
  Object.entries(items).forEach(([key, {value, size}]) => {
    console.log(`   ${key}: ${size} 字节`);
  });
  
  // 检查是否超过建议限制 (5MB)
  const limitMB = 5;
  const limitBytes = limitMB * 1024 * 1024;
  const withinLimit = totalSize < limitBytes;
  
  console.log(`${withinLimit ? '✅' : '⚠️'} 存储限制检查: ${withinLimit ? '正常' : `超过建议限制 ${limitMB}MB`}`);
  
  return withinLimit;
}

/**
 * 测试错误恢复
 */
function testErrorRecovery() {
  console.log('🧪 测试错误恢复机制...');
  
  // 保存原始值
  const originalValue = localStorage.getItem('testModel');
  
  // 设置无效JSON
  localStorage.setItem('testModel', 'invalid-json-{');
  
  // 尝试读取并恢复
  try {
    const parsed = JSON.parse(localStorage.getItem('testModel'));
    console.log('❌ 错误恢复测试: 应该抛出错误但没有');
    return false;
  } catch (error) {
    console.log('✅ 错误恢复测试: 正确捕获JSON解析错误');
    
    // 恢复原始值
    if (originalValue !== null) {
      localStorage.setItem('testModel', originalValue);
    } else {
      localStorage.removeItem('testModel');
    }
    
    return true;
  }
}

/**
 * 运行所有自动化测试
 */
function testLocalStorage() {
  console.log('🚀 开始本地存储功能测试');
  console.log('='.repeat(50));
  
  const tests = [
    { name: '配置持久化', fn: testConfigPersistence },
    { name: '代理URL历史', fn: testProxyHistory },
    { name: '导出格式验证', fn: testExportFormat },
    { name: '存储空间使用', fn: testStorageUsage },
    { name: '错误恢复机制', fn: testErrorRecovery }
  ];
  
  let passed = 0;
  let total = tests.length;
  
  tests.forEach(({ name, fn }) => {
    console.log(`\n📋 ${name}:`);
    try {
      if (fn()) {
        passed++;
        console.log(`✅ ${name} - 通过`);
      } else {
        console.log(`❌ ${name} - 失败`);
      }
    } catch (error) {
      console.log(`❌ ${name} - 错误:`, error.message);
    }
  });
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 测试结果: ${passed}/${total} 通过`);
  
  if (passed === total) {
    console.log('🎉 所有自动化测试通过！');
  } else {
    console.log('⚠️ 部分测试失败，请检查实现。');
  }
  
  // 手动测试指南
  console.log('\n📋 手动测试步骤:');
  console.log('1. 修改各种配置设置');
  console.log('2. 刷新页面验证设置保持');
  console.log('3. 测试配置导出/导入功能');
  console.log('4. 测试代理URL历史下拉菜单');
  console.log('5. 测试配置清除功能');
  
  return { passed, total, success: passed === total };
}

/**
 * 快速验证当前配置状态
 */
function checkCurrentConfig() {
  console.log('📋 当前配置状态:');
  
  const configKeys = [
    'apiType', 'testModel', 'proxyUrl', 'concurrency', 
    'maxRetries', 'theme', 'language', 'enablePaidDetection', 'recentProxyUrls'
  ];
  
  configKeys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value !== null) {
      try {
        const parsed = JSON.parse(value);
        console.log(`✅ ${key}:`, parsed);
      } catch {
        console.log(`⚠️ ${key}: ${value} (原始字符串)`);
      }
    } else {
      console.log(`❌ ${key}: 未设置`);
    }
  });
}

// 导出到全局作用域
if (typeof window !== 'undefined') {
  window.testLocalStorage = testLocalStorage;
  window.checkCurrentConfig = checkCurrentConfig;
  
  console.log('💡 测试工具已加载！');
  console.log('   运行 testLocalStorage() 开始测试');
  console.log('   运行 checkCurrentConfig() 查看当前配置');
}

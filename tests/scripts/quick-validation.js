#!/usr/bin/env node
/**
 * 快速验证脚本 - 检查核心功能是否正常工作
 * 用于快速验证系统状态，无需运行完整测试套件
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../..');

console.log('🔍 API密钥测试工具 - 快速验证\n');

// 验证核心文件存在
const coreFiles = [
    'js/core/adaptiveConcurrencyManager.js',
    'js/core/smartRetryManager.js', 
    'js/core/enhancedMemoryManager.js',
    'js/core/highPerformanceProcessor.js',
    'js/core/networkOptimizer.js',
    'js/core/highSpeedController.js',
    'index.html',
    'package.json'
];

let passed = 0;
let total = coreFiles.length;

console.log('📁 检查核心文件...');
coreFiles.forEach(file => {
    const exists = existsSync(join(projectRoot, file));
    const status = exists ? '✅' : '❌';
    console.log(`${status} ${file}`);
    if (exists) passed++;
});

console.log(`\n📊 文件检查: ${passed}/${total} 通过`);

// 检查HTML集成
console.log('\n🔗 检查HTML集成...');
try {
    const htmlContent = readFileSync(join(projectRoot, 'index.html'), 'utf-8');
    const hasHighSpeedController = htmlContent.includes('highSpeedController');
    const hasOptimizationScripts = htmlContent.includes('js/core/');
    
    console.log(`${hasHighSpeedController ? '✅' : '❌'} 高速控制器集成`);
    console.log(`${hasOptimizationScripts ? '✅' : '❌'} 优化模块脚本`);
} catch (error) {
    console.log('❌ HTML文件读取失败');
}

// 检查测试文件
console.log('\n🧪 检查测试文件...');
const testFiles = [
    'tests/unit/adaptiveConcurrencyManager.test.js',
    'tests/unit/smartRetryManager.test.js',
    'tests/unit/enhancedMemoryManager.test.js',
    'tests/unit/highPerformanceProcessor.test.js',
    'tests/unit/networkOptimizer.test.js',
    'tests/unit/highSpeedController.test.js',
    'tests/integration/optimizationModulesIntegration.test.js',
    'tests/performance/performanceAndStress.test.js',
    'tests/e2e/endToEndWorkflow.test.js',
    'tests/testRunner.js'
];

let testsPassed = 0;
testFiles.forEach(file => {
    const exists = existsSync(join(projectRoot, file));
    const status = exists ? '✅' : '❌';
    console.log(`${status} ${file.split('/').pop()}`);
    if (exists) testsPassed++;
});

console.log(`\n📊 测试文件: ${testsPassed}/${testFiles.length} 存在`);

// 检查package.json配置
console.log('\n📦 检查配置...');
try {
    const packageContent = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf-8'));
    const hasTestScripts = packageContent.scripts && Object.keys(packageContent.scripts).some(key => key.includes('test'));
    const hasVitest = packageContent.devDependencies && packageContent.devDependencies.vitest;
    
    console.log(`${hasTestScripts ? '✅' : '❌'} 测试脚本配置`);
    console.log(`${hasVitest ? '✅' : '❌'} Vitest依赖`);
} catch (error) {
    console.log('❌ Package.json解析失败');
}

// 总结
console.log('\n' + '='.repeat(50));
const overallScore = (passed / total * 100).toFixed(0);
console.log(`📈 系统完整性: ${overallScore}%`);

if (passed === total && testsPassed === testFiles.length) {
    console.log('🎉 快速验证通过！系统准备就绪');
    console.log('\n💡 建议操作:');
    console.log('1. 运行 npm install 安装依赖');
    console.log('2. 运行 npm test 执行完整测试');
    console.log('3. 打开 index.html 开始使用');
} else {
    console.log('⚠️  发现缺失文件，请检查项目完整性');
    console.log('\n🔧 修复建议:');
    console.log('1. 确保所有核心模块文件存在');
    console.log('2. 检查测试文件是否完整');
    console.log('3. 验证配置文件正确性');
}

console.log('='.repeat(50));

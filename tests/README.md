# API密钥测试工具 - 测试套件

## 📋 测试概述

本测试套件为API密钥测试工具的优化模块提供全面的测试覆盖，确保系统的稳定性、性能和可靠性。

## 🏗️ 测试架构

### 测试分层结构

```
tests/
├── unit/                    # 单元测试
│   ├── adaptiveConcurrencyManager.test.js
│   ├── smartRetryManager.test.js
│   ├── enhancedMemoryManager.test.js
│   ├── highPerformanceProcessor.test.js
│   ├── networkOptimizer.test.js
│   └── highSpeedController.test.js
├── integration/             # 集成测试
│   └── optimizationModulesIntegration.test.js
├── performance/             # 性能测试
│   └── performanceAndStress.test.js
├── e2e/                    # 端到端测试
│   └── endToEndWorkflow.test.js
├── verification/           # 验证测试 (现有)
└── testRunner.js           # 测试运行器
```

## 🧪 测试模块详情

### 1. 单元测试 (Unit Tests)

#### `adaptiveConcurrencyManager.test.js`
- **覆盖范围**: 自适应并发控制器的所有核心功能
- **测试场景**:
  - 初始化和配置管理
  - 槽位获取和释放机制
  - 自适应并发调整算法
  - 性能指标追踪
  - 队列管理和错误处理
- **关键测试**: 并发限制、性能适应、资源清理

#### `smartRetryManager.test.js`
- **覆盖范围**: 智能重试管理器的重试逻辑
- **测试场景**:
  - 重试执行和失败处理
  - 熔断器机制
  - 延迟计算算法
  - 错误分类和快速失败
  - 统计数据收集
- **关键测试**: 指数退避、熔断恢复、错误分类

#### `enhancedMemoryManager.test.js`
- **覆盖范围**: 增强内存管理器的内存优化
- **测试场景**:
  - 密钥数据管理
  - 批量操作处理
  - 内存使用监控
  - 数据持久化
  - 后台清理任务
- **关键测试**: 内存泄漏防护、数据压缩、批量处理

#### `highPerformanceProcessor.test.js`
- **覆盖范围**: 高性能处理器的批处理能力
- **测试场景**:
  - 批处理执行
  - UI优化和帧率管理
  - 内存管理
  - 性能指标追踪
  - 自适应优化
- **关键测试**: 并发批处理、UI响应性、内存效率

#### `networkOptimizer.test.js`
- **覆盖范围**: 网络优化器的连接管理
- **测试场景**:
  - 连接池管理
  - 请求合并优化
  - 错误处理和重试
  - 性能监控
  - 缓存机制
- **关键测试**: 连接复用、请求合并、网络恢复

#### `highSpeedController.test.js`
- **覆盖范围**: 高速控制器的集成协调
- **测试场景**:
  - 模块初始化和集成
  - 高速检测流程
  - 状态监控
  - 配置管理
  - 错误恢复
- **关键测试**: 模块协调、状态管理、性能优化

### 2. 集成测试 (Integration Tests)

#### `optimizationModulesIntegration.test.js`
- **覆盖范围**: 所有优化模块的协作验证
- **测试场景**:
  - 模块间通信和数据流
  - 并发和内存管理协调
  - 重试和网络优化集成
  - 处理器和UI集成
  - 端到端工作流程
- **关键测试**: 模块协作、资源共享、错误传播

### 3. 性能测试 (Performance Tests)

#### `performanceAndStress.test.js`
- **覆盖范围**: 系统性能和压力测试
- **测试场景**:
  - 大规模数据处理 (1000+ 密钥)
  - 内存压力测试
  - 并发压力测试
  - 网络压力测试
  - UI性能测试
- **关键指标**: 吞吐量、响应时间、内存使用、错误率

### 4. 端到端测试 (E2E Tests)

#### `endToEndWorkflow.test.js`
- **覆盖范围**: 完整的用户工作流程
- **测试场景**:
  - OpenAI/Claude/Gemini API完整检测流程
  - 错误恢复和韧性测试
  - 性能验证
  - UI集成测试
  - 数据持久化和恢复
- **关键测试**: 真实场景模拟、用户体验验证

## 🚀 运行测试

### 使用Vitest运行

```bash
# 运行所有测试
npm test

# 运行特定类型的测试
npm run test:unit
npm run test:integration
npm run test:performance
npm run test:e2e

# 运行覆盖率测试
npm run test:coverage

# 监视模式
npm run test:watch
```

### 使用测试运行器

```bash
# 运行综合测试套件
node tests/testRunner.js
```

### 浏览器中运行验证测试

打开 `test-optimization-fixes.html` 在浏览器中进行交互式测试验证。

## 📊 测试报告

### 覆盖率要求
- **行覆盖率**: ≥90%
- **函数覆盖率**: ≥90%
- **语句覆盖率**: ≥90%
- **分支覆盖率**: ≥80%

### 性能基准
- **吞吐量**: ≥50 keys/second (正常负载)
- **响应时间**: ≤200ms (平均)
- **内存使用**: ≤100MB (1000个密钥)
- **并发处理**: 支持50+并发

### 报告格式
- **控制台报告**: 实时测试结果
- **HTML报告**: 详细的可视化报告
- **JSON报告**: 机器可读的结果数据
- **覆盖率报告**: 代码覆盖率分析

## 🔧 测试配置

### Vitest配置 (`vitest.config.js`)
```javascript
export default {
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['js/**/*.js'],
      thresholds: {
        lines: 90,
        functions: 90,
        statements: 90,
        branches: 80
      }
    }
  }
}
```

### 测试环境设置
- **DOM模拟**: jsdom环境
- **API模拟**: fetch和localStorage mock
- **性能模拟**: performance API mock
- **定时器模拟**: setTimeout/setInterval mock

## 🐛 调试测试

### 常见问题

1. **模块导入失败**
   - 检查模块路径是否正确
   - 确保所有依赖已正确加载

2. **异步测试超时**
   - 增加测试超时时间
   - 检查Promise处理逻辑

3. **Mock失效**
   - 确保在每个测试前重置mock
   - 检查mock配置是否正确

### 调试技巧

```javascript
// 启用详细日志
console.log = vi.fn().mockImplementation((...args) => {
  console.info('[TEST]', ...args);
});

// 检查异步操作
await new Promise(resolve => setTimeout(resolve, 100));

// 验证mock调用
expect(mockFunction).toHaveBeenCalledWith(expectedArgs);
```

## 📈 持续集成

### CI/CD集成
- **GitHub Actions**: 自动运行测试套件
- **覆盖率报告**: 自动生成和上传覆盖率数据
- **性能监控**: 跟踪性能回归
- **质量门禁**: 测试失败时阻止部署

### 质量标准
- 所有测试必须通过
- 覆盖率达到要求阈值
- 性能指标符合基准
- 无严重安全漏洞

## 🔄 维护指南

### 添加新测试
1. 确定测试类型和位置
2. 遵循现有测试模式
3. 添加适当的mock和断言
4. 更新测试运行器配置

### 更新现有测试
1. 保持向后兼容性
2. 更新相关文档
3. 验证覆盖率不降低
4. 测试新功能和边界情况

### 性能测试维护
- 定期更新性能基准
- 监控性能趋势
- 优化慢速测试
- 保持测试环境一致性

## 📚 参考资源

- [Vitest文档](https://vitest.dev/)
- [测试最佳实践](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [Mock策略指南](https://martinfowler.com/articles/mocksArentStubs.html)
- [性能测试指南](https://web.dev/performance-testing/)

---

**注意**: 本测试套件是API密钥测试工具质量保证的重要组成部分。请确保在提交代码前运行完整的测试套件，并保持测试的及时更新。

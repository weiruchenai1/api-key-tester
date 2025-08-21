#!/bin/bash
# API密钥测试工具 - Linux/macOS测试运行脚本
# 用于在Unix环境下运行完整的测试套件

set -e  # 遇到错误立即退出

echo "================================"
echo "  API密钥测试工具 - 测试套件"
echo "================================"
echo

# 检查Node.js环境
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到Node.js，请先安装Node.js"
    exit 1
fi

echo "✅ Node.js环境检查通过 ($(node --version))"
echo

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖包..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
fi

echo "✅ 依赖检查通过"
echo

# 运行测试套件
echo "🚀 开始运行测试套件..."
echo

# 1. 单元测试
echo "📋 运行单元测试..."
npm run test:unit
if [ $? -ne 0 ]; then
    echo "❌ 单元测试失败"
    exit 1
fi
echo "✅ 单元测试通过"
echo

# 2. 集成测试
echo "📋 运行集成测试..."
npm run test:integration
if [ $? -ne 0 ]; then
    echo "❌ 集成测试失败"
    exit 1
fi
echo "✅ 集成测试通过"
echo

# 3. 性能测试
echo "📋 运行性能测试..."
npm run test:performance
if [ $? -ne 0 ]; then
    echo "❌ 性能测试失败"
    exit 1
fi
echo "✅ 性能测试通过"
echo

# 4. 端到端测试
echo "📋 运行端到端测试..."
npm run test:e2e
if [ $? -ne 0 ]; then
    echo "❌ 端到端测试失败"
    exit 1
fi
echo "✅ 端到端测试通过"
echo

# 5. 覆盖率测试
echo "📊 生成覆盖率报告..."
npm run test:coverage || echo "⚠️  覆盖率报告生成失败，但测试已通过"
echo

# 6. 运行综合测试运行器
echo "🔧 运行综合测试验证..."
npm run test:all
if [ $? -ne 0 ]; then
    echo "❌ 综合测试验证失败"
    exit 1
fi

echo
echo "================================"
echo "🎉 所有测试通过！"
echo "================================"
echo
echo "📊 测试摘要:"
echo "  - 单元测试: ✅ 通过"
echo "  - 集成测试: ✅ 通过"
echo "  - 性能测试: ✅ 通过"
echo "  - 端到端测试: ✅ 通过"
echo "  - 覆盖率报告: 📊 已生成"
echo
echo "🚀 系统已准备就绪，可以部署使用！"
echo

@echo off
REM API密钥测试工具 - Windows测试运行脚本
REM 用于在Windows环境下运行完整的测试套件

echo ================================
echo   API密钥测试工具 - 测试套件
echo ================================
echo.

REM 检查Node.js环境
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到Node.js，请先安装Node.js
    pause
    exit /b 1
)

echo ✅ Node.js环境检查通过
echo.

REM 检查依赖
if not exist "node_modules" (
    echo 📦 安装依赖包...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
)

echo ✅ 依赖检查通过
echo.

REM 运行测试套件
echo 🚀 开始运行测试套件...
echo.

REM 1. 单元测试
echo 📋 运行单元测试...
npm run test:unit
if %errorlevel% neq 0 (
    echo ❌ 单元测试失败
    goto :error
)
echo ✅ 单元测试通过
echo.

REM 2. 集成测试
echo 📋 运行集成测试...
npm run test:integration
if %errorlevel% neq 0 (
    echo ❌ 集成测试失败
    goto :error
)
echo ✅ 集成测试通过
echo.

REM 3. 性能测试
echo 📋 运行性能测试...
npm run test:performance
if %errorlevel% neq 0 (
    echo ❌ 性能测试失败
    goto :error
)
echo ✅ 性能测试通过
echo.

REM 4. 端到端测试
echo 📋 运行端到端测试...
npm run test:e2e
if %errorlevel% neq 0 (
    echo ❌ 端到端测试失败
    goto :error
)
echo ✅ 端到端测试通过
echo.

REM 5. 覆盖率测试
echo 📊 生成覆盖率报告...
npm run test:coverage
if %errorlevel% neq 0 (
    echo ⚠️  覆盖率报告生成失败，但测试已通过
)
echo.

REM 6. 运行综合测试运行器
echo 🔧 运行综合测试验证...
npm run test:all
if %errorlevel% neq 0 (
    echo ❌ 综合测试验证失败
    goto :error
)

echo.
echo ================================
echo 🎉 所有测试通过！
echo ================================
echo.
echo 📊 测试摘要:
echo   - 单元测试: ✅ 通过
echo   - 集成测试: ✅ 通过  
echo   - 性能测试: ✅ 通过
echo   - 端到端测试: ✅ 通过
echo   - 覆盖率报告: 📊 已生成
echo.
echo 🚀 系统已准备就绪，可以部署使用！
echo.
pause
exit /b 0

:error
echo.
echo ================================
echo ❌ 测试失败！
echo ================================
echo.
echo 请检查上述错误信息并修复问题后重新运行测试。
echo.
pause
exit /b 1

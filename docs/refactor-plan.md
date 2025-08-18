## 拆分重构计划（Refactor Plan）

### 一、背景与目标
- 将单文件 `index.html`（含 HTML/CSS/JS）逐步拆分为清晰的模块与层次，降低耦合、提升可维护性与测试性。
- 在不改变部署形态（可直接打开 `index.html` 或 GitHub Pages）的前提下，逐步完成服务层、核心流程、UI 层、工具、国际化、主题与样式的拆分。
- 为“Gemini 付费检测”等后续需求留出扩展点，提升整体工程质量（覆盖率、CI 兼容、团队协作）。

### 二、范围与不在范围
- 范围：前端页面逻辑、服务适配层、并发与重试、UI 渲染与控件、国际化与主题、工具方法、样式分层、测试与覆盖率、推送与忽略策略。
- 不在范围：后端/代理实现、业务需求新增（除计划中的“付费检测”扩展）。

### 三、总体原则
- 单一职责：按 UI、核心流程、并发/重试、服务、工具、国际化、主题、样式等分层。
- 渐进替换：每步仅抽取一小块功能到独立文件；抽取后即修改 `index.html` 引用并做回归。
- 可回滚：每步完成后页面可运行，出现异常快速撤销当前步修改。
- 可测试：优先抽取“纯逻辑/少 DOM 依赖”的部分，尽可能为每步补充单测/Mock。

### 四、目标结构（方案 A：零依赖拆分）
```text
api-key-tester/
├─ index.html
├─ js/
│  ├─ core/
│  │  ├─ tester.js              # startTesting / finalizeResult / 取消逻辑
│  │  ├─ concurrency.js         # processWithFixedConcurrency / waitForAnySlotCompletion / updateProgress
│  │  └─ retry.js               # testApiKeyWithRetry / shouldRetry / extractStatusCode
│  ├─ services/
│  │  ├─ apiUrl.js              # getApiUrl / updateProxyPlaceholder
│  │  ├─ openaiService.js       # testOpenAIKey / getOpenAIModels
│  │  ├─ claudeService.js       # testClaudeKey / getClaudeModels
│  │  └─ geminiService.js       # testGeminiKey / getGeminiModels / testGeminiContextCaching(后续)
│  ├─ ui/
│  │  ├─ render.js              # updateStats / updateKeyLists / showTab / updateUIAsync
│  │  └─ controls.js            # 并发/重试/模型等控件初始化与交互
│  ├─ i18n.js                   # translations / updateLanguage / toggleLanguage
│  ├─ theme.js                  # toggleTheme
│  ├─ utils/
│  │  ├─ keys.js                # deduplicateAndCleanKeys / extractApiKeys 等
│  │  └─ clipboard.js           # copyKeys / pasteFromClipboard / importFile
│  └─ main.js                   # initialize / initializeEventListeners / handleResize
├─ css/
│  ├─ base.css
│  ├─ components.css
│  └─ theme.css
├─ tests/
│  ├─ unit/
│  └─ e2e/
├─ package.json
├─ vitest.config.js
├─ README.md
└─ LICENSE
```

### 五、迁移映射（自 `index.html` → 模块文件）
- core：`startTesting/finalizeResult` → `js/core/tester.js`；`processWithFixedConcurrency/waitForAnySlotCompletion/updateProgress/startKeyTest` → `js/core/concurrency.js`；`testApiKeyWithRetry/shouldRetry/extractStatusCode` → `js/core/retry.js`
- services：`getApiUrl/updateProxyPlaceholder` → `js/services/apiUrl.js`；各平台 `get*Models/test*Key` → 对应 `*Service.js`
- ui：`updateStats/updateKeyLists/updateKeyList/showTab/updateUIAsync` → `js/ui/render.js`；并发/重试/模型控件 → `js/ui/controls.js`
- i18n/theme：`translations/updateLanguage/toggleLanguage` → `js/i18n.js`；`toggleTheme` → `js/theme.js`
- utils：`deduplicateAndCleanKeys/extractApiKeys/extractKeysFromContent/cleanApiKey` → `js/utils/keys.js`；`copyKeys/pasteFromClipboard/importFile/handleFileSelect` → `js/utils/clipboard.js`
- main：`initialize/initializeEventListeners/handleResize/DOMContentLoaded` → `js/main.js`
- css：从内联样式抽取到 `css/`，保留少量首屏关键样式内联以优化首屏

### 六、分步计划（Step 0~12）
- Step 0 预备
  - 动作：创建 `js/ css/ tests/` 等目录；在 `index.html` 预留外链位置
  - 验收：页面可开、无 404/报错
- Step 1 services/apiUrl（已完成）
  - 动作：抽取 `getApiUrl/updateProxyPlaceholder` → `js/services/apiUrl.js`
  - 验收：切换 API 类型时占位符更新；默认代理逻辑正常
- Step 2 平台服务（已完成）
  - 动作：抽取 OpenAI/Claude/Gemini 的 `get*Models/test*Key` → `js/services/*Service.js`
  - 验收：三平台“检测模型/开始测试”可用
- Step 3 重试策略（已完成）
  - 动作：抽取 `testApiKeyWithRetry/shouldRetry/extractStatusCode` → `js/core/retry.js`
  - 验收：403/502/503/504、网络/超时关键词触发重试；速率限制直接返回
- Step 4 并发执行（已完成）
  - 动作：抽取 `processWithFixedConcurrency/startKeyTest/waitForAnySlotCompletion/updateProgress` → `js/core/concurrency.js`
  - 验收：并发/进度表现与拆分前一致；取消能尽快停止排队
- Step 5 测试编排（进行中/待办）
  - 动作：抽取 `startTesting/finalizeResult` → `js/core/tester.js`
  - 验收：整条流程（去重→初始化→并发→收尾提示）跑通
- Step 6 工具（待办）
  - 动作：抽取 `utils/keys.js` 与 `utils/clipboard.js`
  - 验收：导入/粘贴/复制/去重功能完好
- Step 7 UI 渲染与控件（待办）
  - 动作：抽取 `ui/render.js` 与 `ui/controls.js`
  - 验收：统计卡、列表、标签切换、控件联动均正常
- Step 8 国际化与主题（待办）
  - 动作：抽取 `i18n.js` 与 `theme.js`
  - 验收：中英切换、明暗主题切换均可用
- Step 9 入口与事件（待办）
  - 动作：抽取 `main.js`
  - 验收：页面加载后所有事件与控件生效，无报错
- Step 10 样式分层（待办）
  - 动作：新建 `css/base.css/components.css/theme.css` 并迁移样式
  - 验收：浅/深主题、移动端适配正常；无视觉回归
- Step 11 付费检测（待办）
  - 动作：在 `geminiService.js` 增加 `testGeminiContextCaching`；结果在 `finalizeResult` 中区分 `paid`
  - 验收：选择 Gemini 时出现“付费”维度并正确分类
- Step 12 安全与性能（待办）
  - 动作：CSP、AbortController、缓存策略
  - 验收：严格 CSP 下运行正常；取消测试可中止在途请求

### 七、质量保障与测试策略
- 工具：Vitest + jsdom（单测），Playwright/Cypress（E2E，后续补充）
- Mock：拦截 `fetch`，覆盖 200/4xx/5xx/网络错误/超时与边界
- 覆盖率：
  - 目标：关键分支 ≥ 90%，整体函数覆盖率 100%
  - 现状：整体行覆盖率≈87%，函数 100%（已对 `services/`、`core/` 与 `apiUrl` 覆盖，后续继续补齐 tester/ui/utils/i18n/theme）

### 八、里程碑（示例）
- M1：Step 1~3 完成并通过单测与冒烟（已完成）
- M2：Step 4~7 完成，并补充单测与 E2E 冒烟（Step 4 已完成）
- M3：Step 8~10 完成；引入 Step 11；完善测试与文档

### 九、推送与忽略策略
- 推送：`index.html`、`js/`、`tests/`、`package.json`、`vitest.config.js`、`README.md`、`LICENSE`
- 忽略：`node_modules/`、`coverage/`、`dist/`、`.cache/`、`.vite/`、`.DS_Store`、`*.log`、`.idea/`、`.vscode/`、`.env*`、`项目分析/`
- 锁文件：`package-lock.json` 建议推送以保障可复现

### 十、风险与应对
- CORS/代理波动：优先使用自建代理；文案提示；在单测中覆盖错误分支
- 取消测试：引入 AbortController（Step 12）
- UI 回归：拆分后以单测 + 少量 E2E 冒烟覆盖主路径
- 覆盖率达标：对长尾分支（异常与 Fallback）专门补用例

### 十一、当前进度
- 已完成：Step 1~4；建立覆盖率环境并新增大量单测，整体覆盖率≈87%，函数 100%
- 下一步：Step 5 抽出 `startTesting/finalizeResult` 至 `js/core/tester.js` 并补单测；随后依序推进 Step 6~10 与 Step 11 增强

> 本计划为对外共享文档，可作为团队协作、代码评审与进度跟踪的依据；如需，我可在 CI 中接入 Lint/Test/Build 流程，确保主干质量稳定。

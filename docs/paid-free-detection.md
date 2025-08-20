# Gemini 付费/免费检测（Paid/Free Detection）

在“纯前端 + 代理中转”的前提下，为 Gemini API 增加“是否具备付费能力”的判定与展示，避免误把免费/受限账号当作付费账号。

## 背景
- 前端通过代理访问 Gemini API，不存储密钥，仅用于即时验证。

## 判定原理
1. **有效性检测**：调用 `generateContent` 成功 → Key 有效。  
2. **付费能力检测**：调用 `cachedContents`。  
   - 2xx 成功 → Paid  
   - 403 / PERMISSION_DENIED → 非 Paid  
   - 429 / RESOURCE_EXHAUSTED → Rate-limited  
   - 5xx / 网络异常 → Unknown（不改变基础有效性结论）

## UI 与交互
- API=Gemini 时展示：  
  - “付费”统计卡（`paidCount`）  
  - “付费密钥”标签页与列表（`paidKeys`）  
- 提示语已抽取为 i18n key。

## 配置（`js/config/featureFlags.js`）
```js
paidDetection: false,           // 是否启用付费检测（默认关闭）
paidDetectionMaxConcurrency: 5, // 并发上限
paidDetectionBackoff: {         // 429 时退避策略
  baseMs: 500, factor: 2, maxMs: 8000, retries: 2
},
paidDetectionMinTextLen: 8000   // cachedContents 最小文本长度

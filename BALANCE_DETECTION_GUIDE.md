# 硅基流动余额检测功能使用指南

## 功能概述

我们为API Key测试工具新增了硅基流动(SiliconCloud)余额检测功能，可以帮助用户实时查看账户余额和用户信息。

## 使用方法

### 1. 选择API类型
- 在API配置区域，将API类型设置为"SiliconCloud"

### 2. 输入API Key
- 在API密钥列表中输入您的硅基流动API Key
- 格式：每行一个密钥

### 3. 开始测试
- 点击"开始测试"按钮进行密钥验证

### 4. 查看余额信息
- 测试完成后，在右侧结果区域中，每个有效的硅基流动密钥下方会自动显示余额信息
- 余额信息包含：
  - 💰 账户余额（以人民币显示）
  - 👤 用户昵称（如果可用）
- 如果余额查询失败，会显示相应的错误提示

## API接口信息

### 硅基流动余额查询API
- **端点**: `https://api.siliconflow.cn/v1/user/info`
- **方法**: GET
- **认证**: Bearer Token
- **返回数据**: 用户信息包括余额、昵称、邮箱等

### 响应格式示例
```json
{
  "data": {
    "user_id": "user_12345",
    "nickname": "用户昵称", 
    "email": "user@example.com",
    "balance": 100.50,
    "currency": "CNY"
  }
}
```

## 特性

1. **智能显示**: 只在有效的SiliconCloud密钥测试结果中显示余额信息
2. **自动获取**: 密钥验证成功后自动查询余额，无需手动操作
3. **错误处理**: 当余额查询失败时显示明确的错误提示
4. **多语言支持**: 支持中文和英文界面
5. **响应式设计**: 适配桌面和移动设备
6. **实时更新**: 每个密钥独立查询余额，互不干扰

## 注意事项

- 余额查询功能目前仅支持硅基流动平台
- 需要有效的API Key才能查询余额
- 如果API Key没有权限访问用户信息，会显示相应错误
- 代理设置同样适用于余额查询

## 故障排除

### 常见错误及解决方案

1. **HTTP 401错误**
   - 检查API Key是否正确
   - 确认API Key有效且未过期

2. **HTTP 403错误** 
   - API Key可能没有访问用户信息的权限
   - 联系硅基流动客服确认权限设置

3. **网络连接错误**
   - 检查网络连接
   - 如果使用代理，确认代理设置正确

4. **余额不显示**
   - 确认已选择SiliconCloud API类型
   - 确认已输入有效的API Key
   - 尝试点击刷新按钮

## 开发信息

### 文件结构
```
src/
├── components/
│   └── features/
│       ├── BalanceDisplay/
│       │   ├── index.jsx                     # 原余额显示组件（已移除使用）
│       │   ├── KeyBalanceDisplay.jsx         # 单key余额显示组件
│       │   ├── BalanceDisplay.module.css     # 原组件样式
│       │   └── KeyBalanceDisplay.module.css  # 单key组件样式
│       └── Results/
│           └── VirtualizedList.jsx           # 集成余额显示的结果列表
├── services/
│   └── api/
│       ├── base.js                           # 通用API余额查询函数
│       └── siliconcloud.js                   # 硅基流动余额查询实现
└── locales/
    ├── zh.json                               # 中文翻译
    └── en.json                               # 英文翻译
```

### 集成方式
余额显示组件已集成到Results组件的VirtualizedList中，会在每个有效的SiliconCloud密钥测试结果下方自动显示余额信息。
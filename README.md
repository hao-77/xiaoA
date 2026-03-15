# 微信小程序

## 测试

本项目使用 [Vitest](https://vitest.dev/) 作为测试框架。由于微信小程序运行在特定的环境中，测试主要针对工具函数和业务逻辑进行单元测试。

### 安装测试依赖

```bash
cd miniprogram
npm install
```

### 运行测试

```bash
# 运行所有测试
npm test

# 单次运行测试（CI环境）
npm run test:run

# 运行测试并生成覆盖率报告
npm run test:coverage
```

### 测试文件结构

```
miniprogram/test/
├── setup.js          # 微信小程序API Mock设置
├── util.test.ts      # 工具函数测试（日期时间格式化）
├── login.test.js     # 登录逻辑测试（手机号验证、存储操作）
├── register.test.js  # 报名功能测试（时间段选择、日期校验）
└── progress.test.js  # 进度查看功能测试（API解析、URL编解码）
```

### 测试覆盖功能（第一、第二阶段）

| 测试文件 | 测试数量 | 覆盖功能 |
|---------|---------|---------|
| util.test.ts | 4 | 时间格式化函数 |
| login.test.js | 9 | 登录验证、手机号验证、存储操作 |
| register.test.js | 22 | 日期格式化、星期格式化、预约时间段选择、预约校验 |
| progress.test.js | 20 | 流程数据解析、可预约日期解析、跳转校验、文件预览 |

**总计：55个测试**

### 测试说明

由于微信小程序无法直接在Node环境中运行完整页面，本项目的测试策略如下：

1. **工具函数测试**：直接测试 `utils/` 目录下的工具函数
2. **业务逻辑测试**：测试页面中的纯业务逻辑函数（如表单验证、数据处理等）
3. **API Mock**：使用Mock模拟微信小程序的各种API（wx.request、wx.setStorageSync等）

### Mock的微信小程序API

测试框架提供了以下API的Mock：

- 存储相关：`wx.setStorageSync`, `wx.getStorageSync`, `wx.removeStorageSync`, `wx.clearStorageSync`
- 网络请求：`wx.request`
- 导航相关：`wx.switchTab`, `wx.navigateTo`, `wx.redirectTo`, `wx.reLaunch`, `wx.navigateBack`
- UI相关：`wx.showToast`, `wx.showModal`, `wx.showLoading`, `wx.hideLoading`, `wx.showActionSheet`
- 其他：`wx.getSystemInfo`, `wx.getSystemInfoSync` 等

### 编写测试

```javascript
// 测试工具函数
import { formatTime } from '../miniprogram/utils/util';

describe('Util Tests', () => {
  it('should format time correctly', () => {
    const date = new Date(2024, 0, 15, 9, 30, 45);
    const result = formatTime(date);
    expect(result).toBe('2024/01/15 09:30:45');
  });
});

// 测试业务逻辑
describe('Login Logic Tests', () => {
  it('should validate phone correctly', () => {
    const phone = '13800138000';
    const isValid = /^1[3-9]\d{9}$/.test(phone);
    expect(isValid).toBe(true);
  });
});
```

### 注意事项

1. 由于微信小程序使用 `.js` 和 `.wxml` 文件，部分测试需要使用JavaScript编写
2. 页面组件测试需要更复杂的Mock环境，建议使用微信开发者工具进行手动测试
3. 单元测试主要覆盖核心业务逻辑和数据处理函数

### 覆盖的业务需求

根据项目进度文档，本测试覆盖以下功能：

**第一阶段功能：**
- [x] 基本的登录、注册表单
- [x] 填写报名信息
- [x] 查看报名进度
- [x] 用户登录验证

**第二阶段功能：**
- [x] 报名进度的任务查看
- [x] 预约时间段选择
- [x] 日期校验
- [x] 文件预览功能

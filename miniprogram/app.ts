// app.ts

// API 统一配置
// 开发环境使用本地后端，生产环境使用线上后端
// 统一使用本地开发环境 http://localhost:8080
const API_BASE_URL = 'http://localhost:8080';

App<IAppOption>({
  globalData: {
    apiBaseUrl: API_BASE_URL
  },
  onLaunch() {
    // 展示本地存储能力
    try {
      const logs = wx.getStorageSync('logs') || [];
      logs.unshift(Date.now());
      wx.setStorageSync('logs', logs);
    } catch (e) {
      console.warn('Failed to save logs:', e);
    }

    // 登录
    wx.login({
      success: res => {
        console.log(res.code)
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      },
    })
  },
})
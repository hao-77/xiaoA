// app.ts

// API 统一配置
// 开发环境使用本地后端，生产环境使用线上后端
const API_BASE_URL = 'https://smalla.cosh.fun';

App<IAppOption>({
  globalData: {
    apiBaseUrl: API_BASE_URL
  },
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        console.log(res.code)
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      },
    })
  },
})
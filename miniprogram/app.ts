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
  // 全局显示回调 - 每次页面显示都会触发
  onShow() {
    // 验证登录状态 - 同步检查token是否存在
    const token = wx.getStorageSync('token');
    const isLogin = wx.getStorageSync('isLogin');

    // 如果有token但isLogin标志丢失，尝试恢复
    if (token && !isLogin) {
      wx.setStorageSync('isLogin', true);
      console.log('Login state restored from token');
    }

    // 如果token不存在但isLogin为true，清除状态（防止状态不一致）
    if (!token && isLogin) {
      wx.removeStorageSync('isLogin');
      console.log('Inconsistent login state cleared');
    }

    console.log('App onShow - Login state:', token ? 'logged in' : 'not logged in');
  }
})
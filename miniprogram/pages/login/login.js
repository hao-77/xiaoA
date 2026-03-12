// pages/login/login.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    phone: '',           // 手机号
    password: '',        // 密码
    loading: false,      // 全局加载状态
    accountLoadingBtn: false, // 账号密码登录按钮加载状态
    wechatLoadingBtn: false,  // 微信登录按钮加载状态
    loadingText: '登录中...'  // 加载提示文本
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 新增：页面加载时检查本地是否有token，有则直接跳首页
    this.checkLocalStorage();
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    // 新增：清理可能存在的定时器（防止内存泄漏）
    if (this.timeInterval) clearInterval(this.timeInterval);
  },

  // 新增：检查本地缓存的token，有则直接跳转首页
  checkLocalStorage() {
    const token = wx.getStorageSync('token');
    if (token) {
      this.navigateToHome();
    }
  },

  // 新增：统一的跳转首页方法（核心修改）
  navigateToHome() {
    wx.switchTab({
      url: '/pages/home/home',
      // 降级方案：switchTab失败（非tabBar页面）则用redirectTo
      fail: () => {
        wx.redirectTo({ url: '/pages/home/home' });
      }
    });
  },

  // 手机号输入事件
  onPhoneInput(e) {
    this.setData({
      phone: e.detail.value.trim()
    });
  },

  // 密码输入事件
  onPasswordInput(e) {
    this.setData({
      password: e.detail.value.trim()
    });
  },

  // 账号密码登录逻辑
  onAccountLogin() {
    const { phone, password } = this.data;

    // 1. 前端校验
    if (!phone) {
      wx.showToast({ title: '请输入手机号', icon: 'none' });
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({ title: '手机号格式不正确', icon: 'none' });
      return;
    }
    if (!password) {
      wx.showToast({ title: '请输入密码', icon: 'none' });
      return;
    }

    // 2. 显示账号登录按钮加载状态，禁用所有按钮
    this.setData({ accountLoadingBtn: true });

    // 3. 发起账号密码登录请求
    wx.request({
      url: 'https://smalla.cosh.fun/user/user/login',
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: { phone, password },
      success: (res) => {
        this.handleLoginResponse(res); // 统一处理登录响应
      },
      fail: (err) => {
        this.handleLoginFail(err, '账号登录'); // 统一处理请求失败
      },
      complete: () => {
        this.setData({ accountLoadingBtn: false }); // 关闭加载状态
      }
    });
  },

  // 微信一键登录逻辑
  onWechatLogin() {
    // 1. 显示微信登录按钮加载状态，禁用所有按钮
    this.setData({ wechatLoadingBtn: true });

    // 2. 调用微信登录获取 code
    wx.login({
      success: (res) => {
        if (res.code) {
          console.log(res.code)
          // 3. 用 code 调用后端微信登录接口
          wx.request({
            url: 'https://smalla.cosh.fun/user/user/wechat-login',
            method: 'POST',
            header: { 'Content-Type': 'application/json' },
            data: { code: res.code },
            success: (res) => {
              this.handleLoginResponse(res); // 统一处理登录响应
              console.log(res)
            },
            fail: (err) => {
              this.handleLoginFail(err, '微信登录'); // 统一处理请求失败
            },
            complete: () => {
              this.setData({ wechatLoadingBtn: false }); // 关闭加载状态
            }
          });
        } else {
          wx.showToast({ title: '微信登录失败，未获取到code', icon: 'none' });
          this.setData({ wechatLoadingBtn: false });
        }
      },
      fail: (err) => {
        wx.showToast({ title: '微信登录授权失败，请重试', icon: 'none' });
        this.setData({ wechatLoadingBtn: false });
      }
    });
  },

  // 统一处理登录接口响应（修改跳转逻辑）
  handleLoginResponse(res) {
    if (res.statusCode === 200 && res.data.code === 200) {
      const { saTokenInfo } = res.data.data;
      if (saTokenInfo && saTokenInfo.tokenValue) {
        // 存储登录凭证到本地
        wx.setStorageSync('token', saTokenInfo.tokenValue);
        wx.setStorageSync('userInfo', res.data.data);
        wx.setStorageSync('isLogin', true); // 设置登录标志
        
        wx.showToast({ 
          title: '登录成功', 
          icon: 'success', 
          duration: 1500,
          // 新增：确保toast显示完成后再跳转
          success: () => {
            setTimeout(() => this.navigateToHome(), 1000);
          }
        });
      } else {
        wx.showToast({ title: '登录失败，未获取到有效凭证', icon: 'none' });
      }
    } else {
      wx.showToast({ title: res.data.msg || '登录失败，请重试', icon: 'none' });
    }
  },

  // 统一处理请求失败
  handleLoginFail(err, type) {
    console.error(`${type}请求失败:`, err);
    // 显示更详细的错误信息
    let errorMsg = '网络错误，请稍后再试';
    if (err.errMsg) {
      if (err.errMsg.includes('request:fail')) {
        errorMsg = '无法连接服务器，请检查网络';
      } else if (err.errMsg.includes('timeout')) {
        errorMsg = '请求超时，请重试';
      }
    }
    wx.showToast({ title: errorMsg, icon: 'none' });
  }
});

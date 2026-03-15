// pages/registerPassword/registerPassword.js
const api = require('../../config/api.js');

Page({
  data: {
    phone: '',           // 手机号
    password: '',        // 密码
    confirmPassword: '', // 确认密码
    loading: false,     // 加载状态
    loadingText: '注册中...'  // 加载提示文本
  },

  onLoad(options) {
    // 如果从登录页传递了手机号，则自动填充
    if (options.phone) {
      this.setData({
        phone: options.phone
      });
    }
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

  // 确认密码输入事件
  onConfirmPasswordInput(e) {
    this.setData({
      confirmPassword: e.detail.value.trim()
    });
  },

  // 注册提交
  onRegister() {
    const { phone, password, confirmPassword } = this.data;

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
    if (password.length < 6) {
      wx.showToast({ title: '密码长度至少6位', icon: 'none' });
      return;
    }
    if (!confirmPassword) {
      wx.showToast({ title: '请输入确认密码', icon: 'none' });
      return;
    }
    if (password !== confirmPassword) {
      wx.showToast({ title: '两次密码输入不一致', icon: 'none' });
      return;
    }

    // 2. 显示加载状态
    this.setData({ loading: true });

    // 3. 发起注册请求
    // 根据后端API，使用 /user/user/login 接口进行注册（需要同时传phone和password）
    wx.request({
      url: api.API_BASE_URL + '/user/user/login',
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: { phone, password },
      success: (res) => {
        this.handleRegisterResponse(res);
      },
      fail: (err) => {
        this.handleRegisterFail(err);
      },
      complete: () => {
        this.setData({ loading: false });
      }
    });
  },

  // 处理注册响应
  handleRegisterResponse(res) {
    // 根据后端API，成功code可能是200或0
    if (res.statusCode === 200 && (res.data.code === 200 || res.data.code === 0)) {
      const { saTokenInfo, ...userData } = res.data.data || {};
      if (saTokenInfo && saTokenInfo.tokenValue) {
        // 存储登录凭证到本地
        wx.setStorageSync('token', saTokenInfo.tokenValue);
        wx.setStorageSync('userInfo', userData);
        wx.setStorageSync('isLogin', true);

        wx.showToast({
          title: '注册成功',
          icon: 'success',
          duration: 1500,
          success: () => {
            setTimeout(() => {
              wx.switchTab({
                url: '/pages/home/home',
                fail: () => {
                  wx.redirectTo({ url: '/pages/home/home' });
                }
              });
            }, 1000);
          }
        });
      } else {
        wx.showToast({ title: '注册成功，请登录', icon: 'none' });
        // 跳转回登录页
        setTimeout(() => {
          wx.redirectTo({ url: '/pages/login/login' });
        }, 1500);
      }
    } else {
      wx.showToast({ title: res.data.msg || '注册失败，请重试', icon: 'none' });
    }
  },

  // 处理注册失败
  handleRegisterFail(err) {
    console.error('注册请求失败:', err);
    let errorMsg = '网络错误，请稍后再试';
    if (err.errMsg) {
      if (err.errMsg.includes('request:fail')) {
        errorMsg = '无法连接服务器，请检查网络';
      } else if (err.errMsg.includes('timeout')) {
        errorMsg = '请求超时，请重试';
      }
    }
    wx.showToast({ title: errorMsg, icon: 'none' });
  },

  // 返回登录页
  goToLogin() {
    wx.redirectTo({ url: '/pages/login/login' });
  }
});

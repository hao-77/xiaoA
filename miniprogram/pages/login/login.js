// pages/login/login.js
const api = require('../../config/api.js');
const app = getApp();

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
  onLoad: function(options) { // 兼容写法：不用箭头函数
    // 新增：页面加载时检查本地是否有token，有则直接跳首页
    this.checkLocalStorage();
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() { // 兼容写法：不用箭头函数
    // 新增：清理可能存在的定时器（防止内存泄漏）
    if (this.timeInterval) clearInterval(this.timeInterval);
  },

  // 新增：检查本地缓存的token，有则直接跳转首页
  checkLocalStorage: function() { // 兼容写法
    var token = wx.getStorageSync('token'); // 不用const，改用var兼容低版本
    if (token) {
      this.navigateToHome();
    }
  },

  // 新增：统一的跳转首页方法（核心修改）
  navigateToHome: function() { // 兼容写法
    wx.switchTab({
      url: '/pages/home/home',
      // 降级方案：switchTab失败（非tabBar页面）则用redirectTo
      fail: function() { // 不用箭头函数
        wx.redirectTo({ url: '/pages/home/home' });
      }
    });
  },

  // 手机号输入事件
  onPhoneInput: function(e) { // 兼容写法
    this.setData({
      phone: e.detail.value.trim()
    });
  },

  // 密码输入事件
  onPasswordInput: function(e) { // 兼容写法
    this.setData({
      password: e.detail.value.trim()
    });
  },

  // 账号密码登录逻辑
  onAccountLogin: function() { // 兼容写法
    var that = this; // 保存this指向（兼容低版本）
    var phone = this.data.phone;
    var password = this.data.password;

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
    var apiBaseUrl = app.globalData ? app.globalData.apiBaseUrl : api.API_BASE_URL;
    wx.request({
      url: apiBaseUrl + '/user/user/login',
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: { phone: phone, password: password }, // 兼容写法：不用对象简写
      success: function(res) { // 不用箭头函数
        that.handleLoginResponse(res); // 统一处理登录响应
      },
      fail: function(err) { // 不用箭头函数
        that.handleLoginFail(err, '账号登录'); // 统一处理请求失败
      },
      complete: function() { // 不用箭头函数
        that.setData({ accountLoadingBtn: false }); // 关闭加载状态
      }
    });
  },

  // 微信一键登录逻辑
  onWechatLogin: function() { // 兼容写法
    var that = this; // 保存this指向
    // 1. 显示微信登录按钮加载状态，禁用所有按钮
    this.setData({ wechatLoadingBtn: true });

    // 2. 调用微信登录获取 code
    wx.login({
      success: function(res) { // 不用箭头函数
        if (res.code) {
          console.log(res.code)
          // 3. 用 code 调用后端微信登录接口
          var apiBaseUrl = app.globalData ? app.globalData.apiBaseUrl : api.API_BASE_URL;
          wx.request({
            url: apiBaseUrl + '/user/user/wechat-login',
            method: 'POST',
            header: { 'Content-Type': 'application/json' },
            data: { code: res.code },
            success: function(res) { // 不用箭头函数
              that.handleLoginResponse(res); // 统一处理登录响应
              console.log(res)
            },
            fail: function(err) { // 不用箭头函数
              that.handleLoginFail(err, '微信登录'); // 统一处理请求失败
            },
            complete: function() { // 不用箭头函数
              that.setData({ wechatLoadingBtn: false }); // 关闭加载状态
            }
          });
        } else {
          wx.showToast({ title: '微信登录失败，未获取到code', icon: 'none' });
          that.setData({ wechatLoadingBtn: false });
        }
      },
      fail: function(err) { // 不用箭头函数
        wx.showToast({ title: '微信登录授权失败，请重试', icon: 'none' });
        that.setData({ wechatLoadingBtn: false });
      }
    });
  },

// 统一处理登录接口响应（兼容ES5写法，修复that未定义）
handleLoginResponse: function(res) {
  var that = this; // 关键：定义that指向当前Page实例
  // 【关键】打印完整返回数据，排查问题
  console.log('=== handleLoginResponse 接收到的完整数据 ===');
  console.log('res:', res);
  console.log('res.data.data:', res.data.data);

  if (res.statusCode === 200 && res.data.code === 200) {
    var loginData = res.data.data;

    // 【核心修复】用ES5写法替代可选链，兼容所有环境
    var tokenValue = null;
    // 先判断saTokenInfo是否存在，再取tokenValue
    if (loginData.saTokenInfo && loginData.saTokenInfo.tokenValue) {
      tokenValue = loginData.saTokenInfo.tokenValue;
    }

    console.log('提取到的 tokenValue：', tokenValue);

    if (tokenValue) {
      // 1. 清理旧数据
      wx.removeStorageSync('token');
      wx.removeStorageSync('isLogin');
      wx.removeStorageSync('userInfo');

      // 2. 存储 token
      wx.setStorageSync('token', tokenValue);
      wx.setStorageSync('isLogin', true);

      // 3. 存储用户信息（ES5写法，不用解构赋值）
      var userInfo = {};
      // 遍历loginData，排除saTokenInfo字段
      for (var key in loginData) {
        if (loginData.hasOwnProperty(key) && key !== 'saTokenInfo') {
          userInfo[key] = loginData[key];
        }
      }
      wx.setStorageSync('userInfo', userInfo);

      // 验证存储结果
      console.log('=== 存储验证 ===');
      console.log('本地token:', wx.getStorageSync('token'));
      console.log('登录状态:', wx.getStorageSync('isLogin'));

      // 4. 处理pendingAction
      var pendingAction = wx.getStorageSync('pendingAction');
      var pendingFormData = wx.getStorageSync('pendingFormData');

      wx.showToast({
        title: '登录成功',
        icon: 'success',
        duration: 1500,
        success: function() {
          setTimeout(function() {
            // 检查是否有待处理的表单数据
            if (pendingAction === 'submitApplication') {
              // 保留pendingAction，让应用页面在onLoad和onShow中处理
              // 【修复Bug1】使用redirectTo替换当前页面，避免页面栈问题
              // 用户返回时会直接回到登录之前的页面，而不是回到登录页再返回
              wx.redirectTo({
                url: "/packageBusiness/pages/application/application"
              });
            } else if (pendingAction === 'toApplication') {
              wx.removeStorageSync('pendingAction');
              wx.navigateTo({ url: "/packageBusiness/pages/application/application" });
            } else if (pendingAction === 'checkProgress') {
              // 登录后检查报名进度
              wx.removeStorageSync('pendingAction');
              that.checkProgressAfterLogin();
            } else if (pendingAction === 'checkProgressIfRegistered') {
              // 登录后检查是否已报名，如果是则跳转进度页
              wx.removeStorageSync('pendingAction');
              that.checkProgressIfRegistered();
            } else {
              that.navigateToHome(); // 现在that已定义，可正常调用
            }
          }, 1000);
        }
      });
    } else {
      wx.showToast({ title: '登录失败：未获取到有效Token', icon: 'none' });
    }
  } else if (res.data.code === 500) {
    // 用户未注册的逻辑
    wx.showModal({
      title: '提示',
      content: res.data.msg || '该手机号尚未注册，是否前往注册？',
      confirmText: '前往注册',
      cancelText: '返回',
      success: function(modalRes) { 
        if (modalRes.confirm) {
          wx.redirectTo({
            url: '/pages/registerPassword/registerPassword?phone=' + that.data.phone 
          });
        }
      }
    });
  } else {
    wx.showToast({ title: res.data.msg || '登录失败，请重试', icon: 'none' });
  }
},

  // 统一处理请求失败
  handleLoginFail: function(err, type) { // 兼容写法
    console.error(type + '请求失败:', err); // 不用模板字符串
    // 显示更详细的错误信息
    var errorMsg = '网络错误，请稍后再试';
    if (err.errMsg) {
      if (err.errMsg.indexOf('request:fail') !== -1) { // 不用includes，用indexOf兼容
        errorMsg = '无法连接服务器，请检查网络';
      } else if (err.errMsg.indexOf('timeout') !== -1) {
        errorMsg = '请求超时，请重试';
      }
    }
    wx.showToast({ title: errorMsg, icon: 'none' });
  },

  // 跳转至手动注册页面
  goToRegister: function() { // 兼容写法
    var phone = this.data.phone;
    if (phone && /^1[3-9]\d{9}$/.test(phone)) {
      wx.redirectTo({
        url: '/pages/registerPassword/registerPassword?phone=' + phone // 拼接参数
      });
    } else {
      wx.redirectTo({
        url: '/pages/registerPassword/registerPassword'
      });
    }
  },

  // 检查报名状态并处理（从注册流程过来时使用）
  checkRegistrationAndHandle: function(pendingFormData) {
    var that = this;
    var apiBaseUrl = getApp().globalData ? getApp().globalData.apiBaseUrl : api.API_BASE_URL;
    var token = wx.getStorageSync('token');

    wx.request({
      url: apiBaseUrl + '/user/user/sign-up',
      method: 'GET',
      header: {
        'Authorization': token
      },
      success: function(res) {
        wx.removeStorageSync('pendingAction');
        wx.removeStorageSync('pendingFormData');

        if (res.data.code === 200 && res.data.data && res.data.data.groupId) {
          // 已报名 - 显示"是否沿用之前报名信息？"对话框
          wx.showModal({
            title: '您已报名过',
            content: '是否沿用之前报名信息？',
            confirmText: '否，使用我刚刚填写的信息重新报名',
            cancelText: '是，让我返回修改我之前报过的报名信息（会覆盖刚刚填写的内容）',
            success: function(modalRes) {
              if (modalRes.confirm) {
                // 使用新填写的信息重新报名 - 跳转表单页并传递新数据
                wx.setStorageSync('pendingFormData', pendingFormData);
                wx.navigateTo({
                  url: "/packageBusiness/pages/application/application?useNewData=true"
                });
              } else {
                // 沿用之前的报名信息 - 跳转到进度页查看
                wx.navigateTo({
                  url: "/packageBusiness/pages/progress/progress"
                });
              }
            }
          });
        } else {
          // 未报名 - 显示提交成功
          wx.showToast({
            title: '提交成功',
            icon: 'success',
            duration: 1500
          });
        }
      },
      fail: function(err) {
        console.error('检查报名状态失败:', err);
        // 失败时直接跳转表单页
        wx.navigateTo({
          url: "/packageBusiness/pages/application/application"
        });
      }
    });
  },

  // 登录后检查报名进度（普通查询）
  checkProgressAfterLogin: function() {
    var that = this;
    var apiBaseUrl = getApp().globalData ? getApp().globalData.apiBaseUrl : api.API_BASE_URL;
    var token = wx.getStorageSync('token');

    wx.request({
      url: apiBaseUrl + '/user/user/sign-up',
      method: 'GET',
      header: {
        'Authorization': token
      },
      success: function(res) {
        if (res.data.code === 200 && res.data.data && res.data.data.groupId) {
          // 已报名 - 跳转到进度页（使用redirectTo替换当前页面，避免返回到登录页）
          wx.redirectTo({
            url: "/packageBusiness/pages/progress/progress"
          });
        } else {
          // 未报名 - 显示未报名弹窗
          wx.setStorageSync('showRegisteredButton', false);
          wx.showModal({
            title: '暂未报名',
            content: '您尚未报名，无法查看进度',
            confirmText: '前往报名',
            showCancel: true,
            cancelText: '取消',
            success: function(modalRes) {
              if (modalRes.confirm) {
                wx.navigateTo({
                  url: "/packageBusiness/pages/application/application"
                });
              }
            }
          });
        }
      },
      fail: function(err) {
        console.error('检查报名状态失败:', err);
        wx.showToast({
          title: '获取报名信息失败',
          icon: 'none'
        });
      }
    });
  },

  // 登录后检查是否已报名，如果是则跳转进度页
  checkProgressIfRegistered: function() {
    var that = this;
    var apiBaseUrl = getApp().globalData ? getApp().globalData.apiBaseUrl : api.API_BASE_URL;
    var token = wx.getStorageSync('token');

    wx.request({
      url: apiBaseUrl + '/user/user/sign-up',
      method: 'GET',
      header: {
        'Authorization': token
      },
      success: function(res) {
        wx.removeStorageSync('pendingAction');

        if (res.data.code === 200 && res.data.data && res.data.data.groupId) {
          // 已报名 - 跳转到进度页（使用redirectTo替换当前页面，避免返回到登录页）
          wx.redirectTo({
            url: "/packageBusiness/pages/progress/progress"
          });
        } else {
          // 未报名 - 设置flag隐藏"已报名，点击登录查询"按钮，并显示"暂未登录"
          wx.setStorageSync('showRegisteredButton', false);
          wx.showModal({
            title: '暂未登录',
            content: '您暂未报名，无法查看进度',
            showCancel: false,
            confirmText: '知道了'
          });
        }
      },
      fail: function(err) {
        console.error('检查报名状态失败:', err);
        wx.showToast({
          title: '获取报名信息失败',
          icon: 'none'
        });
      }
    });
  }
});
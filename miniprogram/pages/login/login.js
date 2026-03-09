Page({
  data: {
    // 表单数据（与接口参数名对齐）
    realName: '',
    phone: '',
    agree: true, // 默认同意协议
    
    // 状态
    canLogin: false,
    loading: false,
    loadingText: '登录中...',
    
    // 当前时间
    currentTime: '12:00'
  },

  onLoad: function() {
    this.updateCurrentTime();
    this.timeInterval = setInterval(() => {
      this.updateCurrentTime();
    }, 1000);
    this.checkLocalStorage();
  },

  onUnload: function() {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  },

  updateCurrentTime: function() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    this.setData({
      currentTime: `${hours}:${minutes}`
    });
  },

  checkLocalStorage: function() {
    // 同步读取缓存（正确用法）
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    console.log(token)
    if (token && userInfo) {
      wx.switchTab({
        url: '/pages/index/index'
      });
    }
  },

  onNameInput: function(e) {
    this.setData({
      realName: e.detail.value
    }, () => {
      this.checkLoginStatus();
    });
  },

  onPhoneInput: function(e) {
    let phone = e.detail.value.replace(/[^\d]/g, '');
    this.setData({
      phone: phone
    }, () => {
      this.checkLoginStatus();
    });
  },

  checkLoginStatus: function() {
    const { realName, phone, agree } = this.data;
    const canLogin = realName.length > 0 && phone.length === 11 && agree;
    this.setData({ canLogin });
  },

  // 对接真实登录接口
  onLogin: function() {
    if (!this.data.canLogin) return;

    const { realName, phone } = this.data;

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({
        title: '手机号格式不正确',
        icon: 'none'
      });
      return;
    }

    this.setData({
      loading: true,
      loadingText: '登录中...'
    });

    // 获取全局API地址
    const apiBaseUrl = getApp().globalData.apiBaseUrl;
    
    // 真实接口请求
    wx.request({
      url: apiBaseUrl + '/user/user/login',
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      },
      data: {
        realName: realName,
        phone: phone
      },
      success: (res) => {
        this.setData({ loading: false });
        if (res.data.code === 200) {
          const { saTokenInfo } = res.data.data;
          // 从接口返回中提取 token 和 userId
          const token = saTokenInfo.tokenValue;
          const userId = saTokenInfo.loginId;
          const isLogin = saTokenInfo.isLogin;
          console.log(token)

          // 统一使用同步方法写入缓存（修复：全部加 Sync）
          wx.setStorageSync('token', token);
          wx.setStorageSync('isLogin', isLogin); // 同步写入
          wx.setStorageSync('userInfo', {
            realName: realName,
            phone: phone,
            userId: userId
          });

          wx.showToast({
            title: '登录成功',
            icon: 'success',
            duration: 1500,
            success: () => {
              setTimeout(() => {
                wx.navigateTo({
                  url: '/pages/home/home',
                })
              }, 1500);
            }
          });

        } else {
          wx.showToast({
            title: res.data.msg || '登录失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        this.setData({ loading: false });
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
        console.error('登录请求失败:', err);
      }
    });
  },

  // 快速测试登录（可选）
  onQuickLogin: function() {
    this.setData({
      realName: '测试姓名',
      phone: '13800138000',
      agree: true
    }, () => {
      this.checkLoginStatus();
    });
  }
});
Page({
  /**
   * 页面的初始数据
   */
  data: {
    loading: false, // 修复：新增 loading 变量，避免 setData 报错
    userName: '',   // 用户名
    userPhone: '',  // 用户手机号
    avatarUrl: ''   // 微信头像
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 页面显示时获取用户信息
    this.fetchUserInfo();
  },

  // 获取用户信息
  fetchUserInfo() {
    const userInfo = wx.getStorageSync('userInfo');
    const token = wx.getStorageSync('token');

    if (token && userInfo) {
      // 从缓存中获取用户信息，兼容多种字段名
      const realName = userInfo.realName || userInfo.name || userInfo.nickname || '';
      const phone = userInfo.phone || userInfo.phoneNumber || '';
      const avatarUrl = userInfo.avatarUrl || userInfo.avatar || '';

      // 优先显示真名，没有则显示手机号
      const displayName = realName || phone || '用户';
      this.setData({
        userName: displayName,
        userPhone: phone,
        avatarUrl: avatarUrl
      });

      // 同时从后端获取最新用户信息
      this.fetchUserInfoFromServer();
    } else {
      // 未登录
      this.setData({
        userName: '',
        userPhone: '',
        avatarUrl: ''
      });
    }
  },

  // 从后端获取用户信息
  fetchUserInfoFromServer() {
    const apiBaseUrl = getApp().globalData.apiBaseUrl;
    wx.request({
      url: apiBaseUrl + '/user/user',
      method: 'GET',
      header: {
        'Authorization': wx.getStorageSync('token')
      },
      success: (res) => {
        if (res.data.code === 200 && res.data.data) {
          const data = res.data.data;
          // 更新本地缓存
          const storedUserInfo = wx.getStorageSync('userInfo') || {};
          storedUserInfo.realName = data.realName;
          storedUserInfo.phone = data.phone;
          storedUserInfo.avatarUrl = data.avatarUrl;
          storedUserInfo.gender = data.gender;
          storedUserInfo.studentId = data.studentId;
          storedUserInfo.college = data.college;
          storedUserInfo.grade = data.grade;
          storedUserInfo.majorClass = data.majorClass;
          storedUserInfo.groupId = data.groupId;
          wx.setStorageSync('userInfo', storedUserInfo);

          // 更新页面数据
          const displayName = data.realName || data.phone || '用户';
          this.setData({
            userName: displayName,
            userPhone: data.phone || '',
            avatarUrl: data.avatarUrl || ''
          });
        }
      },
      fail: (err) => {
        console.error('获取用户信息失败:', err);
      }
    });
  },

  // 获取微信头像
  getWechatAvatar() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        const userInfo = res.userInfo;
        this.setData({
          avatarUrl: userInfo.avatarUrl,
          userName: userInfo.nickName
        });
        // 保存到本地缓存
        const storedUserInfo = wx.getStorageSync('userInfo') || {};
        storedUserInfo.avatarUrl = userInfo.avatarUrl;
        storedUserInfo.nickname = userInfo.nickName;
        wx.setStorageSync('userInfo', storedUserInfo);
      },
      fail: (err) => {
        console.log('获取用户头像失败:', err);
        wx.showToast({
          title: '获取头像失败',
          icon: 'none'
        });
      }
    });
  },

  logout:function(){
    // 修复1：改用同步方法读取缓存（加 Sync）
    const token = wx.getStorageSync('token');
    const isLogin = wx.getStorageSync('isLogin');
    console.log(token, isLogin, 666);

    // 修复2：判空逻辑优化
    if (!token || !isLogin) {
      wx.showToast({
        title: '未登录，无需退出',
        icon: 'none'
      });
      // 清除残留缓存并跳转登录页
      this.clearLoginCache();
      return;
    }

    this.setData({ loading: true }); // 修复：登出前显示加载

    const apiBaseUrl = getApp().globalData.apiBaseUrl;
    wx.request({
      url: apiBaseUrl + '/user/user/logout',
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      data: {},
      success: (res) => {
        this.setData({ loading: false });
        if (res.data.code === 200) {
          wx.showToast({
            title: '登出成功',
            icon: 'success',
            duration: 1500
          });
          // 修复3：成功后清除缓存并跳转
          this.clearLoginCache();
        } else {
          wx.showToast({
            title: res.data.msg || '登出失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        this.setData({ loading: false });
        wx.showToast({
          title: '网络错误，强制退出',
          icon: 'none'
        });
        console.error('登出请求失败:', err);
        // 修复4：网络错误也清除缓存
        this.clearLoginCache();
      }
    });
  },

  // 封装清除登录缓存的方法
  clearLoginCache() {
    // 同步清除所有登录相关缓存
    wx.removeStorageSync('token');
    wx.removeStorageSync('isLogin');
    wx.removeStorageSync('userInfo');
    
    // 修复5：用 reLaunch 清空页面栈，避免返回
    setTimeout(() => {
      wx.reLaunch({
        url: '/pages/login/login'
      });
    }, 1500);
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {},

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {},

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {},

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {},

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {},

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {},

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {}
});
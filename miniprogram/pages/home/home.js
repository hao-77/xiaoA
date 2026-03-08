// pages/home/home.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    onLoading: false // 加载状态，避免用户重复点击
  },

  // 跳转至申请表单页
  toApplication: function() {
    wx.navigateTo({
      url: "/pages/application/application"
    });
  },

  // 跳转至进度页
  toProgress: function() {
    wx.navigateTo({
      url: "/pages/progress/progress"
    });
  },
  toTeamIntro:function(){
    wx.navigateTo({
      url: "/pages/teamIntro/teamIntro"
    });
  },

  // 核心：登录超级管理员获取 superToken（适配后端返回格式）
  superAdmin: function() {
    // 1. 开始请求前显示加载状态
    this.setData({ onLoading: true });

    wx.request({
      url: 'http://localhost:8080/admin/user/login',
      method: "POST",
      header: {
        'Content-Type': 'application/json'
      },
      data: {
        account: 3,    // 按你需求传数字，后端能接收即可
        password: 3    // 保持和你原代码一致的参数格式
      },
      success: (res) => {
        // 2. 请求结束，关闭加载状态
        this.setData({ onLoading: false });

        // 3. 校验后端返回的核心数据
        if (res.data && res.data.code === 200) {
          const { saTokenInfo, roleId } = res.data.data;
          
          // 4. 提取超级管理员的 token 和关键信息
          if (saTokenInfo && saTokenInfo.tokenValue) {
            const superToken = saTokenInfo.tokenValue; // 核心要拿的 superToken
            console.log(superToken);
            const loginId = saTokenInfo.loginId;       // 用户ID
            const isLogin = saTokenInfo.isLogin;       // 是否登录成功
            const tokenName = saTokenInfo.tokenName;   // 后端指定的 token 名（Authorization）
            const roleId = res.data.data.roleId;       // 角色ID（3 是超级管理员）

            // 5. 把关键信息存入本地缓存（方便全局使用）
            wx.setStorageSync('superToken', superToken);
            wx.setStorageSync('superAdminLoginId', loginId);
            wx.setStorageSync('isSuperAdminLogin', isLogin);
            wx.setStorageSync('superAdminTokenName', tokenName);
            wx.setStorageSync('superAdminRoleId', roleId);

            // 打印日志，方便你验证是否获取成功
            console.log('超级管理员登录成功！');
            console.log('superToken：', superToken);
            console.log('登录ID：', loginId);
            console.log('角色ID：', roleId);

            // 提示用户登录成功
            wx.showToast({
              title: '超级管理员登录成功',
              icon: 'success',
              duration: 1500
            });

            // 可选：如果需要跳转到管理员专属页面，取消下面注释
            // setTimeout(() => {
            //   wx.navigateTo({ url: '/pages/admin/admin' });
            // }, 1500);
          } else {
            // 有返回但无 token，提示错误
            wx.showToast({
              title: '登录成功但 Token 缺失',
              icon: 'none'
            });
          }
        } else {
          // 后端返回非 200 状态
          wx.showToast({
            title: res.data.msg || '超级管理员登录失败',
            icon: 'none'
          });
          console.error('登录失败原因：', res.data.msg || '未知错误');
        }
      },
      fail: (err) => {
        // 网络错误/请求失败处理
        this.setData({ onLoading: false });
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
        console.error('登录请求失败：', err);
      }
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    // 页面加载时自动调用超级管理员登录接口
    this.superAdmin();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    // 可选：页面显示时，校验缓存中的 superToken 是否存在
    const superToken = wx.getStorageSync('superToken');
    if (superToken) {
      console.log('缓存中已存在 superToken：', superToken);
    } else {
      console.log('缓存中无 superToken，可重新登录');
      // 可选：无 token 时自动重新登录
      // this.superAdmin();
    }
  },

  // 其他生命周期函数保持默认即可
  onReady: function() {},
  onHide: function() {},
  onUnload: function() {},
  onPullDownRefresh: function() {},
  onReachBottom: function() {},
  onShareAppMessage: function() {
    return {
      title: '首页',
      path: '/pages/home/home'
    };
  }
});
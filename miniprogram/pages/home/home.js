// pages/home/home.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    onLoading: false, // 加载状态，避免用户重复点击
    showSignupModal: false, // 报名弹窗显示
    hasSignup: false,      // 是否已报名
    userSignupGroup: '',   // 用户报名的组别
    latestTweetCover: '',   // 最新推文的封面图片
    latestTweetTitle: '',   // 最新推文的标题
    showLoginModal: false, // 登录选择弹窗显示
    showRegisteredOption: true, // 是否显示"已报名，点击登录查询"选项
  },

  // 跳转至申请表单页 - 直接跳转到报名页，让用户在表单提交时才登录
  toApplication: function() {
    // 直接跳转到报名页，不检查登录状态
    // 用户可以浏览和填写表单，只有在提交时才需要登录
    wx.navigateTo({
      url: "/packageBusiness/pages/application/application"
    });
  },

  // 跳转至进度页 - 先检查是否已报名
  toProgress: function() {
    const that = this;
    const apiBaseUrl = getApp().globalData.apiBaseUrl;
    const token = wx.getStorageSync('token');
    const isLogin = wx.getStorageSync('isLogin');
    const showRegisteredButton = wx.getStorageSync('showRegisteredButton');

    // 如果未登录，显示自定义弹窗让用户选择
    if (!token || !isLogin) {
      // 显示自定义登录选择弹窗
      this.setData({
        showLoginModal: true,
        showRegisteredOption: showRegisteredButton !== false
      });
      return;
    }

    // 已登录，检查用户是否已报名
    wx.request({
      url: apiBaseUrl + '/user/user/sign-up',
      method: 'GET',
      header: {
        'Authorization': token
      },
      success: (res) => {
        if (res.data.code === 200 && res.data.data && res.data.data.groupId) {
          // 已报名 - 直接跳转到进度页
          wx.navigateTo({
            url: "/packageBusiness/pages/progress/progress"
          });
        } else {
          // 未报名 - 显示弹窗
          that.setData({
            showSignupModal: true,
            hasSignup: false,
            userSignupGroup: ''
          });
        }
      },
      fail: () => {
        wx.showToast({
          title: '获取报名信息失败',
          icon: 'none'
        });
      }
    });
  },

  // 关闭弹窗
  closeModal: function() {
    this.setData({
      showSignupModal: false
    });
  },

  // 关闭登录选择弹窗
  closeLoginModal: function() {
    this.setData({
      showLoginModal: false
    });
  },

  // 去登录
  goToLogin: function() {
    this.setData({
      showLoginModal: false
    });
    wx.setStorageSync('pendingAction', 'checkProgress');
    wx.navigateTo({
      url: '/pages/login/login'
    });
  },

  // 暂不登录
  notLoginNow: function() {
    this.setData({
      showLoginModal: false
    });
    wx.showModal({
      title: '提示',
      content: '查看报名进度需要先登录',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 已报名，点击登录查询
  goToLoginCheckRegistered: function() {
    this.setData({
      showLoginModal: false
    });
    wx.setStorageSync('pendingAction', 'checkProgressIfRegistered');
    wx.navigateTo({
      url: '/pages/login/login'
    });
  },

  // 跳转报名
  goToSignup: function() {
    this.setData({
      showSignupModal: false
    });
    wx.navigateTo({
      url: '/packageBusiness/pages/application/application',
      fail: () => {
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        });
      }
    });
  },

  toTeamIntro:function(){
    wx.navigateTo({
      url: "/packageTeam/pages/teamIntro/teamIntro"
    });
  },

  // 跳转至精选推文/最新动态 - 跳转到推文列表页面
  toTweets: function() {
    wx.navigateTo({
      url: "/packageTeam/pages/tweets/tweets"
    });
  },

  // 保留超级管理员登录功能，但不再自动调用
  // 现在需要通过"我的"页面的管理员登录按钮手动触发
  superAdmin: function() {
    // 1. 开始请求前显示加载状态
    this.setData({ onLoading: true });

    // 获取全局API地址
    const apiBaseUrl = getApp().globalData.apiBaseUrl;

    wx.request({
      url: apiBaseUrl + '/admin/user/login',
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

  // 获取最新推文的封面图片和标题
  fetchLatestTweetCover: function() {
    const apiBaseUrl = getApp().globalData.apiBaseUrl;

    wx.request({
      url: `${apiBaseUrl}/user/tweet/list`,
      method: 'GET',
      data: {
        page: 1,
        pageSize: 1
      },
      header: {
        'Content-Type': 'application/json'
      },
      success: (res) => {
        if (res.data.code === 200 && res.data.data) {
          // Handle both array response and paginated response with records
          // (Same logic as used in tweets.js)
          const tweets = Array.isArray(res.data.data) ? res.data.data : (res.data.data.records || []);

          if (tweets.length > 0) {
            const latestTweet = tweets[0];
            this.setData({
              latestTweetCover: latestTweet.coverImageUrl || '',
              latestTweetTitle: latestTweet.title || ''
            });
            console.log('最新推文封面:', latestTweet.coverImageUrl);
            console.log('最新推文标题:', latestTweet.title);
          } else {
            console.log('推文列表为空');
          }
        } else {
          console.log('获取推文失败:', res.data.msg);
        }
      },
      fail: (err) => {
        console.error('获取最新推文封面失败:', err);
        wx.showToast({
          title: '获取推文失败，请检查网络',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    // 移除自动调用超级管理员登录 - 这会导致所有用户都尝试登录管理员
    // 管理员登录功能现在通过"我的"页面的管理员入口手动触发
    console.log('Home page loaded');
    
    // 获取最新推文的封面图片
    this.fetchLatestTweetCover();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    // 移除超级管理员自动登录检查 - 不再自动登录管理员
    // 管理员如需登录，应通过"我的"页面的管理员入口手动操作
    const token = wx.getStorageSync('token');
    if (token) {
      console.log('User is logged in');
    } else {
      console.log('User is not logged in');
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
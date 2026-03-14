Page({
  /**
   * 页面的初始数据
   */
  data: {
    currentTab: 1, // 当前选中的选项卡（默认“组别介绍”）
    teamData: {}    // 存储从接口拉取的团队数据
  },

  /**
   * 切换选项卡
   */
  switchTab(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      currentTab: index
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.fetchTeamData(); // 页面加载时拉取团队数据
  },

  // 从 /team 接口拉取团队介绍数据
  fetchTeamData() {
    wx.showLoading({ title: '加载中...' });
    wx.request({
      url: getApp().globalData.apiBaseUrl + '/team',
      method: 'GET',
      header: {
        // 如果需要超级管理员权限，这里带上 superToken
        'Authorization': wx.getStorageSync('superToken')
      },
      success: (res) => {
        wx.hideLoading();
        if (res.data.code === 200 && res.data.data) {
          const teamData = res.data.data;
          console.log('拉取到的团队数据：', teamData);

          this.setData({
            teamData: teamData
          });
        } else {
          wx.showToast({
            title: '获取团队信息失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
        console.error('拉取团队信息失败:', err);
      }
    });
  },

  // 跳转到项目介绍页面
  toProjectIntro() {
    wx.navigateTo({
      url: '/packageTeam/pages/projectIntro/projectIntro'
    });
  },

  // 核心：跳转到组别介绍页面（直接到轮播页面）
  toGroupIntro() {
    wx.navigateTo({
      url: '/packageTeam/pages/groupCarousel/groupCarousel'
    });
  }
});
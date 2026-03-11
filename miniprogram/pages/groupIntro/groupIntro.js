Page({
  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 核心：跳转到对应组别页面
   */
  goToGroupPage(e) {
    const groupName = e.currentTarget.dataset.group;
    if (!groupName) {
      wx.showToast({ title: '组别信息异常', icon: 'none' });
      return;
    }
  
    // 特殊处理前端组：文件夹是 frontEnd0
    let folderName = groupName;
    if (groupName === 'frontEnd') {
      folderName = 'frontEnd0';
    }
  
    const url = `/pages/${folderName}/${groupName}`; // 页面名还是 frontEnd
  
    wx.navigateTo({
      url: url,
      fail: () => {
        wx.showToast({
          title: `暂无${this.getGroupNameCN(groupName)}介绍页面`,
          icon: 'none'
        });
      }
    });
  },
  /**
   * 辅助：将英文组别名转为中文（用于提示）
   */
  getGroupNameCN(groupName) {
    const nameMap = {
      AI: 'AI组',
      frontEnd: '前端组',
      mechanical: '机械组',
      product: '产品组',
      backStage: '后端组',
      EC: '电控组',
      operation: '运营组'
    };
    return nameMap[groupName] || groupName;
  },

  /**
   * 查看组别介绍（保留原有方法，可按需删除）
   */
  viewIntro() {
    wx.showModal({
      title: '运营组介绍',
      content: '运营组负责项目的日常运营、用户维护与活动策划，是连接产品与用户的核心桥梁。',
      showCancel: false,
      confirmText: '知道了'
    })
  },

  /**
   * 跳转到首页
   */
  goToHome() {
    wx.switchTab({
      url: '/pages/home/home'
    })
  },

  /**
   * 跳转到我的页面
   */
  goToMy() {
    wx.switchTab({
      url: '/pages/my/my'
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

  }
})
// pages/progress/progress.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    currentProcess: {} // 初始为空，由接口填充
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.fetchProgressData(); // 页面加载时就请求数据
  },

  /**
   * 查看详情按钮点击事件
   */
  onDetailTap() {
    const { userProcessId } = this.data.currentProcess;
    if (userProcessId) {
      wx.navigateTo({
        url: `/pages/progress-detail/progress-detail?id=${userProcessId}`
      });
    } else {
      wx.showToast({ title: "暂无详情", icon: "none" });
    }
  },

  /**
   * 请求接口获取动态数据
   */
  fetchProgressData() {
    wx.request({
      url: 'https://smalla.cosh.fun/user/process/progress', // 用你截图里的真实地址
      method: 'GET',
      header: {
        // 如果接口需要 token 认证，在这里加上
        'Content-Type': 'application/json',
        'Authorization': wx.getStorageSync('token')
      },
      success: (res) => {
        console.log('接口返回:', res.data); // 方便调试
        if (res.data.code === 200) {
          // 把接口返回的 currentProcess 直接赋值给页面数据
          this.setData({
            currentProcess: res.data.data.currentProcess
          });
        } else {
          wx.showToast({
            title: res.data.msg || '获取数据失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('请求进度数据失败：', err);
        wx.showToast({
          title: "网络错误，请重试",
          icon: "error"
        });
      }
    });
  }
})
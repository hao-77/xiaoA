// pages/webview/webview.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    url: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    if (options.url) {
      // 解码 URL 参数
      const url = decodeURIComponent(options.url);
      this.setData({ url });
    } else {
      // 如果没有传 URL，尝试从存储中获取
      const savedUrl = wx.getStorageSync('webviewUrl');
      if (savedUrl) {
        this.setData({ url: savedUrl });
        wx.removeStorageSync('webviewUrl');
      } else {
        wx.showToast({
          title: '无效的链接',
          icon: 'none'
        });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }
    }
  },

  /**
   * 页面关闭时清理存储
   */
  onUnload() {
    wx.removeStorageSync('webviewUrl');
  }
});

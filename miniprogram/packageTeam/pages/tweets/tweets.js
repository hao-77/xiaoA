// packageTeam/pages/tweets/tweets.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    tweetList: [],      // 推文列表数据
    page: 1,            // 当前页码
    pageSize: 10,       // 每页数量
    hasMore: true,      // 是否还有更多数据
    loading: false,     // 加载状态
    refreshing: false   // 下拉刷新状态
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.fetchTweetList();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 页面显示时刷新数据
    this.setData({
      page: 1,
      hasMore: true
    });
    this.fetchTweetList();
  },

  // 获取推文列表数据
  fetchTweetList(isRefresh = false) {
    if (this.data.loading) return;
    
    this.setData({ loading: true });
    
    wx.showLoading({ title: '加载中...' });
    
    const apiBaseUrl = getApp().globalData.apiBaseUrl;
    
    wx.request({
      url: `${apiBaseUrl}/user/tweet/list`,
      method: 'GET',
      data: {
        page: this.data.page,
        pageSize: this.data.pageSize
      },
      header: {
        'Content-Type': 'application/json'
      },
      success: (res) => {
        wx.hideLoading();
        
        if (res.data.code === 200 && res.data.data) {
          const newList = res.data.data.records || [];
          
          this.setData({
            tweetList: isRefresh ? newList : [...this.data.tweetList, ...newList],
            hasMore: newList.length >= this.data.pageSize,
            loading: false,
            refreshing: false
          });
          
          console.log('推文列表数据：', this.data.tweetList);
        } else {
          wx.showToast({
            title: res.data.msg || '获取推文列表失败',
            icon: 'none'
          });
          this.setData({ loading: false, refreshing: false });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
        console.error('获取推文列表失败:', err);
        this.setData({ loading: false, refreshing: false });
      }
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({
      page: 1,
      hasMore: true,
      refreshing: true
    });
    this.fetchTweetList(true);
    
    // 停止下拉刷新
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },

  // 上拉加载更多
  onReachBottom() {
    if (!this.data.hasMore) {
      wx.showToast({
        title: '没有更多了',
        icon: 'none'
      });
      return;
    }
    
    this.setData({
      page: this.data.page + 1
    });
    this.fetchTweetList();
  },

  // 点击推文查看详情（如果有详情页的话）
  onTweetClick(e) {
    const index = e.currentTarget.dataset.index;
    const tweet = this.data.tweetList[index];
    
    wx.showToast({
      title: '暂未开放详情页',
      icon: 'none'
    });
    
    // 未来可以跳转到详情页：
    // wx.navigateTo({
    //   url: `/packageTeam/pages/tweetDetail/tweetDetail?id=${tweet.id}`
    // });
  }
});

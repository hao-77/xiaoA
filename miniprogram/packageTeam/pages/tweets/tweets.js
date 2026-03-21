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
    refreshing: false,  // 下拉刷新状态
    dataLoaded: false   // 数据是否已加载过（防止onShow重复获取数据）
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
    // 只有在数据未加载时才获取数据，防止重复获取导致数据重复
    if (!this.data.dataLoaded) {
      this.setData({
        page: 1,
        hasMore: true
      });
      this.fetchTweetList();
    }
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
          // Handle both array response and paginated response with records
          const newList = Array.isArray(res.data.data) ? res.data.data : (res.data.data.records || []);
          
          this.setData({
            tweetList: isRefresh ? newList : [...this.data.tweetList, ...newList],
            hasMore: newList.length >= this.data.pageSize,
            loading: false,
            refreshing: false,
            dataLoaded: true  // 标记数据已加载
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

  // 点击推文查看详情 - 打开文章链接
  onTweetClick(e) {
    const index = e.currentTarget.dataset.index;
    const tweet = this.data.tweetList[index];

    if (!tweet.contentUrl) {
      wx.showToast({
        title: '文章链接无效',
        icon: 'none'
      });
      return;
    }

    const contentUrl = encodeURIComponent(tweet.contentUrl);

    // 跳转到 webview 页面打开文章链接
    wx.navigateTo({
      url: `/pages/webview/webview?url=${contentUrl}`,
      fail(res) {
        console.log('跳转webview失败', res);
        wx.showToast({
          title: '无法打开文章',
          icon: 'none'
        });
      }
    });
  },

  // 解析小程序链接，判断是否为小程序链接并提取 appId 和 path
  parseMiniProgramUrl(url) {
    if (!url) return null;

    // 去除空格
    url = url.trim();

    // 1. 检查是否是短链接格式（小程序页面路径，如 pageshow?foo=123 或 pages/index/index?id=1）
    // 这种格式没有 http/https 前缀，通常是小程序页面路径
    const shortLinkPattern = /^[a-zA-Z0-9\/\?_=&-]+$/;
    if (shortLinkPattern.test(url) && (url.startsWith('pages') || url.includes('?'))) {
      // 短链接格式，假设使用默认 appId（需要根据实际业务调整）
      // 这里返回一个默认的 appId，实际项目中可能需要从配置或服务端获取
      return {
        appId: '', // 短链接格式无法直接获取 appId，需要业务方提供
        path: url
      };
    }

    // 2. 检查是否是外部 URL 格式
    if (url.startsWith('http://') || url.startsWith('https://')) {
      // 尝试从 URL 参数中提取 appId
      try {
        const urlObj = new URL(url);
        const appId = urlObj.searchParams.get('appId') || urlObj.searchParams.get('appid');

        if (appId) {
          // URL 中包含 appId，认为是小程序链接
          // 提取 path 参数，如果没有则使用首页
          let path = urlObj.searchParams.get('path') || urlObj.searchParams.get('page') || '';
          // 解码 path
          if (path) {
            path = decodeURIComponent(path);
          }

          return {
            appId: appId,
            path: path
          };
        }

        // 检查是否是微信小程序专用链接格式
        // 例如: weixin://dl/business/?appid=xxx&path=xxx
        if (url.includes('weixin://dl/business/') || url.includes('weixin://')) {
          const appIdMatch = url.match(/appid=([^&]+)/i);
          const pathMatch = url.match(/path=([^&]+)/i);

          if (appIdMatch) {
            return {
              appId: appIdMatch[1],
              path: pathMatch ? decodeURIComponent(pathMatch[1]) : ''
            };
          }
        }

        // 是外部 URL 但不包含小程序信息，不是有效的小程序链接
        return null;
      } catch (e) {
        console.error('解析URL失败', e);
        return null;
      }
    }

    // 3. 其他格式（如纯数字、纯字符串等），不是有效的小程序链接
    return null;
  }
});

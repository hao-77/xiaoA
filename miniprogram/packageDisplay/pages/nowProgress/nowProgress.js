const api = require('../../../config/api.js');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    currentProcess: {}, // 保存当前流程信息
    processList: [],    // 保存所有流程列表
    availableDates: []  // 存储可预约日期
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 页面加载时拉取流程进度，预约日期在流程数据获取成功后再拉取
    this.fetchUserProgress();
  },

  // 从后端拉取用户流程进度（复用参考代码逻辑）
  fetchUserProgress() {
    wx.showLoading({ title: '加载中...' });
    wx.request({
      url: api.API_BASE_URL + '/user/process/progress',
      method: 'GET',
      header: {
        'Authorization': wx.getStorageSync('token') // 带上登录token
      },
      success: (res) => {
        wx.hideLoading();
        if (res.data.code === 200 && res.data.data) {
          const { currentProcess, processList } = res.data.data;
          console.log('拉取到的流程数据：', currentProcess, processList);

          // 回填到页面数据（供WXML渲染）
          this.setData({
            currentProcess: currentProcess,
            processList: processList
          });

          // 流程数据获取成功后，调用查询预约日期的方法
          this.userAppointmentsDate();
        } else {
          wx.showToast({
            title: '获取流程信息失败',
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
        console.error('拉取流程进度失败:', err);
      }
    });
  },

  // 查询流程可预约日期（复用参考代码逻辑）
  userAppointmentsDate() {
    // 从当前流程中获取 processId
    const processId = this.data.currentProcess.id;
    console.log('当前流程ID：', processId);

    if (!processId) {
      wx.showToast({
        title: '流程信息不完整',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({ title: '加载可预约日期...' });
    wx.request({
      url: api.API_BASE_URL + `/user/user-appointments/date?processId=${processId}`,
      method: 'GET',
      header: {
        'Authorization': wx.getStorageSync('token')
      },
      success: (res) => {
        wx.hideLoading();
        if (res.data.code === 200 && res.data.data) {
          console.log('可预约日期接口返回：', res.data.data);
          const availableDates = res.data.data;
          
          // 把日期数据存到页面 data 中
          this.setData({
            availableDates: availableDates
          });
        } else {
          wx.showToast({
            title: '获取可预约日期失败',
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
        console.error('获取可预约日期失败:', err);
      }
    });
  },

  // 核心：点击“查看详情”跳转到register页面（预约页面）
// nowProgress页面的gotoHomework方法
gotoHomework() {
  const { availableDates, currentProcess } = this.data;
  
  if (!availableDates || availableDates.length === 0) {
    wx.showToast({ title: '暂无可预约日期', icon: 'none' });
    return;
  }
  if (!currentProcess.id) {
    wx.showToast({ title: '流程信息缺失', icon: 'none' });
    return;
  }

  // 跳转homework并传递参数（核心）
  wx.navigateTo({
    url: `/packageBusiness/pages/homework/homework?availableDates=${encodeURIComponent(JSON.stringify(availableDates))}&currentProcess=${encodeURIComponent(JSON.stringify(currentProcess))}`,
    fail: () => {
      wx.showToast({ title: '页面跳转失败', icon: 'none' });
    }
  });
},

  // 可选：跳转到我的页面（如需保留）
  goToMy() {
    wx.switchTab({
      url: '/pages/my/my'
    });
  }
});
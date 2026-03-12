Page({
  data: {
    currentProcess: {}, // 保存当前流程信息
    processList: [],    // 保存所有流程列表
    availableDates: []  // 存储可预约日期
  },

  onLoad() {
    // 页面加载时先拉取流程进度，预约日期在流程数据获取成功后再拉取
    this.fetchUserProgress();
  },

  // 从后端拉取用户流程进度
  fetchUserProgress() {
    wx.showLoading({ title: '加载中...' });
    wx.request({
      url: getApp().globalData.apiBaseUrl + '/user/process/progress',
      method: 'GET',
      header: {
        'Authorization': wx.getStorageSync('token') // 带上登录token
      },
      success: (res) => {
        wx.hideLoading();
        if (res.data.code === 200 && res.data.data) {
          const { currentProcess, processList } = res.data.data;
          console.log('拉取到的流程数据：', currentProcess, processList);

          // 回填到页面数据
          this.setData({
            currentProcess: currentProcess,
            processList: processList,
            // 回填卡片信息
            'cardTitle': currentProcess.name || '寒假训练营',
            'groupName': currentProcess.groupName || '前端组',
            'startTime': currentProcess.startTime || '2024-05-26',
            'fileUrl': currentProcess.fileUrl || ''
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

  // 查询流程可预约日期
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
      url: getApp().globalData.apiBaseUrl + '/user/user-appointments/date?processId=' + processId,
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

  // 跳转到register页面（预约页面）
  gotoRegisterPage() {
    const { availableDates, currentProcess } = this.data;
    
    // 校验数据
    if (!availableDates || availableDates.length === 0) {
      wx.showToast({
        title: '暂无可预约日期',
        icon: 'none'
      });
      return;
    }
    if (!currentProcess.id) {
      wx.showToast({
        title: '流程信息缺失',
        icon: 'none'
      });
      return;
    }

    // 缓存processId，供register页面使用
    wx.setStorageSync('currentProcessId', currentProcess.id);

    // 跳转并传递可预约日期（编码避免特殊字符）
    wx.navigateTo({
      url: '/packageBusiness/pages/register/register?availableDates=' + encodeURIComponent(JSON.stringify(availableDates))
    });
  },

  // 跳转到我的
  goToMy() {
    wx.switchTab({
      url: '/pages/my/my'
    });
  },

  // 查看作业详情（打开fileUrl）
  viewWorkDetail() {
    const fileUrl = this.data.currentProcess.fileUrl;
    if (fileUrl) {
      wx.showModal({
        title: '作业详情',
        content: '将打开外部链接查看作业详情',
        confirmText: '打开',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/webview/webview?url=' + encodeURIComponent(fileUrl)
            });
          }
        }
      });
    } else {
      wx.showToast({
        title: '暂无作业详情',
        icon: 'none'
      });
    }
  }
});
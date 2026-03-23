Page({
  data: {
    currentProcess: {}, // 保存当前流程信息
    processList: [],    // 保存所有流程列表（用于动态渲染步骤）
    availableDates: [], // 存储可预约日期
    appointmentInfo: null // 保存当前流程的预约信息
  },

  onLoad() {
    // 页面加载时先拉取流程进度，预约日期在流程数据获取成功后再拉取
    this.fetchUserProgress();
  },

  // 查询用户当前流程的预约信息
  fetchUserAppointmentInfo() {
    const processId = this.data.currentProcess.id;
    if (!processId) {
      wx.showToast({
        title: '流程信息不完整',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({ title: '加载预约信息...' });
    wx.request({
      url: getApp().globalData.apiBaseUrl + '/user/user-appointments',
      method: 'GET',
      header: {
        'Authorization': wx.getStorageSync('token')
      },
      data: {
        processId: processId
      },
      success: (res) => {
        wx.hideLoading();
        if (res.data.code === 200) {
          console.log('预约信息接口返回：', res.data.data);
          this.setData({
            appointmentInfo: res.data.data
          });
        } else {
          wx.showToast({
            title: '获取预约信息失败',
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
        console.error('获取预约信息失败:', err);
      }
    });
  },

  // 从后端拉取用户流程进度
  fetchUserProgress() {
    const token = wx.getStorageSync('token');
    console.log('当前token：', token);
    wx.showLoading({ title: '加载中...' });
    wx.request({
      url: getApp().globalData.apiBaseUrl + '/user/process/progress',
      method: 'GET',
      header: {
        'Authorization': wx.getStorageSync('token')
      },
      success: (res) => {
        wx.hideLoading();
        if (res.data.code === 200 && res.data.data) {
          const { currentProcess, processList } = res.data.data;
          console.log('拉取到的流程数据：', currentProcess, processList);

          this.setData({
            currentProcess: currentProcess,
            processList: processList, // 关键：将流程列表存入data供渲染
            'cardTitle': currentProcess.name || '暂无',
            'groupName': currentProcess.groupName || '未获取',
            'startTime': currentProcess.startTime || '',
            'fileUrl': currentProcess.fileUrl || ''
          });

          // 流程数据获取成功后，调用查询预约日期和预约信息的方法
          this.userAppointmentsDate();
          this.fetchUserAppointmentInfo();
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
  // 新增：获取可预约日期列表
fetchAvailableDates() {
  const processId = wx.getStorageSync('currentProcessId');
  if (!processId) {
    wx.showToast({ title: '流程ID缺失', icon: 'none' });
    return;
  }

  wx.showLoading({ title: '加载可预约日期...' });
  wx.request({
    url: getApp().globalData.apiBaseUrl + '/user/user-appointments/date',
    method: 'GET',
    header: {
      'Authorization': wx.getStorageSync('token')
    },
    data: {
      processId: processId
    },
    success: (res) => {
      wx.hideLoading();
      if (res.data.code === 200 && res.data.data) {
        const availableDates = res.data.data;
        console.log('可预约日期接口返回：', availableDates);
        
        // 格式化可预约日期（转成带中文日期+星期的结构）
        const formatAvailableDates = availableDates.map(date => ({
          value: date,
          label: `${this.formatDate(date)}(${this.formatWeekday(date)})`
        }));

        this.setData({
          availableDates: availableDates,
          formatAvailableDates: formatAvailableDates
        }, () => {
          // 初始化默认日期（优先选可预约日期第一个，无则选今日）
          const today = this.formatToday();
          const defaultDate = this.data.availableDates.length > 0 
            ? this.data.availableDates[0] 
            : today;
          
          this.setData({
            currentDate: defaultDate
          }, () => {
            // 加载默认日期的时间段
            this.loadTimeListByDate(defaultDate);
            // 查询当前预约信息
            this.fetchUserAppointmentInfo();
          });
        });
      } else {
        wx.showToast({ title: '获取可预约日期失败', icon: 'none' });
      }
    },
    fail: (err) => {
      wx.hideLoading();
      wx.showToast({ title: '网络错误，请重试', icon: 'none' });
      console.error('获取可预约日期失败:', err);
    }
  });
},

  // 查询流程可预约日期
  userAppointmentsDate() {
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
          this.setData({
            availableDates: res.data.data
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
  // gotoRegisterPage() {
  //   const { currentProcess } = this.data;
    
  //   if (!currentProcess || !currentProcess.id) {
  //     wx.showToast({
  //       title: '暂无考核流程',
  //       icon: 'none'
  //     });
  //     return;
  //   }

  //   wx.setStorageSync('currentProcessId', currentProcess.id);
  //   wx.navigateTo({
  //     url: '/packageBusiness/pages/register/register'
  //   });
  // },

  // 跳转到我的
  
  gotoRegisterPage() {
    const { currentProcess, availableDates } = this.data;
    
    // 添加保护：如果已完成面试，阻止跳转
    if (currentProcess.userStatus === 2) {
      wx.showToast({
        title: '已完成面试，无需再次预约',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    
    if (!currentProcess || !currentProcess.id) {
      wx.showToast({
        title: '暂无考核流程',
        icon: 'none'
      });
      return;
    }
  
    // 保存流程ID
    wx.setStorageSync('currentProcessId', currentProcess.id);
    
    // 如果没有可预约日期，先获取再跳转
    if (!availableDates || availableDates.length === 0) {
      wx.showLoading({ title: '加载可预约日期...' });
      this.fetchAvailableDatesBeforeJump(() => {
        wx.hideLoading();
        this.navigateToRegister();
      });
    } else {
      this.navigateToRegister();
    }
  },
  
  // 新增：跳转前获取可预约日期
  fetchAvailableDatesBeforeJump(callback) {
    const processId = this.data.currentProcess.id;
    
    wx.request({
      url: getApp().globalData.apiBaseUrl + '/user/user-appointments/date',
      method: 'GET',
      header: {
        'Authorization': wx.getStorageSync('token')
      },
      data: {
        processId: processId
      },
      success: (res) => {
        if (res.data.code === 200 && res.data.data) {
          const availableDates = res.data.data;
          this.setData({ availableDates: availableDates });
          
          // 保存到本地缓存，供register页面使用
          wx.setStorageSync('availableDates', availableDates);
          
          if (callback) callback();
        } else {
          if (callback) callback();
        }
      },
      fail: (err) => {
        console.error('获取可预约日期失败:', err);
        if (callback) callback();
      }
    });
  },
  
  // 新增：跳转到预约页面
  navigateToRegister() {
    const { availableDates } = this.data;
    
    // 将可预约日期作为参数传递
    let url = '/packageBusiness/pages/register/register';
    if (availableDates && availableDates.length > 0) {
      const encodedDates = encodeURIComponent(JSON.stringify(availableDates));
      url += `?availableDates=${encodedDates}`;
    }
    
    wx.navigateTo({
      url: url
    });
  },
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
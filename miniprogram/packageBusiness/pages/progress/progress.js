Page({
  data: {
    currentProcess: {}, // 保存当前流程信息
    processList: [],    // 保存所有流程列表（用于动态渲染步骤）
    availableDates: [], // 存储可预约日期
    appointmentInfo: null, // 保存当前流程的预约信息
    hasFailedProcess: false // 新增：标记是否有考核未通过的流程
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

          // 核心新增：判断是否有考核未通过的流程（userStatus 既不是0/1/2，视为不通过）
          const hasFailedProcess = processList.some(item => 
            item.userStatus !== 0 && item.userStatus !== 1 && item.userStatus !== 2
          );

          this.setData({
            currentProcess: currentProcess,
            processList: processList, // 关键：将流程列表存入data供渲染
            hasFailedProcess: hasFailedProcess, // 标记是否有未通过流程
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
  gotoRegisterPage() {
    const { currentProcess, availableDates, hasFailedProcess } = this.data;

    // 核心修改1：如果有未通过流程，直接提示并阻止跳转
    if (hasFailedProcess) {
      wx.showToast({
        title: '你有考核未通过，禁止预约',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    // 核心修改2：如果已完成面试，阻止跳转
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

  // 跳转到我的
  goToMy() {
    wx.switchTab({
      url: '/pages/my/my'
    });
  },

// 查看作业详情（跳转到workDetailed页面）
viewWorkDetail() {
  const currentProcess = this.data.currentProcess;
  if (currentProcess && currentProcess.id) {
    // ✅ 正确传参：直接传 currentProcess
    wx.navigateTo({
      url: '/packageBusiness/pages/workDetailed/workDetailed?processData=' + encodeURIComponent(JSON.stringify(currentProcess))
    });
  } else {
    wx.showToast({
      title: '暂无作业详情',
      icon: 'none'
    });
  }
},

  // 以下为格式化工具方法（如果需要的话）
  formatDate(dateStr) {
    if (!dateStr) return '';
    const datePart = dateStr.split(' ')[0];
    const [year, month, day] = datePart.split('-');
    return `${month}月${day}日`;
  },

  formatWeekday(dateStr) {
    if (!dateStr) return '';
    const weekList = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const datePart = dateStr.split(' ')[0];
    const date = new Date(datePart);
    return weekList[date.getDay()];
  },

  formatToday() {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  loadTimeListByDate(date) {
    // 这里可以保留原有的加载时间段逻辑（如果需要）
    console.log('加载日期：', date, '的时间段');
  }
});
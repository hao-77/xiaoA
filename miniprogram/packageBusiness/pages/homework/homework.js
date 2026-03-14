Page({
  data: {
    availableDates: [], // 可预约日期列表
    currentProcess: { id: '', startTime: '', endTime: '' }, // 流程信息（含时间字段）
    processList: [], // 流程列表（备用）
    userSignUpInfo: null, // 用户报名信息
    groupList: ['AI组', '电控组', '机械组', '前端组', '后台组', '运营组']
  },

  /**
   * 生命周期函数--监听页面加载
   * 页面加载时直接调用接口拉取数据，不再解析URL参数
   */
  onLoad(options) {
    // 1. 先拉取用户报名信息
    this.fetchUserSignUpInfo();
    // 2. 再拉取流程进度（含startTime/endTime）
    this.fetchUserProgress();
  },

  /**
   * 获取用户报名信息
   */
  fetchUserSignUpInfo() {
    const apiBaseUrl = getApp().globalData.apiBaseUrl;
    wx.request({
      url: apiBaseUrl + '/user/user/sign-up',
      method: 'GET',
      header: {
        'Authorization': wx.getStorageSync('token')
      },
      success: (res) => {
        if (res.data.code === 200 && res.data.data) {
          const data = res.data.data;
          // 计算组别名称
          const groupName = data.groupId ? this.data.groupList[data.groupId - 1] : '未选择';
          this.setData({
            userSignUpInfo: {
              ...data,
              groupName: groupName
            }
          });
        }
      },
      fail: (err) => {
        console.error('获取报名信息失败:', err);
      }
    });
  },

  /**
   * 拉取用户流程进度（核心接口，获取startTime/endTime）
   */
  fetchUserProgress() {
    wx.showLoading({ title: '加载中...' });
    wx.request({
      url: 'https://smalla.cosh.fun/user/process/progress',
      method: 'GET',
      header: {
        'Authorization': wx.getStorageSync('token') // 带上登录token
      },
      success: (res) => {
        wx.hideLoading();
        if (res.data.code === 200 && res.data.data) {
          const { currentProcess, processList } = res.data.data;
          console.log('拉取到的流程数据：', currentProcess, processList);

          // 回填到页面数据（供WXML渲染考核时间）
          this.setData({
            currentProcess: currentProcess || { id: '', startTime: '', endTime: '' },
            processList: processList || []
          });
          console.log('setData后最新的currentProcess：', this.data.currentProcess);
          // 也可以针对性打印关键字段（需要判断不为null）
          if (this.data.currentProcess) {
            console.log('考核开始时间：', this.data.currentProcess.startTime);
            console.log('考核结束时间：', this.data.currentProcess.endTime);
            console.log('流程ID：', this.data.currentProcess.id);
          }

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

  /**
   * 查询流程可预约日期
   */
  userAppointmentsDate() {
    // 从当前流程中获取 processId
    const currentProcess = this.data.currentProcess;
    // 如果没有流程ID，仍然显示页面，只是提示暂无考核安排
    if (!currentProcess || !currentProcess.id) {
      console.log('暂无考核流程安排');
      // 不再弹出错误提示，页面会显示"暂无考核安排"
      return;
    }
    const processId = currentProcess.id;
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
      url: `https://smalla.cosh.fun/user/user-appointments/date?processId=${processId}`,
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

  /**
   * 格式化时间（YYYY-MM-DD HH:MM:SS → YYYY-MM-DD）
   * 兼容字段为空的情况
   */
  formatTime(timeStr) {
    if (!timeStr) return '未设置';
    // 截取日期部分（处理 "2024-06-20 10:00:00" 格式）
    return timeStr.split(' ')[0] || timeStr;
  },

  /**
   * 复制提交地址功能
   */
  copySubmitAddress() {
    wx.setClipboardData({
      data: '1111111@qq.com',
      success: () => {
        wx.showToast({
          title: '复制成功',
          icon: 'success',
          duration: 1500
        });
      },
      fail: () => {
        wx.showToast({
          title: '复制失败，请重试',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 查看考核详情 - 跳转到考核进度页面
   */
  viewAssessmentDetail() {
    const { currentProcess } = this.data;

    if (!currentProcess || !currentProcess.id) {
      wx.showToast({
        title: '暂无考核安排',
        icon: 'none'
      });
      return;
    }

    // 缓存processId供进度页面使用
    wx.setStorageSync('currentProcessId', currentProcess.id);

    // 跳转到考核进度页面
    wx.navigateTo({
      url: '/packageBusiness/pages/progress/progress',
      fail: () => {
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 返回主界面
   */
  goToHome() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  }
});
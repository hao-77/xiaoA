// register.js
const api = require('../../../config/api.js');
Page({
  data: {
    timeList: [],
    currentDate: '',
    availableDates: [],
    startDate: '2025-01-01',
    endDate: '2026-12-31',
    selectedTime: '',
    selectedCount: 0,
    showDatePicker: false,
    formatAvailableDates: [],
    showSuccessModal: false,
    appointmentInfo: null,
    hasAppointed: false,
    appointmentInfoStart: "",
    appointmentInfoEnd: "",
    appointmentInfoStartYear: "",
    currentAppointmentId: null, // 当前预约ID，用于修改
    isModifying: false // 是否处于修改模式
  },

  onLoad(options) {
    // 1. 优先从 URL 参数接收可预约日期（从进度页面传递过来的）
    let availableDates = [];
    
    if (options.availableDates) {
      try {
        availableDates = JSON.parse(decodeURIComponent(options.availableDates));
        console.log('从URL参数接收的可预约日期：', availableDates);
      } catch (e) {
        console.error('解析可预约日期失败：', e);
      }
    }
    
    // 2. 如果 URL 没有，尝试从本地缓存获取
    if (!availableDates || availableDates.length === 0) {
      const cachedDates = wx.getStorageSync('availableDates');
      if (cachedDates && cachedDates.length > 0) {
        availableDates = cachedDates;
        console.log('从缓存获取的可预约日期：', availableDates);
      }
    }
    
    // 3. 如果还没有，就调用接口获取
    if (availableDates && availableDates.length > 0) {
      this.setData({
        availableDates: availableDates
      }, () => {
        this.initDatePicker();
      });
    } else {
      // 调用接口获取可预约日期
      this.fetchAvailableDates();
    }
    
    // 4. 查询当前预约信息
    this.fetchUserAppointmentInfo();
  },
  
  // 点击切换时间段
  onTimeTap(e) {
    const { index } = e.currentTarget.dataset;
    const { timeList } = this.data;
    const targetItem = timeList[index];

    // 跳过约满的时间段
    if (targetItem.availablePerson <= 0) {
      wx.showToast({
        title: '该时间段已约满',
        icon: 'none'
      });
      return;
    }

    // 重置选中状态
    const newTimeList = timeList.map((item, i) => ({
      ...item,
      active: i === index
    }));

    this.setData({
      timeList: newTimeList,
      selectedTime: targetItem.time,
      selectedCount: targetItem.availablePerson
    });
  },

  // 日期选择器变化
  onDateChange(e) {
    const newDate = e.detail.value;
    const { availableDates } = this.data;

    if (availableDates.length > 0 && !availableDates.includes(newDate)) {
      wx.showToast({
        title: '该日期不可预约',
        icon: 'none'
      });
      return; 
    }

    this.setData({
      currentDate: newDate
    }, () => {
      this.loadTimeListByDate(newDate);
    });
  },

  // 初始化日期选择器
  initDatePicker() {
    const { availableDates } = this.data;
    
    const formatDates = availableDates.map(date => ({
      value: date,
      label: `${this.formatDate(date)}(${this.formatWeekday(date)})`
    }));
    
    const today = this.formatToday();
    const defaultDate = availableDates.length > 0 ? availableDates[0] : today;
    
    this.setData({
      formatAvailableDates: formatDates,
      currentDate: defaultDate
    }, () => {
      if (defaultDate) {
        this.loadTimeListByDate(defaultDate);
      }
    });
  },

  // 调用接口获取可预约日期
  fetchAvailableDates() {
    const processId = wx.getStorageSync('currentProcessId');
    if (!processId) {
      console.error('流程ID缺失');
      wx.showToast({ title: '流程ID缺失', icon: 'none' });
      return;
    }
    
    wx.showLoading({ title: '加载可预约日期...' });
    wx.request({
      url: api.API_BASE_URL + '/user/user-appointments/date',
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
          console.log('接口返回的可预约日期：', availableDates);
          
          this.setData({
            availableDates: availableDates
          }, () => {
            this.initDatePicker();
          });
        } else {
          wx.showToast({ title: '获取可预约日期失败', icon: 'none' });
          this.setData({
            formatAvailableDates: []
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('获取可预约日期失败:', err);
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  },

  // 查询用户当前流程的预约信息
  fetchUserAppointmentInfo() {
    const processId = wx.getStorageSync('currentProcessId');
    if (!processId) {
      console.log('流程ID缺失，跳过查询预约信息');
      return;
    }

    wx.request({
      url: api.API_BASE_URL + '/user/user-appointments',
      method: 'GET',
      header: {
        'Authorization': wx.getStorageSync('token')
      },
      data: {
        processId: processId
      },
      success: (res) => {
        if (res.data.code === 200 && res.data.data) {
          const appointmentInfo = res.data.data;
          const appointmentInfoStartYear = appointmentInfo.startTime.split(' ')[0];
          const appointmentInfoStart = appointmentInfo.startTime.split(' ')[1].substring(0,5);
          const appointmentInfoEnd = appointmentInfo.endTime.split(' ')[1].substring(0,5);
          
          console.log('当前预约信息：', appointmentInfo);
          
          this.setData({
            appointmentInfo: appointmentInfo,
            hasAppointed: true,
            appointmentInfoStart: appointmentInfoStart,
            appointmentInfoEnd: appointmentInfoEnd,
            appointmentInfoStartYear: appointmentInfoStartYear,
            currentAppointmentId: appointmentInfo.id // 保存预约ID
          });
        } else {
          this.setData({
            appointmentInfo: null,
            hasAppointed: false,
            currentAppointmentId: null,
            isModifying: false // 退出修改模式
          });
        }
      },
      fail: (err) => {
        console.error('查询预约信息失败：', err);
      }
    });
  },

  // 切换下拉框显示/隐藏
  toggleDatePicker() {
    if (this.data.formatAvailableDates.length === 0) {
      wx.showToast({ title: '暂无可用日期', icon: 'none' });
      return;
    }
    this.setData({
      showDatePicker: !this.data.showDatePicker
    });
  },

  // 选择下拉框中的日期
  selectDate(e) {
    const selectedValue = e.currentTarget.dataset.value;
    this.setData({
      currentDate: selectedValue,
      showDatePicker: false
    }, () => {
      this.loadTimeListByDate(selectedValue);
    });
  },

  // 加载时间段
  loadTimeListByDate(date) {
    const processId = wx.getStorageSync('currentProcessId');
    if (!processId) {
      wx.showToast({ title: '流程ID缺失', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '加载时间段...' });
    wx.request({
      url: api.API_BASE_URL + '/user/user-appointments/duration',
      method: 'GET',
      header: {
        'Authorization': wx.getStorageSync('token'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: {
        processId: processId,
        reserveDate: date
      },
      success: (res) => {
        wx.hideLoading();
        if (res.data.code === 200 && res.data.data) {
          const durationList = res.data.data;
          const formatTimeList = durationList.map((item) => {
            const start = item.startTime ? item.startTime.split(' ')[1].substring(0, 5) : '';
            const end = item.endTime ? item.endTime.split(' ')[1].substring(0, 5) : '';
            const timeStr = start && end ? `${start}-${end}` : '未知时间段';
            const available = item.availablePerson || 0;
            
            return {
              id: item.id,
              time: timeStr,
              count: `余${available}人`,
              active: false,
              allowedPerson: item.allowedPerson,
              availablePerson: available,
              appointmentId: item.appointmentId,
              version: item.version
            };
          });

          this.setData({
            timeList: formatTimeList
          }, () => {
            // 自动选中第一个可用的时间段
            const firstAvailable = formatTimeList.find(item => item.availablePerson > 0);
            if (firstAvailable) {
              this.setData({
                selectedTime: firstAvailable.time,
                selectedCount: firstAvailable.availablePerson
              });
              // 设置active状态
              const updatedList = formatTimeList.map(item => ({
                ...item,
                active: item.time === firstAvailable.time
              }));
              this.setData({ timeList: updatedList });
            }
          });
        } else {
          wx.showToast({ title: '暂无可用时间段', icon: 'none' });
          this.setData({ timeList: [] });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('加载时间段失败：', err);
        wx.showToast({ title: '加载失败', icon: 'none' });
      }
    });
  },

  // 开始修改预约
  startModifyAppointment() {
    wx.showModal({
      title: '修改预约',
      content: '确定要修改预约时间吗？修改后原预约将自动取消。',
      confirmText: '确定修改',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            isModifying: true,
            selectedTime: '', // 清空已选时间
            selectedCount: 0
          });
          
          // 重新加载当前日期的时间段
          if (this.data.currentDate) {
            this.loadTimeListByDate(this.data.currentDate);
          }
          
          wx.showToast({
            title: '请重新选择时间段',
            icon: 'none',
            duration: 2000
          });
        }
      }
    });
  },

  // 取消修改
  cancelModify() {
    this.setData({
      isModifying: false,
      selectedTime: '',
      selectedCount: 0
    });
    
    // 重新加载已预约信息
    this.fetchUserAppointmentInfo();
  },

  // 提交预约（支持新增和修改）
  submitAppointment() {
    const { selectedTime, timeList, hasAppointed, isModifying, currentAppointmentId } = this.data;
    const selectedItem = timeList.find(item => item.time === selectedTime);

    if (!selectedItem || selectedItem.availablePerson <= 0) {
      wx.showToast({ title: '请选择可用的时间段', icon: 'none' });
      return;
    }

    // 如果是修改模式，提示确认修改
    const modalTitle = isModifying ? '确认修改预约' : '确认预约';
    const modalContent = isModifying 
      ? `确定要修改为${this.formatDate(this.data.currentDate)}(${this.formatWeekday(this.data.currentDate)}) ${selectedItem.time}吗？`
      : `你选择了${this.formatDate(this.data.currentDate)}(${this.formatWeekday(this.data.currentDate)}) ${selectedItem.time}，剩余名额：${selectedItem.availablePerson}`;

    wx.showModal({
      title: modalTitle,
      content: modalContent,
      confirmText: isModifying ? '确认修改' : '确认',
      success: (res) => {
        if (res.confirm) {
          const requestData = {
            appointDurationId: selectedItem.id
          };
          
          // 如果是修改模式，传递预约ID
          if (isModifying && currentAppointmentId) {
            requestData.id = currentAppointmentId;
          }

          wx.request({
            url: api.API_BASE_URL + '/user/user-appointments',
            method: 'POST',
            header: {
              'Authorization': wx.getStorageSync('token'),
              'Content-Type': 'application/json'
            },
            data: requestData,
            success: (res) => {
              if (res.data.code === 200) {
                this.setData({ 
                  showSuccessModal: true,
                  isModifying: false // 退出修改模式
                });
                this.fetchUserAppointmentInfo();
              } else {
                wx.showToast({ title: res.data.msg || (isModifying ? '修改失败' : '预约失败'), icon: 'none' });
              }
            },
            fail: (err) => {
              console.error(isModifying ? '预约修改失败：' : '预约提交失败：', err);
              wx.showToast({ title: '网络错误，请重试', icon: 'none' });
            }
          });
        }
      }
    });
  },

  // 辅助方法
  formatToday() {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  formatDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return '';
    const dateParts = dateStr.split('-');
    if (dateParts.length !== 3) return '';
    const [year, month, day] = dateParts;
    if (!month || !day || isNaN(month) || isNaN(day)) return '';
    return `${month.padStart(2, '0')}月${day.padStart(2, '0')}日`;
  },

  formatWeekday(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return '';
    const weekList = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      return weekList[date.getDay()];
    } catch (e) {
      return '';
    }
  },

  closeSuccessModal() {
    this.setData({ showSuccessModal: false });
    setTimeout(() => wx.navigateBack(), 300);
  }
});
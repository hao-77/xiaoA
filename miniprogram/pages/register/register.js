Page({
  data: {
    timeList: [], // 动态加载对应日期的时间段
    currentDate: '', // 当前选中的日期（YYYY-MM-DD）
    availableDates: [], // 承接传递的可预约日期列表
    startDate: '2025-01-01', // 可选日期范围的开始
    endDate: '2026-12-31', // 可选日期范围的结束
    selectedTime: '', // 选中的时间段
    selectedCount: 0, // 选中时间段的剩余人数
    // 新增：自定义下拉框相关
    showDatePicker: false, // 是否显示下拉日期列表
    // 格式化后的可预约日期列表（带中文日期和星期）
    formatAvailableDates: []
  },

  onLoad(options) {
    // 1. 接收并解析可预约日期
    if (options.availableDates) {
      try {
        const availableDates = JSON.parse(decodeURIComponent(options.availableDates));
        this.setData({
          availableDates: availableDates
        });
        console.log('接收的可预约日期：', availableDates);
        
        // 新增：格式化可预约日期（转成带中文日期+星期的结构）
        const formatDates = availableDates.map(date => ({
          value: date, // 原始日期（YYYY-MM-DD）
          label: `${this.formatDate(date)}(${this.formatWeekday(date)})` // 显示文本
        }));
        this.setData({
          formatAvailableDates: formatDates
        });
      } catch (e) {
        console.error('解析可预约日期失败：', e);
        wx.showToast({
          title: '日期数据异常',
          icon: 'none'
        });
      }
    }

    // 2. 初始化默认日期（优先选可预约日期第一个，无则选今日）
    const today = this.formatToday();
    const defaultDate = this.data.availableDates.length > 0 
      ? this.data.availableDates[0] 
      : today;
    
    this.setData({
      currentDate: defaultDate
    }, () => {
      // 3. 加载默认日期的时间段
      this.loadTimeListByDate(defaultDate);
    });
  },

  // 新增：切换下拉框显示/隐藏
  toggleDatePicker() {
    this.setData({
      showDatePicker: !this.data.showDatePicker
    });
  },

  // 新增：选择下拉框中的日期
  selectDate(e) {
    const selectedValue = e.currentTarget.dataset.value;
    this.setData({
      currentDate: selectedValue,
      showDatePicker: false // 选择后关闭下拉框
    }, () => {
      // 加载选中日期的时间段
      this.loadTimeListByDate(selectedValue);
    });
  },


  // 核心：根据日期加载时间段（适配新接口 /user/user-appointments/duration）
  loadTimeListByDate(date) {
    // 校验processId
    const processId = wx.getStorageSync('currentProcessId');
    if (!processId) {
      wx.showToast({
        title: '流程ID缺失',
        icon: 'none'
      });
      this.setMockTimeList(date);
      return;
    }

    wx.showLoading({ title: '加载时间段...' });
    wx.request({
      url: `https://smalla.cosh.fun/user/user-appointments/duration`,
      method: 'GET',
      header: {
        'Authorization': wx.getStorageSync('token'),
        // 注意：接口用的是 form-data，需要指定 Content-Type
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      // 接口参数：processId 和 reserveDate
      data: {
        processId: processId,
        reserveDate: date // 对应选中的日期
      },
      success: (res) => {
        wx.hideLoading();
        if (res.data.code === 200 && res.data.data) {
          const durationList = res.data.data;
          console.log('接口返回的可预约时间段：', durationList);
          
          // 格式化接口数据，适配页面渲染的 timeList 格式
          const formatTimeList = durationList.map((item, index) => {
            // 从 startTime 和 endTime 中提取 HH:MM 部分
            const start = item.startTime ? item.startTime.split(' ')[1].substring(0, 5) : '';
            const end = item.endTime ? item.endTime.split(' ')[1].substring(0, 5) : '';
            const timeStr = start && end ? `${start}-${end}` : '未知时间段';
            
            // 剩余人数
            const available = item.availablePerson || 0;
            
            return {
              id: item.id, // 保存时间段ID，用于提交预约
              time: timeStr,
              count: `余${available}人`,
              active: index === 0, // 默认选中第一个
              allowedPerson: item.allowedPerson,
              availablePerson: available,
              appointmentId: item.appointmentId,
              version: item.version
            };
          });

          this.setData({
            timeList: formatTimeList
          }, () => {
            // 初始化选中第一个时间段
            if (formatTimeList.length > 0) {
              this.setData({
                selectedTime: formatTimeList[0].time,
                selectedCount: formatTimeList[0].availablePerson
              });
            }
          });
        } else {
          wx.showToast({
            title: '暂无可用时间段',
            icon: 'none'
          });
          this.setData({ timeList: [] });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('加载时间段失败：', err);
        wx.showToast({
          title: '加载失败，显示模拟数据',
          icon: 'none'
        });
        this.setMockTimeList(date);
      }
    });
  },

  // 新增：模拟时间段数据（兜底用）
  setMockTimeList(date) {
    const mockTimeList = [
      { id: 1, time: '10:00-11:00', count: '余1人', active: true, availablePerson: 1 },
      { id: 2, time: '11:00-12:00', count: '余3人', active: false, availablePerson: 3 },
    ];
    this.setData({
      timeList: mockTimeList,
      selectedTime: mockTimeList[0].time,
      selectedCount: mockTimeList[0].availablePerson
    });
  },

  // 点击切换时间段
  onTimeTap(e) {
    const { index } = e.currentTarget.dataset;
    const { timeList } = this.data;
    const targetItem = timeList[index];

    // 跳过约满的时间段（改用availablePerson判断，更准确）
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
      selectedCount: targetItem.availablePerson // 直接用数字，避免字符串解析错误
    });
  },

  // 日期选择器变化（增加可预约日期校验）
  onDateChange(e) {
    const newDate = e.detail.value;
    const { availableDates } = this.data;

    // 校验：选中的日期是否在可预约列表中
    if (availableDates.length > 0 && !availableDates.includes(newDate)) {
      wx.showToast({
        title: '该日期不可预约',
        icon: 'none'
      });
      // 恢复到之前的选中日期，避免显示错误日期
      return; 
    }

    this.setData({
      currentDate: newDate
    }, () => {
      this.loadTimeListByDate(newDate);
    });
  },

  // 格式化今日日期为YYYY-MM-DD
  formatToday() {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 格式化日期为"12月14日"
  formatDate(dateStr) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${month}月${day}日`;
  },

  // 格式化星期
  formatWeekday(dateStr) {
    if (!dateStr) return '';
    const weekList = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const date = new Date(dateStr);
    return weekList[date.getDay()];
  },

  // 核心修复：disableDate 方法（小程序要求返回函数，优化逻辑）
  disableDate() {
    const { availableDates } = this.data;
    // 返回一个函数，接收日期对象，判断是否禁用
    return (date) => {
      // 无可用日期时，禁用所有日期（避免用户选择无效日期）
      if (availableDates.length === 0) return true;
      // 将日期对象转为 YYYY-MM-DD 格式（兼容不同时区）
      const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      // 不在可预约列表中的日期，返回true（禁用）；在列表中返回false（可用）
      return !availableDates.includes(dateStr);
    };
  },

  // 提交预约（适配新接口 /user/user-appointments，参数为 appointDurationId）
  submitAppointment() {
    const { currentDate, selectedTime, timeList } = this.data;
    const processId = wx.getStorageSync('currentProcessId');

    // 找到选中的时间段对象，获取其ID
    const selectedItem = timeList.find(item => item.time === selectedTime);

    // 校验
    if (!selectedItem || selectedItem.availablePerson <= 0) {
      wx.showToast({ title: '请选择可用的时间段', icon: 'none' });
      return;
    }
    if (!processId) {
      wx.showToast({ title: '流程信息缺失', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认预约',
      content: `你选择了${this.formatDate(currentDate)}(${this.formatWeekday(currentDate)}) ${selectedTime}，剩余名额：${selectedItem.availablePerson}`,
      confirmText: '确认',
      success: (res) => {
        console.log("token",wx.getStorageSync('token'))
        if (res.confirm) {
          console.log(selectedItem.id )
          wx.request({
            url: 'https://smalla.cosh.fun/user/user-appointments',
            method: 'POST',
            header: {
              'Authorization': wx.getStorageSync('token'),
              'Content-Type': 'application/json'
            },
            // 接口参数：只需要 appointDurationId（即时间段的id）
            data: {
              appointDurationId: selectedItem.id // 这里是关键，必须传时间段的ID
            },
            success: (res) => {
              console.log(res)
              if (res.data.code === 200) {
                wx.showToast({ title: '预约成功', icon: 'success' });
                setTimeout(() => wx.navigateBack(), 1500);
              } else {
                wx.showToast({ title: res.data.msg || '预约失败', icon: 'none' });
              }
            },
            fail: (err) => {
              console.error('预约提交失败：', err);
              wx.showToast({ title: '网络错误，请重试', icon: 'none' });
            }
          });
        }
      }
    });
  }
});
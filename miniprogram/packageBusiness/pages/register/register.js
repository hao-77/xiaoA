// const api = require('../../../config/api.js');

// Page({
//   data: {
//     timeList: [], // 动态加载对应日期的时间段
//     currentDate: '', // 当前选中的日期（YYYY-MM-DD）
//     availableDates: [], // 承接传递的可预约日期列表
//     startDate: '2025-01-01', // 可选日期范围的开始
//     endDate: '2026-12-31', // 可选日期范围的结束
//     selectedTime: '', // 选中的时间段
//     selectedCount: 0, // 选中时间段的剩余人数
//     // 新增：自定义下拉框相关
//     showDatePicker: false, // 是否显示下拉日期列表
//     // 格式化后的可预约日期列表（带中文日期和星期）
//     formatAvailableDates: [],
//     // 自定义成功弹窗
//     showSuccessModal: false, // 是否显示成功弹窗
//     // 新增：预约信息相关
//     appointmentInfo: null,      // 存储当前预约信息
//     hasAppointed: false         // 标记是否已预约
//   },

//   onLoad(options) {
//     // 1. 接收并解析可预约日期
//     if (options.availableDates) {
//       try {
//         const availableDates = JSON.parse(decodeURIComponent(options.availableDates));
//         this.setData({
//           availableDates: availableDates
//         });
//         console.log('接收的可预约日期：', availableDates);
        
//         // 新增：格式化可预约日期（转成带中文日期+星期的结构）
//         const formatDates = availableDates.map(date => ({
//           value: date, // 原始日期（YYYY-MM-DD）
//           label: `${this.formatDate(date)}(${this.formatWeekday(date)})` // 显示文本
//         }));
//         this.setData({
//           formatAvailableDates: formatDates
//         });
//       } catch (e) {
//         console.error('解析可预约日期失败：', e);
//         wx.showToast({
//           title: '日期数据异常',
//           icon: 'none'
//         });
//       }
//     }

//     // 2. 初始化默认日期（优先选可预约日期第一个，无则选今日）
//     const today = this.formatToday();
//     const defaultDate = this.data.availableDates.length > 0 
//       ? this.data.availableDates[0] 
//       : today;
    
//     this.setData({
//       currentDate: defaultDate
//     }, () => {
//       // 3. 加载默认日期的时间段
//       this.loadTimeListByDate(defaultDate);
//       // 4. 新增：查询当前预约信息
//       this.fetchUserAppointmentInfo();
//     });
//   },

//   // 新增：查询用户当前流程的预约信息
//   fetchUserAppointmentInfo() {
//     const processId = wx.getStorageSync('currentProcessId');
//     if (!processId) {
//       wx.showToast({ title: '流程ID缺失', icon: 'none' });
//       return;
//     }

//     wx.showLoading({ title: '加载预约信息...' });
//     wx.request({
//       url: api.API_BASE_URL + '/user/user-appointments',
//       method: 'GET',
//       header: {
//         'Authorization': wx.getStorageSync('token')
//       },
//       data: {
//         processId: processId
//       },
//       success: (res) => {
//         wx.hideLoading();
//         if (res.data.code === 200 && res.data.data) {
//           const appointmentInfo = res.data.data;
//           console.log('当前预约信息：', appointmentInfo);
          
//           // 标记已预约状态，并存入预约信息
//           this.setData({
//             appointmentInfo: appointmentInfo,
//             hasAppointed: true
//           });
//         } else {
//           // 无预约信息
//           this.setData({
//             appointmentInfo: null,
//             hasAppointed: false
//           });
//         }
//       },
//       fail: (err) => {
//         wx.hideLoading();
//         console.error('查询预约信息失败：', err);
//         wx.showToast({ title: '查询预约信息失败', icon: 'none' });
//       }
//     });
//   },
//   formatAvailableDates() {
//     const { availableDates } = this.data;
//     const formatDates = availableDates.map(date => ({
//       value: date, // 原始日期（YYYY-MM-DD）
//       label: `${this.formatDate(date)}(${this.formatWeekday(date)})` // 显示文本
//     }));
//     this.setData({
//       formatAvailableDates: formatDates
//     });
//   },


//   // 新增：切换下拉框显示/隐藏
//   toggleDatePicker() {
//     this.setData({
//       showDatePicker: !this.data.showDatePicker
//     });
//   },

//   // 新增：选择下拉框中的日期
//   selectDate(e) {
//     const selectedValue = e.currentTarget.dataset.value;
//     this.setData({
//       currentDate: selectedValue,
//       showDatePicker: false // 选择后关闭下拉框
//     }, () => {
//       // 加载选中日期的时间段
//       this.loadTimeListByDate(selectedValue);
//     });
//   },

//   // 核心：根据日期加载时间段（适配新接口 /user/user-appointments/duration）
//   loadTimeListByDate(date) {
//     // 校验processId
//     const processId = wx.getStorageSync('currentProcessId');
//     if (!processId) {
//       wx.showToast({
//         title: '流程ID缺失',
//         icon: 'none'
//       });
//       this.setMockTimeList(date);
//       return;
//     }

//     wx.showLoading({ title: '加载时间段...' });
//     wx.request({
//       url: api.API_BASE_URL + `/user/user-appointments/duration`,
//       method: 'GET',
//       header: {
//         'Authorization': wx.getStorageSync('token'),
//         // 注意：接口用的是 form-data，需要指定 Content-Type
//         'Content-Type': 'application/x-www-form-urlencoded'
//       },
//       // 接口参数：processId 和 reserveDate
//       data: {
//         processId: processId,
//         reserveDate: date // 对应选中的日期
//       },
//       success: (res) => {
//         wx.hideLoading();
//         if (res.data.code === 200 && res.data.data) {
//           const durationList = res.data.data;
//           console.log('接口返回的可预约时间段：', durationList);
          
//           // 格式化接口数据，适配页面渲染的 timeList 格式
//           const formatTimeList = durationList.map((item, index) => {
//             // 从 startTime 和 endTime 中提取 HH:MM 部分
//             const start = item.startTime ? item.startTime.split(' ')[1].substring(0, 5) : '';
//             const end = item.endTime ? item.endTime.split(' ')[1].substring(0, 5) : '';
//             const timeStr = start && end ? `${start}-${end}` : '未知时间段';
            
//             // 剩余人数
//             const available = item.availablePerson || 0;
            
//             return {
//               id: item.id, // 保存时间段ID，用于提交预约
//               time: timeStr,
//               count: `余${available}人`,
//               active: index === 0, // 默认选中第一个
//               allowedPerson: item.allowedPerson,
//               availablePerson: available,
//               appointmentId: item.appointmentId,
//               version: item.version
//             };
//           });

//           this.setData({
//             timeList: formatTimeList
//           }, () => {
//             // 初始化选中第一个时间段
//             if (formatTimeList.length > 0) {
//               this.setData({
//                 selectedTime: formatTimeList[0].time,
//                 selectedCount: formatTimeList[0].availablePerson
//               });
//             }
//           });
//         } else {
//           wx.showToast({
//             title: '暂无可用时间段',
//             icon: 'none'
//           });
//           this.setData({ timeList: [] });
//         }
//       },
//       fail: (err) => {
//         wx.hideLoading();
//         console.error('加载时间段失败：', err);
//         wx.showToast({
//           title: '加载失败，显示模拟数据',
//           icon: 'none'
//         });
//         this.setMockTimeList(date);
//       }
//     });
//   },

//   // 新增：模拟时间段数据（兜底用）
//   setMockTimeList(date) {
//     const mockTimeList = [
//       { id: 1, time: '10:00-11:00', count: '余1人', active: true, availablePerson: 1 },
//       { id: 2, time: '11:00-12:00', count: '余3人', active: false, availablePerson: 3 },
//     ];
//     this.setData({
//       timeList: mockTimeList,
//       selectedTime: mockTimeList[0].time,
//       selectedCount: mockTimeList[0].availablePerson
//     });
//   },

//   // 点击切换时间段
//   onTimeTap(e) {
//     const { index } = e.currentTarget.dataset;
//     const { timeList } = this.data;
//     const targetItem = timeList[index];

//     // 跳过约满的时间段（改用availablePerson判断，更准确）
//     if (targetItem.availablePerson <= 0) {
//       wx.showToast({
//         title: '该时间段已约满',
//         icon: 'none'
//       });
//       return;
//     }

//     // 重置选中状态
//     const newTimeList = timeList.map((item, i) => ({
//       ...item,
//       active: i === index
//     }));

//     this.setData({
//       timeList: newTimeList,
//       selectedTime: targetItem.time,
//       selectedCount: targetItem.availablePerson // 直接用数字，避免字符串解析错误
//     });
//   },

//   // 日期选择器变化（增加可预约日期校验）
//   onDateChange(e) {
//     const newDate = e.detail.value;
//     const { availableDates } = this.data;

//     // 校验：选中的日期是否在可预约列表中
//     if (availableDates.length > 0 && !availableDates.includes(newDate)) {
//       wx.showToast({
//         title: '该日期不可预约',
//         icon: 'none'
//       });
//       // 恢复到之前的选中日期，避免显示错误日期
//       return; 
//     }

//     this.setData({
//       currentDate: newDate
//     }, () => {
//       this.loadTimeListByDate(newDate);
//     });
//   },

//   // 格式化今日日期为YYYY-MM-DD
//   formatToday() {
//     const today = new Date();
//     const year = today.getFullYear();
//     const month = (today.getMonth() + 1).toString().padStart(2, '0');
//     const day = today.getDate().toString().padStart(2, '0');
//     return `${year}-${month}-${day}`;
//   },

//   // 格式化日期为"12月14日"（增加容错）
//   formatDate(dateStr) {
//     if (!dateStr || typeof dateStr !== 'string') return '';
//     // 先过滤掉非日期格式的内容
//     const dateParts = dateStr.split('-');
//     if (dateParts.length !== 3) return '';
//     const [year, month, day] = dateParts;
//     // 校验月份和日期是否为有效数字
//     if (!month || !day || isNaN(month) || isNaN(day)) return '';
//     return `${month.padStart(2, '0')}月${day.padStart(2, '0')}日`;
//   },

//   // 格式化星期（增加容错）
//   formatWeekday(dateStr) {
//     if (!dateStr || typeof dateStr !== 'string') return '';
//     const weekList = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
//     try {
//       const date = new Date(dateStr);
//       // 校验日期是否有效
//       if (isNaN(date.getTime())) return '';
//       return weekList[date.getDay()];
//     } catch (e) {
//       return '';
//     }
//   },

//   // 新增：专门处理已预约信息的展示文本
//   getAppointmentDisplayText(appointmentInfo) {
//     if (!appointmentInfo) return '暂无预约信息';
    
//     // 提取日期和时间部分
//     let datePart = '';
//     let startTimePart = '';
//     let endTimePart = '';
    
//     // 处理开始时间
//     if (appointmentInfo.startTime && typeof appointmentInfo.startTime === 'string') {
//       const timeParts = appointmentInfo.startTime.split(' ');
//       datePart = timeParts[0] || ''; // 日期部分 YYYY-MM-DD
//       startTimePart = (timeParts[1] || '').substring(0, 5) || ''; // 时间部分 HH:MM
//     }
    
//     // 处理结束时间
//     if (appointmentInfo.endTime && typeof appointmentInfo.endTime === 'string') {
//       const timeParts = appointmentInfo.endTime.split(' ');
//       endTimePart = (timeParts[1] || '').substring(0, 5) || ''; // 时间部分 HH:MM
//     }
    
//     // 拼接最终显示文本
//     const dateText = this.formatDate(datePart);
//     const weekdayText = this.formatWeekday(datePart);
//     const timeText = `${startTimePart}${endTimePart ? '-' + endTimePart : ''}`;
    
//     // 兜底处理
//     if (!dateText) return '时间未知';
//     if (!timeText) return `${dateText}(${weekdayText}) 时间未知`;
    
//     return `${dateText}(${weekdayText}) ${timeText}`;
//   },

//   // 核心修复：disableDate 方法（小程序要求返回函数，优化逻辑）
//   disableDate() {
//     const { availableDates } = this.data;
//     // 返回一个函数，接收日期对象，判断是否禁用
//     return (date) => {
//       // 无可用日期时，禁用所有日期（避免用户选择无效日期）
//       if (availableDates.length === 0) return true;
//       // 将日期对象转为 YYYY-MM-DD 格式（兼容不同时区）
//       const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
//       // 不在可预约列表中的日期，返回true（禁用）；在列表中返回false（可用）
//       return !availableDates.includes(dateStr);
//     };
//   },

//   // 提交预约（适配新接口 /user/user-appointments，参数为 appointDurationId）
//   submitAppointment() {
//     // 新增：先判断是否已预约，禁止重复报名
//     if (this.data.hasAppointed) {
//       wx.showToast({ title: '你已预约过该流程，不可重复报名', icon: 'none' });
//       return;
//     }

//     const { currentDate, selectedTime, timeList } = this.data;
//     const processId = wx.getStorageSync('currentProcessId');

//     // 找到选中的时间段对象，获取其ID
//     const selectedItem = timeList.find(item => item.time === selectedTime);

//     // 校验
//     if (!selectedItem || selectedItem.availablePerson <= 0) {
//       wx.showToast({ title: '请选择可用的时间段', icon: 'none' });
//       return;
//     }
//     if (!processId) {
//       wx.showToast({ title: '流程信息缺失', icon: 'none' });
//       return;
//     }

//     wx.showModal({
//       title: '确认预约',
//       content: `你选择了${this.formatDate(currentDate)}(${this.formatWeekday(currentDate)}) ${selectedTime}，剩余名额：${selectedItem.availablePerson}`,
//       confirmText: '确认',
//       success: (res) => {
//         console.log("token",wx.getStorageSync('token'))
//         if (res.confirm) {
//           console.log('选择的时间',selectedItem.id )
//           wx.request({
//             url: api.API_BASE_URL + '/user/user-appointments',
//             method: 'POST',
//             header: {
//               'Authorization': wx.getStorageSync('token'),
//               'Content-Type': 'application/json'
//             },
//             // 接口参数：只需要 appointDurationId（即时间段的id）
//             data: {
//               appointDurationId: selectedItem.id // 这里是关键，必须传时间段的ID
//             },
//             success: (res) => {
//               console.log(res)
//               if (res.data.code === 200) {
//                 // 显示自定义成功弹窗
//                 this.setData({ showSuccessModal: true });
//                 // 成功后更新预约状态
//                 this.fetchUserAppointmentInfo();
//               } else {
//                 wx.showToast({ title: res.data.msg || '预约失败', icon: 'none' });
//               }
//             },
//             fail: (err) => {
//               console.error('预约提交失败：', err);
//               wx.showToast({ title: '网络错误，请重试', icon: 'none' });
//             }
//           });
//         }
//       }
//     });
//   },

//   // 关闭成功弹窗并返回上一页
//   closeSuccessModal() {
//     this.setData({ showSuccessModal: false });
//     setTimeout(() => wx.navigateBack(), 300);
//   }
// });

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
    appointmentInfoStart:"",
    appointmentInfoEnd:""

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

  // 新增：初始化日期选择器
  initDatePicker() {
    const { availableDates } = this.data;
    
    // 格式化可预约日期
    const formatDates = availableDates.map(date => ({
      value: date,
      label: `${this.formatDate(date)}(${this.formatWeekday(date)})`
    }));
    
    // 初始化默认日期（优先选可预约日期第一个）
    const today = this.formatToday();
    const defaultDate = availableDates.length > 0 ? availableDates[0] : today;
    
    this.setData({
      formatAvailableDates: formatDates,
      currentDate: defaultDate
    }, () => {
      // 加载默认日期的时间段
      if (defaultDate) {
        this.loadTimeListByDate(defaultDate);
      }
    });
  },

  // 新增：调用接口获取可预约日期
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
          // 设置空数据
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
          const appointmentInfoStartYear=appointmentInfo.startTime.split(' ')[0]
          const appointmentInfoStart=appointmentInfo.startTime.split(' ')[1].substring(0,5);
          const appointmentInfoEnd=appointmentInfo.endTime.split(' ')[1].substring(0,5);
          console.log('当前预约信息：', appointmentInfo,appointmentInfoStart,);
          
          this.setData({
            appointmentInfo: appointmentInfo,
            hasAppointed: true,
            appointmentInfoStart:appointmentInfoStart,
            appointmentInfoEnd:appointmentInfoEnd,
            appointmentInfoStartYear:appointmentInfoStartYear
          });
        } else {
          this.setData({
            appointmentInfo: null,
            hasAppointed: false
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
    // 只有存在可预约日期时才显示下拉框
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

  // 提交预约
  submitAppointment() {
    if (this.data.hasAppointed) {
      wx.showToast({ title: '你已预约过该流程，不可重复报名', icon: 'none' });
      return;
    }

    const { selectedTime, timeList } = this.data;
    const selectedItem = timeList.find(item => item.time === selectedTime);

    if (!selectedItem || selectedItem.availablePerson <= 0) {
      wx.showToast({ title: '请选择可用的时间段', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认预约',
      content: `你选择了${this.formatDate(this.data.currentDate)}(${this.formatWeekday(this.data.currentDate)}) ${selectedItem.time}，剩余名额：${selectedItem.availablePerson}`,
      confirmText: '确认',
      success: (res) => {
        if (res.confirm) {
          wx.request({
            url: api.API_BASE_URL + '/user/user-appointments',
            method: 'POST',
            header: {
              'Authorization': wx.getStorageSync('token'),
              'Content-Type': 'application/json'
            },
            data: {
              appointDurationId: selectedItem.id
            },
            success: (res) => {
              if (res.data.code === 200) {
                this.setData({ showSuccessModal: true });
                this.fetchUserAppointmentInfo();
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
// pages/mine/mine.js
const api = require('../../config/api.js');
const app = getApp();

// 学院映射表 - 与后端对应
const COLLEGE_MAP = {
  1: '计算机学院',
  2: '软件学院',
  3: '信息工程学院',
  4: '电子工程学院',
  5: '机械工程学院',
  6: '电气工程学院',
  7: '土木工程学院',
  8: '化工学院',
  9: '材料学院',
  10: '能源学院',
  11: '环境学院',
  12: '数学学院',
  13: '物理学院',
  14: '化学学院',
  15: '生物学院',
  16: '医学院',
  17: '药学院',
  18: '护理学院',
  19: '口腔医学院',
  20: '公共卫生学院',
  21: '经济学院',
  22: '管理学院',
  23: '会计学院',
  24: '金融学院',
  25: '法学院',
  26: '人文学院',
  27: '外国语学院',
  28: '新闻与传播学院',
  29: '艺术学院',
  30: '音乐学院',
  31: '体育学院',
  32: '马克思主义学院',
  33: '教育学院',
  34: '心理学院',
  35: '国际学院',
  36: '海洋学院',
  37: '航空航天学院',
  38: '自动化学院',
  39: '通信工程学院',
  40: '光电信息学院',
  41: '仪器科学与光电工程学院',
  42: '机电工程学院',
  43: '汽车工程学院',
  44: '交通与物流学院',
  45: '建筑工程学院',
  46: '水利与环境学院',
  47: '矿业与安全工程学院',
  48: '材料科学与工程学院',
  49: '化学与化工学院',
  50: '生命科学学院',
  51: '药学院',
  52: '临床医学院',
  53: '基础医学院',
  54: '公共卫生学院',
  55: '口腔医学院',
  56: '护理学院',
  57: '管理与经济学院',
  58: '人文与社会科学学院',
  59: '马克思主义学院',
  60: '其他'
};

Page({
  /**
   * 页面的初始数据
   */
  data: {
    loading: false, // 加载状态
    isLogin: false, // 登录状态
    userName: '',   // 用户昵称（可编辑）
    editedName: '', // 编辑中的昵称
    realName: '',   // 真名（报名后显示）
    userPhone: '',  // 用户手机号
    avatarUrl: '',  // 微信头像
    displayName: '', // 显示的名称：昵称 + (真名)
    isEditingName: false, // 是否正在编辑名字
    
    // 额外信息
    college: '',    // 学院ID
    collegeText: '', // 学院名称
    majorClass: '', // 专业班级
    
    // 提示信息
    toast: {
      show: false,
      message: ''
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 页面显示时获取用户信息
    this.fetchUserInfo();
  },

  // 显示提示信息
  showToast(message) {
    this.setData({
      toast: {
        show: true,
        message: message
      }
    });
    
    // 2秒后自动隐藏
    setTimeout(() => {
      this.setData({
        'toast.show': false
      });
    }, 2000);
  },

  // 获取用户信息
  fetchUserInfo() {
    // 双重检查：先从本地存储，再从服务器
    const userInfo = wx.getStorageSync('userInfo');
    const token = wx.getStorageSync('token');
    const isLogin = wx.getStorageSync('isLogin');

    // 优先使用 token 判断登录状态（更可靠）
    if (token) {
      // 标记已登录
      if (!isLogin) {
        wx.setStorageSync('isLogin', true);
      }
      
      this.setData({ isLogin: true });
      
      // 从缓存中获取用户信息
      const nickname = (userInfo && userInfo.nickname) || (userInfo && userInfo.name) || '';
      const realName = (userInfo && userInfo.realName) || '';
      const phone = (userInfo && userInfo.phone) || (userInfo && userInfo.phoneNumber) || '';
      const avatarUrl = (userInfo && userInfo.avatarUrl) || (userInfo && userInfo.avatar) || '';
      const college = (userInfo && userInfo.college) || '';
      const majorClass = (userInfo && userInfo.majorClass) || '';

      // 学院ID转名称
      const collegeText = this.getCollegeText(college);

      // 构建显示名称：如果已报名（realName存在），显示"昵称（真名）"
      let displayName = nickname || phone || '用户';
      if (realName) {
        displayName = nickname ? `${nickname}（${realName}）` : `${realName}（${realName}）`;
      } else if (nickname) {
        displayName = nickname;
      } else if (phone) {
        displayName = phone;
      }

      this.setData({
        userName: nickname || '',
        realName: realName,
        userPhone: phone,
        avatarUrl: avatarUrl,
        displayName: displayName,
        college: college,
        collegeText: collegeText,
        majorClass: majorClass
      });

      // 同时从后端获取最新用户信息
      this.fetchUserInfoFromServer();
    } else {
      // 未登录
      this.setData({
        isLogin: false,
        userName: '',
        realName: '',
        userPhone: '',
        avatarUrl: '',
        displayName: '',
        college: '',
        collegeText: '',
        majorClass: ''
      });
    }
  },

  // 学院ID转学院名称
  getCollegeText(collegeId) {
    if (!collegeId) return '';
    return COLLEGE_MAP[collegeId] || `学院${collegeId}`;
  },

  // 从后端获取用户信息
  fetchUserInfoFromServer() {
    const apiBaseUrl = app.globalData ? app.globalData.apiBaseUrl : api.API_BASE_URL;
    wx.request({
      url: apiBaseUrl + '/user/user',
      method: 'GET',
      header: {
        'Authorization': wx.getStorageSync('token')
      },
      success: (res) => {
        if (res.data.code === 200 && res.data.data) {
          const data = res.data.data;
          
          // 更新本地缓存
          const storedUserInfo = wx.getStorageSync('userInfo') || {};
          storedUserInfo.nickname = data.realName ? (storedUserInfo.nickname || '') : storedUserInfo.nickname;
          storedUserInfo.realName = data.realName || storedUserInfo.realName;
          storedUserInfo.phone = data.phone || storedUserInfo.phone;
          storedUserInfo.avatarUrl = data.avatarUrl || storedUserInfo.avatarUrl;
          storedUserInfo.gender = data.gender;
          storedUserInfo.studentId = data.studentId;
          storedUserInfo.college = data.college;
          storedUserInfo.grade = data.grade;
          storedUserInfo.majorClass = data.majorClass;
          storedUserInfo.groupId = data.groupId;
          wx.setStorageSync('userInfo', storedUserInfo);

          // 获取学院名称
          const collegeText = this.getCollegeText(data.college);

          // 重新计算显示名称
          const nickname = storedUserInfo.nickname || '';
          const realName = data.realName || storedUserInfo.realName || '';
          const phone = data.phone || storedUserInfo.phone || '';
          
          let displayName = phone || '用户';
          if (realName) {
            displayName = nickname ? `${nickname}（${realName}）` : `${realName}（${realName}）`;
          } else if (nickname) {
            displayName = nickname;
          } else if (phone) {
            displayName = phone;
          }

          // 更新页面数据
          this.setData({
            userName: nickname || '',
            realName: realName,
            userPhone: data.phone || '',
            avatarUrl: data.avatarUrl || '',
            displayName: displayName,
            college: data.college || '',
            collegeText: collegeText,
            majorClass: data.majorClass || ''
          });
        }
      },
      fail: (err) => {
        console.error('获取用户信息失败:', err);
        // 即使失败也不清除本地数据，保持页面显示
      }
    });
  },

  // 获取微信头像
  getWechatAvatar() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        const userInfo = res.userInfo;
        
        // 保存到本地缓存
        const storedUserInfo = wx.getStorageSync('userInfo') || {};
        storedUserInfo.avatarUrl = userInfo.avatarUrl;
        storedUserInfo.nickname = userInfo.nickName;
        wx.setStorageSync('userInfo', storedUserInfo);

        // 重新计算显示名称
        const nickname = userInfo.nickName;
        const realName = this.data.realName;
        
        let displayName = nickname || '用户';
        if (realName) {
          displayName = `${nickname}（${realName}）`;
        }

        this.setData({
          avatarUrl: userInfo.avatarUrl,
          userName: nickname,
          displayName: displayName
        });

        this.showToast('头像更新成功');
      },
      fail: (err) => {
        console.log('获取用户头像失败:', err);
        // 使用默认头像
        this.showToast('获取头像失败，已使用默认头像');
      }
    });
  },

  // 开始编辑名字
  startEditName() {
    this.setData({
      isEditingName: true,
      editedName: this.data.userName || ''
    });
  },

  // 名字输入
  onNameInput(e) {
    this.setData({
      editedName: e.detail.value
    });
  },

  // 确认编辑名字
  confirmEditName() {
    const newName = this.data.editedName.trim();
    
    if (!newName) {
      this.showToast('昵称不能为空');
      this.setData({ isEditingName: false });
      return;
    }

    // 保存到本地缓存
    const storedUserInfo = wx.getStorageSync('userInfo') || {};
    storedUserInfo.nickname = newName;
    wx.setStorageSync('userInfo', storedUserInfo);

    // 重新计算显示名称
    const realName = this.data.realName;
    let displayName = newName;
    if (realName) {
      displayName = `${newName}（${realName}）`;
    }

    this.setData({
      userName: newName,
      displayName: displayName,
      isEditingName: false
    });

    this.showToast('昵称更新成功');
  },

  // 取消编辑名字
  cancelEditName() {
    this.setData({
      isEditingName: false,
      editedName: this.data.userName || ''
    });
  },

  // 跳转到登录页
  goToLogin() {
    wx.navigateTo({
      url: '/pages/login/login'
    });
  },

  // 退出登录
  logout: function() {
    const that = this;
    const token = wx.getStorageSync('token');

    if (!token) {
      this.showToast('未登录，无需退出');
      this.clearLoginCache();
      return;
    }

    // 显示确认弹窗
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      confirmText: '退出',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          that.doLogout();
        }
      }
    });
  },

  // 执行退出登录
  doLogout() {
    this.setData({ loading: true });

    const apiBaseUrl = app.globalData ? app.globalData.apiBaseUrl : api.API_BASE_URL;
    wx.request({
      url: apiBaseUrl + '/user/user/logout',
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': wx.getStorageSync('token')
      },
      data: {},
      success: (res) => {
        this.setData({ loading: false });
        
        // 根据后端API文档，成功的code可能是200也可能是0
        if (res.data.code === 200 || res.data.code === 0) {
          this.showToast('登出成功');
        } else {
          this.showToast(res.data.msg || '登出失败');
        }
        
        // 清除缓存并跳转
        this.clearLoginCache();
      },
      fail: (err) => {
        this.setData({ loading: false });
        this.showToast('网络错误');
        console.error('登出请求失败:', err);
        // 即使失败也清除缓存
        this.clearLoginCache();
      }
    });
  },

  // 封装清除登录缓存的方法
  clearLoginCache() {
    // 同步清除所有登录相关缓存
    wx.removeStorageSync('token');
    wx.removeStorageSync('isLogin');
    wx.removeStorageSync('userInfo');
    wx.removeStorageSync('pendingAction');

    // 重置页面数据
    this.setData({
      isLogin: false,
      userName: '',
      realName: '',
      userPhone: '',
      avatarUrl: '',
      displayName: '',
      college: '',
      collegeText: '',
      majorClass: ''
    });

    // 延迟跳转，让用户看到提示
    setTimeout(() => {
      wx.reLaunch({
        url: '/pages/login/login'
      });
    }, 1500);
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {},

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {},

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {},

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {},

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {},

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {},

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {}
});

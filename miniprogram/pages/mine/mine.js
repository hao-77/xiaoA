const api = require('../../config/api.js');
const app = getApp();

// 学院映射表 - 与后端对应
const COLLEGE_MAP = {
  1: '机电工程学院',
  2: '自动化学院',
  3: '轻工化工学院',
  4: '信息工程学院',
  5: '土木与交通工程学院',
  6: '管理学院',
  7: '计算机学院',
  8: '材料与能源学院',
  9: '环境科学与工程学院',
  10: '外国语学院',
  11: '数学与统计学院',
  12: '物理与光电工程学院',
  13: '艺术与设计学院',
  14: '法学院',
  15: '马克思主义学院',
  16: '建筑与城市规划学院',
  17: '经济学院',
  18: '生物医药学院',
  19: '集成电路学院',
  20: '生态环境与资源学院',
  21: '体育学院（体育部）',
  22: '国际教育学院',
  23: '国际交流学院',
  24: '先进制造学院',
  25: '其他'
};

Page({
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
    college: '',    // 学院ID
    collegeText: '', // 学院名称
    majorClass: '', // 专业班级
    toast: {
      show: false,
      message: ''
    }
  },

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
    setTimeout(() => {
      this.setData({ 'toast.show': false });
    }, 2000);
  },

  // 获取用户信息
  fetchUserInfo() {
    const userInfo = wx.getStorageSync('userInfo');
    const token = wx.getStorageSync('token');
    const isLogin = wx.getStorageSync('isLogin');
    console.log(token,userInfo,isLogin,"我的")

    if (token) {
      if (!isLogin) wx.setStorageSync('isLogin', true);
      this.setData({ isLogin: true });
      
      const nickname = (userInfo && userInfo.nickname) || (userInfo && userInfo.name) || '';
      const realName = (userInfo && userInfo.realName) || '';
      const phone = (userInfo && userInfo.phone) || (userInfo && userInfo.phoneNumber) || '';
      const avatarUrl = (userInfo && userInfo.avatarUrl) || (userInfo && userInfo.avatar) || '';
      const college = (userInfo && userInfo.college) || '';
      const majorClass = (userInfo && userInfo.majorClass) || '';

      const collegeText = this.getCollegeText(college);
      let displayName = nickname || phone || '用户';
      if (realName) {
        displayName = nickname ? `${nickname}（${realName}）` : `${realName}（${realName}）`;
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
      this.fetchUserInfoFromServer();
    } else {
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
      header: { 'Authorization': wx.getStorageSync('token') },
      success: (res) => {
        if (res.data.code === 200 && res.data.data) {
          const data = res.data.data;
          const storedUserInfo = wx.getStorageSync('userInfo') || {};
          
          // 合并后端返回的用户信息
          storedUserInfo.nickname = storedUserInfo.nickname || data.nickname;
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

          const collegeText = this.getCollegeText(data.college);
          const nickname = storedUserInfo.nickname || '';
          const realName = data.realName || storedUserInfo.realName || '';
          const phone = data.phone || storedUserInfo.phone || '';
          
          let displayName = phone || '用户';
          if (realName) {
            displayName = nickname ? `${nickname}（${realName}）` : `${realName}（${realName}）`;
          } else if (nickname) {
            displayName = nickname;
          }

          this.setData({
            userName: nickname || '',
            realName: realName,
            userPhone: data.phone || '',
            avatarUrl: storedUserInfo.avatarUrl || '',
            displayName: displayName,
            college: data.college || '',
            collegeText: collegeText,
            majorClass: data.majorClass || ''
          });
        }
      },
      fail: (err) => {
        console.error('获取用户信息失败:', err);
      }
    });
  },

  // 获取微信头像（兼容新旧接口）
// 获取微信头像（仅使用稳定的旧版接口，避免版本兼容问题）
getWechatAvatar() {
  // 先检查用户是否已授权过用户信息（提高体验）
  wx.getSetting({
    success: (res) => {
      // 如果已授权，直接获取；未授权则触发授权弹窗
      if (res.authSetting['scope.userInfo']) {
        wx.getUserInfo({
          success: (infoRes) => {
            this.updateAvatar(infoRes.userInfo.avatarUrl);
          },
          fail: (err) => {
            console.log('获取已授权的用户信息失败:', err);
            this.showToast('获取头像失败，请重试');
          }
        });
      } else {
        // 未授权，触发授权弹窗（必须用户主动点击触发）
        wx.getUserProfile({
          desc: '用于完善用户资料，仅获取头像信息', // 授权说明（微信要求必填）
          success: (res) => {
            const userInfo = res.userInfo;
            this.updateAvatar(userInfo.avatarUrl);
          },
          fail: (err) => {
            console.log('用户拒绝授权或获取失败:', err);
            // 区分「用户取消」和「其他错误」
            if (err.errMsg.includes('cancel')) {
              this.showToast('你取消了头像授权');
            } else {
              this.showToast('获取头像失败，请重试');
            }
          }
        });
      }
    },
    fail: (err) => {
      console.log('获取授权设置失败:', err);
      this.showToast('获取授权状态失败');
    }
  });
},

// 获取微信头像（简化版，不上传后端）
getWechatAvatar() {
  const that = this;
  
  // 使用 getUserProfile（新版API）
  wx.getUserProfile({
    desc: '用于更换头像',
    success: (res) => {
      const userInfo = res.userInfo;
      if (userInfo && userInfo.avatarUrl) {
        // 微信头像URL可以直接使用
        const avatarUrl = userInfo.avatarUrl;
        
        // 1. 更新页面显示
        that.setData({ avatarUrl: avatarUrl });
        
        // 2. 更新缓存（让下次打开还能看到）
        const storedUserInfo = wx.getStorageSync('userInfo') || {};
        storedUserInfo.avatarUrl = avatarUrl;
        wx.setStorageSync('userInfo', storedUserInfo);
        
        // 3. 如果需要，同步更新displayName（可选）
        const nickname = storedUserInfo.nickname || userInfo.nickName || that.data.userName;
        const realName = that.data.realName;
        let displayName = nickname || '用户';
        if (realName) {
          displayName = `${nickname}（${realName}）`;
        }
        
        that.setData({
          userName: nickname,
          displayName: displayName
        });
        
        that.showToast('头像更新成功');
      }
    },
    fail: (err) => {
      console.error('获取头像失败:', err);
      // 如果 getUserProfile 失败，可以用 chooseImage 让用户选本地图片
      if (err.errMsg.includes('fail')) {
        that.chooseLocalImage();
      }
    }
  });
},

// 从相册选择图片（备用方案）
chooseLocalImage() {
  const that = this;
  wx.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      const tempFilePath = res.tempFilePaths[0];
      
      // 显示选中的图片
      that.setData({ avatarUrl: tempFilePath });
      
      // 保存到缓存
      const storedUserInfo = wx.getStorageSync('userInfo') || {};
      storedUserInfo.avatarUrl = tempFilePath;
      wx.setStorageSync('userInfo', storedUserInfo);
      
      that.showToast('头像更新成功');
    },
    fail: (err) => {
      that.showToast('选择图片失败');
    }
  });
},

// 移除原来的 updateAvatar 和 uploadAvatarToServer 函数中的上传相关代码

  // 开始编辑名字
  startEditName() {
    this.setData({
      isEditingName: true,
      editedName: this.data.userName || ''
    });
  },

  // 名字输入
  onNameInput(e) {
    this.setData({ editedName: e.detail.value });
  },

  // 确认编辑名字
  confirmEditName() {
    const newName = this.data.editedName.trim();
    if (!newName) {
      this.showToast('昵称不能为空');
      this.setData({ isEditingName: false });
      return;
    }

    const storedUserInfo = wx.getStorageSync('userInfo') || {};
    storedUserInfo.nickname = newName;
    wx.setStorageSync('userInfo', storedUserInfo);

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
    wx.navigateTo({ url: '/pages/login/login' });
  },

  // 退出登录
  logout() {
    const that = this;
    const token = wx.getStorageSync('token');

    if (!token) {
      this.showToast('未登录，无需退出');
      this.clearLoginCache();
      return;
    }

    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      confirmText: '退出',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) that.doLogout();
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
      success: (res) => {
        this.setData({ loading: false });
        this.showToast(res.data.code === 200 || res.data.code === 0 ? '登出成功' : (res.data.msg || '登出失败'));
        this.clearLoginCache();
      },
      fail: (err) => {
        this.setData({ loading: false });
        this.showToast('网络错误');
        console.error('登出请求失败:', err);
        this.clearLoginCache();
      }
    });
  },

  // 封装清除登录缓存的方法
  clearLoginCache() {
    wx.removeStorageSync('token');
    wx.removeStorageSync('isLogin');
    wx.removeStorageSync('userInfo');
    wx.removeStorageSync('pendingAction');

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

    // 用户退出登录后，停留在当前页面（mine页面会以未登录状态显示）
    // 不再自动跳转到登录页面
  },

  onLoad() {},
  onReady() {},
  onHide() {},
  onUnload() {},
  onPullDownRefresh() {},
  onReachBottom() {},
  onShareAppMessage() {}
});
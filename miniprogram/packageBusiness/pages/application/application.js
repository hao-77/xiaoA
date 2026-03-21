Page({
  data: {
    showSuccessModal: false, // 控制成功弹窗显示
    isFirstSubmit: false,   // 标记是否为首次提交
    // 学院列表 - 从API动态获取
    collegeList: ['未选择'], // 新增默认选项
    collegeData: [], // 存储学院完整数据（包含ID）
    gradeList: ['未选择', '大一', '大二', '大三', '大四'], // 新增默认选项
    groupList: ['未选择', 'AI组', '电控组', '机械组', '前端组', '后台组', '运营组'], // 新增默认选项
    collegeIndex: 0, // 默认选中「未选择」
    selectedCollegeId: 0, // 存储选中学院的实际ID
    gradeIndex: 0,   // 默认选中「未选择」
    groupIndex: 0,   // 默认选中「未选择」
    wordCount: 0,
    hasSubmitted: false, // 控制按钮文字：提交/修改
    formData: {
      phoneOld: '' // 标记已绑定的手机号，避免重复绑定
    },
    isPhoneExist: false, // 标记手机号是否已被占用
    preGroupIndex: -1 // 预填组别索引（从组别介绍页面跳转时使用）
  },

  // 从API获取学院列表
  fetchColleges() {
    const that = this;
    const apiBaseUrl = getApp().globalData.apiBaseUrl;

    // 【调试日志】记录API响应详情
    console.log('========== fetchColleges 开始请求 ==========');
    console.log('API URL:', apiBaseUrl + '/user/user/college');

    wx.request({
      url: apiBaseUrl + '/user/user/college',
      method: 'GET',
      success: (res) => {
        // 【调试日志】打印完整响应结构
        console.log('========== API 响应详情 ==========');
        console.log('HTTP状态码:', res.statusCode);
        console.log('完整响应数据:', res.data);
        console.log('res.data.code:', res.data && res.data.code);
        console.log('res.data.data:', res.data && res.data.data);
        console.log('res.data.data 类型:', typeof (res.data && res.data.data));
        console.log('res.data.data 是否为数组:', Array.isArray(res.data && res.data.data));

        // 尝试多种可能的响应格式
        let colleges = null;

        // 格式1: res.data.data 直接是数组
        if (res.data.code === 200 && res.data.data && Array.isArray(res.data.data)) {
          colleges = res.data.data;
          console.log('【匹配】格式1: res.data.data 是数组');
        }
        // 格式2: res.data.data.data 是数组（嵌套结构）
        else if (res.data.code === 200 && res.data.data && res.data.data.data && Array.isArray(res.data.data.data)) {
          colleges = res.data.data.data;
          console.log('【匹配】格式2: res.data.data.data 是数组');
        }
        // 格式3: res.data.data.list 是数组
        else if (res.data.code === 200 && res.data.data && res.data.data.list && Array.isArray(res.data.data.list)) {
          colleges = res.data.data.list;
          console.log('【匹配】格式3: res.data.data.list 是数组');
        }
        // 格式4: res.data 直接是数组（无code包装）
        else if (Array.isArray(res.data)) {
          colleges = res.data;
          console.log('【匹配】格式4: res.data 直接是数组');
        }
        // 格式5: res.data.data.rows 是数组（分页格式）
        else if (res.data.code === 200 && res.data.data && res.data.data.rows && Array.isArray(res.data.data.rows)) {
          colleges = res.data.data.rows;
          console.log('【匹配】格式5: res.data.data.rows 是数组');
        }
        // 格式6: res.data.data.collegeMaps 是数组（当前实际格式）
        else if (res.data.code === 200 && res.data.data && res.data.data.collegeMaps && Array.isArray(res.data.data.collegeMaps)) {
          colleges = res.data.data.collegeMaps;
          console.log('【匹配】格式6: res.data.data.collegeMaps 是数组');
        }
        else {
          console.error('【未匹配】无法识别API响应格式!');
          console.error('学院列表获取失败 - 响应格式不匹配');
          wx.showToast({
            title: '获取学院列表失败',
            icon: 'none'
          });
          return;
        }

        // 提取学院名称列表（用于picker显示），并在前面加上"未选择"
        const collegeNames = ['未选择', ...colleges.map(college => college.name || college.collegeName)];
        that.setData({
          collegeList: collegeNames,
          collegeData: colleges // 存储完整数据，包含ID
        });
        console.log('学院列表获取成功, 共', colleges.length, '条记录');
        console.log('学院数据:', colleges);
      },
      fail: (err) => {
        console.error('学院列表请求失败:', err);
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      }
    });
  },

  onLoad(options) {
    // 先获取学院列表
    this.fetchColleges();

    // 先获取登录用户的手机号（从缓存的userInfo中取）
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo && userInfo.phone) {
      this.setData({
        'formData.phone': userInfo.phone // 自动回填登录手机号
      });
    }

    // 【关键修复】检查是否有待处理的提交操作
    // 如果有 pendingAction === 'submitApplication'，说明用户刚登录回来
    // 此时需要先显示对话框让用户选择，不应该自动填充旧数据
    const pendingAction = wx.getStorageSync('pendingAction');
    const pendingFormData = wx.getStorageSync('pendingFormData');

    // 检查是否使用新数据重新报名
    if (options.useNewData === 'true') {
      // 用户选择使用新信息重新报名，恢复之前填写的表单数据
      const savedFormData = wx.getStorageSync('pendingFormData');
      if (savedFormData) {
        this.setData({
          hasSubmitted: false,
          isPhoneExist: false,
          formData: {
            ...this.data.formData,
            ...savedFormData,
            phoneOld: '' // 标记为未绑定，让用户可以重新填写
          },
          wordCount: savedFormData.personalIntroduction ? savedFormData.personalIntroduction.length : 0
        });
        // 清除保存的表单数据
        wx.removeStorageSync('pendingFormData');
        // 自动提交表单
        const apiBaseUrl = getApp().globalData.apiBaseUrl;
        this.submitSignUpForm(apiBaseUrl, savedFormData, savedFormData.phone);
      } else {
        this.setData({
          hasSubmitted: false,
          isPhoneExist: false,
          formData: {
            phoneOld: '' // 标记为未绑定，让用户可以重新填写
          }
        });
        wx.showToast({
          title: '请填写新报名信息',
          icon: 'none'
        });
      }
      // 使用新数据报名时不需要再拉取旧数据
      return;
    }

    // 【关键】如果有待提交的报名操作，NOT auto-fill with old data
    // 让 onShow 来处理显示对话框的逻辑
    const token = wx.getStorageSync('token');
    const isLogin = wx.getStorageSync('isLogin');

    // 【修复Bug1】如果用户已登录且有待提交的报名操作，恢复用户填写的表单数据
    // 让 onShow 处理对话框逻辑
    if (pendingAction === 'submitApplication' && pendingFormData && token && isLogin) {
      console.log('========== 检测到待提交的报名操作 ==========');
      console.log('pendingFormData:', pendingFormData);
      
      // 【关键修复】恢复用户填写的表单数据到页面
      // 用户登录后返回表单页，应该看到自己之前填写的数据
      this.setData({
        formData: {
          ...this.data.formData,
          ...pendingFormData,
          phoneOld: '' // 标记为未绑定，提交时会检查手机号
        },
        wordCount: pendingFormData.personalIntroduction ? pendingFormData.personalIntroduction.length : 0,
        // 计算学院索引 - pendingFormData.college是学院ID
        collegeIndex: (() => {
          if (pendingFormData.college) {
            const foundIndex = this.data.collegeData.findIndex(
              c => c.id === pendingFormData.college || c.collegeId === pendingFormData.college
            );
            return foundIndex >= 0 ? foundIndex + 1 : 0;
          }
          return 0;
        })(),
        selectedCollegeId: pendingFormData.college || 0,
        gradeIndex: pendingFormData.grade || 0,
        groupIndex: pendingFormData.groupId || 0,
        hasSubmitted: false, // 重置为未提交状态
        isPhoneExist: false
      });
      
      console.log('已恢复用户填写的表单数据到页面');
      console.log('formData:', this.data.formData);
      console.log('wordCount:', this.data.wordCount);
      console.log('collegeIndex:', this.data.collegeIndex);
      console.log('gradeIndex:', this.data.gradeIndex);
      console.log('groupIndex:', this.data.groupIndex);
      console.log('将在onShow中弹出对话框让用户选择');
      
      // 保存预填组别（如果有）
      let preGroupIndex = -1;
      if (options.groupId) {
        const groupId = parseInt(options.groupId);
        if (groupId >= 1 && groupId <= 6) {
          preGroupIndex = groupId;
        }
      }
      this.setData({ preGroupIndex: preGroupIndex });
      return;
    }

    // 【新增】如果用户已登录（没有pendingFormData但已注册），也跳过自动填充
    // 让 onShow 来检测报名状态并显示对话框
    if (token && isLogin && !pendingFormData) {
      console.log('用户已登录，检测报名状态中...');
      // 保存预填组别（如果有）
      let preGroupIndex = -1;
      if (options.groupId) {
        const groupId = parseInt(options.groupId);
        if (groupId >= 1 && groupId <= 6) {
          preGroupIndex = groupId;
        }
      }
      this.setData({ preGroupIndex: preGroupIndex });
      // 不调用 fetchSignUpInfo()，让 onShow 处理
      return;
    }

    // 保存预填组别（如果有）
    let preGroupIndex = -1;
    if (options.groupId) {
      const groupId = parseInt(options.groupId);
      if (groupId >= 1 && groupId <= 6) {
        // 后端groupId(1-6) → 前端index(1-6)（因为新增了「未选择」，索引+1）
        preGroupIndex = groupId;
      }
    }

    // 存储预填组别到data中，在fetchSignUpInfo后使用
    this.setData({ preGroupIndex: preGroupIndex });

    // 只有在没有待处理操作时才拉取旧报名信息
    this.fetchSignUpInfo();
  },

  // 新增：onShow 生命周期函数 - 页面显示时检查pending action
  onShow: function() {
    console.log('========== onShow 执行 ==========');
    const pendingAction = wx.getStorageSync('pendingAction');
    const pendingFormData = wx.getStorageSync('pendingFormData');
    const token = wx.getStorageSync('token');
    const isLogin = wx.getStorageSync('isLogin');
    
    console.log('pendingAction:', pendingAction);
    console.log('pendingFormData:', pendingFormData);
    console.log('token:', token ? '已存在' : '不存在');
    console.log('isLogin:', isLogin);

    // 【修复Bug1】情况1：有待提交的报名操作
    if (pendingAction === 'submitApplication' && pendingFormData) {
      console.log('========== 进入情况1：待提交的报名操作 ==========');
      // 清除pending action，防止重复触发
      wx.removeStorageSync('pendingAction');
      console.log('已清除pendingAction');

      if (token && isLogin) {
        console.log('用户已登录，准备调用checkRegistrationAndShowDialog');
        // 用户已登录，检查报名状态并显示对话框
        this.checkRegistrationAndShowDialog(pendingFormData);
      }
      return;
    }

    // 【新增】情况2：用户已登录，但没有pendingFormData
    // 需要检测用户是否已报名，显示对应状态
    if (token && isLogin && !pendingFormData) {
      // 用户已登录，检查是否已报名
      this.fetchSignUpInfo();
    }
  },

  // 新增：检查报名状态并显示对话框
  checkRegistrationAndShowDialog: function(formData) {
    const that = this;
    const apiBaseUrl = getApp().globalData.apiBaseUrl;
    const token = wx.getStorageSync('token');
    
    console.log('========== checkRegistrationAndShowDialog 执行 ==========');
    console.log('formData (用户新填写的数据):', formData);

    wx.request({
      url: apiBaseUrl + '/user/user/sign-up',
      method: 'GET',
      header: { 'Authorization': token },
      success: function(res) {
        console.log('API返回结果:', res.data);
        // 【修复BUG】不要在这里删除pendingFormData！让用户选择后再删除
        // 只有在用户明确选择后才清除pendingFormData

        if (res.data.code === 200 && res.data.data && res.data.data.groupId) {
          // 已报名 - 显示对话框
          console.log('用户已报名过，准备弹出对话框...');
          wx.showModal({
            title: '您已报名过',
            content: '是否沿用之前的报名信息？',
            confirmText: '否，使用我刚刚填写的信息重新报名',
            cancelText: '是，让我返回修改我之前报过的报名信息',
            success: function(modalRes) {
              if (modalRes.confirm) {
                // 【修复BUG】用户选择使用新填写的信息
                // 先清除pendingFormData（用户已经做出选择）
                wx.removeStorageSync('pendingFormData');

                // 【关键修复】先设置表单数据到页面，确保页面显示新数据
                // 用户已经明确选择使用新数据，直接提交，不再弹出对话框
                that.setData({
                  formData: {
                    ...that.data.formData,
                    ...formData,
                    phoneOld: '' // 标记为未绑定
                  },
                  wordCount: formData.personalIntroduction ? formData.personalIntroduction.length : 0,
                  hasSubmitted: false, // 重置为未提交状态，使用新数据报名
                  isPhoneExist: false
                });

                // 【关键修复】用户已选择使用新数据，直接提交表单，不再调用checkAndPromptRegistration
                // 因为checkAndPromptRegistration会再次弹出对话框
                that.submitSignUpForm(apiBaseUrl, formData, formData.phone);
              } else {
                // 用户选择沿用之前的报名信息 - 清除pendingFormData并跳转到进度页
                wx.removeStorageSync('pendingFormData');
                wx.navigateTo({
                  url: '/packageBusiness/pages/progress/progress'
                });
              }
            },
            fail: function() {
              // 用户取消对话框 - 也要清除pendingFormData
              wx.removeStorageSync('pendingFormData');
            }
          });
        } else {
          // 未报名 - 直接提交新数据（不再弹出对话框，因为用户已经在上一步做出了选择）
          // 先设置表单数据到页面
          that.setData({
            formData: {
              ...that.data.formData,
              ...formData,
              phoneOld: '' // 标记为未绑定
            },
            wordCount: formData.personalIntroduction ? formData.personalIntroduction.length : 0,
            hasSubmitted: false, // 重置为未提交状态
            isPhoneExist: false
          });
          // 清除pendingFormData
          wx.removeStorageSync('pendingFormData');
          // 【修复BUG】直接提交，不再调用checkAndPromptRegistration避免重复弹窗
          that.submitSignUpForm(apiBaseUrl, formData, formData.phone);
        }
      },
      fail: function(err) {
        console.error('检查报名状态失败:', err);
        // 请求失败时直接提交 - 但也要先设置表单数据到页面
        that.setData({
          formData: {
            ...that.data.formData,
            ...formData,
            phoneOld: ''
          },
          wordCount: formData.personalIntroduction ? formData.personalIntroduction.length : 0,
          hasSubmitted: false,
          isPhoneExist: false
        });
        wx.removeStorageSync('pendingFormData');
        // 【修复BUG】直接提交，不再调用checkAndPromptRegistration避免重复弹窗
        that.submitSignUpForm(apiBaseUrl, formData, formData.phone);
      }
    });
  },

  // 从后端拉取已有报名信息（GET接口）
  fetchSignUpInfo() {
    // 获取全局API地址
    const apiBaseUrl = getApp().globalData.apiBaseUrl;
    
    wx.showLoading({ title: '加载中...' });
    wx.request({
      url: apiBaseUrl + '/user/user/sign-up',
      method: 'GET',
      header: {
        'Authorization': wx.getStorageSync('token')
      },
      success: (res) => {
        wx.hideLoading();
        if (res.data.code === 200 && res.data.data) {
          const data = res.data.data;
          console.log("后端返回数据：", data)
          
          // 关键修改：先默认设置为未占用
          let isPhoneExist = false;
          let hasSubmitted = false;
          
          // 只要有学号，说明已提交过
          if(data.studentId){
            hasSubmitted = true;
            isPhoneExist = true; // 已报名用户的手机号当然是被占用的
          }
      
          // 核心优化：组别索引转换（新增「未选择」后，索引+1）
          let groupIndex = 0; // 默认未选择
          if(data.groupId && data.groupId >= 1 && data.groupId <= 6){
            groupIndex = data.groupId; // 后端groupId(1-6) → 前端index(1-6)
          }
          
          // 学院索引转换 - 从动态学院列表中查找对应的索引
          let collegeIndex = 0;
          let selectedCollegeId = 0;
          if (data.college) {
            // 在collegeData中查找对应的学院ID
            const collegeId = data.college;
            const foundIndex = this.data.collegeData.findIndex(
              c => c.id === collegeId || c.collegeId === collegeId
            );
            if (foundIndex >= 0) {
              // collegeData数组索引0对应picker索引1（因为有"未选择"）
              collegeIndex = foundIndex + 1;
              selectedCollegeId = collegeId;
            }
          }
      
          // 年级索引转换（新增「未选择」后，索引+1）
          let gradeIndex = 0;
          if(data.grade && data.grade >= 1 && data.grade <= this.data.gradeList.length - 1){
            gradeIndex = data.grade; // 后端grade(1-5) → 前端index(1-5)
          }
          
          this.setData({
            formData: {
              ...data,
              phone: data.phone, // 【修复Bug2】同时设置phone字段，供修改报名时使用
              phoneOld: data.phone // 标记已绑定的手机号
            },
            collegeIndex: collegeIndex,
            selectedCollegeId: selectedCollegeId,
            gradeIndex: gradeIndex,
            groupIndex: groupIndex,
            wordCount: data.personalIntroduction ? data.personalIntroduction.length : 0,
            hasSubmitted: hasSubmitted,
            isPhoneExist: isPhoneExist
          });
        } else {
          // 没有报名信息，显示“提交”按钮
          this.setData({
            hasSubmitted: false,
            isPhoneExist: false,
            formData: {
              phoneOld: '' // 初始化为空，标记未绑定
            },
            wordCount: 0,
            // 重置所有picker索引为「未选择」
            collegeIndex: 0,
            selectedCollegeId: 0,
            gradeIndex: 0,
            groupIndex: this.data.preGroupIndex >= 1 ? this.data.preGroupIndex : 0
          });
          if (this.data.preGroupIndex >= 1) {
            wx.showToast({ title: '已自动选择对应组别', icon: 'none' });
          }
        }
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({
          title: '获取信息失败',
          icon: 'none'
        });
        console.error('拉取报名信息失败:', err);
      }
    });
  },

  // 学院选择
  bindCollegeChange(e) {
    const index = e.detail.value;
    let selectedCollegeId = 0;
    
    // 如果选择了学院（不是"未选择"），获取对应学院的ID
    if (index > 0 && this.data.collegeData[index - 1]) {
      // collegeData数组索引0对应学院ID 1，所以需要index - 1
      selectedCollegeId = this.data.collegeData[index - 1].id || this.data.collegeData[index - 1].collegeId || (index);
    }
    
    this.setData({
      collegeIndex: index,
      selectedCollegeId: selectedCollegeId // 存储选中的学院ID
    });
    console.log('选择的学院:', this.data.collegeList[index], 'ID:', selectedCollegeId);
  },

  // 年级选择
  bindGradeChange(e) {
    this.setData({
      gradeIndex: e.detail.value
    })
  },

  // 组别选择
  bindGroupChange(e) {
    this.setData({
      groupIndex: e.detail.value
    })
  },

  // 统计字数
  countWords(e) {
    const length = e.detail.value.length
    this.setData({
      wordCount: length
    })
  },

  // 表单提交/修改
// 表单提交/修改
formSubmit(e) {
  // 获取全局API地址
  const apiBaseUrl = getApp().globalData.apiBaseUrl;
  const token = wx.getStorageSync('token'); // 从缓存取token
  const isLogin = wx.getStorageSync('isLogin');

  const formData = e.detail.value
  console.log('表单提交数据：', formData)

  // 检查是否已登录
  if (!token || !isLogin) {
    // 未登录，提示用户需要登录，并保存表单数据
    wx.showModal({
      title: '提示',
      content: '提交表单需要登录，以便未来追溯进度与查询',
      confirmText: '去登录',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 保存当前填写的表单数据
          wx.setStorageSync('pendingAction', 'submitApplication');
          wx.setStorageSync('pendingFormData', formData);
          wx.navigateTo({ url: '/pages/login/login' });
        }
      }
    });
    return;
  }

  // ==================== 一次性验证所有字段 ====================
  const errors = [];
  const phone = (this.data.formData.phone || '').trim();

  // 1. 姓名校验
  if (!formData.realName || !formData.realName.trim()) {
    errors.push('请填写姓名');
  } else if (formData.realName.trim().length > 10) {
    errors.push('姓名不能超过10个字符');
  }

  // 2. 性别校验
  if (!formData.gender) {
    errors.push('请选择性别');
  }

  // 3. 手机号校验
  if (!phone) {
    errors.push('请填写手机号');
  } else if (!/^1[3-9]\d{9}$/.test(phone)) {
    errors.push('手机号格式不正确（应为11位数字，以1[3-9]开头）');
  }

  // 4. 学号校验
  if (!formData.studentId || !formData.studentId.trim()) {
    errors.push('请填写学号');
  } else if (formData.studentId.trim().length > 12) {
    errors.push('学号不能超过12个字符');
  }

  // 5. 学院校验
  if (this.data.collegeIndex == 0) {
    errors.push('请选择学院');
  }

  // 6. 年级校验
  if (this.data.gradeIndex == 0) {
    errors.push('请选择年级');
  }

  // 7. 专业班级校验
  if (!formData.majorClass || !formData.majorClass.trim()) {
    errors.push('请填写专业班级');
  } else if (formData.majorClass.trim().length > 30) {
    errors.push('专业班级不能超过30个字符');
  }

  // 8. 组别校验
  if (this.data.groupIndex == 0) {
    errors.push('请选择组别');
  }

  // 9. 个人简介校验
  if (!formData.personalIntroduction || !formData.personalIntroduction.trim()) {
    errors.push('请填写个人简介');
  } else if (formData.personalIntroduction.trim().length > 500) {
    errors.push('个人简介不能超过500个字符');
  }

  // 如果有错误，一次性显示所有错误
  if (errors.length > 0) {
    // 构造完整的错误提示信息
    const errorMessage = '请检查以下内容：\n\n' + errors.map((err, index) => `${index + 1}. ${err}`).join('\n');
    wx.showModal({
      title: '信息有误',
      content: errorMessage,
      showCancel: false,
      confirmText: '知道了'
    });
    return;
  }

  // 先调用绑定手机号接口（如果是首次填写手机号）
  const isBindPhone = !this.data.formData.phoneOld; // 标记是否需要绑定
  
  // 【修复Bug2】如果是已报名用户点击"修改信息"按钮，直接提交（PUT请求）
  // 不再弹出"是否沿用之前报名信息"的对话框
  if (this.data.hasSubmitted) {
    // 已报名用户修改信息，直接提交
    this.submitSignUpForm(apiBaseUrl, formData, phone);
    return;
  }
  
  if (isBindPhone) {
    wx.showLoading({ title: '绑定手机号中...' });
    // 调用绑定手机号接口
    wx.request({
      url: apiBaseUrl + '/user/user/bind-phone', // 绑定接口地址
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': token // 从缓存取token
      },
      data: { phone: phone }, // 提交手机号
      success: (res) => {
        if (res.data.code === 200) {
          // 手机号绑定成功，继续提交报名信息
          this.submitSignUpForm(apiBaseUrl, formData, phone);
        } else {
          wx.hideLoading();
          wx.showToast({ title: res.data.msg || '手机号绑定失败', icon: 'none' });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({ title: '网络错误，绑定失败', icon: 'none' });
        console.error('绑定手机号失败:', err);
      }
    });
  } else {
    // 已有手机号，检查是否已报名，显示对应提示
    this.checkAndPromptRegistration(apiBaseUrl, formData, phone);
  }
},

// 检查是否已报名，并提示用户选择
checkAndPromptRegistration: function(apiBaseUrl, formData, phone) {
  const that = this;
  const token = wx.getStorageSync('token');

  wx.request({
    url: apiBaseUrl + '/user/user/sign-up',
    method: 'GET',
    header: {
      'Authorization': token
    },
    success: (res) => {
      if (res.data.code === 200 && res.data.data && res.data.data.groupId) {
        // 已报名 - 显示"是否沿用之前报名信息？"对话框
        wx.showModal({
          title: '您已报名过',
          content: '是否沿用之前报名信息？',
          confirmText: '否，使用新信息重新报名',
          cancelText: '是，返回修改之前报名信息',
          success: (modalRes) => {
            if (modalRes.confirm) {
              // 使用新填写的信息重新报名
              that.submitSignUpForm(apiBaseUrl, formData, phone);
            } else {
              // 沿用之前的报名信息 - 跳转到进度页查看
              wx.navigateTo({
                url: "/packageDisplay/pages/nowProgress/nowProgress"
              });
            }
          }
        });
      } else {
        // 未报名 - 直接提交
        that.submitSignUpForm(apiBaseUrl, formData, phone);
      }
    },
    fail: function(err) {
      // 请求失败时直接提交
      that.submitSignUpForm(apiBaseUrl, formData, phone);
    }
  });
},

// 新增：抽离报名信息提交逻辑（复用）
submitSignUpForm(apiBaseUrl, formData, phone) {
  wx.showLoading({ title: this.data.hasSubmitted ? '修改中...' : '提交中...' });

  // 构造提交给后端的数据
  const submitData = {
    realName: formData.realName,
    gender: Number(formData.gender), // 1=女，2=男
    phone: phone, // 使用绑定/已有的手机号
    studentId: formData.studentId,
    college: Number(this.data.selectedCollegeId) || Number(this.data.collegeIndex),
    grade: Number(this.data.gradeIndex),
    majorClass: formData.majorClass,
    groupId: Number(this.data.groupIndex),
    personalIntroduction: formData.personalIntroduction
  };

  console.log("提交给后端的最终数据：", submitData);

  // 根据是否已提交，选择POST或PUT
  const requestMethod = this.data.hasSubmitted ? 'PUT' : 'POST';

  wx.request({
    url: apiBaseUrl + '/user/user/sign-up',
    method: requestMethod,
    header: {
      'Content-Type': 'application/json',
      'Authorization': wx.getStorageSync('token')
    },
    data: submitData,
    success: (res) => {
      wx.hideLoading();
      if (res.data.code === 200) {
        // 记录是否为首次提交（用于弹窗显示不同文案）
        const isFirstSubmit = !this.data.hasSubmitted;

        // 提交/修改成功后，再次拉取最新数据
        this.fetchSignUpInfo();

        // 显示成功弹窗
        this.setData({
          showSuccessModal: true,
          isFirstSubmit: isFirstSubmit,
          'formData.phoneOld': phone // 标记已绑定手机号
        });

      } else {
        // 特殊处理手机号已被使用的错误
        if (res.data.msg && res.data.msg.includes('手机号已被使用')) {
          wx.showModal({
            title: '提示',
            content: '该手机号已用于报名，无法重复提交！如需修改信息，请联系管理员。',
            showCancel: false,
            confirmText: '知道了'
          });
        } else {
          wx.showToast({
            title: res.data.msg || (this.data.hasSubmitted ? '修改失败' : '提交失败'),
            icon: 'none'
          });
        }
      }
    },
    fail: (err) => {
      wx.hideLoading();
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      })
      console.error('请求失败:', err);
    }
  });
},

  // 关闭成功弹窗
  closeSuccessModal() {
    this.setData({
      showSuccessModal: false
    });
  },

  // 防止点击弹窗内容时关闭
  preventClose() {
    return;
  },onPhoneInput(e) {
  this.setData({
    'formData.phone': e.detail.value.trim()
  });
},

  // 跳转到报名详情页
  goToHomework() {
    this.setData({
      showSuccessModal: false
    });
    wx.navigateTo({
      url: '/packageBusiness/pages/homework/homework',
      fail: () => {
        wx.redirectTo({
          url: '/packageBusiness/pages/homework/homework'
        });
      }
    });
  }
});
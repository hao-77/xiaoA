Page({
  data: {
    showSuccessModal: false, // 控制成功弹窗显示
    isFirstSubmit: false,   // 标记是否为首次提交
    // 1. 新增「未选择」作为第一个选项
    collegeList: [
      '未选择', // 新增默认选项
      '机电工程学院',
      '自动化学院',
      '轻工化工学院',
      '信息工程学院',
      '土木与交通工程学院',
      '管理学院',
      '计算机学院',
      '材料与能源学院',
      '环境科学与工程学院',
      '外国语学院',
      '数学与统计学院',
      '物理与光电工程学院',
      '艺术与设计学院',
      '法学院',
      '马克思主义学院',
      '建筑与城市规划学院',
      '经济学院',
      '生物医药学院',
      '集成电路学院',
      '生态环境与资源学院',
      '体育学院（体育部）',
      '国际教育学院',
      '国际交流学院',
      '先进制造学院',
      '其他（请在下面专业班级前注明）'
    ],
    gradeList: ['未选择', '大一', '大二', '大三', '大四', '研究生'], // 新增默认选项
    groupList: ['未选择', 'AI组', '电控组', '机械组', '前端组', '后台组', '运营组'], // 新增默认选项
    collegeIndex: 0, // 默认选中「未选择」
    gradeIndex: 0,   // 默认选中「未选择」
    groupIndex: 0,   // 默认选中「未选择」
    wordCount: 0,
    hasSubmitted: false, // 控制按钮文字：提交/修改
    formData: {}, // 保存从接口拉取的表单数据
    isPhoneExist: false, // 标记手机号是否已被占用
    preGroupIndex: -1 // 预填组别索引（从组别介绍页面跳转时使用）
  },

  onLoad(options) {
    // 先获取登录用户的手机号（从缓存的userInfo中取）
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo && userInfo.phone) {
      this.setData({
        'formData.phone': userInfo.phone // 自动回填登录手机号
      });
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

    // 拉取报名信息
    this.fetchSignUpInfo();
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
          
          // 学院索引转换（新增「未选择」后，索引+1）
          let collegeIndex = 0;
          if(data.college && data.college >= 1 && data.college <= this.data.collegeList.length - 1){
            collegeIndex = data.college; // 后端college(1-n) → 前端index(1-n)
          }

          // 年级索引转换（新增「未选择」后，索引+1）
          let gradeIndex = 0;
          if(data.grade && data.grade >= 1 && data.grade <= this.data.gradeList.length - 1){
            gradeIndex = data.grade; // 后端grade(1-5) → 前端index(1-5)
          }
          
          this.setData({
            formData: data,
            collegeIndex: collegeIndex,
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
            formData: {},
            wordCount: 0,
            // 重置所有picker索引为「未选择」
            collegeIndex: 0,
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
    this.setData({
      collegeIndex: e.detail.value
    })
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
  formSubmit(e) {
    // 获取全局API地址
    const apiBaseUrl = getApp().globalData.apiBaseUrl;
    
    const formData = e.detail.value
    console.log('表单提交数据：', formData)

    // 补充性别校验
    if (!formData.gender) {
      wx.showToast({
        title: '请选择性别',
        icon: 'none'
      });
      return;
    }

    // 2. 新增：检查学院/年级/组别是否选择（索引为0表示未选择）
    if (this.data.collegeIndex == 0) {
      wx.showToast({ title: '请选择学院', icon: 'none' });
      return;
    }
    if (this.data.gradeIndex == 0) {
      wx.showToast({ title: '请选择年级', icon: 'none' });
      return;
    }
    if (this.data.groupIndex == 0) {
      wx.showToast({ title: '请选择组别', icon: 'none' });
      return;
    }

    // 简单校验
    if (!formData.realName || !formData.phone || !formData.studentId || !formData.majorClass || !formData.personalIntroduction) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    // 手机号格式校验
    if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
      wx.showToast({
        title: '手机号格式不正确',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: this.data.hasSubmitted ? '修改中...' : '提交中...' })

    // 构造提交给后端的数据（3. 索引转换：前端index(1-n) → 后端(1-(n-1))）
    const submitData = {
      realName: formData.realName,
      gender: Number(formData.gender), // 1=女，2=男
      phone: formData.phone,
      studentId: formData.studentId,
      college: Number(this.data.collegeIndex), // 前端index(1-n) → 后端1-(n-1)（和原逻辑一致）
      grade: Number(this.data.gradeIndex), // 前端index(1-5) → 后端1-5
      majorClass: formData.majorClass,
      groupId: Number(this.data.groupIndex), // 前端index(1-6) → 后端1-6
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
        wx.hideLoading()
        if (res.data.code === 200) {
          // 记录是否为首次提交（用于弹窗显示不同文案）
          const isFirstSubmit = !this.data.hasSubmitted;

          // 提交/修改成功后，再次拉取最新数据
          this.fetchSignUpInfo();

          // 显示成功弹窗
          this.setData({
            showSuccessModal: true,
            isFirstSubmit: isFirstSubmit
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
    })
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
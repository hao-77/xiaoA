Page({
  data: {
    collegeList: ['自动化学院', '计算机学院', '电子信息学院', '机械工程学院', '工商管理学院'],
    gradeList: ['大一', '大二', '大三', '大四', '研究生'],
    groupList: ['AI组', '电控组', '机械组', '前端组', '后台组', '运营组'], // 顺序对应groupId 1-6
    collegeIndex: 0,
    gradeIndex: 0,
    groupIndex: 0,
    wordCount: 0,
    hasSubmitted: false, // 控制按钮文字：提交/修改
    formData: {}, // 保存从接口拉取的表单数据
    isPhoneExist: false // 标记手机号是否已被占用
  },

  onLoad() {
    // 先获取登录用户的手机号（从缓存的userInfo中取）
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo && userInfo.phone) {
      this.setData({
        'formData.phone': userInfo.phone // 自动回填登录手机号
      });
    }
    // 再拉取报名信息
    this.fetchSignUpInfo();
  },

  // 从后端拉取已有报名信息（GET接口）
  fetchSignUpInfo() {
    wx.showLoading({ title: '加载中...' });
    wx.request({
      url: 'http://localhost:8080/user/user/sign-up',
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

          // 核心优化：组别索引转换（防止后端返回值超出前端列表长度）
          let groupIndex = 0;
          if(data.groupId && data.groupId >= 1 && data.groupId <= this.data.groupList.length){
            groupIndex = data.groupId - 1; // 后端groupId(1-6) → 前端index(0-5)
          }
          
          this.setData({
            formData: data,
            collegeIndex: data.college ? (data.college - 1) : 0,
            gradeIndex: data.grade ? (data.grade - 1) : 0,
            groupIndex: groupIndex, // 使用优化后的组别索引
            wordCount: data.personalIntroduction?.length || 0,
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
            // 重置所有picker索引
            collegeIndex: 0,
            gradeIndex: 0,
            groupIndex: 0
          });
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
    const formData = e.detail.value
    console.log('表单提交数据：', formData)

    // 补充性别校验（之前缺失）
    if (!formData.gender) {
      wx.showToast({
        title: '请选择性别',
        icon: 'none'
      });
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

    // 如果是首次提交但手机号已被占用，直接提示
    if (!this.data.hasSubmitted && this.data.isPhoneExist) {
      wx.showModal({
        title: '提示',
        content: '您的手机号已用于报名，无法重复提交！如需修改信息，请联系管理员。',
        showCancel: false,
        confirmText: '知道了'
      });
      return;
    }

    wx.showLoading({ title: this.data.hasSubmitted ? '修改中...' : '提交中...' })

    // 构造提交给后端的数据（确保groupId从1开始）
    const submitData = {
      realName: formData.realName,
      gender: Number(formData.gender), // 1=女，2=男
      phone: formData.phone,
      studentId: formData.studentId,
      college: Number(this.data.collegeIndex) + 1, // 前端index(0-4) → 后端1-5
      grade: Number(this.data.gradeIndex) + 1, // 前端index(0-4) → 后端1-5
      majorClass: formData.majorClass,
      groupId: Number(this.data.groupIndex) + 1, // 核心：前端index(0-5) → 后端1-6（AI组=1，运营组=6）
      personalIntroduction: formData.personalIntroduction
    };

    console.log("提交给后端的最终数据：", submitData);

    // 根据是否已提交，选择POST或PUT
    const requestMethod = this.data.hasSubmitted ? 'PUT' : 'POST';

    wx.request({
      url: 'http://localhost:8080/user/user/sign-up',
      method: requestMethod,
      header: {
        'Content-Type': 'application/json',
        'Authorization': wx.getStorageSync('token')
      },
      data: submitData,
      success: (res) => {
        wx.hideLoading()
        if (res.data.code === 200) {
          // 提交/修改成功后，再次拉取最新数据
          this.fetchSignUpInfo();

          wx.showToast({
            title: this.data.hasSubmitted ? '修改成功' : '提交成功',
            icon: 'success'
          });
          setTimeout(() => {
            wx.navigateTo({
              url: '/pages/homework/homework', // 替换为你实际的homework页面路径
              fail: () => {
                // 兜底：如果navigateTo失败（如页面层级问题），用redirectTo
                wx.redirectTo({
                  url: '/pages/homework/homework'
                });
              }
            });
          }, 1500);
        
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
  }
});
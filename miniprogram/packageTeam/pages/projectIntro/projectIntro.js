Page({
  data: {
    projects: [
      {
        id: 1,
        name: '异眼盯真',
        image: '../../assets/project_yiyanjing.png',
        description: '智能视觉检测系统',
        detail: '异眼盯真是一款基于深度学习的智能视觉检测系统，能够高效准确地识别产品缺陷，广泛应用于工业质检领域。'
      },
      {
        id: 2,
        name: '蔚蓝方舟',
        image: '../../assets/project_weilan.png',
        description: '海洋智能监测平台',
        detail: '蔚蓝方舟致力于海洋环境监测与保护，利用物联网和AI技术实现海洋生态的智能化管理。'
      },
      {
        id: 3,
        name: '智能小A',
        image: '../../assets/project_xiaoa.png',
        description: 'AI智能助手',
        detail: '智能小A是团队的旗舰产品，一款基于大语言模型的智能助手，为用户提供全方位的智能化服务。'
      },
      {
        id: 4,
        name: '金盾卫士',
        image: '../../assets/project_jindun.png',
        description: '网络安全防护系统',
        detail: '金盾卫士是一款企业级网络安全防护系统，提供全面的威胁检测和应急响应能力。'
      }
    ]
  },

  onLoad() {
    // 页面加载
  },

  // 查看项目详情
  viewProjectDetail(e) {
    const projectId = e.currentTarget.dataset.id;
    wx.showToast({
      title: '查看项目详情 ' + projectId,
      icon: 'none'
    });
  }
});

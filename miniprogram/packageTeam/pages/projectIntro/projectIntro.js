Page({
  data: {
    projects: [
      {
        id: 1,
        shortName: '异眼盯真',
        fullName: '异眼盯真',
        image: '../../assets/project_yiyanjing.png',
        description: '多模态深度伪造假新闻检测系统',
        detail: '异眼盯真是一款多模态深度伪造假新闻检测系统，提供粗细双粒度检测功能，帮助识破 AI 生成的新闻图与 AI 篡改的新闻稿，其性能在多个数据集上超越了各主流 AI 伪造内容检测模型。项目和广州市算力中心合作推进落地中，相关项目开发人员被邀请进入算力中心实习。',
        awards: [
          '2025 异腾 AI 创新大赛 华南赛区铜奖',
          '2025CAIP 智海人工智能算法应用赛 广东省三等奖',
          '2025 ISC. AI 创新独角兽沙盒大赛高校创新新星赛道优秀奖',
          '2025 ISC.AI 创新独角兽沙盒大赛高校创新新星赛创新技术公益独角兽奖'
        ]
      },
      {
        id: 2,
        shortName: '蔚蓝方舟',
        fullName: '蔚蓝方舟',
        image: '../../assets/project_weilan.png',
        description: '海洋智能监测平台',
        detail: '（待补充）',
        awards: []
      },
      {
        id: 3,
        shortName: '智能小A',
        fullName: '智能小A',
        image: '../../assets/project_xiaoa.png',
        description: 'AI智能助手',
        detail: '（待补充）',
        awards: []
      },
      {
        id: 4,
        shortName: '金盾卫士',
        fullName: '金盾卫士',
        image: '../../assets/project_jindun.png',
        description: '网络安全防护系统',
        detail: '（待补充）',
        awards: []
      }
    ],
    selectedProject: null
  },

  onLoad() {
    // 页面加载
  },

  // 查看项目详情
  viewProjectDetail(e) {
    const projectId = e.currentTarget.dataset.id;
    const project = this.data.projects.find(p => p.id === projectId);
    if (project) {
      this.setData({
        selectedProject: project
      });
    }
  },

  // 关闭项目详情
  closeDetail() {
    this.setData({
      selectedProject: null
    });
  }
});

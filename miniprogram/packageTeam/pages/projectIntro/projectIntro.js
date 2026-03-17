Page({
  data: {
    projects: [
      {
        id: 1,
        shortName: '异眼盯真',
        fullName: '异眼盯真',
        image: '../../../assets/异眼盯真.jpg',
        description: '多模态深度伪造假新闻检测系统',
        detail: '异眼盯真是一款多模态深度伪造假新闻检测系统，提供粗细双粒度检测功能，帮助识破AI生成的新闻图与AI篡改的新闻稿，其性能在多个数据集上超越了各主流AI伪造内容检测模型。项目和广州市算力中心合作推进落地中，相关项目开发人员被邀请进入算力中心实习。',
        awards: [
          '2025昇腾AI创新大赛华南赛区铜奖',
          '2025CAIP智海人工智能算法应用赛广东省三等奖',
          '2025 ISC.AI 创新独角兽沙盒大赛高校创新新星赛道优秀奖',
          '2025 ISC.AI 创新独角兽沙盒大赛高校创新新星赛创新技术公益独角兽奖'
        ]
      },
      {
        id: 2,
        shortName: '蔚蓝方舟',
        fullName: '蔚蓝方舟',
        image: '../../../assets/蔚蓝方舟.jpg',
        description: '智能低碳清洁船',
        detail: '蔚蓝方舟是一款智能低碳清洁船，搭载多传感器与太阳能系统，依托算法自主航行，凭ROS和FreeRTOS实现节能零排放，高效收集水面垃圾。',
        awards: [
          '《一种垃圾自动分类与定点回收的无人船设备》（专利）',
          '《一种光伏热电耦合柔性发电装置》（专利）',
          '《一种供电模块及云检测装置》（专利）',
          '2024睿抗机器人开发者大赛(RAICOM)全国赛智能生活创意设计竞赛项目二等奖',
          '2023中国机器人大赛暨RoboCup机器人世界杯中国赛一等奖',
          '2023年第二届"创祎杯"全国大学生课外学术科技作品大赛国家级银奖',
          '第十七届"挑战杯"广东大学生课外学科技作品竞赛"绿美广东"专项赛一等奖',
          '2025第18届中国计算机设计大赛国赛三等奖',
          '第十一届3S杯"三创"大赛国家级二等奖'
        ]
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
        image: '../../../assets/金盾卫士.jpg',
        description: '数字金融智能防御平台',
        detail: '金盾卫士是为应对数字金融时代欺诈威胁升级而研发的智能防御平台，基于国产化华为昇腾AI全栈技术构建，充分发挥昇腾芯片的强大算力和MindSpore AI 框架的协同优势。',
        awards: [
          '2025AI AGENT全球专项赛-次轮入围-官方推荐金牌项目',
          'iCAN大学生创新创业大赛智能教育大湾区二等奖',
          '华为昇腾AI创新大赛华南总决赛最具商业潜力奖',
          '百度飞桨C4-AI中国高校计算机大赛国家级三等奖',
          'RAICOM睿抗机器人开发者大赛国家级二等奖',
          'AIC全球校园人工智能算法精英大赛广东省三等奖'
        ]
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
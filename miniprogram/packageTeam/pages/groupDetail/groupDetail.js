Page({
  data: {
    // 组别信息
    team: {
      id: 1,
      name: '运营组',
      nameEn: 'operation',
      image: 'https://raw.githubusercontent.com/lydiastep/alwaysbe-files/main/card_team_1.png',
      description: '负责项目日常运营、用户维护与活动策划，是连接产品与用户的核心桥梁。',
      responsibilities: ['用户运营', '活动策划', '社群维护', '数据分析'],
      requirements: ['良好的沟通能力', '文案写作能力', '活动组织经验', '数据分析基础']
    }
  },

  onLoad(options) {
    const { id, name, nameEn } = options;

    // 组别数据
    const teamsData = {
      1: {
        id: 1,
        name: '运营组',
        nameEn: 'operation',
        description: '负责项目日常运营、用户维护与活动策划，是连接产品与用户的核心桥梁。我们致力于提升用户体验，通过精心策划的活动和社群运营，让每一位用户都能感受到团队的温度。',
        responsibilities: ['用户运营', '活动策划', '社群维护', '数据分析', '内容运营'],
        requirements: ['良好的沟通能力', '文案写作能力', '活动组织经验', '数据分析基础', '创新思维']
      },
      2: {
        id: 2,
        name: '前端组',
        nameEn: 'frontEnd',
        description: '负责小程序/Web前端开发，将设计稿转化为精美的用户界面。我们追求极致的用户体验，用代码创造流畅、美观的交互效果。',
        responsibilities: ['小程序开发', 'Web前端开发', 'UI实现', '性能优化', '响应式设计'],
        requirements: ['HTML/CSS/JavaScript基础', 'Vue或React框架', 'UI设计sense', '代码规范意识', '用户体验思维']
      },
      3: {
        id: 3,
        name: '后台组',
        nameEn: 'backStage',
        description: '负责后端服务开发与维护，保障系统稳定运行。我们构建安全、高效、可扩展的后端架构，为业务发展提供坚实的技术支撑。',
        responsibilities: ['API开发', '数据库设计', '服务部署', '性能优化', '安全防护'],
        requirements: ['Java/Python/Go基础', '数据库知识', 'API设计能力', '问题排查能力', '架构思维']
      },
      4: {
        id: 4,
        name: '机械组',
        nameEn: 'mechanical',
        description: '负责机械结构设计与制作，将创意转化为实物。我们运用先进的制造技术，打造高性能的机械产品。',
        responsibilities: ['结构设计', '3D建模', '零件加工', '装配调试', '材料选型'],
        requirements: ['SolidWorks/CAD使用', '机械原理知识', '动手能力', '创新思维', '材料学基础']
      },
      5: {
        id: 5,
        name: '电控组',
        nameEn: 'EC',
        description: '负责电子控制系统设计与编程，实现智能化控制。我们用代码驱动硬件，让机器具备智慧的大脑。',
        responsibilities: ['电路设计', 'PCB制作', '嵌入式编程', '传感器应用', '通信协议'],
        requirements: ['模电数电基础', 'C语言编程', '单片机/STM32', '电路焊接能力', '调试能力']
      },
      6: {
        id: 6,
        name: 'AI组',
        nameEn: 'AI',
        description: '负责人工智能算法研究与智能应用开发。我们探索前沿AI技术，将智能化带入现实应用。分为深度学习应用与科研方向，将 AI 成果落地应用，同时开展 NLP、CV 等方向的学术研究。',
        responsibilities: ['算法研究', '模型训练', '视觉识别', '智能决策', '数据处理'],
        requirements: ['Python编程', '机器学习基础', '深度学习框架', '数学基础', '论文阅读能力']
      },
      7: {
        id: 7,
        name: '项目组',
        nameEn: 'product',
        description: '负责产品规划与项目管理，协调各方资源。我们是团队的核心枢纽，确保项目顺利推进。',
        responsibilities: ['需求分析', '产品设计', '项目推进', '团队协调', '进度管理'],
        requirements: ['产品思维', '文档能力', '沟通协调', '项目管理基础', '商业敏感度']
      }
    };

    // 设置当前组别数据
    const teamId = parseInt(id) || 1;
    const team = teamsData[teamId] || teamsData[1];

    // 使用本地图片
    team.image = `../../assets/card_team_${teamId}.png`;

    this.setData({
      team: team
    });
  },

  // 返回上一页
  onBackTap() {
    wx.navigateBack();
  }
});

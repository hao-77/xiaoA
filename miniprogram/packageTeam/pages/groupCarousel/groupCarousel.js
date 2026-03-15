Page({
  data: {
    // 团队组别数据
    teams: [
      {
        id: 1,
        name: '运营组',
        nameEn: 'operation',
        image: '../../assets/card_team_1.png',
        description: '负责项目日常运营、用户维护与活动策划，是连接产品与用户的核心桥梁。',
        responsibilities: ['用户运营', '活动策划', '社群维护', '数据分析'],
        requirements: ['良好的沟通能力', '文案写作能力', '活动组织经验', '数据分析基础']
      },
      {
        id: 2,
        name: '前端组',
        nameEn: 'frontEnd',
        image: '../../assets/card_team_2.png',
        description: '负责小程序/Web前端开发，将设计稿转化为精美的用户界面。',
        responsibilities: ['小程序开发', 'Web前端开发', 'UI实现', '性能优化'],
        requirements: ['HTML/CSS/JavaScript基础', 'Vue或React框架', 'UI设计sense', '代码规范意识']
      },
      {
        id: 3,
        name: '后台组',
        nameEn: 'backStage',
        image: '../../assets/card_team_3.png',
        description: '负责后端服务开发与维护，保障系统稳定运行。',
        responsibilities: ['API开发', '数据库设计', '服务部署', '性能优化'],
        requirements: ['Java/Python/Go基础', '数据库知识', 'API设计能力', '问题排查能力']
      },
      {
        id: 4,
        name: '机械组',
        nameEn: 'mechanical',
        image: '../../assets/card_team_4.png',
        description: '负责机械结构设计与制作，将创意转化为实物。',
        responsibilities: ['结构设计', '3D建模', '零件加工', '装配调试'],
        requirements: ['SolidWorks/CAD使用', '机械原理知识', '动手能力', '创新思维']
      },
      {
        id: 5,
        name: '电控组',
        nameEn: 'EC',
        image: '../../assets/card_team_5.png',
        description: '负责电子控制系统设计与编程，实现智能化控制。',
        responsibilities: ['电路设计', 'PCB制作', '嵌入式编程', '传感器应用'],
        requirements: ['模电数电基础', 'C语言编程', '单片机/STM32', '电路焊接能力']
      },
      {
        id: 6,
        name: 'AI组',
        nameEn: 'AI',
        image: '../../assets/card_team_6.png',
        description: '负责人工智能算法研究与智能应用开发。',
        responsibilities: ['算法研究', '模型训练', '视觉识别', '智能决策'],
        requirements: ['Python编程', '机器学习基础', '深度学习框架', '数学基础']
      },
      {
        id: 7,
        name: '项目组',
        nameEn: 'product',
        image: '../../assets/card_team_7.png',
        description: '负责产品规划与项目管理，协调各方资源。',
        responsibilities: ['需求分析', '产品设计', '项目推进', '团队协调'],
        requirements: ['产品思维', '文档能力', '沟通协调', '项目管理基础']
      }
    ],
    // 当前显示的组别索引
    currentIndex: 0,
    // 卡片堆叠样式数据（仅缩放/透明度/层级）
    cardStyles: [],
    // 是否正在动画中（防止重复点击）
    isAnimating: false,
    // 滚动相关（仅触摸反馈，无实际位移）
    startY: 0,
    // 卡片配置（固定堆叠位置）
    cardConfig: {
      maxScale: 1,
      minScale: 0.25,
      maxTranslateY: -200,
      minTranslateY: -900,
      visibleCount: 7,
      bottomOffset: 220
    }
  },

  onLoad(options) {
    this.initializeCardStyles();
  },

  onReady() {
    // 页面准备完成后初始化样式
    this.updateCardStyles(0);
  },

  // 初始化卡片样式（仅缩放/透明度/层级）
  initializeCardStyles() {
    const { teams, cardConfig } = this.data;
    const styles = [];

    for (let i = 0; i < teams.length; i++) {
      styles.push(this.calculateCardStyle(i, 0));
    }

    this.setData({ cardStyles: styles });
  },

  // 计算单个卡片的样式（无位移，仅缩放/透明度/层级）
  calculateCardStyle(index, offset) {
    const { teams, cardConfig } = this.data;
    const total = teams.length;

    // 计算相对于当前卡片的位置
    let relativeIndex = (index - this.data.currentIndex + total) % total;

    // 如果是向后滚动，调整索引
    if (offset < 0) {
      relativeIndex = (index - this.data.currentIndex + total) % total;
    }

    // 仅计算缩放/透明度/层级，无位移变化
    const scaleRange = cardConfig.maxScale - cardConfig.minScale;
    const translateRange = Math.abs(cardConfig.maxTranslateY - cardConfig.minTranslateY);

    const scale = cardConfig.maxScale - (scaleRange * Math.pow(relativeIndex / (cardConfig.visibleCount - 1), 0.6));
    const translateY = cardConfig.maxTranslateY - (translateRange * Math.pow(relativeIndex / (cardConfig.visibleCount - 1), 0.5));
    const opacity = 1 - (relativeIndex * 0.08);
    const zIndex = total - relativeIndex;

    return {
      scale: Math.max(cardConfig.minScale, scale),
      translateY: translateY, // 固定值，仅初始化堆叠位置
      opacity: Math.max(0.4, opacity),
      zIndex: zIndex,
      visible: relativeIndex < cardConfig.visibleCount
    };
  },

  // 更新所有卡片样式
  updateCardStyles(offset) {
    const { teams } = this.data;
    const styles = [];

    for (let i = 0; i < teams.length; i++) {
      styles.push(this.calculateCardStyle(i, offset));
    }

    this.setData({ cardStyles: styles });
  },

  // 触摸开始（仅记录位置，无位移）
  onTouchStart(e) {
    if (this.data.isAnimating) return;

    this.setData({
      startY: e.touches[0].clientY
    });
  },

  // 触摸移动（仅轻微反馈，无实际位移）
  onTouchMove(e) {
    if (this.data.isAnimating) return;

    const deltaY = e.touches[0].clientY - this.data.startY;
    // 仅轻微调整样式，无整体位移
    this.updateCardStyles(deltaY / 5);
  },

  // 触摸结束（仅切换索引，无位移）
  onTouchEnd(e) {
    if (this.data.isAnimating) return;

    const deltaY = e.changedTouches[0].clientY - this.data.startY;
    const threshold = 50; // 滑动阈值

    if (Math.abs(deltaY) > threshold) {
      this.setData({ isAnimating: true });
      
      let newIndex;
      if (deltaY > 0) {
        // 向上滑，显示下一个
        newIndex = (this.data.currentIndex + 1) % this.data.teams.length;
      } else {
        // 向下滑，显示上一个
        newIndex = (this.data.currentIndex - 1 + this.data.teams.length) % this.data.teams.length;
      }

      // 切换索引 + 重置样式
      this.setData({ currentIndex: newIndex });
      this.updateCardStyles(0);

      // 结束动画状态
      setTimeout(() => {
        this.setData({ isAnimating: false });
      }, 400);
    } else {
      // 未达到阈值，复位样式
      this.updateCardStyles(0);
    }
  },

  // 点击左侧箭头 - 切换上一个（丝滑动画）
  onLeftArrowTap() {
    if (this.data.isAnimating) return;

    this.setData({ isAnimating: true });
    // 切换到上一个索引
    const newIndex = (this.data.currentIndex - 1 + this.data.teams.length) % this.data.teams.length;
    this.setData({ currentIndex: newIndex });
    this.updateCardStyles(0);

    // 结束动画状态
    setTimeout(() => {
      this.setData({ isAnimating: false });
    }, 400);
  },

  // 点击右侧箭头 - 切换下一个（丝滑动画）
  onRightArrowTap() {
    if (this.data.isAnimating) return;

    this.setData({ isAnimating: true });
    // 切换到下一个索引
    const newIndex = (this.data.currentIndex + 1) % this.data.teams.length;
    this.setData({ currentIndex: newIndex });
    this.updateCardStyles(0);

    // 结束动画状态
    setTimeout(() => {
      this.setData({ isAnimating: false });
    }, 400);
  },

  // 点击卡片查看详情
  onCardTap(e) {
    const { index } = e.currentTarget.dataset;
    const team = this.data.teams[index];

    wx.navigateTo({
      url: `/packageTeam/pages/groupDetail/groupDetail?id=${team.id}&name=${team.name}&nameEn=${team.nameEn}`
    });
  }
});
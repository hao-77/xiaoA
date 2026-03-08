Component({
  /**
   * 组件的属性列表：定义可外部传入的动态参数
   */
  properties: {
    // 背景相关图片
    cloudImg: {
      type: String,
      value: '../../assets/teamCloud.png' // 默认值
    },
    starImg: {
      type: String,
      value: '../../assets/star.png'
    },
    whichGroupImg: {
      type: String,
      value: '../../assets/whichGroup.png'
    },
    leftImg: {
      type: String,
      value: '../../assets/left.png'
    },
    rightImg: {
      type: String,
      value: '../../assets/right.png'
    },
    // 组别主图
    operationImg: {
      type: String,
      value: '../../assets/operation.png'
    },
    // 组别介绍列表（数组，支持多组介绍）
    introList: {
      type: Array,
      value: [
        {
          title: '组别介绍',
          content: '运营组内部工作内容主要分六个方向产品经理，UI，美工，传媒，财务，运维。工作内容为竞赛管理、财务经费管理、品牌宣传和媒体运营、产品管理和协调等方面。'
        }
      ]
    },
    recruitment:{
      type: Array,
      value: [
        {
          title: '招新需求',
          content: '运营组内部工作内容主要分六个方向产品经理，UI，美工，传媒，财务，运维。工作内容为竞赛管理、财务经费管理、品牌宣传和媒体运营、产品管理和协调等方面。'
        }
      ]
    }

  },

  /**
   * 组件的初始数据
   */
  data: {},

  /**
   * 组件的方法列表
   */
  methods: {}
})
const api = require('../../config/api.js');

Component({
  properties: {
    // 背景相关图片（保留）
    cloudImg: { type: String, value: '../../assets/teamCloud.png' },
    starImg: { type: String, value: '../../assets/star.png' },
    whichGroupImg: { type: String, value: '../../assets/whichGroup.png' },
    leftImg: { type: String, value: '../../assets/left.png' },
    rightImg: { type: String, value: '../../assets/right.png' },
    // 🔥 关键修改：属性名从 groupMainImg 改为 groupMainImg（通用组别主图）
    groupMainImg: {
      type: String,
      value: '../../assets/operation.png' // 默认值
    },
    // 组别ID（保留）
    groupId: { type: Number, value: 1 },
    // 组别名称（用于报名跳转）
    groupName: { type: String, value: '' }
  },

  data: { introList: [], recruitment: [] },

  lifetimes: { attached() { this.fetchGroupData(); } },

  methods: {
    // 跳转到报名页面
    goToRegister() {
      const groupName = this.properties.groupName;
      // 组别名称映射到中文组名和groupId
      const groupMap = {
        'AI': { name: 'AI组', id: 1 },
        'EC': { name: '电控组', id: 2 },
        'mechanical': { name: '机械组', id: 3 },
        'frontEnd': { name: '前端组', id: 4 },
        'product': { name: '后台组', id: 5 },
        'backStage': { name: '后台组', id: 5 },
        'operation': { name: '运营组', id: 6 }
      };
      
      const groupInfo = groupMap[groupName] || { name: 'AI组', id: 1 };
      
      wx.navigateTo({
        url: `/packageBusiness/pages/application/application?groupId=${groupInfo.id}&groupName=${encodeURIComponent(groupInfo.name)}`,
        fail: () => {
          wx.showToast({
            title: '无法跳转报名页面',
            icon: 'none'
          });
        }
      });
    },

    fetchGroupData() {
      const token = wx.getStorageSync('superToken');
      if (!token) {
        wx.showToast({ title: '未获取到权限凭证', icon: 'none' });
        return;
      }

      wx.showLoading({ title: '加载中...' });
      wx.request({
        url: api.API_BASE_URL + '/group/list',
        method: 'GET',
        header: { 'Authorization': token },
        success: (res) => {
          wx.hideLoading();
          if (res.data.code === 200 && res.data.data) {
            const groupList = res.data.data;
            const currentGroup = groupList.find(item => item.id === this.properties.groupId);
            if (!currentGroup) {
              wx.showToast({ title: '未找到对应组别信息', icon: 'none' });
              return;
            }

            this.setData({
              introList: [{ title: '组别介绍', content: currentGroup.content || '暂无介绍内容' }],
              recruitment: [{ title: '招新需求', content: currentGroup.demand || '暂无招新需求' }]
            });
          } else {
            wx.showToast({ title: res.data.msg || '获取组别信息失败', icon: 'none' });
          }
        },
        fail: (err) => {
          wx.hideLoading();
          console.error('拉取组别数据失败:', err);
          wx.showToast({ title: '网络错误，请重试', icon: 'none' });
        }
      });
    }
  }
});
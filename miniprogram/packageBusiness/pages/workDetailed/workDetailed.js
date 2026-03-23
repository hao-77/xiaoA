// packageBusiness/pages/workDetailed/workDetailed.js
const api = require('../../../config/api.js');

Page({
  data: {
    workDetail: {},
    processId: ''
  },

  onLoad(options) {
    if (options.processData) {
      try {
        const decodedData = decodeURIComponent(options.processData);
        const processData = JSON.parse(decodedData);
        const currentProcess = processData.currentProcess;

        if (currentProcess) {
          const workDetail = {
            periodName: currentProcess.name || '',
            startTime: this.formatTime(currentProcess.startTime),
            endTime: currentProcess.endTime ? this.formatTime(currentProcess.endTime) : this.formatTime(currentProcess.startTime),
            fileUrl: currentProcess.fileUrl || '',
            email: '1111111@qq.com'
          };
          const processId = currentProcess.id || '';
          this.setData({ processId, workDetail });
          return;
        }
      } catch (e) {
        console.error('解析 processData 失败：', e);
      }
    }

    const processId = options.processId || wx.getStorageSync('currentProcessId');
    if (processId) {
      this.setData({ processId });
      this.fetchWorkDetail(processId);
    } else {
      this.setData({
        workDetail: {
          periodName: '第一期',
          startTime: '2024-01-01',
          endTime: '2024-01-15',
          fileUrl: 'https://example.com/homework.pdf',
          email: '1111111@qq.com'
        }
      });
    }
  },

  fetchWorkDetail(processId) {
    wx.showLoading({ title: '加载中...' });
    wx.request({
      url: api.API_BASE_URL + '/user/process/progress?processId=' + processId,
      method: 'GET',
      header: {
        'Authorization': wx.getStorageSync('token')
      },
      success: (res) => {
        wx.hideLoading();
        if (res.data.code === 200 && res.data.data) {
          const currentProcess = res.data.data.currentProcess;
          this.setData({
            workDetail: {
              periodName: currentProcess.name || '',
              startTime: this.formatTime(currentProcess.startTime),
              endTime: this.formatTime(currentProcess.endTime),
              fileUrl: currentProcess.fileUrl || '',
              email: '1111111@qq.com'
            }
          });
        } else {
          wx.showToast({ title: '获取作业详情失败', icon: 'none' });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({ title: '网络错误，请重试', icon: 'none' });
        console.error('获取作业详情失败:', err);
      }
    });
  },

  formatTime(timeStr) {
    if (!timeStr) return '';
    return timeStr.split(' ')[0] || timeStr;
  },

  copyEmail() {
    const email = this.data.workDetail.email || '1111111@qq.com';
    wx.setClipboardData({
      data: email,
      success: () => {
        wx.showToast({ title: '复制成功', icon: 'success', duration: 1500 });
      },
      fail: () => {
        wx.showToast({ title: '复制失败，请重试', icon: 'none' });
      }
    });
  },

  downloadAttachment() {
    const fileUrl = this.data.workDetail.fileUrl;
    if (!fileUrl) {
      wx.showToast({ title: '暂无附件', icon: 'none' });
      return;
    }

    const fileName = fileUrl.split('/').pop();
    if (!fileName) {
      wx.showToast({ title: '文件名解析失败', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '获取文件中...' });

    wx.request({
      url: api.API_BASE_URL + '/file/getFile',
      method: 'GET',
      header: {
        'Authorization': wx.getStorageSync('token')
      },
      data: { fileName: fileName },
      responseType: 'arraybuffer',
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200) {
          const arrayBuffer = res.data;
          const parts = fileName.split('.');
          const lastPart = parts.pop();
          const fileExtension = lastPart ? lastPart.toLowerCase() : '';
          const filePath = `${wx.env.USER_DATA_PATH}/temp_${Date.now()}.${fileExtension}`;
          const fs = wx.getFileSystemManager();

          fs.writeFile({
            filePath: filePath,
            data: arrayBuffer,
            success: () => {
              if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension || '')) {
                wx.previewImage({ urls: [filePath] });
              } else if (['pdf'].includes(fileExtension || '')) {
                wx.openDocument({
                  filePath: filePath,
                  success: () => console.log('打开文档成功'),
                  fail: (err) => {
                    console.error('打开文档失败:', err);
                    wx.showToast({ title: '打开失败', icon: 'none' });
                  }
                });
              } else {
                wx.showModal({
                  title: '提示',
                  content: '是否保存到手机？',
                  success: (modalRes) => {
                    if (modalRes.confirm) {
                      wx.saveFile({
                        tempFilePath: filePath,
                        success: () => wx.showToast({ title: '保存成功', icon: 'success' }),
                        fail: () => wx.showToast({ title: '保存失败', icon: 'none' })
                      });
                    }
                  }
                });
              }
            },
            fail: (err) => {
              console.error('写入临时文件失败:', err);
              wx.showToast({ title: '文件处理失败', icon: 'none' });
            }
          });
        } else {
          wx.showToast({ title: '获取文件失败', icon: 'none' });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('获取OSS文件失败:', err);
        wx.showToast({ title: '网络错误，请重试', icon: 'none' });
      }
    });
  },

  onReady() {},
  onShow() {},
  onHide() {},
  onUnload() {},
  onPullDownRefresh() {},
  onReachBottom() {},
  onShareAppMessage() {}
});
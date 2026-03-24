// packageBusiness/pages/workDetailed/workDetailed.js
const api = require('../../../config/api.js');

Page({
  data: {
    workDetail: {},
    processId: ''
  },

  onLoad(options) {
    // ✅ 正确解析：直接拿到 processData 就是 currentProcess 对象
    if (options.processData) {
      try {
        const decodedData = decodeURIComponent(options.processData);
        const currentProcess = JSON.parse(decodedData); // ✅ 直接解析
  
        if (currentProcess) {
          const workDetail = {
            periodName: currentProcess.name || '',
            startTime: this.formatTime(currentProcess.startTime),
            endTime: currentProcess.endTime ? this.formatTime(currentProcess.endTime) : this.formatTime(currentProcess.startTime),
            fileUrl: currentProcess.fileUrl || '',
            email: currentProcess.email || "暂无"
          };
          const processId = currentProcess.id || '';
          this.setData({ processId, workDetail });
          return; // 解析成功，直接结束，不走下面的逻辑
        }
      } catch (e) {
        console.error('解析 processData 失败：', e);
      }
    }
  
    // 备用方案：解析失败才走这里
    const processId = options.processId || wx.getStorageSync('currentProcessId');
    if (processId) {
      this.setData({ processId });
      this.fetchWorkDetail(processId);
    } else {
      this.setData({
        workDetail: {
          periodName: '暂无',
          startTime: '暂无',
          endTime: '暂无',
          fileUrl: 'https://example.com/homework.pdf',
          email: '暂无'
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

// ✅ 直接使用 fileUrl 打开/预览附件（修复兼容版）
downloadAttachment() {
  const { fileUrl } = this.data.workDetail;
  
  // 无链接判断
  if (!fileUrl) {
    wx.showToast({ title: '暂无附件', icon: 'none' });
    return;
  }

  wx.showLoading({ title: '正在打开...' });

  // 获取文件后缀（兼容低版本语法）
  let fileExtension = '';
  const lastPart = fileUrl.split('.').pop();
  if (lastPart) {
    fileExtension = lastPart.toLowerCase();
  }

  // 1. 图片 → 直接预览
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension)) {
    wx.previewImage({
      urls: [fileUrl],
      complete: () => wx.hideLoading()
    });
  }
  // 2. PDF/Word/Excel 等文档 → 直接打开
  else if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'].includes(fileExtension)) {
    wx.downloadFile({
      url: fileUrl,
      success: (res) => {
        if (res.statusCode === 200) {
          wx.openDocument({
            filePath: res.tempFilePath,
            success: () => console.log('打开文档成功'),
            fail: () => wx.showToast({ title: '打开失败', icon: 'none' })
          });
        }
      },
      fail: () => wx.showToast({ title: '文件下载失败', icon: 'none' }),
      complete: () => wx.hideLoading()
    });
  }
  // 3. 其他类型 → 提示下载
  else {
    wx.hideLoading();
    wx.showModal({
      title: '提示',
      content: '该文件无法直接预览，是否前往下载？',
      success: (modalRes) => {
        if (modalRes.confirm) {
          wx.setClipboardData({
            data: fileUrl,
            success: () => wx.showToast({ title: '链接已复制，可在浏览器打开', icon: 'success' })
          });
        }
      }
    });
  }
},
  onReady() {},
  onShow() {},
  onHide() {},
  onUnload() {},
  onPullDownRefresh() {},
  onReachBottom() {},
  onShareAppMessage() {}
});
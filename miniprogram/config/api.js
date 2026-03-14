// API 统一配置
// 开发环境使用本地后端，生产环境使用线上后端

// 根据环境切换 API 地址
// 开发环境: http://localhost:8080
// 生产环境: https://smalla.cosh.fun

const API_BASE_URL = 'https://smalla.cosh.fun';

// 获取API地址的辅助函数 - 兼容多种调用方式
const getApiBaseUrl = () => {
  // 优先使用全局配置
  try {
    const app = getApp();
    if (app && app.globalData && app.globalData.apiBaseUrl) {
      return app.globalData.apiBaseUrl;
    }
  } catch (e) {
    console.warn('getApp() not available:', e);
  }
  // 备用使用硬编码地址
  return API_BASE_URL;
};

// 导出供其他模块使用
module.exports = {
  API_BASE_URL: API_BASE_URL,
  getApiBaseUrl: getApiBaseUrl
};

// API 统一配置
// 开发环境使用本地后端，生产环境使用线上后端

// 根据环境切换 API 地址
// 开发环境: http://localhost:8080
// 生产环境: https://smalla.cosh.fun

const API_BASE_URL = 'https://smalla.cosh.fun';

// 导出供其他模块使用
module.exports = {
  API_BASE_URL: API_BASE_URL
};

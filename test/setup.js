import '@testing-library/jest-dom';

// Mock wx global object
global.wx = {
  // 存储相关
  setStorageSync: vi.fn((key, value) => {
    global.wx._storage = global.wx._storage || {};
    global.wx._storage[key] = value;
  }),
  getStorageSync: vi.fn((key) => {
    global.wx._storage = global.wx._storage || {};
    return global.wx._storage[key];
  }),
  removeStorageSync: vi.fn((key) => {
    global.wx._storage = global.wx._storage || {};
    delete global.wx._storage[key];
  }),
  clearStorageSync: vi.fn(() => {
    global.wx._storage = {};
  }),

  // 请求相关
  request: vi.fn(),

  // 导航相关
  switchTab: vi.fn(),
  navigateTo: vi.fn(),
  redirectTo: vi.fn(),
  reLaunch: vi.fn(),
  navigateBack: vi.fn(),

  // UI相关
  showToast: vi.fn(),
  showModal: vi.fn(),
  showLoading: vi.fn(),
  hideLoading: vi.fn(),
  showActionSheet: vi.fn(),

  // 页面相关
  pageScrollTo: vi.fn(),

  // 位置相关
  getLocation: vi.fn(),
  chooseLocation: vi.fn(),

  // 图片相关
  chooseImage: vi.fn(),
  previewImage: vi.fn(),

  // 获取系统信息
  getSystemInfo: vi.fn(),
  getSystemInfoSync: vi.fn(() => ({
    brand: 'devtools',
    model: 'iPhone 14 Pro',
    platform: 'ios',
    system: 'iOS 15.0',
    version: '8.0.30',
    screenWidth: 375,
    screenHeight: 812,
  })),
};

// 模拟Page函数
global.Page = vi.fn((options) => {
  global.Page._options = options;
  return options;
});

// 模拟Component函数
global.Component = vi.fn((options) => {
  global.Component._options = options;
  return options;
});

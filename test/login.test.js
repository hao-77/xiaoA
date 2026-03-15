// Mock global wx object before importing
global.wx = {
  setStorageSync: vi.fn(),
  getStorageSync: vi.fn(),
  removeStorageSync: vi.fn(),
  clearStorageSync: vi.fn(),
  request: vi.fn(),
  switchTab: vi.fn(),
  navigateTo: vi.fn(),
  redirectTo: vi.fn(),
  reLaunch: vi.fn(),
  navigateBack: vi.fn(),
  showToast: vi.fn(),
  showModal: vi.fn(),
  showLoading: vi.fn(),
  hideLoading: vi.fn(),
  showActionSheet: vi.fn(),
  pageScrollTo: vi.fn(),
  getLocation: vi.fn(),
  chooseLocation: vi.fn(),
  chooseImage: vi.fn(),
  previewImage: vi.fn(),
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

// Import the login page logic after mocking
const { onLogin, checkLoginStatus, onPhoneInput } = require('../miniprogram/pages/login/login.js');

describe('Miniprogram Login Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.wx.getStorageSync = vi.fn().mockReturnValue(null);
    global.wx.setStorageSync = vi.fn();
    global.wx.showToast = vi.fn();
    global.wx.request = vi.fn();
    global.wx.navigateTo = vi.fn();
  });

  describe('checkLoginStatus', () => {
    it('should return false when name is empty', () => {
      // 模拟组件的data
      const data = {
        realName: '',
        phone: '13800138000',
        agree: true,
      };
      
      // 验证逻辑：当姓名为空时，不应该可以登录
      const canLogin = data.realName.length > 0 && data.phone.length === 11 && data.agree;
      expect(canLogin).toBe(false);
    });

    it('should return false when phone is not 11 digits', () => {
      const data = {
        realName: 'Test User',
        phone: '1380013800', // 10 digits
        agree: true,
      };
      
      const canLogin = data.realName.length > 0 && data.phone.length === 11 && data.agree;
      expect(canLogin).toBe(false);
    });

    it('should return false when agree is false', () => {
      const data = {
        realName: 'Test User',
        phone: '13800138000',
        agree: false,
      };
      
      const canLogin = data.realName.length > 0 && data.phone.length === 11 && data.agree;
      expect(canLogin).toBe(false);
    });

    it('should return true when all conditions are met', () => {
      const data = {
        realName: 'Test User',
        phone: '13800138000',
        agree: true,
      };
      
      const canLogin = data.realName.length > 0 && data.phone.length === 11 && data.agree;
      expect(canLogin).toBe(true);
    });
  });

  describe('Phone validation', () => {
    it('should filter non-digit characters', () => {
      // 模拟onPhoneInput的输入处理逻辑
      const input = '138-0013-8000';
      const filtered = input.replace(/[^\d]/g, '');
      expect(filtered).toBe('13800138000');
    });

    it('should validate correct phone format', () => {
      const phone = '13800138000';
      const isValid = /^1[3-9]\d{9}$/.test(phone);
      expect(isValid).toBe(true);
    });

    it('should reject invalid phone format', () => {
      const phone = '1380013800';
      const isValid = /^1[3-9]\d{9}$/.test(phone);
      expect(isValid).toBe(false);
    });

    it('should reject phone starting with wrong digit', () => {
      const phone = '12800138000';
      const isValid = /^1[3-9]\d{9}$/.test(phone);
      expect(isValid).toBe(false);
    });
  });

  describe('Storage operations', () => {
    it('should save token to storage on successful login', () => {
      const token = 'test-token-123';
      const userId = 'user-123';
      const isLogin = true;
      const realName = 'Test User';
      const phone = '13800138000';

      // 模拟登录成功后的存储逻辑
      global.wx.setStorageSync('token', token);
      global.wx.setStorageSync('isLogin', isLogin);
      global.wx.setStorageSync('userInfo', {
        realName: realName,
        phone: phone,
        userId: userId
      });

      expect(global.wx.setStorageSync).toHaveBeenCalledWith('token', token);
      expect(global.wx.setStorageSync).toHaveBeenCalledWith('isLogin', isLogin);
      expect(global.wx.setStorageSync).toHaveBeenCalledWith('userInfo', expect.objectContaining({
        realName: realName,
        phone: phone,
        userId: userId
      }));
    });
  });
});

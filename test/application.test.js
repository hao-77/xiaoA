import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock global wx object
global.wx = {
  setStorageSync: vi.fn(),
  getStorageSync: vi.fn((key) => {
    const storage = {
      token: 'test-token',
      userId: 1,
    };
    return storage[key];
  }),
  removeStorageSync: vi.fn(),
  request: vi.fn(),
  navigateTo: vi.fn(),
  redirectTo: vi.fn(),
  showToast: vi.fn(),
  showModal: vi.fn(),
  showLoading: vi.fn(),
  hideLoading: vi.fn(),
  chooseImage: vi.fn(),
  uploadFile: vi.fn(),
  getSystemInfoSync: vi.fn(() => ({
    brand: 'devtools',
    model: 'iPhone 14 Pro',
    platform: 'ios',
  })),
};

describe('Application Page Tests (报名信息填写功能)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('报名信息表单验证功能', () => {
    const validateApplicationForm = (formData) => {
      const errors = [];
      
      if (!formData.name || formData.name.trim() === '') {
        errors.push('姓名不能为空');
      }
      
      if (!formData.studentId || formData.studentId.trim() === '') {
        errors.push('学号不能为空');
      } else if (!/^\d{10}$/.test(formData.studentId)) {
        errors.push('学号格式不正确');
      }
      
      if (!formData.phone || formData.phone.trim() === '') {
        errors.push('手机号不能为空');
      } else if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
        errors.push('手机号格式不正确');
      }
      
      if (!formData.groupId) {
        errors.push('请选择报名组别');
      }
      
      if (!formData.introduction || formData.introduction.trim() === '') {
        errors.push('自我介绍不能为空');
      } else if (formData.introduction.length < 10) {
        errors.push('自我介绍至少10个字');
      }
      
      return {
        valid: errors.length === 0,
        errors,
      };
    };

    it('should pass validation with correct data', () => {
      const formData = {
        name: '张三',
        studentId: '2024011001',
        phone: '13800138000',
        groupId: 1,
        introduction: '热爱编程，喜欢学习新技术',
      };
      const result = validateApplicationForm(formData);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should fail when name is empty', () => {
      const formData = {
        name: '',
        studentId: '2024011001',
        phone: '13800138000',
        groupId: 1,
        introduction: '热爱编程，喜欢学习新技术',
      };
      const result = validateApplicationForm(formData);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('姓名不能为空');
    });

    it('should fail when studentId format is invalid', () => {
      const formData = {
        name: '张三',
        studentId: '12345',
        phone: '13800138000',
        groupId: 1,
        introduction: '热爱编程，喜欢学习新技术',
      };
      const result = validateApplicationForm(formData);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('学号格式不正确');
    });

    it('should fail when phone format is invalid', () => {
      const formData = {
        name: '张三',
        studentId: '2024011001',
        phone: '12345',
        groupId: 1,
        introduction: '热爱编程，喜欢学习新技术',
      };
      const result = validateApplicationForm(formData);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('手机号格式不正确');
    });

    it('should fail when group is not selected', () => {
      const formData = {
        name: '张三',
        studentId: '2024011001',
        phone: '13800138000',
        groupId: null,
        introduction: '热爱编程，喜欢学习新技术',
      };
      const result = validateApplicationForm(formData);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('请选择报名组别');
    });

    it('should fail when introduction is too short', () => {
      const formData = {
        name: '张三',
        studentId: '2024011001',
        phone: '13800138000',
        groupId: 1,
        introduction: '你好',
      };
      const result = validateApplicationForm(formData);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('自我介绍至少10个字');
    });
  });

  describe('组别列表解析功能', () => {
    const parseGroupList = (responseData) => {
      if (responseData.code === 200 && responseData.data) {
        return {
          success: true,
          groups: responseData.data.map((item) => ({
            id: item.id,
            name: item.groupName,
            description: item.description,
          })),
        };
      }
      return { success: false, groups: [] };
    };

    it('should parse group list correctly', () => {
      const responseData = {
        code: 200,
        data: [
          { id: 1, groupName: '前端组', description: '负责前端开发' },
          { id: 2, groupName: '后端组', description: '负责后端开发' },
          { id: 3, groupName: '产品组', description: '负责产品设计' },
        ],
      };
      const result = parseGroupList(responseData);
      expect(result.success).toBe(true);
      expect(result.groups.length).toBe(3);
      expect(result.groups[0].name).toBe('前端组');
    });

    it('should return empty for error response', () => {
      const responseData = { code: 500, msg: 'Error' };
      const result = parseGroupList(responseData);
      expect(result.success).toBe(false);
      expect(result.groups).toEqual([]);
    });
  });

  describe('报名信息提交功能', () => {
    const submitApplication = async (formData, token) => {
      if (!token) {
        return { success: false, message: '请先登录' };
      }
      
      const response = await global.wx.request({
        url: 'https://smalla.cosh.fun/api/application',
        method: 'POST',
        header: {
          Authorization: `Bearer ${token}`,
        },
        data: formData,
      });
      
      if (response.data.code === 200) {
        return { success: true, message: '提交成功' };
      }
      return { success: false, message: response.data.msg || '提交失败' };
    };

    it('should submit successfully with valid token', async () => {
      global.wx.request = vi.fn().mockResolvedValue({
        data: { code: 200, msg: '提交成功' },
      });
      
      const formData = {
        name: '张三',
        studentId: '2024011001',
        phone: '13800138000',
        groupId: 1,
        introduction: '热爱编程，喜欢学习新技术',
      };
      
      const result = await submitApplication(formData, 'test-token');
      expect(result.success).toBe(true);
      expect(result.message).toBe('提交成功');
    });

    it('should fail without token', async () => {
      const formData = {
        name: '张三',
        studentId: '2024011001',
        phone: '13800138000',
        groupId: 1,
        introduction: '热爱编程，喜欢学习新技术',
      };
      
      const result = await submitApplication(formData, null);
      expect(result.success).toBe(false);
      expect(result.message).toBe('请先登录');
    });
  });

  describe('图片上传功能', () => {
    const uploadImage = async (tempFilePath, token) => {
      if (!tempFilePath) {
        return { success: false, message: '请选择图片' };
      }
      
      const response = await global.wx.uploadFile({
        url: 'https://smalla.cosh.fun/api/upload',
        filePath: tempFilePath,
        header: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      const data = JSON.parse(response.data);
      if (data.code === 200) {
        return { success: true, url: data.data };
      }
      return { success: false, message: '上传失败' };
    };

    it('should upload successfully', async () => {
      global.wx.uploadFile = vi.fn().mockResolvedValue({
        data: JSON.stringify({ code: 200, data: 'https://example.com/image.jpg' }),
      });
      
      const result = await uploadImage('temp/image.jpg', 'test-token');
      expect(result.success).toBe(true);
      expect(result.url).toBe('https://example.com/image.jpg');
    });

    it('should fail when no file selected', async () => {
      const result = await uploadImage('', 'test-token');
      expect(result.success).toBe(false);
      expect(result.message).toBe('请选择图片');
    });
  });

  describe('登录状态检查功能', () => {
    const checkLoginStatus = () => {
      const token = global.wx.getStorageSync('token');
      const userId = global.wx.getStorageSync('userId');
      
      if (token && userId) {
        return { loggedIn: true, userId };
      }
      return { loggedIn: false };
    };

    it('should return logged in when token exists', () => {
      const result = checkLoginStatus();
      expect(result.loggedIn).toBe(true);
      expect(result.userId).toBe(1);
    });

    it('should return logged out when token does not exist', () => {
      global.wx.getStorageSync = vi.fn().mockReturnValue(null);
      const result = checkLoginStatus();
      expect(result.loggedIn).toBe(false);
    });
  });
});

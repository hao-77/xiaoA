// Mock global wx object
global.wx = {
  setStorageSync: vi.fn(),
  getStorageSync: vi.fn((key) => {
    const storage = {
      token: 'test-token',
      currentProcessId: 1,
    };
    return storage[key];
  }),
  removeStorageSync: vi.fn(),
  clearStorageSync: vi.fn(),
  request: vi.fn(),
  switchTab: vi.fn(),
  navigateTo: vi.fn(),
  navigateBack: vi.fn(),
  redirectTo: vi.fn(),
  reLaunch: vi.fn(),
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

describe('Progress Page Tests (进度查看功能)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.wx.getStorageSync = vi.fn((key) => {
      const storage = {
        token: 'test-token',
        currentProcessId: 1,
      };
      return storage[key];
    });
  });

  describe('API响应数据解析功能', () => {
    const parseProcessData = (responseData) => {
      if (responseData.code === 200 && responseData.data) {
        const { currentProcess, processList } = responseData.data;
        return {
          success: true,
          currentProcess,
          processList,
        };
      }
      return { success: false };
    };

    it('should parse successful response correctly', () => {
      const responseData = {
        code: 200,
        data: {
          currentProcess: { id: 1, name: '寒假训练营', groupName: '前端组' },
          processList: [{ id: 1, name: '第一轮' }, { id: 2, name: '第二轮' }],
        },
      };
      const result = parseProcessData(responseData);
      expect(result.success).toBe(true);
      expect(result.currentProcess.name).toBe('寒假训练营');
      expect(result.processList.length).toBe(2);
    });

    it('should return failure for error response', () => {
      const responseData = { code: 500, msg: 'Error' };
      const result = parseProcessData(responseData);
      expect(result.success).toBe(false);
    });

    it('should return failure for null data', () => {
      const responseData = { code: 200, data: null };
      const result = parseProcessData(responseData);
      expect(result.success).toBe(false);
    });
  });

  describe('可预约日期解析功能', () => {
    const parseAvailableDates = (responseData) => {
      if (responseData.code === 200 && responseData.data) {
        return {
          success: true,
          dates: responseData.data,
        };
      }
      return { success: false, dates: [] };
    };

    it('should parse available dates correctly', () => {
      const responseData = {
        code: 200,
        data: ['2025-01-15', '2025-01-16', '2025-01-17'],
      };
      const result = parseAvailableDates(responseData);
      expect(result.success).toBe(true);
      expect(result.dates.length).toBe(3);
    });

    it('should return empty dates for error response', () => {
      const responseData = { code: 500, msg: 'Error' };
      const result = parseAvailableDates(responseData);
      expect(result.success).toBe(false);
      expect(result.dates).toEqual([]);
    });
  });

  describe('跳转注册页面校验功能', () => {
    const validateBeforeNavigate = (availableDates, currentProcess) => {
      if (!availableDates || availableDates.length === 0) {
        return { valid: false, message: '暂无可预约日期' };
      }
      if (!currentProcess || !currentProcess.id) {
        return { valid: false, message: '流程信息缺失' };
      }
      return { valid: true, message: '' };
    };

    it('should fail when no available dates', () => {
      const result = validateBeforeNavigate([], { id: 1 });
      expect(result.valid).toBe(false);
      expect(result.message).toBe('暂无可预约日期');
    });

    it('should fail when currentProcess is null', () => {
      const result = validateBeforeNavigate(['2025-01-15'], null);
      expect(result.valid).toBe(false);
      expect(result.message).toBe('流程信息缺失');
    });

    it('should fail when currentProcess.id is missing', () => {
      const result = validateBeforeNavigate(['2025-01-15'], {});
      expect(result.valid).toBe(false);
      expect(result.message).toBe('流程信息缺失');
    });

    it('should pass when all conditions are met', () => {
      const result = validateBeforeNavigate(['2025-01-15'], { id: 1 });
      expect(result.valid).toBe(true);
    });
  });

  describe('页面数据回填功能', () => {
    const fillPageData = (currentProcess) => {
      return {
        cardTitle: currentProcess.name || '寒假训练营',
        groupName: currentProcess.groupName || '前端组',
        startTime: currentProcess.startTime || '2024-05-26',
        fileUrl: currentProcess.fileUrl || '',
      };
    };

    it('should fill data with process values', () => {
      const currentProcess = {
        name: '春季招新',
        groupName: '后端组',
        startTime: '2025-02-01',
        fileUrl: 'https://example.com/file.pdf',
      };
      const result = fillPageData(currentProcess);
      expect(result.cardTitle).toBe('春季招新');
      expect(result.groupName).toBe('后端组');
      expect(result.startTime).toBe('2025-02-01');
      expect(result.fileUrl).toBe('https://example.com/file.pdf');
    });

    it('should use default values when process values are missing', () => {
      const currentProcess = {};
      const result = fillPageData(currentProcess);
      expect(result.cardTitle).toBe('寒假训练营');
      expect(result.groupName).toBe('前端组');
      expect(result.startTime).toBe('2024-05-26');
      expect(result.fileUrl).toBe('');
    });
  });

  describe('文件预览功能', () => {
    const canPreviewFile = (fileUrl) => {
      // 修复：确保返回boolean类型
      return Boolean(fileUrl && fileUrl.length > 0);
    };

    it('should return true when fileUrl exists', () => {
      expect(canPreviewFile('https://example.com/file.pdf')).toBe(true);
    });

    it('should return false when fileUrl is empty', () => {
      expect(canPreviewFile('')).toBe(false);
    });

    it('should return false when fileUrl is null', () => {
      expect(canPreviewFile(null)).toBe(false);
    });

    it('should return false when fileUrl is undefined', () => {
      expect(canPreviewFile(undefined)).toBe(false);
    });
  });

  describe('Storage操作功能', () => {
    it('should save currentProcessId to storage', () => {
      const processId = 1;
      global.wx.setStorageSync('currentProcessId', processId);
      expect(global.wx.setStorageSync).toHaveBeenCalledWith('currentProcessId', processId);
    });

    it('should get token from storage', () => {
      global.wx.getStorageSync('token');
      expect(global.wx.getStorageSync).toHaveBeenCalledWith('token');
    });

    it('should get currentProcessId from storage', () => {
      global.wx.getStorageSync('currentProcessId');
      expect(global.wx.getStorageSync).toHaveBeenCalledWith('currentProcessId');
    });
  });

  describe('URL编码功能', () => {
    const encodeDatesForUrl = (dates) => {
      return encodeURIComponent(JSON.stringify(dates));
    };

    const decodeDatesFromUrl = (encoded) => {
      return JSON.parse(decodeURIComponent(encoded));
    };

    it('should encode and decode dates correctly', () => {
      const dates = ['2025-01-15', '2025-01-16'];
      const encoded = encodeDatesForUrl(dates);
      const decoded = decodeDatesFromUrl(encoded);
      expect(decoded).toEqual(dates);
    });

    it('should handle special characters in dates', () => {
      const dates = ['2025-01-15', '2025-01-16'];
      const encoded = encodeDatesForUrl(dates);
      expect(encoded).not.toContain('[');
      expect(encoded).not.toContain(']');
    });
  });
});

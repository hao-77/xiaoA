import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock global wx object
global.wx = {
  getStorageSync: vi.fn((key) => {
    const storage = {
      token: 'test-token',
    };
    return storage[key];
  }),
  request: vi.fn(),
  navigateTo: vi.fn(),
  previewImage: vi.fn(),
  showToast: vi.fn(),
};

describe('Team Introduction Tests (团队介绍功能)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('团队列表解析功能', () => {
    const parseTeamList = (responseData) => {
      if (responseData.code === 200 && responseData.data) {
        return {
          success: true,
          teams: responseData.data.map((item) => ({
            id: item.id,
            name: item.teamName,
            description: item.description,
            imageUrl: item.imageUrl,
          })),
        };
      }
      return { success: false, teams: [] };
    };

    it('should parse team list correctly', () => {
      const responseData = {
        code: 200,
        data: [
          { id: 1, teamName: '小A创新创业团队', description: '致力于创新创业', imageUrl: 'https://example.com/team1.jpg' },
          { id: 2, teamName: '技术组', description: '技术驱动创新', imageUrl: 'https://example.com/team2.jpg' },
        ],
      };
      const result = parseTeamList(responseData);
      expect(result.success).toBe(true);
      expect(result.teams.length).toBe(2);
      expect(result.teams[0].name).toBe('小A创新创业团队');
    });

    it('should return empty for error response', () => {
      const responseData = { code: 500, msg: 'Error' };
      const result = parseTeamList(responseData);
      expect(result.success).toBe(false);
    });
  });

  describe('团队详情解析功能', () => {
    const parseTeamDetail = (responseData) => {
      if (responseData.code === 200 && responseData.data) {
        return {
          success: true,
          detail: {
            id: responseData.data.id,
            name: responseData.data.teamName,
            description: responseData.data.description,
            vision: responseData.data.vision,
            culture: responseData.data.culture,
            achievements: responseData.data.achievements,
            imageUrls: responseData.data.imageUrls || [],
          },
        };
      }
      return { success: false, detail: null };
    };

    it('should parse team detail correctly', () => {
      const responseData = {
        code: 200,
        data: {
          id: 1,
          teamName: '小A创新创业团队',
          description: '致力于创新创业',
          vision: '成为最优秀的创业团队',
          culture: '开放、创新、协作',
          achievements: '获得多项创业大赛奖项',
          imageUrls: ['https://example.com/1.jpg', 'https://example.com/2.jpg'],
        },
      };
      const result = parseTeamDetail(responseData);
      expect(result.success).toBe(true);
      expect(result.detail.name).toBe('小A创新创业团队');
      expect(result.detail.vision).toBe('成为最优秀的创业团队');
      expect(result.detail.imageUrls.length).toBe(2);
    });

    it('should handle missing optional fields', () => {
      const responseData = {
        code: 200,
        data: {
          id: 1,
          teamName: '小A创新创业团队',
          description: '致力于创新创业',
        },
      };
      const result = parseTeamDetail(responseData);
      expect(result.success).toBe(true);
      expect(result.detail.name).toBe('小A创新创业团队');
      expect(result.detail.vision).toBeUndefined();
      expect(result.detail.imageUrls).toEqual([]);
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
            requirement: item.requirement,
            iconUrl: item.iconUrl,
          })),
        };
      }
      return { success: false, groups: [] };
    };

    it('should parse group list correctly', () => {
      const responseData = {
        code: 200,
        data: [
          { id: 1, groupName: '前端组', description: '负责前端开发', requirement: '熟悉Vue/React', iconUrl: 'https://example.com/fe.png' },
          { id: 2, groupName: '后端组', description: '负责后端开发', requirement: '熟悉Java/Node.js', iconUrl: 'https://example.com/be.png' },
          { id: 3, groupName: '产品组', description: '负责产品设计', requirement: '有产品思维', iconUrl: 'https://example.com/pm.png' },
        ],
      };
      const result = parseGroupList(responseData);
      expect(result.success).toBe(true);
      expect(result.groups.length).toBe(3);
      expect(result.groups[0].requirement).toBe('熟悉Vue/React');
    });

    it('should return empty for error response', () => {
      const responseData = { code: 500, msg: 'Error' };
      const result = parseGroupList(responseData);
      expect(result.success).toBe(false);
    });
  });

  describe('获取团队动态/推文功能', () => {
    const parseTweetsList = (responseData) => {
      if (responseData.code === 200 && responseData.data) {
        return {
          success: true,
          tweets: responseData.data.map((item) => ({
            id: item.id,
            title: item.title,
            content: item.content,
            publishTime: item.publishTime,
            imageUrl: item.coverImage,
          })),
        };
      }
      return { success: false, tweets: [] };
    };

    it('should parse tweets correctly', () => {
      const responseData = {
        code: 200,
        data: [
          { id: 1, title: '招新啦', content: '欢迎加入我们', publishTime: '2025-01-01', coverImage: 'https://example.com/1.jpg' },
          { id: 2, title: '年会', content: '年度总结', publishTime: '2025-01-15', coverImage: 'https://example.com/2.jpg' },
        ],
      };
      const result = parseTweetsList(responseData);
      expect(result.success).toBe(true);
      expect(result.tweets.length).toBe(2);
      expect(result.tweets[0].title).toBe('招新啦');
    });
  });

  describe('图片预览功能', () => {
    const previewTeamImages = (currentUrl, allUrls) => {
      global.wx.previewImage({
        current: currentUrl,
        urls: allUrls,
      });
    };

    it('should preview single image', () => {
      const currentUrl = 'https://example.com/team.jpg';
      const allUrls = [currentUrl];
      previewTeamImages(currentUrl, allUrls);
      expect(global.wx.previewImage).toHaveBeenCalledWith({
        current: currentUrl,
        urls: allUrls,
      });
    });

    it('should preview multiple images', () => {
      const currentUrl = 'https://example.com/team1.jpg';
      const allUrls = [
        'https://example.com/team1.jpg',
        'https://example.com/team2.jpg',
        'https://example.com/team3.jpg',
      ];
      previewTeamImages(currentUrl, allUrls);
      expect(global.wx.previewImage).toHaveBeenCalledWith({
        current: currentUrl,
        urls: allUrls,
      });
    });
  });

  describe('时间格式化功能', () => {
    const formatPublishTime = (publishTime) => {
      if (!publishTime) return '';
      const date = new Date(publishTime);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      
      if (days === 0) return '今天';
      if (days === 1) return '昨天';
      if (days < 7) return `${days}天前`;
      return publishTime;
    };

    it('should return "今天" for today', () => {
      const today = new Date().toISOString().split('T')[0];
      const result = formatPublishTime(today);
      expect(result).toBe('今天');
    });

    it('should return "昨天" for yesterday', () => {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const result = formatPublishTime(yesterday);
      expect(result).toBe('昨天');
    });

    it('should return days ago for within a week', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0];
      const result = formatPublishTime(threeDaysAgo);
      expect(result).toBe('3天前');
    });

    it('should return original date for older than a week', () => {
      const oldDate = '2024-12-01';
      const result = formatPublishTime(oldDate);
      expect(result).toBe('2024-12-01');
    });
  });
});

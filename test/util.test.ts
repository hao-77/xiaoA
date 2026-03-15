import { describe, it, expect, beforeEach } from 'vitest';
import { formatTime } from '../miniprogram/utils/util';

describe('Util Tests', () => {
  describe('formatTime', () => {
    it('should format time correctly', () => {
      // 创建一个固定的日期时间进行测试
      const date = new Date(2024, 0, 15, 9, 30, 45); // 2024-01-15 09:30:45
      const result = formatTime(date);
      
      expect(result).toBe('2024/01/15 09:30:45');
    });

    it('should pad single digits with zero', () => {
      const date = new Date(2024, 0, 5, 1, 2, 3); // 2024-01-05 01:02:03
      const result = formatTime(date);
      
      expect(result).toBe('2024/01/05 01:02:03');
    });

    it('should handle year correctly', () => {
      const date = new Date(2023, 11, 31, 23, 59, 59); // 2023-12-31 23:59:59
      const result = formatTime(date);
      
      expect(result).toBe('2023/12/31 23:59:59');
    });

    it('should format month correctly (0-indexed)', () => {
      // 注意：月份是0-indexed，5表示6月
      const date = new Date(2024, 5, 1, 0, 0, 0); // 2024-06-01 00:00:00
      const result = formatTime(date);
      
      expect(result).toBe('2024/06/01 00:00:00');
    });
  });
});

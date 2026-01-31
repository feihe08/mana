import { describe, it, expect } from 'vitest';
import { formatHashShort, isValidHash } from './file-hash';

describe('文件哈希工具', () => {
  describe('formatHashShort', () => {
    it('应该格式化长哈希为短格式', () => {
      // SHA-256 哈希是 64 个字符
      const hash = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8c9d0e1f2';
      const short = formatHashShort(hash);
      expect(short).toBe('a1b2c3d4...c9d0e1f2');
    });

    it('应该保持短哈希不变', () => {
      const hash = 'a1b2c3d4';
      const short = formatHashShort(hash);
      expect(short).toBe('a1b2c3d4');
    });
  });

  describe('isValidHash', () => {
    it('应该验证有效的 SHA-256 哈希', () => {
      const validHash = 'a'.repeat(64);
      expect(isValidHash(validHash)).toBe(true);
    });

    it('应该拒绝无效长度的哈希', () => {
      const invalidHash = 'a'.repeat(63);
      expect(isValidHash(invalidHash)).toBe(false);
    });

    it('应该拒绝包含非十六进制字符的哈希', () => {
      const invalidHash = 'g'.repeat(64);
      expect(isValidHash(invalidHash)).toBe(false);
    });

    it('应该接受大小写混合的哈希', () => {
      const mixedCaseHash = 'A'.repeat(32) + 'a'.repeat(32);
      expect(isValidHash(mixedCaseHash)).toBe(true);
    });
  });
});

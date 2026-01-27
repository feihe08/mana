/**
 * 文件验证工具测试
 */
import { describe, it, expect } from 'vitest';
import {
  validateFile,
  validateFileSize,
  validateFileExtension,
  validateMimeType,
  MAX_FILE_SIZE,
  ALLOWED_EXTENSIONS,
} from './file-validation';

describe('file-validation', () => {
  describe('validateFileSize', () => {
    it('should reject empty files', () => {
      const file = new File([], 'test.csv', { type: 'text/csv' });
      const result = validateFileSize(file);
      expect(result.valid).toBe(false);
      expect(result.error?.message).toContain('文件为空');
    });

    it('should accept normal sized files', () => {
      const content = 'a'.repeat(1024); // 1KB
      const file = new File([content], 'test.csv', { type: 'text/csv' });
      const result = validateFileSize(file);
      expect(result.valid).toBe(true);
    });

    it('should accept files at size limit', () => {
      const content = 'a'.repeat(MAX_FILE_SIZE);
      const file = new File([content], 'test.csv', { type: 'text/csv' });
      const result = validateFileSize(file);
      expect(result.valid).toBe(true);
    });

    it('should reject files over size limit', () => {
      const content = 'a'.repeat(MAX_FILE_SIZE + 1);
      const file = new File([content], 'test.csv', { type: 'text/csv' });
      const result = validateFileSize(file);
      expect(result.valid).toBe(false);
      expect(result.error?.message).toContain('文件过大');
    });
  });

  describe('validateFileExtension', () => {
    it('should accept CSV files', () => {
      const result = validateFileExtension('test.csv');
      expect(result.valid).toBe(true);
    });

    it('should accept Excel files', () => {
      expect(validateFileExtension('test.xlsx').valid).toBe(true);
      expect(validateFileExtension('test.xls').valid).toBe(true);
    });

    it('should accept TXT files', () => {
      const result = validateFileExtension('test.txt');
      expect(result.valid).toBe(true);
    });

    it('should reject unsupported file types', () => {
      const result = validateFileExtension('test.pdf');
      expect(result.valid).toBe(false);
      expect(result.error?.message).toContain('不支持的文件类型');
    });

    it('should reject files without extension', () => {
      const result = validateFileExtension('test');
      expect(result.valid).toBe(false);
      expect(result.error?.message).toContain('不支持的文件类型');
    });

    it('should be case insensitive', () => {
      expect(validateFileExtension('test.CSV').valid).toBe(true);
      expect(validateFileExtension('test.XLSX').valid).toBe(true);
    });
  });

  describe('validateFile', () => {
    it('should validate a correct file', () => {
      const content = 'date,description,amount\\n2025-01-15,Test,100';
      const file = new File([content], 'test.csv', { type: 'text/csv' });
      const result = validateFile(file);
      expect(result.valid).toBe(true);
    });

    it('should reject empty file', () => {
      const file = new File([], 'test.csv', { type: 'text/csv' });
      const result = validateFile(file);
      expect(result.valid).toBe(false);
    });

    it('should reject oversized file', () => {
      const content = 'a'.repeat(MAX_FILE_SIZE + 1);
      const file = new File([content], 'test.csv', { type: 'text/csv' });
      const result = validateFile(file);
      expect(result.valid).toBe(false);
    });

    it('should reject unsupported file type', () => {
      const content = 'test';
      const file = new File([content], 'test.pdf', { type: 'application/pdf' });
      const result = validateFile(file);
      expect(result.valid).toBe(false);
    });
  });
});

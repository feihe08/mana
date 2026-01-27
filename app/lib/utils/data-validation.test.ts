/**
 * 数据验证工具测试
 */
import { describe, it, expect } from 'vitest';
import {
  validateAmount,
  validateDate,
  validateBill,
  validateBills,
  sanitizeBills,
} from './data-validation';

describe('data-validation', () => {
  describe('validateAmount', () => {
    it('should accept positive amounts', () => {
      expect(validateAmount(100.5)).toBe(true);
      expect(validateAmount(1)).toBe(true);
      expect(validateAmount(9999999)).toBe(true);
    });

    it('should accept negative amounts (expenses)', () => {
      expect(validateAmount(-50)).toBe(true);
      expect(validateAmount(-100.5)).toBe(true);
    });

    it('should reject zero', () => {
      expect(validateAmount(0)).toBe(false);
    });

    it('should reject very small amounts', () => {
      expect(validateAmount(0.001)).toBe(false);
      expect(validateAmount(-0.005)).toBe(false);
    });

    it('should reject very large amounts', () => {
      expect(validateAmount(20000000)).toBe(false);
      expect(validateAmount(-20000000)).toBe(false);
    });

    it('should reject NaN', () => {
      expect(validateAmount(NaN)).toBe(false);
    });

    it('should reject null and undefined', () => {
      expect(validateAmount(null as any)).toBe(false);
      expect(validateAmount(undefined as any)).toBe(false);
    });

    it('should accept string numbers', () => {
      expect(validateAmount('123.45' as any)).toBe(true);
      expect(validateAmount('-50' as any)).toBe(true);
    });

    it('should reject invalid string numbers', () => {
      expect(validateAmount('abc' as any)).toBe(false);
      expect(validateAmount('' as any)).toBe(false);
    });
  });

  describe('validateDate', () => {
    it('should accept valid dates', () => {
      expect(validateDate('2025-01-15')).toBe(true);
      expect(validateDate('2020-06-30')).toBe(true);
    });

    it('should accept ISO format dates', () => {
      expect(validateDate('2025-01-15T10:30:00Z')).toBe(true);
    });

    it('should reject invalid dates', () => {
      expect(validateDate('2025-13-45')).toBe(false);
      expect(validateDate('invalid')).toBe(false);
    });

    it('should reject dates before 1990', () => {
      expect(validateDate('1989-12-31')).toBe(false);
    });

    it('should reject dates after 2030', () => {
      expect(validateDate('2031-01-01')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(validateDate('')).toBe(false);
    });

    it('should reject null and undefined', () => {
      expect(validateDate(null as any)).toBe(false);
      expect(validateDate(undefined as any)).toBe(false);
    });
  });

  describe('validateBill', () => {
    it('should accept valid bill', () => {
      const bill = {
        description: 'Test',
        amount: 100,
        transactionDate: '2025-01-15',
      };
      const errors = validateBill(bill, 0);
      expect(errors).toHaveLength(0);
    });

    it('should reject bill without description', () => {
      const bill = {
        description: '',
        amount: 100,
        transactionDate: '2025-01-15',
      };
      const errors = validateBill(bill, 0);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].field).toBe('description');
    });

    it('should reject bill without amount', () => {
      const bill = {
        description: 'Test',
        amount: null as any,
        transactionDate: '2025-01-15',
      };
      const errors = validateBill(bill, 0);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.field === 'amount')).toBe(true);
    });

    it('should reject bill without date', () => {
      const bill = {
        description: 'Test',
        amount: 100,
        transactionDate: '',
      };
      const errors = validateBill(bill, 0);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.field === 'transactionDate')).toBe(true);
    });
  });

  describe('validateBills', () => {
    it('should validate all bills', () => {
      const bills = [
        {
          id: '1',
          description: 'Test 1',
          amount: 100,
          transactionDate: '2025-01-15',
          originalData: {},
        },
        {
          id: '2',
          description: 'Test 2',
          amount: -50,
          transactionDate: '2025-01-16',
          originalData: {},
        },
      ];
      const result = validateBills(bills);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid bills', () => {
      const bills = [
        {
          id: '1',
          description: 'Test 1',
          amount: 0, // Invalid
          transactionDate: '2025-01-15',
          originalData: {},
        },
        {
          id: '2',
          description: 'Test 2',
          amount: 100,
          transactionDate: '2025-13-45', // Invalid
          originalData: {},
        },
      ];
      const result = validateBills(bills);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('sanitizeBills', () => {
    it('should separate valid and invalid bills', () => {
      const bills = [
        {
          id: '1',
          description: 'Valid',
          amount: 100,
          transactionDate: '2025-01-15',
          originalData: {},
        },
        {
          id: '2',
          description: 'Invalid amount',
          amount: 0,
          transactionDate: '2025-01-15',
          originalData: {},
        },
        {
          id: '3',
          description: 'Invalid date',
          amount: 100,
          transactionDate: '2025-13-45',
          originalData: {},
        },
      ];
      const result = sanitizeBills(bills);
      expect(result.valid).toHaveLength(1);
      expect(result.invalid).toBe(2);
      expect(result.valid[0].id).toBe('1');
    });

    it('should return all bills as valid if all are valid', () => {
      const bills = [
        {
          id: '1',
          description: 'Test 1',
          amount: 100,
          transactionDate: '2025-01-15',
          originalData: {},
        },
        {
          id: '2',
          description: 'Test 2',
          amount: -50,
          transactionDate: '2025-01-16',
          originalData: {},
        },
      ];
      const result = sanitizeBills(bills);
      expect(result.valid).toHaveLength(2);
      expect(result.invalid).toBe(0);
    });
  });
});

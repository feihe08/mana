import { describe, it, expect } from 'vitest';
import {
  generateTransactionHash,
  deduplicateBills,
  removeDuplicatesWithinBatch,
  findDuplicateGroups,
  formatDeduplicationStats,
  generateDeduplicationReport,
} from './deduplication';
import type { ParsedBill } from '../parsers/csv';

describe('账单去重工具', () => {
  // 测试数据
  const bill1: ParsedBill = {
    id: '1',
    amount: 50.5,
    description: '美团外卖',
    transactionDate: '2024-01-01',
    category: 'Food-Delivery',
    originalData: {},
  };

  const bill2: ParsedBill = {
    id: '2',
    amount: 50.5,
    description: '美团外卖',
    transactionDate: '2024-01-01',
    category: 'Food-Delivery',
    originalData: {},
  };

  const bill3: ParsedBill = {
    id: '3',
    amount: 30.0,
    description: '滴滴出行',
    transactionDate: '2024-01-02',
    category: 'Transport-Taxi',
    originalData: {},
  };

  describe('generateTransactionHash', () => {
    it('应该为相同的交易生成相同的哈希', () => {
      const hash1 = generateTransactionHash(bill1);
      const hash2 = generateTransactionHash(bill2);
      expect(hash1).toBe(hash2);
    });

    it('应该为不同的交易生成不同的哈希', () => {
      const hash1 = generateTransactionHash(bill1);
      const hash3 = generateTransactionHash(bill3);
      expect(hash1).not.toBe(hash3);
    });

    it('应该忽略描述的大小写和空格', () => {
      const billA: ParsedBill = {
        ...bill1,
        description: '  美团外卖  ',
      };
      const billB: ParsedBill = {
        ...bill1,
        description: '美团外卖',
      };
      expect(generateTransactionHash(billA)).toBe(generateTransactionHash(billB));
    });

    it('应该对金额保留两位小数', () => {
      const billA: ParsedBill = {
        ...bill1,
        amount: 50.5,
      };
      const billB: ParsedBill = {
        ...bill1,
        amount: 50.50,
      };
      expect(generateTransactionHash(billA)).toBe(generateTransactionHash(billB));
    });
  });

  describe('deduplicateBills', () => {
    it('应该正确识别重复记录', () => {
      const newBills = [bill1, bill2, bill3];
      const existingBills = [bill1];

      const result = deduplicateBills(newBills, existingBills);

      // bill1 和 bill2 都与 existingBills 中的 bill1 重复
      // 只有 bill3 是唯一的
      expect(result.uniqueCount).toBe(1); // bill3
      expect(result.duplicateCount).toBe(2); // bill1 和 bill2
      expect(result.unique).toHaveLength(1);
      expect(result.duplicates).toHaveLength(2);
    });

    it('应该处理没有重复的情况', () => {
      const newBills = [bill3];
      const existingBills = [bill1];

      const result = deduplicateBills(newBills, existingBills);

      expect(result.uniqueCount).toBe(1);
      expect(result.duplicateCount).toBe(0);
    });

    it('应该处理所有记录都重复的情况', () => {
      const newBills = [bill1, bill2];
      const existingBills = [bill1, bill2];

      const result = deduplicateBills(newBills, existingBills);

      expect(result.uniqueCount).toBe(0);
      expect(result.duplicateCount).toBe(2);
    });

    it('应该处理空的历史记录', () => {
      const newBills = [bill1, bill2, bill3];
      const existingBills: ParsedBill[] = [];

      const result = deduplicateBills(newBills, existingBills);

      expect(result.uniqueCount).toBe(2); // bill1 和 bill3（bill2 与 bill1 重复）
      expect(result.duplicateCount).toBe(1);
    });
  });

  describe('removeDuplicatesWithinBatch', () => {
    it('应该移除同一批次内的重复记录', () => {
      const bills = [bill1, bill2, bill3];
      const unique = removeDuplicatesWithinBatch(bills);

      expect(unique).toHaveLength(2);
      expect(unique[0]).toBe(bill1);
      expect(unique[1]).toBe(bill3);
    });

    it('应该保留所有唯一记录', () => {
      const bills = [bill1, bill3];
      const unique = removeDuplicatesWithinBatch(bills);

      expect(unique).toHaveLength(2);
    });

    it('应该处理空数组', () => {
      const bills: ParsedBill[] = [];
      const unique = removeDuplicatesWithinBatch(bills);

      expect(unique).toHaveLength(0);
    });
  });

  describe('findDuplicateGroups', () => {
    it('应该找到重复记录的分组', () => {
      const bills = [bill1, bill2, bill3];
      const groups = findDuplicateGroups(bills);

      expect(groups.size).toBe(1);
      const duplicateGroup = Array.from(groups.values())[0];
      expect(duplicateGroup).toHaveLength(2);
    });

    it('应该返回空 Map 如果没有重复', () => {
      const bills = [bill1, bill3];
      const groups = findDuplicateGroups(bills);

      expect(groups.size).toBe(0);
    });
  });

  describe('formatDeduplicationStats', () => {
    it('应该格式化无重复的统计信息', () => {
      const result = {
        unique: [bill1],
        duplicates: [],
        uniqueCount: 1,
        duplicateCount: 0,
      };

      const stats = formatDeduplicationStats(result);
      expect(stats).toContain('未发现重复记录');
    });

    it('应该格式化有重复的统计信息', () => {
      const result = {
        unique: [bill3],
        duplicates: [bill1],
        uniqueCount: 1,
        duplicateCount: 1,
      };

      const stats = formatDeduplicationStats(result);
      expect(stats).toContain('发现 1 条重复记录');
      expect(stats).toContain('保留 1 条唯一记录');
    });
  });

  describe('generateDeduplicationReport', () => {
    it('应该生成详细的去重报告', () => {
      const result = {
        unique: [bill3],
        duplicates: [bill1, bill2],
        uniqueCount: 1,
        duplicateCount: 2,
      };

      const report = generateDeduplicationReport(result);

      expect(report.totalNew).toBe(3);
      expect(report.uniqueNew).toBe(1);
      expect(report.duplicateNew).toBe(2);
      expect(report.duplicateRate).toBeCloseTo(66.67, 1);
      expect(report.duplicateExamples).toHaveLength(2);
    });

    it('应该限制重复示例数量为5条', () => {
      const duplicates = Array(10).fill(bill1);
      const result = {
        unique: [],
        duplicates,
        uniqueCount: 0,
        duplicateCount: 10,
      };

      const report = generateDeduplicationReport(result);
      expect(report.duplicateExamples).toHaveLength(5);
    });

    it('应该处理没有重复的情况', () => {
      const result = {
        unique: [bill1, bill3],
        duplicates: [],
        uniqueCount: 2,
        duplicateCount: 0,
      };

      const report = generateDeduplicationReport(result);

      expect(report.duplicateRate).toBe(0);
      expect(report.duplicateExamples).toHaveLength(0);
    });
  });
});

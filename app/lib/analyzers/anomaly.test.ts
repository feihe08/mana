import { describe, it, expect } from 'vitest';
import {
  detectAnomalousBills,
  detectBudgetOverruns,
  calculateCategoryStats,
  type Anomaly,
  type BillStats,
} from './anomaly';

describe('异常检测器', () => {
  describe('calculateCategoryStats', () => {
    it('应该正确计算类别统计数据', () => {
      const bills = [
        { category: '餐饮', amount: 50 },
        { category: '餐饮', amount: 60 },
        { category: '餐饮', amount: 70 },
        { category: '交通', amount: 10 },
        { category: '交通', amount: 20 },
      ];

      const stats = calculateCategoryStats(bills);

      expect(stats.size).toBe(2);

      const foodStats = stats.get('餐饮');
      expect(foodStats).toBeDefined();
      expect(foodStats?.average).toBe(60);
      expect(foodStats?.max).toBe(70);
      expect(foodStats?.count).toBe(3);

      const transportStats = stats.get('交通');
      expect(transportStats).toBeDefined();
      expect(transportStats?.average).toBe(15);
      expect(transportStats?.max).toBe(20);
      expect(transportStats?.count).toBe(2);
    });

    it('应该处理空账单数组', () => {
      const stats = calculateCategoryStats([]);
      expect(stats.size).toBe(0);
    });

    it('应该处理未分类的账单', () => {
      const bills = [
        { category: '', amount: 50 },
        { category: undefined, amount: 60 },
        { category: null, amount: 70 },
      ];

      const stats = calculateCategoryStats(bills);
      const uncategorizedStats = stats.get('未分类');

      expect(uncategorizedStats).toBeDefined();
      expect(uncategorizedStats?.count).toBe(3);
      expect(uncategorizedStats?.average).toBeCloseTo(60);
    });
  });

  describe('detectAnomalousBills', () => {
    it('应该检测出高额支出异常', () => {
      const bills = [
        { id: '1', amount: 50, category: '餐饮' },
        { id: '2', amount: 60, category: '餐饮' },
        { id: '3', amount: 70, category: '餐饮' },
        { id: '4', amount: 110, category: '餐饮' }, // 异常支出 (超过最大值70的1.5倍)
      ];

      const stats = calculateCategoryStats(bills);
      const anomalies = detectAnomalousBills(bills, stats);

      expect(anomalies.length).toBe(1);
      expect(anomalies[0].billId).toBe('4');
      expect(anomalies[0].severity).toBe('high');
      expect(anomalies[0].reason).toContain('远超该类别平均值');
    });

    it('应该跳过样本太少的类别', () => {
      const bills = [
        { id: '1', amount: 50, category: '餐饮' },
        { id: '2', amount: 200, category: '餐饮' }, // 虽然金额高，但样本数不足
      ];

      const stats = calculateCategoryStats(bills);
      const anomalies = detectAnomalousBills(bills, stats);

      expect(anomalies.length).toBe(0);
    });

    it('应该处理空账单数组', () => {
      const anomalies = detectAnomalousBills([], new Map());
      expect(anomalies.length).toBe(0);
    });
  });

  describe('detectBudgetOverruns', () => {
    it('应该检测出预算超支', () => {
      const categorySpending = new Map([
        ['餐饮', 1500],
        ['交通', 800],
        ['购物', 2000],
      ]);

      const budgets = new Map([
        ['餐饮', 1000],
        ['交通', 1000],
        ['购物', 1500],
      ]);

      const anomalies = detectBudgetOverruns(categorySpending, budgets);

      expect(anomalies.length).toBe(2);
      expect(anomalies.some(a => a.billId === '餐饮')).toBe(true);
      expect(anomalies.some(a => a.billId === '购物')).toBe(true);
    });

    it('应该忽略没有设置预算的类别', () => {
      const categorySpending = new Map([
        ['餐饮', 1500],
        ['交通', 800],
      ]);

      const budgets = new Map([
        ['餐饮', 1000],
      ]);

      const anomalies = detectBudgetOverruns(categorySpending, budgets);

      expect(anomalies.length).toBe(1);
      expect(anomalies[0].billId).toBe('餐饮');
    });

    it('应该处理空的支出和预算', () => {
      const anomalies1 = detectBudgetOverruns(new Map(), new Map());
      expect(anomalies1.length).toBe(0);

      const anomalies2 = detectBudgetOverruns(new Map([['餐饮', 500]]), new Map());
      expect(anomalies2.length).toBe(0);
    });
  });
});

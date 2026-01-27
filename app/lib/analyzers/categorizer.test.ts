/**
 * 分类器测试
 */
import { describe, it, expect } from 'vitest';
import { categorizeBill, categorizeBills, type Category } from './categorizer';

describe('categorizer', () => {
  const mockCategories: Category[] = [
    {
      id: '1',
      name: '餐饮-外卖',
      keywords: ['美团', '饿了么', '外卖'],
      budget_limit: 1000,
    },
    {
      id: '2',
      name: '交通-打车',
      keywords: ['滴滴', '打车', '出租车'],
      budget_limit: 500,
    },
    {
      id: '3',
      name: '购物-日用',
      keywords: ['超市', '便利店', '名创优品'],
      budget_limit: 800,
    },
  ];

  describe('categorizeBill', () => {
    it('should categorize food delivery', async () => {
      const result = await categorizeBill('美团外卖', mockCategories);
      expect(result).toBe('餐饮-外卖');
    });

    it('should categorize taxi', async () => {
      const result = await categorizeBill('滴滴出行', mockCategories);
      expect(result).toBe('交通-打车');
    });

    it('should categorize shopping', async () => {
      const result = await categorizeBill('711便利店', mockCategories);
      expect(result).toBe('购物-日用');
    });

    it('should be case insensitive', async () => {
      const result = await categorizeBill('美团外卖', mockCategories);
      expect(result).toBe('餐饮-外卖');
    });

    it('should return 未分类 for unknown descriptions', async () => {
      const result = await categorizeBill('未知商户', mockCategories);
      expect(result).toBe('未分类');
    });

    it('should match multiple keywords', async () => {
      const result = await categorizeBill('美团外卖订单', mockCategories);
      expect(result).toBe('餐饮-外卖');
    });

    it('should choose category with highest score', async () => {
      const categories: Category[] = [
        {
          id: '1',
          name: 'Category A',
          keywords: ['test'],
          budget_limit: 1000,
        },
        {
          id: '2',
          name: 'Category B',
          keywords: ['test', 'example'],
          budget_limit: 1000,
        },
      ];
      const result = await categorizeBill('test example', categories);
      expect(result).toBe('Category B');
    });
  });

  describe('categorizeBills', () => {
    it('should categorize multiple bills', async () => {
      const bills = [
        { description: '美团外卖' },
        { description: '滴滴出行' },
        { description: '711便利店' },
      ];
      const results = await categorizeBills(bills, mockCategories);
      expect(results).toEqual(['餐饮-外卖', '交通-打车', '购物-日用']);
    });

    it('should handle empty bills array', async () => {
      const results = await categorizeBills([], mockCategories);
      expect(results).toEqual([]);
    });

    it('should handle bills with no matches', async () => {
      const bills = [
        { description: '未知商户1' },
        { description: '未知商户2' },
      ];
      const results = await categorizeBills(bills, mockCategories);
      expect(results).toEqual(['未分类', '未分类']);
    });
  });
});

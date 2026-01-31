import { describe, it, expect } from 'vitest';
import { BeancountGenerator, generateBeancount, billToTransaction } from './generator';
import type { ParsedBill } from '../parsers/csv';

describe('Beancount 生成器', () => {
  const mockBills: ParsedBill[] = [
    {
      id: '1',
      amount: -50.5,
      description: '美团外卖-北京朝阳店',
      transactionDate: '2024-01-01T12:00:00Z',
      originalData: {},
    },
    {
      id: '2',
      amount: -15.8,
      description: '滴滴出行',
      transactionDate: '2024-01-02T08:30:00Z',
      originalData: {},
    },
    {
      id: '3',
      amount: 1000,
      description: '工资',
      transactionDate: '2024-01-03T09:00:00Z',
      originalData: {},
    },
  ];

  describe('BeancountGenerator 类', () => {
    it('应该创建实例', () => {
      const generator = new BeancountGenerator();
      expect(generator).toBeInstanceOf(BeancountGenerator);
    });

    it('应该生成包含文件头的 Beancount 文本', () => {
      const generator = new BeancountGenerator({
        header: {
          title: '测试账单',
          author: '测试用户',
          description: '这是一个测试账单',
        },
      });

      const result = generator.generateFromBills(mockBills.slice(0, 1));

      expect(result).toContain('Title: 测试账单');
      expect(result).toContain('Author: 测试用户');
      expect(result).toContain('Description: 这是一个测试账单');
    });

    it('应该生成包含 Open 指令的 Beancount 文本', () => {
      const generator = new BeancountGenerator({
        includeOpenDirectives: true,
      });

      const result = generator.generateFromBills(mockBills.slice(0, 1));

      expect(result).toContain('open Expenses:Food:Delivery');
      expect(result).toContain('open Liabilities:CreditCard:Generic');
    });
  });

  describe('generateBeancount 函数', () => {
    it('应该生成有效的 Beancount 文本', () => {
      const result = generateBeancount(mockBills);

      expect(typeof result).toBe('string');
      expect(result).not.toBe('');
      expect(result).toContain('2024-01-01');
      expect(result).toContain('美团外卖');
      expect(result).toContain('50.50 CNY');
    });

    it('应该生成包含收入和支出的交易', () => {
      const result = generateBeancount(mockBills);

      // 支出交易
      expect(result).toContain('Expenses:Food:Delivery');

      // 收入交易
      expect(result).toContain('Income:Refunds');
    });
  });

  describe('billToTransaction 函数', () => {
    it('应该将账单转换为交易', () => {
      const transaction = billToTransaction(mockBills[0]);

      expect(transaction).toHaveProperty('date');
      expect(transaction).toHaveProperty('payee');
      expect(transaction).toHaveProperty('narration');
      expect(transaction).toHaveProperty('postings');
      expect(transaction.postings.length).toBe(2);
    });

    it('应该正确解析包含分隔符的描述', () => {
      const transaction = billToTransaction(mockBills[0]);

      expect(transaction.payee).toBe('美团外卖');
      expect(transaction.narration).toBe('北京朝阳店');
    });

    it('应该正确处理没有分隔符的描述', () => {
      const bill: ParsedBill = {
        ...mockBills[1],
        description: '滴滴出行',
      };

      const transaction = billToTransaction(bill);

      expect(transaction.payee).toBeUndefined();
      expect(transaction.narration).toBe('滴滴出行');
    });
  });

  describe('交易格式化', () => {
    it('应该正确格式化支出交易', () => {
      const result = generateBeancount([mockBills[0]]);

      expect(result).toContain('Expenses:Food:Delivery');
      expect(result).toContain('50.50 CNY');
      expect(result).toContain('Assets:Cash');
      expect(result).toContain('-50.50 CNY');
    });

    it('应该正确格式化收入交易', () => {
      const result = generateBeancount([mockBills[2]]);

      expect(result).toContain('Income:Refunds');
      expect(result).toContain('-1000.00 CNY');
      expect(result).toContain('Assets:Cash');
      expect(result).toContain('1000.00 CNY');
    });
  });
});

import { describe, it, expect, vi } from 'vitest';
import { parseAlipayCSV } from './alipay';

describe('支付宝解析器', () => {
  const createMockFile = (name: string, content: string): File => {
    // 为了测试方便，直接使用 UTF-8 编码
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
    return new File([blob], name, { type: 'text/csv' });
  };

  const mockAlipayCSV = `交易时间,交易分类,交易对方,对方账号,商品说明,收/支,金额,收/付款方式,交易状态,交易订单号,商户订单号,资金状态
2024-01-01 12:00:00,餐饮美食,美团外卖,123456789,外卖订单,支出,50.5,支付宝余额,交易成功,1234567890,9876543210,已到账
2024-01-02 08:30:00,交通出行,滴滴出行,987654321,打车费用,支出,15.8,花呗,交易成功,0987654321,1357924680,已到账
2024-01-03 18:00:00,购物,淘宝商城,112233445,衣服,收入,200,银行卡,交易成功,2468135790,3692581470,已到账
`;

  it('应该解析有效的支付宝 CSV 文件', async () => {
    const file = createMockFile('alipay.csv', mockAlipayCSV);
    const bills = await parseAlipayCSV(file);

    expect(bills.length).toBe(2); // 只解析支出
    expect(bills[0].amount).toBe(-50.5);
    expect(bills[0].description).toBe('外卖订单');
    expect(bills[0].originalData.source).toBe('alipay');
  });

  it('应该正确解析金额和日期', async () => {
    const file = createMockFile('alipay.csv', mockAlipayCSV);
    const bills = await parseAlipayCSV(file);

    expect(bills[0].amount).toBe(-50.5);
    expect(bills[0].transactionDate).toBeDefined();
    expect(new Date(bills[0].transactionDate).getFullYear()).toBe(2024);
  });

  it('应该只解析成功的交易', async () => {
    const invalidCSV = `交易时间,交易分类,交易对方,对方账号,商品说明,收/支,金额,收/付款方式,交易状态
2024-01-01 12:00:00,餐饮美食,美团外卖,123456789,外卖订单,支出,50.5,支付宝余额,交易失败
`;

    const file = createMockFile('alipay_invalid.csv', invalidCSV);
    const bills = await parseAlipayCSV(file);

    expect(bills.length).toBe(0);
  });

  it('应该只解析支出交易', async () => {
    const file = createMockFile('alipay.csv', mockAlipayCSV);
    const bills = await parseAlipayCSV(file);

    const hasIncome = bills.some(bill => bill.amount > 0);
    expect(hasIncome).toBe(false);
  });

  it('应该抛出未找到表头的错误', async () => {
    const invalidCSV = `无效的文件内容
这不是支付宝账单
`;

    const file = createMockFile('invalid.csv', invalidCSV);

    await expect(parseAlipayCSV(file)).rejects.toThrow('未找到表头行');
  });
});

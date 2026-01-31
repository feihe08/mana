import { describe, it, expect } from 'vitest';
import { parseWeChatCSV } from './wechat';

describe('微信解析器', () => {
  const createMockFile = (name: string, content: string): File => {
    const blob = new Blob([content], { type: 'text/csv' });
    return new File([blob], name, { type: 'text/csv' });
  };

  const mockWeChatCSV = `微信支付账单明细,,,,,,,
,\"下载时间：2024年1月1日 12:00:00\",,,,,,,
,,,,,,,
交易时间,交易类型,交易对方,商品说明,收/支,金额(元),支付方式,当前状态,交易单号,商户单号
2024-01-01 12:00:00,商户消费,美团外卖,外卖订单,支出,¥50.50,零钱,支付成功,1234567890,9876543210
2024-01-02 08:30:00,商户消费,滴滴出行,打车费用,支出,¥15.80,银行卡,支付成功,0987654321,1357924680
2024-01-03 18:00:00,转账,朋友转账,转账,收入,¥200.00,零钱,已存入零钱,2468135790,3692581470
`;

  it('应该解析有效的微信 CSV 文件', async () => {
    const file = createMockFile('wechat.csv', mockWeChatCSV);
    const bills = await parseWeChatCSV(file);

    expect(bills.length).toBe(2); // 只解析支出
    expect(bills[0].amount).toBe(-50.5);
    expect(bills[0].description).toBe('外卖订单');
    expect(bills[0].originalData.source).toBe('wechat');
  });

  it('应该正确解析金额和日期', async () => {
    const file = createMockFile('wechat.csv', mockWeChatCSV);
    const bills = await parseWeChatCSV(file);

    expect(bills[0].amount).toBe(-50.5);
    expect(bills[0].transactionDate).toBeDefined();
    expect(new Date(bills[0].transactionDate).getFullYear()).toBe(2024);
  });

  it('应该只解析支出交易', async () => {
    const file = createMockFile('wechat.csv', mockWeChatCSV);
    const bills = await parseWeChatCSV(file);

    const hasIncome = bills.some(bill => bill.amount > 0);
    expect(hasIncome).toBe(false);
  });

  it('应该正确处理金额中的符号和格式', async () => {
    const file = createMockFile('wechat.csv', mockWeChatCSV);
    const bills = await parseWeChatCSV(file);

    expect(bills[0].amount).toBe(-50.5);
    expect(bills[1].amount).toBe(-15.8);
  });
});

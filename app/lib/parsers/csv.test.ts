import { describe, it, expect } from 'vitest';
import { parseCSV } from './csv';

describe('通用 CSV 解析器', () => {
  const createMockFile = (name: string, content: string): File => {
    const blob = new Blob([content], { type: 'text/csv' });
    return new File([blob], name, { type: 'text/csv' });
  };

  const simpleCSV = `日期,金额,说明,分类,方向
2024-01-01,50.5,外卖订单,餐饮,支出
2024-01-02,15.8,打车费用,交通,支出
2024-01-03,200,转账收入,转账,收入
`;

  it('应该解析基本的 CSV 文件', async () => {
    const file = createMockFile('simple.csv', simpleCSV);
    const bills = await parseCSV(file);

    expect(bills.length).toBe(2); // 只解析支出
    expect(bills[0].amount).toBe(50.5);
    expect(bills[0].description).toBe('外卖订单');
  });

  it('应该自动检测表头', async () => {
    const fileWithComments = `这是一个账单文件
包含一些说明文字
日期,金额,说明,分类,方向
2024-01-01,50.5,外卖订单,餐饮,支出
`;

    const file = createMockFile('with_comments.csv', fileWithComments);
    const bills = await parseCSV(file);

    expect(bills.length).toBe(1);
    expect(bills[0].description).toBe('外卖订单');
  });

  it('应该解析没有方向字段的 CSV', async () => {
    const csvWithoutDirection = `日期,金额,说明,分类
2024-01-01,50.5,外卖订单,餐饮
2024-01-02,15.8,打车费用,交通
`;

    const file = createMockFile('without_direction.csv', csvWithoutDirection);
    const bills = await parseCSV(file);

    expect(bills.length).toBe(2);
  });

  it('应该处理不同语言的表头', async () => {
    const englishCSV = `Date,Amount,Description,Category,Direction
2024-01-01,50.5,Food Delivery,Food,Out
2024-01-02,15.8,Taxi,Transport,Out
`;

    const file = createMockFile('english.csv', englishCSV);
    const bills = await parseCSV(file);

    expect(bills.length).toBe(2);
    expect(bills[0].amount).toBe(50.5);
  });

  it('应该抛出空文件错误', async () => {
    const emptyFile = createMockFile('empty.csv', '');

    await expect(parseCSV(emptyFile)).rejects.toThrow('CSV 文件为空');
  });

  it('应该忽略无效的行', async () => {
    const csvWithInvalidLines = `日期,金额,说明,分类,方向
2024-01-01,50.5,外卖订单,餐饮,支出
无效的数据行
2024-01-02,15.8,打车费用,交通,支出
, , , ,
`;

    const file = createMockFile('with_invalid.csv', csvWithInvalidLines);
    const bills = await parseCSV(file);

    expect(bills.length).toBe(2);
  });
});

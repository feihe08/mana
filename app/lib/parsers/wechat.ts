/**
 * 微信账单解析器
 * 解析微信支付导出的 CSV 账单文件
 */

import type { ParsedBill } from './csv';

export async function parseWechatCSV(file: File): Promise<ParsedBill[]> {
  const text = await file.text();
  const lines = text.split('\n').filter(line => line.trim());

  // 微信账单格式示例：
  // 交易时间,交易类型,交易对方,商品说明,收/支,金额(元),支付方式,当前状态,交易单号,商户单号...
  // 跳过前两行（微信账单通常有标题行和空行）

  const bills: ParsedBill[] = [];
  let startIndex = 0;

  // 找到实际数据开始位置
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('交易时间')) {
      startIndex = i + 1;
      break;
    }
  }

  for (let i = startIndex; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 6) continue;

    const [
      time,
      type,
      counterparty,
      description,
      direction,
      amount,
      paymentMethod,
      status,
    ] = cols;

    // 只处理支出
    if (direction !== '支出') {
      continue;
    }

    const bill: ParsedBill = {
      id: `wechat-${Date.now()}-${i}`,
      amount: Math.abs(parseFloat(amount || '0')),
      description: description || counterparty || type || '',
      transactionDate: parseWechatDate(time || ''),
      originalData: {
        source: 'wechat',
        time,
        type,
        counterparty,
        description,
        direction,
        amount,
        paymentMethod,
        status,
      },
    };

    if (!isNaN(bill.amount)) {
      bills.push(bill);
    }
  }

  return bills;
}

// 解析微信日期格式：2024-01-01 12:00:00
function parseWechatDate(dateStr: string): string {
  try {
    // 微信日期可能包含中文
    const normalized = dateStr.replace(/[年月]/g, '-').replace(/日/g, '');
    const date = new Date(normalized);
    return date.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

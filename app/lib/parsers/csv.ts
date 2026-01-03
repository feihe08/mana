/**
 * CSV 解析器
 * 用于解析通用的 CSV 格式账单
 */

export interface ParsedBill {
  id: string;
  amount: number;
  description: string;
  transactionDate: string;
  originalData: Record<string, any>;
}

export async function parseCSV(file: File): Promise<ParsedBill[]> {
  const text = await file.text();
  const lines = text.split('\n').filter(line => line.trim());

  if (lines.length < 2) {
    throw new Error('CSV 文件为空或格式不正确');
  }

  // 解析标题行
  const headers = lines[0].split(',').map(h => h.trim());

  // 解析数据行
  const bills: ParsedBill[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);

    if (values.length === 0) continue;

    const row: Record<string, any> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    // 尝试识别关键字段
    const bill: ParsedBill = {
      id: `bill-${Date.now()}-${i}`,
      amount: parseFloat(row['金额'] || row['amount'] || '0'),
      description: row['说明'] || row['description'] || row['商品说明'] || '',
      transactionDate: row['时间'] || row['date'] || row['交易时间'] || new Date().toISOString(),
      originalData: row,
    };

    if (!isNaN(bill.amount)) {
      bills.push(bill);
    }
  }

  return bills;
}

// 处理带引号的 CSV 行
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

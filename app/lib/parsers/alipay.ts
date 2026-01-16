/**
 * 支付宝账单解析器
 * 解析支付宝导出的 CSV/Excel 账单文件
 */

import * as XLSX from "xlsx";
import type { ParsedBill } from './csv';

/**
 * 读取文件为文本（支持 CSV 和 Excel）
 */
async function readFileAsText(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();

  // 如果是 Excel 文件，先转换为 CSV
  if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // 将 Excel 转换为 CSV 格式的字符串
    return XLSX.utils.sheet_to_csv(worksheet);
  }

  // CSV 文件直接读取
  return await file.text();
}

export async function parseAlipayCSV(file: File): Promise<ParsedBill[]> {
  const text = await readFileAsText(file);
  const lines = text.split('\n').filter(line => line.trim());

  // 支付宝账单格式：
  // 付款时间,商品说明,收/付款,对方户名,金额,交易状态,资金流向...
  // 跳过标题行和可能的空行
  const bills: ParsedBill[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 4) continue;

    const [
      time,
      description,
      type,
      counterparty,
      amount,
      status,
      flow
    ] = cols;

    // 只处理已成功的交易
    if (status && status.includes('成功') === false) continue;

    // 只处理支出
    if (flow && flow.includes('支出') === false && type && type.includes('付款') === false) {
      continue;
    }

    const bill: ParsedBill = {
      id: `alipay-${Date.now()}-${i}`,
      amount: Math.abs(parseFloat(amount || '0')),
      description: description || counterparty || '',
      transactionDate: parseAlipayDate(time || ''),
      originalData: {
        source: 'alipay',
        time,
        description,
        type,
        counterparty,
        amount,
        status,
      },
    };

    if (!isNaN(bill.amount)) {
      bills.push(bill);
    }
  }

  return bills;
}

// 解析支付宝日期格式：2024-01-01 12:00:00
function parseAlipayDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
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

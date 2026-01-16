/**
 * 微信账单解析器
 * 解析微信支付导出的 CSV/Excel 账单文件
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

export async function parseWechatCSV(file: File): Promise<ParsedBill[]> {
  const text = await readFileAsText(file);
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

    // 解析金额：去掉 ¥ 符号和逗号
    const amountValue = parseFloat((amount || '0').replace(/[¥,]/g, ''));

    const bill: ParsedBill = {
      id: `wechat-${Date.now()}-${i}`,
      amount: Math.abs(amountValue),
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

    if (!isNaN(bill.amount) && bill.amount > 0) {
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

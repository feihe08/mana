/**
 * CSV 解析器
 * 用于解析通用的 CSV/Excel 格式账单
 */

import * as XLSX from "xlsx";

import type { PaymentMethodInfo } from "./payment-method-parser";

export interface ParsedBill {
  id: string;
  amount: number;
  description: string;
  transactionDate: string;
  originalData: Record<string, any>;
  /** 支付方式信息（如果可提取） */
  paymentMethodInfo?: PaymentMethodInfo;
}

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

export async function parseCSV(file: File): Promise<ParsedBill[]> {
  const text = await readFileAsText(file);
  const lines = text.split('\n').filter(line => line.trim());

  if (lines.length < 2) {
    throw new Error('CSV 文件为空或格式不正确');
  }

  // 自动查找表头行（跳过说明行）
  let headerIndex = 0;
  let headers: string[] = [];

  for (let i = 0; i < Math.min(30, lines.length); i++) {
    const values = parseCSVLine(lines[i]);
    const hasTimeField = values.some(v =>
      v.includes('时间') || v.includes('Time') || v.includes('Date') || v.includes('日期')
    );
    const hasAmountField = values.some(v =>
      v.includes('金额') || v.includes('Amount') || v.includes('价格') || v.includes('Price')
    );

    if (hasTimeField && hasAmountField && values.length >= 3) {
      headerIndex = i;
      headers = values;
      break;
    }
  }

  if (headers.length === 0) {
    // 如果没找到表头，使用第一行
    headers = lines[0].split(',').map(h => h.trim());
  }

  // 创建字段索引映射
  const getFieldIndex = (keywords: string[]): number => {
    return headers.findIndex(h => {
      const lowerH = h.toLowerCase();
      return keywords.some(k => lowerH.includes(k.toLowerCase()));
    });
  };

  const timeIndex = getFieldIndex(['时间', 'Time', 'Date', '日期', '交易时间']);
  const amountIndex = getFieldIndex(['金额', 'Amount', '价格', 'Price', '交易金额']);
  const descIndex = getFieldIndex(['说明', 'Description', '商品说明', '商品', '描述', '交易名称', '交易对方']);
  const categoryIndex = getFieldIndex(['分类', 'Category', '类型', 'Type', '交易类型']);
  const directionIndex = getFieldIndex(['方向', 'Direction', '收付款', '收支']);

  // 解析数据行
  const bills: ParsedBill[] = [];

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);

    if (values.length === 0 || values.every(v => !v.trim())) continue;

    const row: Record<string, any> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    // 过滤：只处理支出
    if (directionIndex >= 0) {
      const direction = values[directionIndex] || '';
      const isExpense = direction.includes('支') ||
                        direction.includes('出') ||
                        direction.toLowerCase().includes('out') ||
                        direction.toLowerCase() === '支出';

      if (!isExpense) continue;
    }

    // 提取金额并清理
    const amountStr = amountIndex >= 0 ? (values[amountIndex] || '0') : '0';
    const amount = parseFloat(amountStr.replace(/[¥$€£￥,，\s]/g, ''));

    if (isNaN(amount) || amount <= 0) continue;

    // 提取描述
    const description = descIndex >= 0
      ? (values[descIndex] || '未知交易')
      : (row['商品说明'] || row['商品'] || row['交易名称'] || row['交易对方'] || '未知交易');

    // 提取时间
    const timeStr = timeIndex >= 0
      ? (values[timeIndex] || new Date().toISOString())
      : new Date().toISOString();

    const bill: ParsedBill = {
      id: `bill-${Date.now()}-${i}`,
      amount,
      description,
      transactionDate: parseDate(timeStr),
      originalData: row,
    };

    bills.push(bill);
  }

  return bills;
}

// 解析日期（支持中文格式）
function parseDate(dateStr: string): string {
  try {
    let normalized = dateStr
      .replace(/[年月]/g, '-')
      .replace(/日/g, '')
      .trim();

    const date = new Date(normalized);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  } catch (e) {
    // 忽略解析错误
  }

  return new Date().toISOString();
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

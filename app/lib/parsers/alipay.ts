/**
 * 支付宝账单解析器
 * 解析支付宝导出的 CSV/Excel 账单文件
 */

import * as XLSX from "xlsx";
import type { ParsedBill } from './csv';
import { parseAlipayPaymentMethod } from './payment-method-parser';

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

  // CSV 文件 - 尝试使用 GB18030 编码，失败则使用 UTF-8
  const buffer = await file.arrayBuffer();
  try {
    const decoder = new TextDecoder('gb18030');
    const text = decoder.decode(buffer);
    // 验证是否包含预期的表头，避免误识别
    if (text.includes('交易时间') && text.includes('交易分类')) {
      return text;
    }
    // 如果不包含预期的中文表头，可能是 UTF-8 编码
    return new TextDecoder('utf-8').decode(buffer);
  } catch {
    return new TextDecoder('utf-8').decode(buffer);
  }
}

export async function parseAlipayCSV(file: File): Promise<ParsedBill[]> {
  console.log('🔵 [parseAlipayCSV] 开始解析支付宝账单:', file.name);

  const text = await readFileAsText(file);
  const lines = text.split('\n').filter(line => line.trim());

  console.log('📊 [parseAlipayCSV] 文件总行数:', lines.length);
  console.log('🔍 [parseAlipayCSV] 前5行内容:', lines.slice(0, 5));

  // 找到表头行
  let headerIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('交易时间') && lines[i].includes('交易分类') && lines[i].includes('收/支')) {
      headerIndex = i;
      break;
    }
  }

  console.log('📍 [parseAlipayCSV] 表头行索引:', headerIndex);
  if (headerIndex >= 0) {
    console.log('📋 [parseAlipayCSV] 表头内容:', lines[headerIndex]);
  }

  if (headerIndex === -1) {
    console.error('❌ [parseAlipayCSV] 未找到表头行');
    throw new Error('未找到表头行，请确认这是有效的支付宝账单文件');
  }

  // 支付宝账单格式：
  // 付款时间,商品说明,收/付款,对方户名,金额,交易状态,资金流向...
  // 跳过标题行和可能的空行
  const bills: ParsedBill[] = [];

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 9) continue; // 至少需要9列

    // 支付宝账单列（2025格式）：
    // 0:交易时间, 1:交易分类, 2:交易对方, 3:对方账号,
    // 4:商品说明, 5:收/支, 6:金额, 7:收/付款方式, 8:交易状态
    const [
      time,
      category,
      counterparty,
      counterpartyAccount,
      description,
      type,
      amount,
      paymentMethod,
      status,
      ...rest
    ] = cols;

    // 只处理已成功的交易
    if (status && status.includes('成功') === false) continue;

    // 只处理支出
    if (type && type.includes('支出') === false && type.includes('付款') === false) {
      continue;
    }

    // 解析支付方式
    const paymentMethodInfo = paymentMethod
      ? parseAlipayPaymentMethod(paymentMethod)
      : undefined;

    const bill: ParsedBill = {
      id: `alipay-${Date.now()}-${i}`,
      amount: -Math.abs(parseFloat(amount || '0')), // 支出为负数
      description: description || counterparty || '',
      transactionDate: parseAlipayDate(time || ''),
      paymentMethodInfo,
      originalData: {
        source: 'alipay',
        time,
        category,
        counterparty,
        description,
        type,
        amount,
        paymentMethod,
        status,
      },
    };

    if (!isNaN(bill.amount)) {
      bills.push(bill);
    }
  }

  console.log('✅ [parseAlipayCSV] 解析完成，共', bills.length, '条支出记录');

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

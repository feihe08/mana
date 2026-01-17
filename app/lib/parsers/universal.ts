/**
 * 通用账单解析器
 * 基于列名映射，支持不同格式和语言的账单
 */

import * as XLSX from "xlsx";
import type { ParsedBill } from './csv';

/**
 * 字段映射配置
 * 定义不同来源的字段名称映射
 */
interface FieldMapping {
  // 时间字段可能的名称
  timeFields: string[];
  // 描述字段可能的名称
  descriptionFields: string[];
  // 金额字段可能的名称
  amountFields: string[];
  // 收支方向字段可能的名称
  directionFields: string[];
  // 交易对方字段可能的名称
  counterpartyFields: string[];
}

/**
 * 微信支付字段映射（支持中英文）
 */
const WECHAT_MAPPING: FieldMapping = {
  timeFields: ["交易时间", "时间", "Time", "交易时间\t", "交易时间 "],
  descriptionFields: ["商品", "商品说明", "说明", "Description", "商品\t"],
  amountFields: ["金额(元)", "金额", "Amount", "金额(元)\t"],
  directionFields: ["收/支", "收支", "方向", "Direction", "收/支\t"],
  counterpartyFields: ["交易对方", "对方", "商户", "Merchant", "交易对方\t"],
};

/**
 * 支付宝字段映射
 */
const ALIPAY_MAPPING: FieldMapping = {
  timeFields: ["付款时间", "时间", "Time", "付款时间\t"],
  descriptionFields: ["商品说明", "说明", "商品", "Description", "商品说明\t"],
  amountFields: ["金额", "金额（元）", "Amount", "金额\t"],
  directionFields: ["收/付款", "收支", "方向", "Direction", "收/付款\t"],
  counterpartyFields: ["对方户名", "交易对方", "对方", "Merchant", "对方户名\t"],
};

/**
 * 通用 CSV 字段映射
 */
const GENERIC_MAPPING: FieldMapping = {
  timeFields: ["时间", "日期", "time", "date", "datetime", "交易时间"],
  descriptionFields: ["说明", "描述", "备注", "description", "desc", "商品"],
  amountFields: ["金额", "amount", "价格", "price"],
  directionFields: ["方向", "收支", "direction", "type", "收/支"],
  counterpartyFields: ["对方", "商户", "merchant", "counterparty", "交易对方"],
};

/**
 * 读取文件为 CSV 文本
 */
async function readFileAsCSV(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_csv(worksheet);
  }

  return await file.text();
}

/**
 * 解析 CSV 行（支持引号包裹的字段）
 */
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

/**
 * 根据映射查找列索引
 */
function findColumnIndex(headers: string[], possibleNames: string[]): number {
  const normalizedHeaders = headers.map(h => h.trim().toLowerCase());

  for (const name of possibleNames) {
    const index = normalizedHeaders.findIndex(h => h === name.trim().toLowerCase());
    if (index !== -1) return index;
  }

  return -1;
}

/**
 * 清理金额字符串
 */
function cleanAmount(amountStr: string): number {
  // 移除货币符号、逗号、空格等
  const cleaned = amountStr
    .replace(/[¥$€£￥,，\s]/g, '')
    .trim();

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : Math.abs(parsed);
}

/**
 * 通用账单解析器
 * @param file 文件
 * @param mapping 字段映射配置
 * @param options 解析选项
 */
export async function parseUniversalBill(
  file: File,
  mapping: FieldMapping,
  options: {
    includeIncome?: boolean; // 是否包含收入
    includeRefund?: boolean; // 是否包含退款
    directionFilter?: string[]; // 包含的收支方向
  } = {}
): Promise<ParsedBill[]> {
  const {
    includeIncome = false,
    includeRefund = false,
    directionFilter,
  } = options;

  const csvText = await readFileAsCSV(file);
  const lines = csvText.split('\n').filter(line => line.trim());

  if (lines.length < 2) {
    throw new Error('文件为空或格式不正确');
  }

  // 查找表头行
  let headerIndex = -1;
  let headers: string[] = [];

  for (let i = 0; i < Math.min(30, lines.length); i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length >= 4) {
      // 检查是否包含关键字段
      const hasTime = mapping.timeFields.some(f =>
        cols.some(c => c.trim().toLowerCase() === f.toLowerCase())
      );

      if (hasTime) {
        headerIndex = i;
        headers = cols;
        break;
      }
    }
  }

  if (headerIndex === -1) {
    throw new Error('未找到有效的表头，请检查文件格式');
  }

  // 建立列索引映射
  const timeIndex = findColumnIndex(headers, mapping.timeFields);
  const descIndex = findColumnIndex(headers, mapping.descriptionFields);
  const amountIndex = findColumnIndex(headers, mapping.amountFields);
  const directionIndex = findColumnIndex(headers, mapping.directionFields);
  const counterpartyIndex = findColumnIndex(headers, mapping.counterpartyFields);

  if (timeIndex === -1 || amountIndex === -1) {
    throw new Error('缺少必要字段（时间或金额）');
  }

  // 解析数据行
  const bills: ParsedBill[] = [];

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);

    if (cols.length < Math.max(timeIndex, amountIndex) + 1) {
      continue; // 跳过列数不足的行
    }

    const time = cols[timeIndex] || '';
    const description = descIndex >= 0 ? (cols[descIndex] || '') : '';
    const amountStr = amountIndex >= 0 ? (cols[amountIndex] || '0') : '0';
    const direction = directionIndex >= 0 ? (cols[directionIndex] || '') : '';
    const counterparty = counterpartyIndex >= 0 ? (cols[counterpartyIndex] || '') : '';

    // 过滤收支方向
    const shouldInclude =
      includeIncome ||
      directionFilter?.includes(direction) ||
      (!includeIncome && (direction.includes('支') || direction.includes('out') || direction.toLowerCase() === '支出'));

    if (!shouldInclude) {
      continue;
    }

    const amount = cleanAmount(amountStr);
    if (amount <= 0) {
      continue; // 跳过金额无效的记录
    }

    bills.push({
      id: `${Date.now()}-${i}`,
      amount,
      description: description || counterparty || '未知交易',
      transactionDate: parseDate(time),
      originalData: {
        time,
        description,
        direction,
        counterparty,
        amount: amountStr,
      },
    });
  }

  return bills;
}

/**
 * 解析日期（支持多种格式）
 */
function parseDate(dateStr: string): string {
  try {
    // 移除中文日期字符
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

/**
 * 微信账单解析器（使用通用解析器）
 */
export async function parseWechatUniversal(file: File, options?: { includeIncome?: boolean }): Promise<ParsedBill[]> {
  return parseUniversalBill(file, WECHAT_MAPPING, {
    includeIncome: options?.includeIncome ?? false,
    directionFilter: ['支出'], // 默认只包含支出
  });
}

/**
 * 支付宝账单解析器（使用通用解析器）
 */
export async function parseAlipayUniversal(file: File, options?: { includeIncome?: boolean }): Promise<ParsedBill[]> {
  return parseUniversalBill(file, ALIPAY_MAPPING, {
    includeIncome: options?.includeIncome ?? false,
    directionFilter: ['付款', '支出'], // 默认只包含支出
  });
}

/**
 * 通用 CSV 账单解析器
 */
export async function parseGenericCSV(file: File): Promise<ParsedBill[]> {
  return parseUniversalBill(file, GENERIC_MAPPING, {
    includeIncome: false,
  });
}

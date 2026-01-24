/**
 * 智能账单解析器
 * 整合 AI 列识别和缓存的通用解析器
 */

import * as XLSX from "xlsx";
import { recognizeColumns } from "../api/column-recognizer-client";
import { ColumnMappingCache } from "../cache/column-mapping-cache";
import type { ColumnMapping } from "../api/column-recognizer-client";
import type { ParsedBill } from "./csv";

export interface SmartParserOptions {
  forceReidentify?: boolean;
  onRecognizing?: (isRecognizing: boolean) => void;
}

/**
 * 使用 AI 智能识别列并解析账单
 * @param file 账单文件（CSV 或 Excel）
 * @param source 账单来源（wechat, alipay, csv, bank）
 * @param options 解析选项
 * @returns 解析后的账单数组
 */
export async function parseBillWithAI(
  file: File,
  source: string,
  options: SmartParserOptions = {}
): Promise<ParsedBill[]> {
  // const cache = new ColumnMappingCache();

  // 1. 读取文件，提取表头
  const { headers, csvText } = await extractHeaders(file);

  // 2. 检查缓存（开发阶段禁用缓存，便于调试）
  // let mapping = options.forceReidentify
  //   ? null
  //   : cache.get(source, headers);

  // 3. 直接调用 AI API（不使用缓存）
  options.onRecognizing?.(true);

  try {
    const result = await recognizeColumns(headers, source);
    const mapping = result.mapping;

    // 4. 缓存映射（开发阶段禁用）
    // cache.set(source, headers, mapping, result.confidence);

    // 5. 使用映射解析数据
    return parseCSVWithMapping(csvText, mapping);
  } catch (error) {
    // AI API 调用失败，抛出错误让调用者降级到传统解析器
    console.warn('AI 解析失败，将降级到传统解析器:', error);
    throw error;
  } finally {
    options.onRecognizing?.(false);
  }
}

/**
 * 提取文件表头
 */
async function extractHeaders(file: File): Promise<{ headers: string[]; csvText: string }> {
  const fileName = file.name.toLowerCase();

  // Excel 文件
  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const csvText = XLSX.utils.sheet_to_csv(worksheet);
    const lines = csvText.split('\n').filter(line => line.trim());

    // 找到表头行（包含"交易时间"且有足够的非空列）
    for (let i = 0; i < Math.min(30, lines.length); i++) {
      const cols = parseCSVLine(lines[i]);
      const hasTimeKeyword = lines[i].includes('交易时间') || lines[i].includes('时间') || lines[i].includes('Time');
      const nonEmptyCols = cols.filter(col => col.trim().length > 0).length;
      const hasEnoughCols = nonEmptyCols >= 5; // 至少有5个非空列

      if (hasTimeKeyword && hasEnoughCols) {
        return {
          headers: cols,
          csvText,
        };
      }
    }

    throw new Error('未找到表头行');
  }

  // CSV 文件 - 使用 GB18030 编码（中文 CSV 文件常用编码）
  const buffer = await file.arrayBuffer();
  const decoder = new TextDecoder('gb18030');
  const csvText = decoder.decode(buffer);
  const lines = csvText.split('\n').filter(line => line.trim());

  // 对 CSV 也使用相同的逻辑（跳过说明行）
  for (let i = 0; i < Math.min(30, lines.length); i++) {
    const cols = parseCSVLine(lines[i]);
    const hasTimeKeyword = lines[i].includes('交易时间') || lines[i].includes('时间') || lines[i].includes('Time');
    const nonEmptyCols = cols.filter(col => col.trim().length > 0).length;
    const hasEnoughCols = nonEmptyCols >= 5; // 至少有5个非空列

    if (hasTimeKeyword && hasEnoughCols) {
      return {
        headers: cols,
        csvText,
      };
    }
  }

  throw new Error('未找到表头行');
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
 * 使用列映射解析 CSV 数据
 */
function parseCSVWithMapping(csvText: string, mapping: ColumnMapping): ParsedBill[] {
  console.log('🔍 [parseCSVWithMapping] AI 识别的列映射:', mapping);

  const lines = csvText.split('\n').filter(line => line.trim());
  const bills: ParsedBill[] = [];

  // 找到数据行开始的索引（跳过表头）
  let dataStartIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length > 1) {
      // 如果这一行包含实际数据（不只是表头），从这里开始
      // 简单的判断：第一行有数据的话就是表头，从下一行开始
      dataStartIndex = i + 1;
      break;
    }
  }

  console.log(`📊 [parseCSVWithMapping] 找到 ${lines.length} 行，数据从第 ${dataStartIndex} 行开始`);

  // 解析数据行
  for (let i = dataStartIndex; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);

    if (cols.length < Math.max(mapping.time, mapping.amount) + 1) {
      continue; // 跳过列数不足的行
    }

    const time = cols[mapping.time] || '';
    const description = mapping.description >= 0 ? (cols[mapping.description] || '') : '';
    const amountStr = cols[mapping.amount] || '0';
    const direction = mapping.direction !== undefined && mapping.direction >= 0 ? (cols[mapping.direction] || '') : '';
    const counterparty = mapping.counterparty !== undefined && mapping.counterparty >= 0 ? (cols[mapping.counterparty] || '') : '';

    // 清理金额（移除货币符号和逗号）
    const amount = parseFloat(amountStr.replace(/[¥$€£￥,，\s]/g, ''));
    if (isNaN(amount) || amount === 0) {
      continue; // 跳过无效金额（允许正数和负数）
    }

    // 过滤：只处理支出（如果有方向列）
    if (mapping.direction !== undefined && mapping.direction >= 0) {
      const isExpense = direction.includes('支') ||
                        direction.includes('出') ||
                        direction.toLowerCase().includes('out') ||
                        direction.toLowerCase() === '支出';

      if (!isExpense) {
        continue;
      }
    }

    // 支出转为负数
    const finalAmount = -Math.abs(amount);

    bills.push({
      id: `bill-${Date.now()}-${i}`,
      amount: finalAmount,
      description: description || counterparty || '未知交易',
      transactionDate: parseDate(time),
      originalData: {
        source: 'ai-parsed',
        time,
        description,
        direction,
        counterparty,
        amount: amountStr,
      },
    });
  }

  console.log(`✅ [parseCSVWithMapping] 解析完成，共 ${bills.length} 条记录`);

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

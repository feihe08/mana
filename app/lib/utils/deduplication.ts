/**
 * 账单去重工具
 * 用于检测和移除重复的交易记录
 */

import type { ParsedBill } from '../parsers/csv';

/**
 * 生成交易记录的唯一标识
 * 基于日期、金额和描述生成哈希
 */
export function generateTransactionHash(bill: ParsedBill): string {
  const date = bill.transactionDate;
  const amount = bill.amount.toFixed(2); // 保留两位小数
  const description = bill.description.trim().toLowerCase();

  // 组合关键字段生成唯一标识
  return `${date}|${amount}|${description}`;
}

/**
 * 去重结果
 */
export interface DeduplicationResult {
  unique: ParsedBill[];        // 唯一的记录
  duplicates: ParsedBill[];    // 重复的记录
  duplicateCount: number;      // 重复记录数量
  uniqueCount: number;         // 唯一记录数量
}

/**
 * 对账单进行去重
 * @param newBills 新上传的账单
 * @param existingBills 历史账单
 * @returns 去重结果
 */
export function deduplicateBills(
  newBills: ParsedBill[],
  existingBills: ParsedBill[]
): DeduplicationResult {
  // 1. 构建历史记录的哈希集合
  const existingHashes = new Set<string>();
  existingBills.forEach((bill) => {
    const hash = generateTransactionHash(bill);
    existingHashes.add(hash);
  });

  // 2. 分类新账单
  const unique: ParsedBill[] = [];
  const duplicates: ParsedBill[] = [];

  newBills.forEach((bill) => {
    const hash = generateTransactionHash(bill);
    if (existingHashes.has(hash)) {
      // 重复记录
      duplicates.push(bill);
    } else {
      // 唯一记录
      unique.push(bill);
      // 添加到哈希集合，避免同一批次内的重复
      existingHashes.add(hash);
    }
  });

  return {
    unique,
    duplicates,
    duplicateCount: duplicates.length,
    uniqueCount: unique.length,
  };
}

/**
 * 检测同一批次内的重复记录
 * @param bills 账单列表
 * @returns 去重后的账单列表
 */
export function removeDuplicatesWithinBatch(bills: ParsedBill[]): ParsedBill[] {
  const seen = new Set<string>();
  const unique: ParsedBill[] = [];

  bills.forEach((bill) => {
    const hash = generateTransactionHash(bill);
    if (!seen.has(hash)) {
      seen.add(hash);
      unique.push(bill);
    }
  });

  return unique;
}

/**
 * 查找重复的交易记录
 * @param bills 账单列表
 * @returns 重复记录的分组
 */
export function findDuplicateGroups(bills: ParsedBill[]): Map<string, ParsedBill[]> {
  const groups = new Map<string, ParsedBill[]>();

  bills.forEach((bill) => {
    const hash = generateTransactionHash(bill);
    if (!groups.has(hash)) {
      groups.set(hash, []);
    }
    groups.get(hash)!.push(bill);
  });

  // 只返回有重复的组（数量 > 1）
  const duplicateGroups = new Map<string, ParsedBill[]>();
  groups.forEach((group, hash) => {
    if (group.length > 1) {
      duplicateGroups.set(hash, group);
    }
  });

  return duplicateGroups;
}

/**
 * 格式化去重统计信息
 */
export function formatDeduplicationStats(result: DeduplicationResult): string {
  const lines: string[] = [];

  if (result.duplicateCount === 0) {
    lines.push('✅ 未发现重复记录');
  } else {
    lines.push(`⚠️ 发现 ${result.duplicateCount} 条重复记录`);
    lines.push(`✅ 保留 ${result.uniqueCount} 条唯一记录`);
  }

  return lines.join('\n');
}

/**
 * 生成去重报告
 */
export interface DeduplicationReport {
  totalNew: number;           // 新上传的总记录数
  uniqueNew: number;          // 唯一的新记录数
  duplicateNew: number;       // 重复的新记录数
  duplicateRate: number;      // 重复率（百分比）
  duplicateExamples: Array<{  // 重复记录示例（最多5条）
    date: string;
    amount: number;
    description: string;
  }>;
}

/**
 * 生成详细的去重报告
 */
export function generateDeduplicationReport(
  result: DeduplicationResult
): DeduplicationReport {
  const totalNew = result.uniqueCount + result.duplicateCount;
  const duplicateRate = totalNew > 0 ? (result.duplicateCount / totalNew) * 100 : 0;

  // 提取重复记录示例（最多5条）
  const duplicateExamples = result.duplicates.slice(0, 5).map((bill) => ({
    date: bill.transactionDate,
    amount: bill.amount,
    description: bill.description,
  }));

  return {
    totalNew,
    uniqueNew: result.uniqueCount,
    duplicateNew: result.duplicateCount,
    duplicateRate: Math.round(duplicateRate * 100) / 100,
    duplicateExamples,
  };
}

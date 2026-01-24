/**
 * 本地存储管理
 * 使用 localStorage 保存账单历史
 */

import type { ParsedBill } from "../parsers/csv";

export interface SavedBill {
  id: string;
  name: string;
  date: string; // ISO string
  bills: Array<ParsedBill & { category: string }>;
  beancountContent: string;
  transactionCount: number;
  totalAmount: number;
}

const STORAGE_KEY = 'mana_bills_history';

/**
 * 保存账单到本地存储
 */
export function saveBills(
  name: string,
  bills: Array<ParsedBill & { category: string }>,
  beancountContent: string
): SavedBill {
  const savedBill: SavedBill = {
    id: `bill-${Date.now()}`,
    name,
    date: new Date().toISOString(),
    bills,
    beancountContent,
    transactionCount: bills.length,
    totalAmount: bills.reduce((sum, b) => sum + b.amount, 0),
  };

  const history = getBillsHistory();
  history.unshift(savedBill); // 最新的在前面

  // 只保留最近 30 条
  if (history.length > 30) {
    history.splice(30);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));

  return savedBill;
}

/**
 * 获取所有保存的账单
 */
export function getBillsHistory(): SavedBill[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];

  try {
    const parsed = JSON.parse(data);
    return parsed;
  } catch {
    return [];
  }
}

/**
 * 根据 ID 获取账单
 */
export function getBillById(id: string): SavedBill | null {
  const history = getBillsHistory();
  return history.find((b) => b.id === id) || null;
}

/**
 * 删除账单
 */
export function deleteBill(id: string): boolean {
  const history = getBillsHistory();
  const filtered = history.filter((b) => b.id !== id);

  if (filtered.length === history.length) {
    return false; // 没有找到
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

/**
 * 清空所有历史
 */
export function clearBillsHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * 获取统计信息
 */
export function getBillsStats() {
  const history = getBillsHistory();

  return {
    totalBills: history.length,
    totalTransactions: history.reduce((sum, b) => sum + b.transactionCount, 0),
    totalAmount: history.reduce((sum, b) => sum + b.totalAmount, 0),
    recentUpload: history[0]?.date || null,
  };
}

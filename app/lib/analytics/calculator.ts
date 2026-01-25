/**
 * 统计计算模块
 * 计算基础统计和分类聚合
 */

import type { ParsedBill } from '../parsers/csv';

// ========================================
// 类型定义
// ========================================

export interface Transaction extends ParsedBill {
  category: string; // 已分类的账单
}

export interface SummaryStats {
  // 基础指标
  totalExpenses: number;      // 总支出
  totalIncome: number;         // 总收入
  netSavings: number;          // 净储蓄
  transactionCount: number;    // 交易笔数
  avgDailyExpense: number;     // 日均支出
  maxExpense: number;          // 最大单笔支出
  maxExpenseDescription: string; // 最大支出描述

  // 对比指标（vs 上月）
  expensesVsLastMonth: number; // 百分比
  incomeVsLastMonth: number;   // 百分比
  savingsVsLastMonth: number;  // 百分比
}

export interface CategoryStats {
  category: string;
  amount: number;
  count: number;
  percentage: number; // 占总支出的百分比
}

export interface DateRange {
  start: string; // ISO date string
  end: string;   // ISO date string
}

// ========================================
// 辅助函数
// ========================================

/**
 * 判断交易是否为支出
 */
function isExpense(tx: Transaction): boolean {
  return tx.amount < 0; // 负数表示支出
}

/**
 * 判断交易是否为收入
 */
function isIncome(tx: Transaction): boolean {
  return tx.amount >= 0; // 非负数表示收入
}

/**
 * 获取月份字符串（YYYY-MM）
 */
function getMonthKey(dateStr: string): string {
  return dateStr.substring(0, 7);
}

/**
 * 计算某月的天数
 */
function getDaysInMonth(dateStr: string): number {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return new Date(year, month, 0).getDate();
}

// ========================================
// 统计计算函数
// ========================================

/**
 * 计算基础统计
 */
export function calculateSummary(
  transactions: Transaction[],
  currentMonth?: string | 'all'
): SummaryStats {
  // 判断是否计算全部数据
  const isAllTime = currentMonth === 'all';

  // 筛选要统计的数据
  let currentMonthTxs: Transaction[];
  let lastMonthTxs: Transaction[] = [];

  if (isAllTime) {
    // 计算全部数据
    currentMonthTxs = transactions;
    lastMonthTxs = []; // 全部数据不需要对比上月
  } else {
    // 筛选本月数据
    const current = currentMonth || new Date().toISOString().substring(0, 7);
    currentMonthTxs = transactions.filter(tx =>
      tx.transactionDate.startsWith(current)
    );

    // 计算上月
    const lastMonth = getLastMonth(current);
    lastMonthTxs = transactions.filter(tx =>
      tx.transactionDate.startsWith(lastMonth)
    );
  }

  // 本月统计
  const expenseTxs = currentMonthTxs.filter(isExpense);
  const incomeTxs = currentMonthTxs.filter(isIncome);

  const expenses = expenseTxs.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  const income = incomeTxs.reduce((sum, tx) => sum + tx.amount, 0);

  // 调试日志
  console.log('📊 [calculateSummary] 交易统计:', {
    范围: isAllTime ? '全部时间' : (currentMonth || '本月'),
    总交易数: currentMonthTxs.length,
    支出交易数: expenseTxs.length,
    收入交易数: incomeTxs.length,
    支出总额: expenses,
    收入总额: income,
    储蓄: income - expenses,
  });

  // 上月统计（用于对比）
  let lastMonthExpenses = 0;
  let lastMonthIncome = 0;

  if (!isAllTime) {
    lastMonthExpenses = lastMonthTxs
      .filter(isExpense)
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    lastMonthIncome = lastMonthTxs
      .filter(isIncome)
      .reduce((sum, tx) => sum + tx.amount, 0);
  }

  // 最大支出
  const maxTx = expenseTxs.reduce((max, tx) =>
    Math.abs(tx.amount) > Math.abs(max.amount) ? tx : max,
    expenseTxs[0] || { amount: 0, description: '无' }
  );

  // 计算对比
  const expensesVsLastMonth = !isAllTime && lastMonthExpenses > 0
    ? ((expenses - lastMonthExpenses) / lastMonthExpenses) * 100
    : 0;

  const incomeVsLastMonth = !isAllTime && lastMonthIncome > 0
    ? ((income - lastMonthIncome) / lastMonthIncome) * 100
    : 0;

  const currentSavings = income - expenses;
  const lastMonthSavings = lastMonthIncome - lastMonthExpenses;
  const savingsVsLastMonth = !isAllTime && lastMonthSavings > 0
    ? ((currentSavings - lastMonthSavings) / lastMonthSavings) * 100
    : 0;

  // 日均支出（只对月度数据有意义）
  const daysInMonth = !isAllTime && currentMonthTxs.length > 0
    ? getDaysInMonth(currentMonthTxs[0]?.transactionDate || new Date().toISOString())
    : 1;
  const avgDailyExpense = !isAllTime ? expenses / daysInMonth : 0;

  return {
    totalExpenses: Math.round(expenses * 100) / 100,
    totalIncome: Math.round(income * 100) / 100,
    netSavings: Math.round(currentSavings * 100) / 100,
    transactionCount: currentMonthTxs.length,
    avgDailyExpense: Math.round(avgDailyExpense * 100) / 100,
    maxExpense: Math.round(Math.abs(maxTx.amount) * 100) / 100,
    maxExpenseDescription: maxTx.description,
    expensesVsLastMonth: Math.round(expensesVsLastMonth),
    incomeVsLastMonth: Math.round(incomeVsLastMonth),
    savingsVsLastMonth: Math.round(savingsVsLastMonth),
  };
}

/**
 * 按分类聚合统计
 */
export function aggregateByCategory(
  transactions: Transaction[],
  currentMonth?: string
): CategoryStats[] {
  // 筛选本月数据
  const current = currentMonth || new Date().toISOString().substring(0, 7);
  const currentMonthTxs = transactions.filter(tx =>
    tx.transactionDate.startsWith(current) && isExpense(tx)
  );

  // 按分类分组
  const categoryMap = new Map<string, { amount: number; count: number }>();

  for (const tx of currentMonthTxs) {
    const category = tx.category || '未分类';
    if (!categoryMap.has(category)) {
      categoryMap.set(category, { amount: 0, count: 0 });
    }
    const stats = categoryMap.get(category)!;
    stats.amount += tx.amount;
    stats.count += 1;
  }

  // 计算总支出（用于百分比）
  const totalExpenses = Array.from(categoryMap.values())
    .reduce((sum, stats) => sum + stats.amount, 0);

  // 转换为数组并排序
  const result: CategoryStats[] = Array.from(categoryMap.entries())
    .map(([category, stats]) => ({
      category,
      amount: Math.round(stats.amount * 100) / 100,
      count: stats.count,
      percentage: totalExpenses > 0
        ? Math.round((stats.amount / totalExpenses) * 1000) / 10 // 保留1位小数
        : 0,
    }))
    .sort((a, b) => b.amount - a.amount); // 按金额降序

  return result;
}

/**
 * 按时间范围筛选
 */
export function filterByDateRange(
  transactions: Transaction[],
  range: DateRange
): Transaction[] {
  const start = new Date(range.start);
  const end = new Date(range.end);

  return transactions.filter(tx => {
    const txDate = new Date(tx.transactionDate);
    return txDate >= start && txDate <= end;
  });
}

/**
 * 获取上个月
 */
function getLastMonth(monthStr: string): string {
  const date = new Date(monthStr + '-01');
  date.setMonth(date.getMonth() - 1);
  return date.toISOString().substring(0, 7);
}

/**
 * 从 uploads 数据中提取所有交易
 */
export function extractTransactions(uploads: Array<{
  parsed_data: string;
}>): Transaction[] {
  const allTransactions: Transaction[] = [];

  for (const upload of uploads) {
    try {
      const bills = JSON.parse(upload.parsed_data);
      // 只保留有 category 字段的账单
      const categorized = bills.filter((b: any) => b.category);
      allTransactions.push(...categorized);
    } catch (error) {
      console.error('解析 parsed_data 失败:', error);
    }
  }

  return allTransactions;
}

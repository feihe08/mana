/**
 * 趋势分析模块
 * 计算月度趋势和对比
 */

import type { Transaction } from './calculator';

// ========================================
// 类型定义
// ========================================

export interface MonthlyData {
  month: string;      // YYYY-MM
  expenses: number;   // 总支出
  income: number;     // 总收入
  savings: number;    // 净储蓄
  count: number;      // 交易笔数
}

export interface TrendPoint {
  month: string;
  value: number;
  label: string;      // 格式化的标签，如 "1月"
}

export interface TrendInsight {
  type: 'increase' | 'decrease' | 'stable';
  category: string;  // 'expenses' | 'income' | 'savings'
  percentage: number;
  description: string;
}

// ========================================
// 趋势计算函数
// ========================================

/**
 * 按月聚合数据
 */
export function aggregateByMonth(
  transactions: Transaction[],
  months: number = 6
): MonthlyData[] {
  const monthlyMap = new Map<string, MonthlyData>();

  // 初始化最近 N 个月
  const today = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthKey = date.toISOString().substring(0, 7);
    monthlyMap.set(monthKey, {
      month: monthKey,
      expenses: 0,
      income: 0,
      savings: 0,
      count: 0,
    });
  }

  // 聚合数据
  for (const tx of transactions) {
    const monthKey = tx.transactionDate.substring(0, 7);
    if (!monthlyMap.has(monthKey)) continue;

    const data = monthlyMap.get(monthKey)!;
    data.count += 1;

    if (tx.amount < 0) {
      // 负数表示支出
      data.expenses += Math.abs(tx.amount);
    } else {
      // 正数或零表示收入
      data.income += tx.amount;
    }
  }

  // 计算储蓄
  for (const data of monthlyMap.values()) {
    data.savings = Math.round((data.income - data.expenses) * 100) / 100;
    data.expenses = Math.round(data.expenses * 100) / 100;
    data.income = Math.round(data.income * 100) / 100;
  }

  // 转换为数组并排序
  return Array.from(monthlyMap.values()).sort((a, b) =>
    a.month.localeCompare(b.month)
  );
}

/**
 * 生成趋势图表数据（仅支出）
 */
export function generateExpenseTrend(
  monthlyData: MonthlyData[]
): TrendPoint[] {
  return monthlyData.map(data => ({
    month: data.month,
    value: data.expenses,
    label: formatMonthLabel(data.month),
  }));
}

/**
 * 生成趋势图表数据（支出和收入）
 */
export function generateCombinedTrend(
  monthlyData: MonthlyData[]
): {
  expenses: TrendPoint[];
  income: TrendPoint[];
} {
  return {
    expenses: monthlyData.map(data => ({
      month: data.month,
      value: data.expenses,
      label: formatMonthLabel(data.month),
    })),
    income: monthlyData.map(data => ({
      month: data.month,
      value: data.income,
      label: formatMonthLabel(data.month),
    })),
  };
}

/**
 * 计算趋势洞察（对比本月vs上月）
 */
export function calculateTrendInsight(
  monthlyData: MonthlyData[]
): TrendInsight[] {
  if (monthlyData.length < 2) {
    return [];
  }

  const current = monthlyData[monthlyData.length - 1];
  const last = monthlyData[monthlyData.length - 2];

  const insights: TrendInsight[] = [];

  // 支出趋势
  const expenseChange = last.expenses > 0
    ? ((current.expenses - last.expenses) / last.expenses) * 100
    : 0;

  insights.push({
    type: expenseChange > 5 ? 'increase' : expenseChange < -5 ? 'decrease' : 'stable',
    category: 'expenses',
    percentage: Math.round(expenseChange),
    description: `支出${expenseChange > 0 ? '增加' : '减少'} ${Math.abs(Math.round(expenseChange))}%`,
  });

  // 收入趋势
  const incomeChange = last.income > 0
    ? ((current.income - last.income) / last.income) * 100
    : 0;

  insights.push({
    type: incomeChange > 5 ? 'increase' : incomeChange < -5 ? 'decrease' : 'stable',
    category: 'income',
    percentage: Math.round(incomeChange),
    description: `收入${incomeChange > 0 ? '增加' : '减少'} ${Math.abs(Math.round(incomeChange))}%`,
  });

  // 储蓄趋势
  const savingsChange = last.savings > 0
    ? ((current.savings - last.savings) / Math.abs(last.savings)) * 100
    : 0;

  insights.push({
    type: savingsChange > 5 ? 'increase' : savingsChange < -5 ? 'decrease' : 'stable',
    category: 'savings',
    percentage: Math.round(savingsChange),
    description: `储蓄${savingsChange > 0 ? '增加' : '减少'} ${Math.abs(Math.round(savingsChange))}%`,
  });

  return insights;
}

/**
 * 格式化月份标签
 */
function formatMonthLabel(monthStr: string): string {
  const date = new Date(monthStr + '-01');
  return `${date.getMonth() + 1}月`;
}

/**
 * 获取最大支出的月份
 */
export function getMaxExpenseMonth(monthlyData: MonthlyData[]): {
  month: string;
  amount: number;
} | null {
  if (monthlyData.length === 0) return null;

  const max = monthlyData.reduce((max, data) =>
    data.expenses > max.expenses ? data : max
  );

  return {
    month: formatMonthLabel(max.month),
    amount: max.expenses,
  };
}

/**
 * 获取平均月度支出
 */
export function getAverageMonthlyExpenses(monthlyData: MonthlyData[]): number {
  if (monthlyData.length === 0) return 0;

  const total = monthlyData.reduce((sum, data) => sum + data.expenses, 0);
  return Math.round((total / monthlyData.length) * 100) / 100;
}

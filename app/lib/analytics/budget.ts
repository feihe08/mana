/**
 * 预算对比模块
 * 对比实际支出与预算设置
 */

import type { StandardCategory } from '../beancount/category-taxonomy';
import type { Transaction } from './calculator';

// ========================================
// 类型定义
// ========================================

export interface BudgetConfig {
  category: StandardCategory;
  monthlyLimit: number;
  alertThreshold: number; // 0-1 之间，如 0.8 表示 80%
}

export interface BudgetComparison {
  category: string;
  budget: number;
  spent: number;
  percentage: number; // 已使用百分比 (0-100+)
  status: 'safe' | 'warning' | 'danger' | 'over';
  remaining: number; // 剩余金额（可能为负）
}

// ========================================
// 预算对比函数
// ========================================

/**
 * 对比所有分类的预算执行情况
 */
export function compareWithBudget(
  transactions: Transaction[],
  budgets: BudgetConfig[],
  currentMonth?: string
): BudgetComparison[] {
  // 筛选本月数据
  const current = currentMonth || new Date().toISOString().substring(0, 7);
  const currentMonthTxs = transactions.filter(tx =>
    tx.transactionDate.startsWith(current)
  );

  // 按分类聚合支出
  const categorySpending = new Map<string, number>();
  for (const tx of currentMonthTxs) {
    const category = tx.category || '未分类';
    categorySpending.set(category, (categorySpending.get(category) || 0) + tx.amount);
  }

  // 对比每个预算
  const comparisons: BudgetComparison[] = budgets
    .map(budget => {
      const spent = categorySpending.get(budget.category) || 0;
      const percentage = budget.monthlyLimit > 0
        ? (spent / budget.monthlyLimit) * 100
        : 0;

      // 计算状态
      let status: BudgetComparison['status'];
      if (percentage >= 100) {
        status = 'over';
      } else if (percentage >= budget.alertThreshold * 100) {
        status = 'danger';
      } else if (percentage >= 50) {
        status = 'warning';
      } else {
        status = 'safe';
      }

      return {
        category: budget.category,
        budget: budget.monthlyLimit,
        spent: Math.round(spent * 100) / 100,
        percentage: Math.round(percentage * 10) / 10, // 保留1位小数
        status,
        remaining: Math.round((budget.monthlyLimit - spent) * 100) / 100,
      };
    })
    .sort((a, b) => b.percentage - a.percentage); // 按使用率降序

  return comparisons;
}

/**
 * 检查是否有超支的分类
 */
export function getOverBudgetCategories(
  transactions: Transaction[],
  budgets: BudgetConfig[],
  currentMonth?: string
): BudgetComparison[] {
  const comparisons = compareWithBudget(transactions, budgets, currentMonth);
  return comparisons.filter(c => c.status === 'over');
}

/**
 * 获取预算使用率最高的分类（Top N）
 */
export function getTopBudgetUsage(
  transactions: Transaction[],
  budgets: BudgetConfig[],
  n: number = 3,
  currentMonth?: string
): BudgetComparison[] {
  const comparisons = compareWithBudget(transactions, budgets, currentMonth);
  return comparisons.slice(0, n);
}

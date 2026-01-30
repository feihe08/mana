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

export interface CategoryComparison {
  category: string;
  currentAmount: number;
  lastMonthAmount: number;
  changePercentage: number;
  count: number;
  status: 'excellent' | 'good' | 'warning' | 'danger';
}

export interface FinancialHealthScore {
  totalScore: number;
  savingsRateScore: number;
  stabilityScore: number;
  budgetScore: number;
  savingsRate: number;
  expenseVariance: number;
  budgetExecutionRate: number;
}

export interface ExpenseSuggestion {
  category: string;
  currentAmount: number;
  suggestedAmount: number;
  potentialSavings: number;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
}

export interface NetWorthStats {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  assetsVsLastMonth: number;
  liabilitiesVsLastMonth: number;
  netWorthVsLastMonth: number;
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
 * 计算净资产统计
 */
export function calculateNetWorth(transactions: Transaction[]): NetWorthStats {
  // 简单的净资产计算：收入总和 - 支出总和（简化版）
  const incomeTxs = transactions.filter(tx => tx.amount >= 0);
  const expenseTxs = transactions.filter(tx => tx.amount < 0);

  const totalAssets = incomeTxs.reduce((sum, tx) => sum + tx.amount, 0);
  const totalLiabilities = Math.abs(expenseTxs.reduce((sum, tx) => sum + tx.amount, 0));
  const netWorth = totalAssets - totalLiabilities;

  // 计算上月净资产（简化版）
  const currentMonth = new Date().toISOString().substring(0, 7);
  const lastMonth = getLastMonth(currentMonth);

  const currentMonthIncome = incomeTxs.filter(tx => tx.transactionDate.startsWith(currentMonth))
    .reduce((sum, tx) => sum + tx.amount, 0);
  const currentMonthExpenses = Math.abs(expenseTxs.filter(tx => tx.transactionDate.startsWith(currentMonth))
    .reduce((sum, tx) => sum + tx.amount, 0));
  const currentMonthNetWorth = currentMonthIncome - currentMonthExpenses;

  const lastMonthIncome = incomeTxs.filter(tx => tx.transactionDate.startsWith(lastMonth))
    .reduce((sum, tx) => sum + tx.amount, 0);
  const lastMonthExpenses = Math.abs(expenseTxs.filter(tx => tx.transactionDate.startsWith(lastMonth))
    .reduce((sum, tx) => sum + tx.amount, 0));
  const lastMonthNetWorth = lastMonthIncome - lastMonthExpenses;

  return {
    totalAssets: Math.round(totalAssets * 100) / 100,
    totalLiabilities: Math.round(totalLiabilities * 100) / 100,
    netWorth: Math.round(netWorth * 100) / 100,
    assetsVsLastMonth: lastMonthIncome > 0 ? Math.round(((currentMonthIncome - lastMonthIncome) / lastMonthIncome) * 100) : 0,
    liabilitiesVsLastMonth: lastMonthExpenses > 0 ? Math.round(((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100) : 0,
    netWorthVsLastMonth: lastMonthNetWorth > 0 ? Math.round(((currentMonthNetWorth - lastMonthNetWorth) / lastMonthNetWorth) * 100) : 0,
  };
}

/**
 * 计算分类对比统计（本月 vs 上月）
 */
export function calculateCategoryChanges(transactions: Transaction[]): CategoryComparison[] {
  const currentMonth = new Date().toISOString().substring(0, 7);
  const lastMonth = getLastMonth(currentMonth);

  // 筛选本月和上月的支出交易
  const currentMonthTxs = transactions.filter(tx => tx.transactionDate.startsWith(currentMonth) && tx.amount < 0);
  const lastMonthTxs = transactions.filter(tx => tx.transactionDate.startsWith(lastMonth) && tx.amount < 0);

  // 计算本月分类统计
  const currentCategoryMap = new Map<string, { amount: number; count: number }>();
  for (const tx of currentMonthTxs) {
    const category = tx.category || '未分类';
    if (!currentCategoryMap.has(category)) {
      currentCategoryMap.set(category, { amount: 0, count: 0 });
    }
    const stats = currentCategoryMap.get(category)!;
    stats.amount += Math.abs(tx.amount);
    stats.count += 1;
  }

  // 计算上月分类统计
  const lastCategoryMap = new Map<string, { amount: number; count: number }>();
  for (const tx of lastMonthTxs) {
    const category = tx.category || '未分类';
    if (!lastCategoryMap.has(category)) {
      lastCategoryMap.set(category, { amount: 0, count: 0 });
    }
    const stats = lastCategoryMap.get(category)!;
    stats.amount += Math.abs(tx.amount);
    stats.count += 1;
  }

  // 合并分类
  const allCategories = new Set([...currentCategoryMap.keys(), ...lastCategoryMap.keys()]);

  const comparisons: CategoryComparison[] = [];
  for (const category of allCategories) {
    const current = currentCategoryMap.get(category) || { amount: 0, count: 0 };
    const last = lastCategoryMap.get(category) || { amount: 0, count: 0 };

    const changePercentage = last.amount > 0
      ? ((current.amount - last.amount) / last.amount) * 100
      : current.amount > 0 ? 100 : 0;

    // 确定状态
    let status: 'excellent' | 'good' | 'warning' | 'danger';
    if (changePercentage < -20) {
      status = 'excellent'; // 大幅减少
    } else if (changePercentage < 10) {
      status = 'good'; // 小幅变化
    } else if (changePercentage < 30) {
      status = 'warning'; // 中等增长
    } else {
      status = 'danger'; // 大幅增长
    }

    comparisons.push({
      category,
      currentAmount: Math.round(current.amount * 100) / 100,
      lastMonthAmount: Math.round(last.amount * 100) / 100,
      changePercentage: Math.round(changePercentage),
      count: current.count,
      status,
    });
  }

  // 按变化百分比绝对值降序排序，突出变化最大的分类
  return comparisons.sort((a, b) => Math.abs(b.changePercentage) - Math.abs(a.changePercentage));
}

/**
 * 计算财务健康评分
 */
export function calculateFinancialHealthScore(
  transactions: Transaction[],
  budgets: Array<{ category: string; monthlyLimit: number }>
): FinancialHealthScore {
  const currentMonth = new Date().toISOString().substring(0, 7);
  const currentMonthTxs = transactions.filter(tx => tx.transactionDate.startsWith(currentMonth));

  // 1. 储蓄率评分（40%权重）
  const incomeTxs = currentMonthTxs.filter(tx => tx.amount >= 0);
  const expenseTxs = currentMonthTxs.filter(tx => tx.amount < 0);

  const totalIncome = incomeTxs.reduce((sum, tx) => sum + tx.amount, 0);
  const totalExpenses = Math.abs(expenseTxs.reduce((sum, tx) => sum + tx.amount, 0));
  const savingsRate = totalIncome > 0 ? (totalIncome - totalExpenses) / totalIncome : 0;

  // 储蓄率评分：30%以上优秀（100分），20%良好（80分），10%中等（60分），低于10%较差
  let savingsRateScore: number;
  if (savingsRate >= 0.3) {
    savingsRateScore = 100;
  } else if (savingsRate >= 0.2) {
    savingsRateScore = 80;
  } else if (savingsRate >= 0.1) {
    savingsRateScore = 60;
  } else {
    savingsRateScore = Math.max(0, Math.round(savingsRate * 1000)); // 负数储蓄率得0分
  }

  // 2. 支出稳定性评分（30%权重）
  // 计算月度支出波动
  const monthlyExpenses = getMonthlyExpenses(transactions);
  const expenseVariance = calculateVariance(monthlyExpenses);
  const stabilityScore = Math.max(0, 100 - Math.min(expenseVariance * 10, 100));

  // 3. 预算执行率评分（30%权重）
  let budgetExecutionRate = 0;
  let validBudgets = 0;

  if (budgets.length > 0) {
    // 计算各分类支出
    const categorySpending = new Map<string, number>();
    for (const tx of expenseTxs) {
      const category = tx.category || '未分类';
      categorySpending.set(category, (categorySpending.get(category) || 0) + Math.abs(tx.amount));
    }

    // 计算预算执行率
    let totalBudget = 0;
    let totalSpent = 0;

    for (const budget of budgets) {
      const spent = categorySpending.get(budget.category) || 0;
      totalBudget += budget.monthlyLimit;
      totalSpent += spent;

      validBudgets++;
    }

    budgetExecutionRate = totalBudget > 0 ? (totalSpent / totalBudget) : 0;
  }

  // 预算执行率评分：85%以下优秀（100分），100%良好（80分），120%警告（60分），超过120%较差
  let budgetScore: number;
  if (budgetExecutionRate <= 0.85) {
    budgetScore = 100;
  } else if (budgetExecutionRate <= 1.0) {
    budgetScore = 80;
  } else if (budgetExecutionRate <= 1.2) {
    budgetScore = 60;
  } else {
    budgetScore = Math.max(0, 100 - Math.min((budgetExecutionRate - 1.2) * 200, 100));
  }

  // 总分
  const totalScore = Math.round(
    (savingsRateScore * 0.4) +
    (stabilityScore * 0.3) +
    (budgetScore * 0.3)
  );

  return {
    totalScore,
    savingsRateScore,
    stabilityScore,
    budgetScore,
    savingsRate: Math.round(savingsRate * 100),
    expenseVariance: Math.round(expenseVariance * 100),
    budgetExecutionRate: Math.round(budgetExecutionRate * 100),
  };
}

/**
 * 生成支出建议
 */
export function generateExpenseSuggestions(
  transactions: Transaction[],
  budgets: Array<{ category: string; monthlyLimit: number }>
): ExpenseSuggestion[] {
  const suggestions: ExpenseSuggestion[] = [];
  const currentMonth = new Date().toISOString().substring(0, 7);

  // 筛选本月支出交易
  const currentMonthTxs = transactions.filter(tx => tx.transactionDate.startsWith(currentMonth) && tx.amount < 0);

  // 计算各分类支出
  const categorySpending = new Map<string, number>();
  for (const tx of currentMonthTxs) {
    const category = tx.category || '未分类';
    categorySpending.set(category, (categorySpending.get(category) || 0) + Math.abs(tx.amount));
  }

  // 分析每个分类
  for (const [category, currentAmount] of categorySpending.entries()) {
    // 查找该分类的预算
    const budget = budgets.find(b => b.category === category);

    // 计算上月支出
    const lastMonth = getLastMonth(currentMonth);
    const lastMonthTxs = transactions.filter(tx => tx.transactionDate.startsWith(lastMonth) && tx.amount < 0 && tx.category === category);
    const lastMonthAmount = Math.abs(lastMonthTxs.reduce((sum, tx) => sum + tx.amount, 0));

    // 生成建议
    if (budget && currentAmount > budget.monthlyLimit) {
      // 预算超支建议
      const suggestedAmount = budget.monthlyLimit;
      const potentialSavings = currentAmount - suggestedAmount;
      suggestions.push({
        category,
        currentAmount: Math.round(currentAmount * 100) / 100,
        suggestedAmount: Math.round(suggestedAmount * 100) / 100,
        potentialSavings: Math.round(potentialSavings * 100) / 100,
        recommendation: `该类别已超出预算 ${Math.round((currentAmount - budget.monthlyLimit) * 100) / 100} 元，建议控制在 ${budget.monthlyLimit} 元以内`,
        priority: 'high',
      });
    } else if (lastMonthAmount > 0 && currentAmount > lastMonthAmount * 1.5) {
      // 支出大幅增长建议
      const suggestedAmount = lastMonthAmount * 1.1; // 建议增长不超过10%
      const potentialSavings = currentAmount - suggestedAmount;
      suggestions.push({
        category,
        currentAmount: Math.round(currentAmount * 100) / 100,
        suggestedAmount: Math.round(suggestedAmount * 100) / 100,
        potentialSavings: Math.round(potentialSavings * 100) / 100,
        recommendation: `该类别支出较上月增长 ${Math.round(((currentAmount - lastMonthAmount) / lastMonthAmount) * 100)}%，建议控制增长幅度`,
        priority: 'medium',
      });
    } else if (currentAmount > 500) {
      // 大额支出建议（简化版）
      const suggestedAmount = currentAmount * 0.9; // 建议节省10%
      const potentialSavings = currentAmount - suggestedAmount;
      suggestions.push({
        category,
        currentAmount: Math.round(currentAmount * 100) / 100,
        suggestedAmount: Math.round(suggestedAmount * 100) / 100,
        potentialSavings: Math.round(potentialSavings * 100) / 100,
        recommendation: `该类别支出较高（¥${Math.round(currentAmount)}），建议适当控制`,
        priority: 'low',
      });
    }
  }

  // 按优先级排序
  return suggestions.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * 辅助函数：获取月度支出数据
 */
function getMonthlyExpenses(transactions: Transaction[]): number[] {
  const monthlyMap = new Map<string, number>();

  for (const tx of transactions.filter(tx => tx.amount < 0)) {
    const monthKey = tx.transactionDate.substring(0, 7);
    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, 0);
    }
    monthlyMap.set(monthKey, monthlyMap.get(monthKey)! + Math.abs(tx.amount));
  }

  return Array.from(monthlyMap.values());
}

/**
 * 辅助函数：计算方差
 */
function calculateVariance(values: number[]): number {
  if (values.length < 2) return 0;

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const sumSquaredDiff = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);
  return sumSquaredDiff / values.length;
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

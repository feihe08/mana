/**
 * 分析模块统一导出
 */

// 统计计算
export {
  calculateSummary,
  aggregateByCategory,
  filterByDateRange,
  extractTransactions,
  type SummaryStats,
  type CategoryStats,
  type DateRange,
  type Transaction,
} from './calculator';

// 预算对比
export {
  compareWithBudget,
  getOverBudgetCategories,
  getTopBudgetUsage,
  type BudgetComparison,
  type BudgetConfig,
} from './budget';

// 趋势分析
export {
  aggregateByMonth,
  generateExpenseTrend,
  generateCombinedTrend,
  calculateTrendInsight,
  getMaxExpenseMonth,
  getAverageMonthlyExpenses,
  type MonthlyData,
  type TrendPoint,
  type TrendInsight,
} from './trends';

/**
 * 关键洞察卡片组件
 * 展示本月财务洞察、支出变化原因和智能建议
 */

import type { Transaction } from '../../lib/analytics/calculator';

interface InsightCardProps {
  transactions: Transaction[];
}

function InsightCard({ transactions }: InsightCardProps) {
  // 计算本月和上月的支出
  const currentMonth = new Date().toISOString().substring(0, 7);
  const lastMonth = getLastMonth(currentMonth);

  const currentMonthTxs = transactions.filter(tx => tx.transactionDate.startsWith(currentMonth) && tx.amount < 0);
  const lastMonthTxs = transactions.filter(tx => tx.transactionDate.startsWith(lastMonth) && tx.amount < 0);

  const currentExpenses = Math.abs(currentMonthTxs.reduce((sum, tx) => sum + tx.amount, 0));
  const lastExpenses = Math.abs(lastMonthTxs.reduce((sum, tx) => sum + tx.amount, 0));

  const expenseChange = lastExpenses > 0
    ? ((currentExpenses - lastExpenses) / lastExpenses) * 100
    : 0;

  // 分析主要变化原因
  const categoryChanges = analyzeCategoryChanges(transactions);

  // 生成智能建议
  const suggestions = generateInsights(categoryChanges);

  // 检测异常支出
  const anomalies = detectAnomalies(currentMonthTxs);

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h2 className="text-xl font-semibold text-white mb-4">📈 本月财务洞察</h2>

      {/* 支出变化概览 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-400">本月支出变化</p>
          <span className={`text-sm font-medium ${expenseChange > 0 ? 'text-red-400' : 'text-green-400'}`}>
            {expenseChange > 0 ? '↑' : '↓'} {Math.abs(expenseChange).toFixed(0)}%
          </span>
        </div>
        <p className="text-2xl font-bold text-white">
          ¥{currentExpenses.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </p>
      </div>

      {/* 主要变化原因 */}
      {categoryChanges.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-400 mb-3">主要变化原因</h3>
          <div className="space-y-2">
            {categoryChanges.slice(0, 3).map((change) => (
              <div key={change.category} className="flex items-center text-sm">
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${change.status === 'danger' ? 'bg-red-400' : 'bg-yellow-400'}`} />
                <span className="text-gray-300">{change.category}</span>
                <span className={`ml-2 font-medium ${change.changePercentage > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {change.changePercentage > 0 ? '↑' : '↓'} {Math.abs(change.changePercentage).toFixed(0)}%
                </span>
                <span className="ml-2 text-gray-400">
                  (¥{change.lastAmount.toLocaleString()} → ¥{change.currentAmount.toLocaleString()})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 智能建议 */}
      {suggestions.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-400 mb-3">行动建议</h3>
          <div className="space-y-2">
            {suggestions.slice(0, 2).map((suggestion, index) => (
              <div key={index} className="flex items-start text-sm">
                <span className="text-purple-400 mr-2">💡</span>
                <span className="text-gray-300">{suggestion}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 异常检测 */}
      {anomalies.length > 0 && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <h3 className="text-sm font-medium text-red-400 mb-2">⚠️ 异常支出警告</h3>
          <div className="space-y-1">
            {anomalies.slice(0, 2).map((anomaly, index) => (
              <div key={index} className="text-sm text-red-300">
                {anomaly}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 辅助函数：获取上个月
function getLastMonth(monthStr: string): string {
  const date = new Date(monthStr + '-01');
  date.setMonth(date.getMonth() - 1);
  return date.toISOString().substring(0, 7);
}

// 分析分类变化
function analyzeCategoryChanges(transactions: Transaction[]): Array<{
  category: string;
  currentAmount: number;
  lastAmount: number;
  changePercentage: number;
  status: 'danger' | 'warning' | 'good';
}> {
  const currentMonth = new Date().toISOString().substring(0, 7);
  const lastMonth = getLastMonth(currentMonth);

  const currentMonthTxs = transactions.filter(tx => tx.transactionDate.startsWith(currentMonth) && tx.amount < 0);
  const lastMonthTxs = transactions.filter(tx => tx.transactionDate.startsWith(lastMonth) && tx.amount < 0);

  const categoryMap = new Map<string, { current: number; last: number }>();

  // 计算本月分类支出
  for (const tx of currentMonthTxs) {
    const category = tx.category || '未分类';
    if (!categoryMap.has(category)) {
      categoryMap.set(category, { current: 0, last: 0 });
    }
    categoryMap.get(category)!.current += Math.abs(tx.amount);
  }

  // 计算上月分类支出
  for (const tx of lastMonthTxs) {
    const category = tx.category || '未分类';
    if (!categoryMap.has(category)) {
      categoryMap.set(category, { current: 0, last: 0 });
    }
    categoryMap.get(category)!.last += Math.abs(tx.amount);
  }

  // 计算变化率
  const changes: Array<{
    category: string;
    currentAmount: number;
    lastAmount: number;
    changePercentage: number;
    status: 'danger' | 'warning' | 'good';
  }> = [];

  for (const [category, amounts] of categoryMap.entries()) {
    if (amounts.last > 0) {
      const changePercentage = ((amounts.current - amounts.last) / amounts.last) * 100;

      let status: 'danger' | 'warning' | 'good';
      if (changePercentage > 30) {
        status = 'danger';
      } else if (changePercentage > 10) {
        status = 'warning';
      } else {
        status = 'good';
      }

      changes.push({
        category,
        currentAmount: Math.round(amounts.current * 100) / 100,
        lastAmount: Math.round(amounts.last * 100) / 100,
        changePercentage: Math.round(changePercentage),
        status,
      });
    }
  }

  // 按变化百分比降序排序
  return changes.sort((a, b) => b.changePercentage - a.changePercentage);
}

// 生成洞察建议
function generateInsights(categoryChanges: ReturnType<typeof analyzeCategoryChanges>): string[] {
  const suggestions: string[] = [];

  const highGrowthCategories = categoryChanges.filter(c => c.changePercentage > 30);
  const significantCategories = categoryChanges.filter(c => c.currentAmount > 500);

  if (highGrowthCategories.length > 0) {
    const topCategory = highGrowthCategories[0];
    suggestions.push(`/${topCategory.category}支出大幅增长（${topCategory.changePercentage}%），建议检查是否有不必要的消费`);
  }

  if (significantCategories.length > 3) {
    suggestions.push('多个类别支出超过¥500，建议优化购物和消费习惯');
  }

  const foodCategories = categoryChanges.filter(c => c.category.includes('餐饮') || c.category.includes('外卖'));
  const foodTotal = foodCategories.reduce((sum, c) => sum + c.currentAmount, 0);
  if (foodTotal > 1000) {
    suggestions.push('餐饮支出较高，建议适当控制在外就餐和外卖频率');
  }

  return suggestions;
}

// 检测异常支出
function detectAnomalies(transactions: Transaction[]): string[] {
  const anomalies: string[] = [];

  // 检测大额支出
  const largeExpenses = transactions.filter(tx => Math.abs(tx.amount) > 500);
  if (largeExpenses.length > 0) {
    const largest = largeExpenses.reduce((max, tx) => Math.abs(tx.amount) > Math.abs(max.amount) ? tx : max, largeExpenses[0]);
    anomalies.push(`单笔大额支出：${largest.description}（¥${Math.abs(largest.amount).toLocaleString()}）`);
  }

  // 检测高频消费
  const dailyCount = new Map<string, number>();
  transactions.forEach(tx => {
    const date = tx.transactionDate.substring(0, 10);
    dailyCount.set(date, (dailyCount.get(date) || 0) + 1);
  });

  const highFrequencyDays = Array.from(dailyCount.entries())
    .filter(([_, count]) => count > 5)
    .map(([date]) => date);

  if (highFrequencyDays.length > 0) {
    anomalies.push(`消费频率异常：${highFrequencyDays.length}天交易次数超过5笔`);
  }

  return anomalies;
}

export default InsightCard;

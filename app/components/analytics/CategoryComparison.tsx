/**
 * 分类对比分析组件
 * 显示本月 vs 上月分类支出对比
 */

import type { CategoryComparison } from '../../lib/analytics/calculator';

interface CategoryComparisonProps {
  comparisons: CategoryComparison[];
  maxItems?: number; // 最多显示多少个分类，默认全部
}

function CategoryComparison({ comparisons, maxItems }: CategoryComparisonProps) {
  // 如果指定了 maxItems，只显示前 N 个
  const displayComparisons = maxItems
    ? comparisons.slice(0, maxItems)
    : comparisons;

  // 状态颜色映射
  const statusColors = {
    excellent: { text: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
    good: { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
    warning: { text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
    danger: { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  };

  // 趋势箭头
  const TrendArrow = ({ value }: { value: number }) => {
    const isPositive = value > 0;
    const color = isPositive ? 'text-red-400' : 'text-green-400';
    const arrow = isPositive ? '↑' : '↓';

    return (
      <span className={`text-sm font-medium ${color}`}>
        {arrow} {Math.abs(value).toFixed(0)}%
      </span>
    );
  };

  // 格式化金额
  const formatAmount = (amount: number): string => {
    return amount.toLocaleString(undefined, {
      maximumFractionDigits: 0,
    });
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h2 className="text-xl font-semibold text-white mb-4">📊 分类对比分析</h2>

      {/* 分类列表 */}
      <div className="space-y-4">
        {displayComparisons.map((comparison) => (
          <div
            key={comparison.category}
            className={`p-4 rounded-lg border ${statusColors[comparison.status].bg} ${statusColors[comparison.status].border}`}
          >
            <div className="flex items-baseline justify-between mb-2">
              <h3 className="text-lg font-medium text-white">{comparison.category}</h3>
              <TrendArrow value={comparison.changePercentage} />
            </div>

            <div className="flex items-baseline space-x-4">
              <div>
                <p className="text-sm text-gray-400">本月</p>
                <p className="text-xl font-bold text-white">
                  ¥{formatAmount(comparison.currentAmount)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-400">上月</p>
                <p className="text-xl font-bold text-gray-500 line-through">
                  ¥{formatAmount(comparison.lastMonthAmount)}
                </p>
              </div>

              <div className="ml-auto">
                <p className="text-sm text-gray-400">笔数</p>
                <p className="text-sm font-medium text-white">{comparison.count}笔</p>
              </div>
            </div>

            {/* 状态说明 */}
            <div className="mt-2">
              {comparison.status === 'excellent' && (
                <p className={`text-xs ${statusColors[comparison.status].text}`}>
                  👍 支出大幅减少，表现优秀！
                </p>
              )}

              {comparison.status === 'good' && (
                <p className={`text-xs ${statusColors[comparison.status].text}`}>
                  ✔️ 支出变化平稳，保持良好！
                </p>
              )}

              {comparison.status === 'warning' && (
                <p className={`text-xs ${statusColors[comparison.status].text}`}>
                  ⚠️ 支出有所增长，建议关注！
                </p>
              )}

              {comparison.status === 'danger' && (
                <p className={`text-xs ${statusColors[comparison.status].text}`}>
                  🚨 支出大幅增长，需要控制！
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 总结洞察 */}
      {displayComparisons.length > 0 && (
        <div className="mt-6 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <p className="text-sm text-purple-400">
            💡 <span className="font-medium">{displayComparisons[0].category}</span> 是变化最大的分类，
            {displayComparisons[0].changePercentage > 0 ? '支出大幅增长' : '支出大幅减少'}
            {Math.abs(displayComparisons[0].changePercentage).toFixed(0)}%
          </p>
        </div>
      )}
    </div>
  );
}

export default CategoryComparison;

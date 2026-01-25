/**
 * 分类条形图组件
 * 显示各分类支出占比（纯 CSS 实现）
 */

import type { CategoryStats } from '../../lib/analytics';

interface CategoryBarProps {
  stats: CategoryStats;
  maxPercentage?: number; // 用于计算条形长度，默认100
}

function CategoryBar({ stats, maxPercentage = 100 }: CategoryBarProps) {
  // 计算条形长度（相对于最大百分比）
  const barWidth = (stats.percentage / maxPercentage) * 100;

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
      {/* 分类名称 */}
      <div className="w-20 text-sm text-gray-300 truncate flex-shrink-0">
        {stats.category}
      </div>

      {/* 条形图 */}
      <div className="flex-1 mx-4">
        <div className="h-6 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
            style={{ width: `${barWidth}%` }}
          />
        </div>
      </div>

      {/* 金额和百分比 */}
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-medium text-white">¥{stats.amount.toLocaleString()}</p>
        <p className="text-xs text-gray-400">{stats.percentage}% ({stats.count}笔)</p>
      </div>
    </div>
  );
}

interface CategoryListProps {
  categories: CategoryStats[];
  maxItems?: number; // 最多显示多少个分类，默认全部
}

export function CategoryList({ categories, maxItems }: CategoryListProps) {
  // 如果指定了 maxItems，只显示前 N 个
  const displayCategories = maxItems
    ? categories.slice(0, maxItems)
    : categories;

  // 计算最大百分比（用于条形长度归一化）
  const maxPercentage = Math.max(
    ...displayCategories.map(c => c.percentage),
    1 // 避免除以0
  );

  // 智能洞察：找出变化最大的分类
  const topCategory = displayCategories[0];

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h2 className="text-xl font-semibold text-white mb-4">🏷️ 支出分类</h2>

      {/* 分类列表 */}
      <div className="space-y-1">
        {displayCategories.map((stats) => (
          <CategoryBar
            key={stats.category}
            stats={stats}
            maxPercentage={maxPercentage}
          />
        ))}
      </div>

      {/* 智能洞察 */}
      {topCategory && topCategory.percentage > 20 && (
        <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <p className="text-sm text-purple-400">
            💡 <span className="font-medium">{topCategory.category}</span> 是最大支出类别，
            占总支出的 <span className="font-medium">{topCategory.percentage}%</span>
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * 预算进度条组件
 * 显示预算使用情况，带颜色编码
 */

import type { BudgetComparison } from '../../lib/analytics';

interface BudgetItemProps {
  comparison: BudgetComparison;
}

function getStatusColor(status: BudgetComparison['status']): string {
  switch (status) {
    case 'safe':
      return 'bg-green-500';
    case 'warning':
      return 'bg-yellow-500';
    case 'danger':
      return 'bg-orange-500';
    case 'over':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
}

function getStatusText(status: BudgetComparison['status']): string {
  switch (status) {
    case 'safe':
      return '🟢 状态良好';
    case 'warning':
      return '🟡 注意控制';
    case 'danger':
      return '🟠 即将超支';
    case 'over':
      return '🔴 已超支！';
    default:
      return '';
  }
}

function BudgetItem({ comparison }: BudgetItemProps) {
  const barWidth = Math.min(comparison.percentage, 100);

  return (
    <div className="py-3 border-b border-gray-700 last:border-0">
      {/* 分类和百分比 */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-white">{comparison.category}</span>
        <span className="text-sm text-gray-400">{comparison.percentage}%</span>
      </div>

      {/* 进度条 */}
      <div className="h-3 bg-gray-700 rounded-full overflow-hidden mb-1">
        <div
          className={`h-full ${getStatusColor(comparison.status)} transition-all duration-300`}
          style={{ width: `${barWidth}%` }}
        />
      </div>

      {/* 详情 */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {comparison.spent > 0 ? `¥${comparison.spent.toLocaleString()}` : '¥0'} / ¥{comparison.budget.toLocaleString()}
        </span>
        <span className="text-xs text-gray-500">{getStatusText(comparison.status)}</span>
      </div>

      {/* 超支提示 */}
      {comparison.status === 'over' && (
        <p className="text-xs text-red-400 mt-1">
          ⚠️ 已超出预算 ¥{Math.abs(comparison.remaining).toLocaleString()}
        </p>
      )}
    </div>
  );
}

interface BudgetProgressProps {
  budgets: BudgetComparison[];
  maxItems?: number;
}

export function BudgetProgress({ budgets, maxItems }: BudgetProgressProps) {
  // 如果没有预算设置
  if (budgets.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-4">💰 预算状态</h2>
        <p className="text-sm text-gray-400">
          暂无预算设置，请到{' '}
          <a href="/settings" className="text-purple-400 hover:text-purple-300">
            设置页面
          </a>{' '}
          添加预算。
        </p>
      </div>
    );
  }

  const displayBudgets = maxItems ? budgets.slice(0, maxItems) : budgets;
  const overBudgetCount = budgets.filter(b => b.status === 'over').length;

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h2 className="text-xl font-semibold text-white mb-4">💰 预算状态</h2>

      {/* 预算列表 */}
      <div className="space-y-1">
        {displayBudgets.map((budget) => (
          <BudgetItem key={budget.category} comparison={budget} />
        ))}
      </div>

      {/* 汇总提示 */}
      {overBudgetCount > 0 && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">
            ⚠️ 有 <span className="font-medium">{overBudgetCount}</span> 个分类已超出预算，建议下月控制支出
          </p>
        </div>
      )}
    </div>
  );
}

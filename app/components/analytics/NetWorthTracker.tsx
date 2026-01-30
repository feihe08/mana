/**
 * 净资产追踪组件
 * 显示净资产总额、资产负债明细和变化趋势
 */

import type { NetWorthStats } from '../../lib/analytics/calculator';

interface NetWorthTrackerProps {
  stats: NetWorthStats;
}

function NetWorthTracker({ stats }: NetWorthTrackerProps) {
  // 格式化金额
  const formatAmount = (amount: number): string => {
    return amount.toLocaleString(undefined, {
      maximumFractionDigits: 0,
    });
  };

  // 趋势箭头
  const TrendArrow = ({ value }: { value: number }) => {
    if (!value || Math.abs(value) < 1) return null;

    const isPositive = value > 0;
    const color = isPositive ? 'text-green-400' : 'text-red-400';
    const arrow = isPositive ? '↑' : '↓';

    return (
      <span className={`text-sm font-medium ${color}`}>
        {arrow} {Math.abs(value).toFixed(0)}%
      </span>
    );
  };

  // 计算资产和负债的占比
  const total = stats.totalAssets + stats.totalLiabilities;
  const assetsPercentage = total > 0 ? (stats.totalAssets / total) * 100 : 0;
  const liabilitiesPercentage = total > 0 ? (stats.totalLiabilities / total) * 100 : 0;

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h2 className="text-xl font-semibold text-white mb-4">💎 净资产追踪</h2>

      {/* 净资产总额 */}
      <div className="mb-6">
        <div className="flex items-baseline justify-between mb-2">
          <p className="text-sm text-gray-400">净资产</p>
          <TrendArrow value={stats.netWorthVsLastMonth} />
        </div>
        <p className="text-3xl font-bold text-blue-400">
          ¥{formatAmount(stats.netWorth)}
        </p>
      </div>

      {/* 资产与负债比例 */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">资产</span>
          <span className="text-gray-400">负债</span>
        </div>
        <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-300"
            style={{ width: `${assetsPercentage}%` }}
          />
          <div
            className="h-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-300"
            style={{ width: `${liabilitiesPercentage}%`, marginLeft: `-${liabilitiesPercentage}%` }}
          />
        </div>
        <div className="flex justify-between text-sm mt-2">
          <span className="text-green-400">
            ¥{formatAmount(stats.totalAssets)} ({Math.round(assetsPercentage)}%)
          </span>
          <span className="text-red-400">
            ¥{formatAmount(stats.totalLiabilities)} ({Math.round(liabilitiesPercentage)}%)
          </span>
        </div>
      </div>

      {/* 详细数据 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 总资产 */}
        <div className="bg-gray-700/50 rounded-lg p-4">
          <div className="flex items-baseline justify-between mb-1">
            <p className="text-sm text-gray-400">总资产</p>
            <TrendArrow value={stats.assetsVsLastMonth} />
          </div>
          <p className="text-xl font-bold text-green-400">
            ¥{formatAmount(stats.totalAssets)}
          </p>
        </div>

        {/* 总负债 */}
        <div className="bg-gray-700/50 rounded-lg p-4">
          <div className="flex items-baseline justify-between mb-1">
            <p className="text-sm text-gray-400">总负债</p>
            <TrendArrow value={stats.liabilitiesVsLastMonth} />
          </div>
          <p className="text-xl font-bold text-red-400">
            ¥{formatAmount(stats.totalLiabilities)}
          </p>
        </div>
      </div>

      {/* 财务健康提示 */}
      {stats.netWorth < 0 && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">
            ⚠️ 净资产为负，财务状况危险，建议立即调整支出结构
          </p>
        </div>
      )}

      {stats.netWorth > 0 && stats.totalLiabilities > stats.totalAssets * 0.5 && (
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-sm text-yellow-400">
            💡 负债比例较高（{Math.round((stats.totalLiabilities / stats.totalAssets) * 100)}%），建议控制负债增长
          </p>
        </div>
      )}

      {stats.netWorth > 0 && stats.totalLiabilities < stats.totalAssets * 0.3 && (
        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <p className="text-sm text-green-400">
            ✨ 负债比例健康（{Math.round((stats.totalLiabilities / stats.totalAssets) * 100)}%），继续保持！
          </p>
        </div>
      )}
    </div>
  );
}

export default NetWorthTracker;

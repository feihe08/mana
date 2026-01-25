/**
 * 统计卡片组件
 * 显示 6 个核心统计指标
 */

import type { SummaryStats } from '../../lib/analytics';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: number;
  trendLabel?: string;
}

function StatCard({ label, value, unit, trend, trendLabel }: StatCardProps) {
  const trendColor = trend !== undefined
    ? trend > 0
      ? 'text-red-400' // 支出增加是坏事（红色）
      : trend < 0
        ? 'text-green-400' // 支出减少是好事（绿色）
        : 'text-gray-400'
    : '';

  const trendIcon = trend !== undefined
    ? trend > 0
      ? '↑'
      : trend < 0
        ? '↓'
        : '→'
    : '';

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <p className="text-sm text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-white mb-1">
        {typeof value === 'number' ? value.toLocaleString() : value}
        {unit && <span className="text-base font-normal text-gray-400 ml-1">{unit}</span>}
      </p>
      {trend !== undefined && (
        <p className={`text-xs ${trendColor}`}>
          {trendIcon} {Math.abs(trend)}% {trendLabel || 'vs 上月'}
        </p>
      )}
    </div>
  );
}

interface StatsCardsProps {
  stats: SummaryStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <StatCard
        label="总支出"
        value={stats.totalExpenses}
        unit="¥"
        trend={stats.expensesVsLastMonth}
      />
      <StatCard
        label="总收入"
        value={stats.totalIncome}
        unit="¥"
        trend={stats.incomeVsLastMonth}
      />
      <StatCard
        label="净储蓄"
        value={stats.netSavings}
        unit="¥"
        trend={stats.savingsVsLastMonth}
      />
      <StatCard
        label="交易笔数"
        value={stats.transactionCount}
        unit="笔"
      />
      <StatCard
        label="日均支出"
        value={stats.avgDailyExpense}
        unit="¥"
      />
      <StatCard
        label="最大支出"
        value={stats.maxExpense}
        unit="¥"
      />
    </div>
  );
}

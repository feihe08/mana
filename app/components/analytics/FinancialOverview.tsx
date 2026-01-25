/**
 * 财务健康概览卡片
 * 用大字和图标快速展示财务状况
 */

interface FinancialOverviewProps {
  totalExpenses: number;
  totalIncome: number;
  netSavings: number;
  expensesVsLastMonth?: number; // vs上月百分比
  incomeVsLastMonth?: number;
  savingsVsLastMonth?: number;
}

function FinancialOverview({
  totalExpenses,
  totalIncome,
  netSavings,
  expensesVsLastMonth,
  incomeVsLastMonth,
  savingsVsLastMonth,
}: FinancialOverviewProps) {
  // 计算储蓄率
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  // 判断财务健康状态
  const getHealthStatus = () => {
    if (netSavings < 0) {
      return { status: 'danger', text: '赤字警告', color: 'text-red-400', bg: 'bg-red-500/10' };
    } else if (savingsRate < 10) {
      return { status: 'warning', text: '储蓄偏低', color: 'text-yellow-400', bg: 'bg-yellow-500/10' };
    } else if (savingsRate < 30) {
      return { status: 'good', text: '状况良好', color: 'text-green-400', bg: 'bg-green-500/10' };
    } else {
      return { status: 'excellent', text: '财务健康', color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
    }
  };

  const health = getHealthStatus();

  // 趋势箭头
  const TrendArrow = ({ value }: { value?: number }) => {
    if (!value) return null;
    const isUp = value > 0;
    const isGood = isUp; // 对于收入和储蓄，上涨是好的

    if (Math.abs(value) < 1) return null; // 变化小于1%不显示

    return (
      <span className={`text-xs ${value > 0 ? 'text-green-400' : 'text-red-400'}`}>
        {value > 0 ? '↑' : '↓'} {Math.abs(value).toFixed(0)}%
      </span>
    );
  };

  return (
    <div className={`bg-gray-800 rounded-xl p-6 border border-gray-700 ${health.bg}`}>
      {/* 健康状态标签 */}
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-xl font-semibold text-white">💰 财务概览</h2>
        <div className={`px-3 py-1 rounded-full ${health.bg} border border-current`}>
          <span className={`text-sm font-medium ${health.color}`}>{health.text}</span>
        </div>
      </div>

      {/* 三列布局：支出、收入、储蓄 */}
      <div className="grid grid-cols-3 gap-6">
        {/* 支出 */}
        <div className="text-center">
          <p className="text-sm text-gray-400 mb-2">本月支出</p>
          <p className="text-3xl font-bold text-red-400 mb-1">
            ¥{Math.abs(totalExpenses).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <TrendArrow value={expensesVsLastMonth} />
        </div>

        {/* 收入 */}
        <div className="text-center">
          <p className="text-sm text-gray-400 mb-2">本月收入</p>
          <p className="text-3xl font-bold text-green-400 mb-1">
            ¥{totalIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <TrendArrow value={incomeVsLastMonth} />
        </div>

        {/* 储蓄 */}
        <div className="text-center">
          <p className="text-sm text-gray-400 mb-2">净储蓄</p>
          <p className={`text-3xl font-bold mb-1 ${netSavings >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
            ¥{netSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <div className="mt-1">
            <TrendArrow value={savingsVsLastMonth} />
            <p className={`text-xs mt-1 ${savingsRate >= 20 ? 'text-green-400' : 'text-yellow-400'}`}>
              储蓄率 {savingsRate.toFixed(0)}%
            </p>
          </div>
        </div>
      </div>

      {/* 简短建议 */}
      {netSavings < 0 && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">
            ⚠️ 本月支出超过收入，建议控制非必要开支
          </p>
        </div>
      )}

      {netSavings >= 0 && savingsRate < 10 && (
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-sm text-yellow-400">
            💡 储蓄率偏低（{savingsRate.toFixed(0)}%），建议提高至20%以上
          </p>
        </div>
      )}

      {savingsRate >= 30 && (
        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <p className="text-sm text-green-400">
            ✨ 储蓄率优秀（{savingsRate.toFixed(0)}%），继续保持！
          </p>
        </div>
      )}
    </div>
  );
}

export default FinancialOverview;

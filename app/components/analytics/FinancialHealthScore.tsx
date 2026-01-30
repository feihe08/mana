/**
 * 财务健康评分组件
 * 简化评分指标（储蓄率、稳定性、预算执行率）
 */

import type { FinancialHealthScore } from '../../lib/analytics/calculator';

interface FinancialHealthScoreProps {
  score: FinancialHealthScore;
}

function FinancialHealthScore({ score }: FinancialHealthScoreProps) {
  // 评分颜色映射
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number): string => {
    if (score >= 80) return 'bg-green-500/10';
    if (score >= 60) return 'bg-yellow-500/10';
    return 'bg-red-500/10';
  };

  const getScoreBorder = (score: number): string => {
    if (score >= 80) return 'border-green-500/30';
    if (score >= 60) return 'border-yellow-500/30';
    return 'border-red-500/30';
  };

  // 评分描述
  const getScoreDescription = (score: number): string => {
    if (score >= 80) return '优秀';
    if (score >= 60) return '良好';
    if (score >= 40) return '一般';
    return '较差';
  };

  // 格式化百分比
  const formatPercent = (value: number): string => {
    return `${value}%`;
  };

  // 维度详情
  const dimensions = [
    {
      label: '储蓄率',
      score: score.savingsRateScore,
      value: score.savingsRate,
      description: score.savingsRate >= 30
        ? '储蓄率优秀，财务状况良好'
        : score.savingsRate >= 20
        ? '储蓄率良好，继续保持'
        : score.savingsRate >= 10
        ? '储蓄率偏低，建议提高'
        : '储蓄率不足，需要改善',
    },
    {
      label: '支出稳定性',
      score: score.stabilityScore,
      value: score.expenseVariance,
      description: score.expenseVariance < 20
        ? '支出稳定，财务状况稳定'
        : score.expenseVariance < 40
        ? '支出波动较大，需要关注'
        : '支出波动剧烈，财务不稳定',
    },
    {
      label: '预算执行率',
      score: score.budgetScore,
      value: score.budgetExecutionRate,
      description: score.budgetExecutionRate <= 85
        ? '预算控制优秀，支出合理'
        : score.budgetExecutionRate <= 100
        ? '预算执行良好，符合预期'
        : score.budgetExecutionRate <= 120
        ? '预算超支，需要控制'
        : '严重超支，财务危机',
    },
  ];

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h2 className="text-xl font-semibold text-white mb-4">💯 财务健康评分</h2>

      {/* 总分 */}
      <div className="text-center mb-6">
        <div className={`inline-block p-4 rounded-full ${getScoreBg(score.totalScore)} ${getScoreBorder(score.totalScore)}`}>
          <p className={`text-4xl font-bold ${getScoreColor(score.totalScore)}`}>
            {score.totalScore}
          </p>
        </div>
        <p className={`text-lg font-medium mt-2 ${getScoreColor(score.totalScore)}`}>
          {getScoreDescription(score.totalScore)}
        </p>
      </div>

      {/* 维度评分 */}
      <div className="space-y-4">
        {dimensions.map((dimension, index) => (
          <div key={index} className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-baseline justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-300">{dimension.label}</h3>
              <span className={`text-sm font-bold ${getScoreColor(dimension.score)}`}>
                {dimension.score}分
              </span>
            </div>

            {/* 进度条 */}
            <div className="h-2 bg-gray-600 rounded-full mb-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${getScoreBg(dimension.score)}`}
                style={{ width: `${dimension.score}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">
                当前值：{formatPercent(dimension.value)}
              </span>
              <span className={`text-xs ${getScoreColor(dimension.score)}`}>
                {dimension.description}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 综合建议 */}
      <div className="mt-6 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
        <h3 className="text-sm font-medium text-purple-400 mb-2">📝 改善建议</h3>
        <ul className="text-xs text-purple-300 space-y-1">
          {score.savingsRate < 20 && (
            <li>• 建议提高储蓄率至20%以上，增加紧急备用金</li>
          )}
          {score.expenseVariance > 30 && (
            <li>• 支出波动较大，建议制定月度预算并严格执行</li>
          )}
          {score.budgetExecutionRate > 100 && (
            <li>• 预算超支，建议分析支出项目，减少非必要消费</li>
          )}
          {score.totalScore >= 80 && (
            <li>• 财务状况优秀，继续保持良好的消费习惯！</li>
          )}
        </ul>
      </div>
    </div>
  );
}

export default FinancialHealthScore;

/**
 * 支出建议组件
 * 显示智能支出建议和预计节省金额
 */

import type { ExpenseSuggestion } from '../../lib/analytics/calculator';

interface ExpenseSuggestionsProps {
  suggestions: ExpenseSuggestion[];
}

function ExpenseSuggestions({ suggestions }: ExpenseSuggestionsProps) {
  // 优先级颜色映射
  const priorityColors = {
    high: { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
    medium: { text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
    low: { text: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
  };

  // 格式化金额
  const formatAmount = (amount: number): string => {
    return amount.toLocaleString(undefined, {
      maximumFractionDigits: 0,
    });
  };

  // 计算总预计节省金额
  const totalSavings = suggestions.reduce((sum, suggestion) => sum + suggestion.potentialSavings, 0);

  if (suggestions.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-4">🎯 智能建议</h2>
        <div className="text-center py-8">
          <p className="text-gray-400 mb-2">👍 财务状况良好</p>
          <p className="text-sm text-gray-500">
            目前支出结构合理，暂无明显需要优化的项目
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h2 className="text-xl font-semibold text-white mb-4">🎯 智能建议</h2>

      {/* 总节省金额 */}
      {totalSavings > 0 && (
        <div className="mb-6 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="flex items-baseline justify-between">
            <p className="text-sm text-green-400">预计总节省</p>
            <p className="text-xl font-bold text-green-400">
              ¥{formatAmount(totalSavings)}
            </p>
          </div>
          <p className="text-xs text-green-300 mt-1">
            实施以下建议，本月可节省以上金额
          </p>
        </div>
      )}

      {/* 建议列表 */}
      <div className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg border ${priorityColors[suggestion.priority].bg} ${priorityColors[suggestion.priority].border}`}
          >
            {/* 优先级标签 */}
            <div className="flex items-center mb-2">
              <span className={`text-xs font-medium px-2 py-1 rounded ${priorityColors[suggestion.priority].bg} ${priorityColors[suggestion.priority].text}`}>
                {suggestion.priority === 'high' ? '高优先级' : suggestion.priority === 'medium' ? '中优先级' : '低优先级'}
              </span>
              <span className="ml-2 text-sm font-medium text-white">{suggestion.category}</span>
            </div>

            {/* 金额对比 */}
            <div className="flex items-baseline justify-between mb-2">
              <div>
                <p className="text-xs text-gray-400">当前支出</p>
                <p className="text-lg font-bold text-white">
                  ¥{formatAmount(suggestion.currentAmount)}
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs text-gray-400">建议支出</p>
                <p className="text-lg font-bold text-green-400">
                  ¥{formatAmount(suggestion.suggestedAmount)}
                </p>
              </div>
            </div>

            {/* 节省金额 */}
            <div className="flex items-baseline justify-between mb-2">
              <p className="text-xs text-gray-400">预计节省</p>
              <p className="text-sm font-bold text-green-400">
                ¥{formatAmount(suggestion.potentialSavings)}
              </p>
            </div>

            {/* 建议内容 */}
            <p className="text-sm text-gray-300 mt-2">
              {suggestion.recommendation}
            </p>
          </div>
        ))}
      </div>

      {/* 行动按钮 */}
      <div className="mt-6 flex space-x-2">
        <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors">
          查看详细分析
        </button>
        <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors">
          导出建议报告
        </button>
      </div>
    </div>
  );
}

export default ExpenseSuggestions;

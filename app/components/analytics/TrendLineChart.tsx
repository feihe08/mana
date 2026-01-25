/**
 * 趋势折线图
 * 显示支出和收入的月度趋势
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { MonthlyData } from '../../lib/analytics';

interface TrendLineChartProps {
  monthlyData: MonthlyData[];
  months?: number; // 显示最近几个月
}

interface ChartData {
  month: string;
  支出: number;
  收入: number;
  储蓄: number;
}

function TrendLineChart({ monthlyData, months = 6 }: TrendLineChartProps) {
  // 如果没有数据
  if (monthlyData.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-4">📈 月度趋势</h2>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-400">暂无数据</p>
        </div>
      </div>
    );
  }

  // 准备图表数据（取最近 N 个月，并反转顺序使最新月份在右侧）
  const chartData: ChartData[] = monthlyData
    .slice(-months)
    .reverse()
    .map(data => ({
      month: data.month,
      支出: Math.abs(data.expenses),
      收入: data.income,
      储蓄: data.savings,
    }));

  // 自定义 Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey}: ¥{Math.abs(entry.value).toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h2 className="text-xl font-semibold text-white mb-4">📈 月度趋势</h2>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="month"
              stroke="#9ca3af"
              fontSize={12}
            />
            <YAxis
              stroke="#9ca3af"
              fontSize={12}
              tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }}
            />
            <Line
              type="monotone"
              dataKey="支出"
              stroke="#ff7c7c"
              strokeWidth={2}
              dot={{ fill: '#ff7c7c', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="收入"
              stroke="#82ca9d"
              strokeWidth={2}
              dot={{ fill: '#82ca9d', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="储蓄"
              stroke="#8884d8"
              strokeWidth={2}
              dot={{ fill: '#8884d8', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 趋势洞察 */}
      {monthlyData.length >= 2 && (
        <div className="mt-4 p-3 bg-gray-700/50 rounded-lg">
          <p className="text-sm text-gray-300">
            💡 <span className="font-medium text-white">趋势提示</span>：
            最近{Math.min(months, monthlyData.length)}个月
            总支出 ¥{Math.abs(monthlyData.slice(-months).reduce((sum, d) => sum + d.expenses, 0)).toLocaleString()}，
            总收入 ¥{monthlyData.slice(-months).reduce((sum, d) => sum + d.income, 0).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}

export default TrendLineChart;

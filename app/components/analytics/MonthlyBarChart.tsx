/**
 * 月度对比柱状图
 * 对比显示各月的支出情况
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { MonthlyData } from '../../lib/analytics';

interface MonthlyBarChartProps {
  monthlyData: MonthlyData[];
  months?: number; // 显示最近几个月
}

interface ChartData {
  month: string;
  支出: number;
  收入: number;
}

function MonthlyBarChart({ monthlyData, months = 6 }: MonthlyBarChartProps) {
  // 如果没有数据
  if (monthlyData.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-4">📊 月度对比</h2>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-400">暂无数据</p>
        </div>
      </div>
    );
  }

  // 准备图表数据（取最近 N 个月，按时间顺序排列）
  const chartData: ChartData[] = monthlyData
    .slice(-months)
    .map(data => ({
      month: data.month,
      支出: Math.abs(data.expenses),
      收入: data.income,
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

  // 计算平均值
  const avgExpenses =
    monthlyData.slice(-months).reduce((sum, d) => sum + Math.abs(d.expenses), 0) /
    Math.min(months, monthlyData.length);
  const avgIncome =
    monthlyData.slice(-months).reduce((sum, d) => sum + d.income, 0) /
    Math.min(months, monthlyData.length);

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h2 className="text-xl font-semibold text-white mb-4">📊 月度对比</h2>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
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
            <Bar dataKey="支出" fill="#ff7c7c" radius={[4, 4, 0, 0]} />
            <Bar dataKey="收入" fill="#82ca9d" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 统计摘要 */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="p-3 bg-gray-700/50 rounded-lg text-center">
          <p className="text-xs text-gray-400 mb-1">平均月支出</p>
          <p className="text-lg font-semibold text-red-400">
            ¥{avgExpenses.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="p-3 bg-gray-700/50 rounded-lg text-center">
          <p className="text-xs text-gray-400 mb-1">平均月收入</p>
          <p className="text-lg font-semibold text-green-400">
            ¥{avgIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>
    </div>
  );
}

export default MonthlyBarChart;

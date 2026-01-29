/**
 * 支出分类饼图
 * 使用 Recharts 展示各分类的支出占比
 */

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { CategoryStats } from '../../lib/analytics';

interface CategoryPieChartProps {
  categories: CategoryStats[];
  maxItems?: number; // 最多显示多少个分类，其余归为"其他"
}

// 颜色方案（15个标准分类）
const COLORS = [
  '#8884d8', // 紫色 - 餐饮
  '#82ca9d', // 绿色 - 交通
  '#ffc658', // 黄色 - 购物
  '#ff7c7c', // 红色 - 医疗
  '#8dd1e1', // 蓝色 - 居住
  '#d0ed57', // 浅绿 - 教育
  '#ffb347', // 橙色 - 娱乐
  '#ff99cc', // 粉色 - 人情
  '#87ceeb', // 天蓝 - 通讯
  '#dda0dd', // 梅红 - 金融
  '#f0e68c', // 卡其 - 宠物
  '#98fb98', // 苍绿 - 其他
];

interface ChartData {
  name: string;
  value: number;
  percentage: number;
}

function CategoryPieChart({ categories, maxItems = 8 }: CategoryPieChartProps) {
  // 如果没有数据
  if (categories.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-4">🍰 支出分类占比</h2>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-400">暂无数据</p>
        </div>
      </div>
    );
  }

  // 准备图表数据
  let chartData: ChartData[] = categories.slice(0, maxItems).map(cat => ({
    name: cat.category,
    value: cat.amount,
    percentage: cat.percentage,
  }));

  // 如果分类数量超过 maxItems，将剩余的归为"其他"
  if (categories.length > maxItems) {
    const otherAmount = categories.slice(maxItems).reduce((sum, cat) => sum + cat.amount, 0);
    const otherCount = categories.slice(maxItems).reduce((sum, cat) => sum + cat.count, 0);
    const otherPercentage = categories.slice(maxItems).reduce((sum, cat) => sum + cat.percentage, 0);

    chartData.push({
      name: '其他',
      value: otherAmount,
      percentage: Math.round(otherPercentage * 10) / 10,
    });
  }

  // 自定义 Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium">{data.name}</p>
          <p className="text-gray-300 text-sm">
            ¥{Math.abs(data.value).toLocaleString()} ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  // 自定义 Legend
  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-300">
              {entry.value} ({entry.payload.percentage}%)
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h2 className="text-xl font-semibold text-white mb-4">🍰 支出分类占比</h2>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, payload }) => `${name} ${payload.percentage}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default CategoryPieChart;

/**
 * 分析页面
 * 显示账单的核心统计分析
 */

import { useState, useMemo } from 'react';
import { Link, useLoaderData } from 'react-router';
import { getDB } from '../lib/server';
import { getUploads } from '../lib/db/uploads';
import { getUserSettings } from '../lib/db/settings';
import {
  calculateSummary,
  aggregateByCategory,
  aggregateByMonth,
  extractTransactions,
  type Transaction,
} from '../lib/analytics';
import {
  compareWithBudget,
  type BudgetComparison,
} from '../lib/analytics/budget';
import { type DateRangeOption } from '../components/analytics/DateRangeFilter';
import {
  detectAnomalousBills,
  calculateCategoryStats,
  type Anomaly,
} from '../lib/analyzers/anomaly';
import { StatsCards } from '../components/analytics/StatsCards';
import { CategoryList } from '../components/analytics/CategoryList';
import CategoryPieChart from '../components/analytics/CategoryPieChart';
import TrendLineChart from '../components/analytics/TrendLineChart';
import MonthlyBarChart from '../components/analytics/MonthlyBarChart';
import FinancialOverview from '../components/analytics/FinancialOverview';
import { BudgetProgress } from '../components/analytics/BudgetProgress';
import { AnomalyAlert } from '../components/analytics/AnomalyAlert';
import { DateRangeFilter } from '../components/analytics/DateRangeFilter';

export function meta() {
  return [
    { title: '数据分析 - Mana' },
    { name: 'description', content: '查看账单的核心统计分析' },
  ];
}

interface AnalyticsData {
  transactions: Transaction[];
  budgets: Array<{
    category: string;
    monthlyLimit: number;
    alertThreshold: number;
  }>;
}

export async function loader(args: any) {
  const db = getDB(args);
  const uploads = await getUploads(db);

  // 获取用户设置（预算）
  const settings = await getUserSettings(db, 'default');

  return {
    transactions: extractTransactions(uploads),
    budgets: settings.budgets,
  };
}

export default function AnalyticsPage() {
  const { transactions, budgets } = useLoaderData<AnalyticsData>();
  const [dateRange, setDateRange] = useState<DateRangeOption>('current');

  // 根据时间范围筛选交易
  const filteredTransactions = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (dateRange) {
      case 'current':
        // 本月
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'last':
        // 上月
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case '3months':
        // 近3个月
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        endDate = now;
        break;
      case '6months':
        // 近6个月
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        endDate = now;
        break;
      case 'year':
        // 本年
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = now;
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = now;
    }

    return transactions.filter((tx) => {
      const txDate = new Date(tx.transactionDate);
      return txDate >= startDate && txDate <= endDate;
    });
  }, [transactions, dateRange]);

  // 计算统计数据（受时间筛选影响）
  const summary = useMemo(() => {
    if (!filteredTransactions || filteredTransactions.length === 0) {
      return null;
    }
    return calculateSummary(filteredTransactions);
  }, [filteredTransactions]);

  // 分类统计（不受时间筛选影响，始终显示所有数据）
  const categoryStats = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return [];
    }
    return aggregateByCategory(transactions);
  }, [transactions]);

  const budgetComparisons = useMemo(() => {
    if (!filteredTransactions || filteredTransactions.length === 0 || !budgets) {
      return [];
    }
    return compareWithBudget(filteredTransactions, budgets);
  }, [filteredTransactions, budgets]);

  const anomalies = useMemo(() => {
    if (!filteredTransactions || filteredTransactions.length === 0) {
      return [];
    }

    // 计算分类统计用于异常检测
    const categoryStatsMap = calculateCategoryStats(filteredTransactions);

    // 检测高额支出
    return detectAnomalousBills(filteredTransactions, categoryStatsMap);
  }, [filteredTransactions]);

  // 计算月度趋势数据（使用所有交易，不受时间筛选影响）
  const monthlyData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return [];
    }
    return aggregateByMonth(transactions, 12); // 最近12个月
  }, [transactions]);

  // 如果没有数据
  if (!transactions || transactions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

        <div className="relative container mx-auto px-4 py-8">
          {/* 标题 */}
          <div className="mb-8">
            <Link to="/" className="text-purple-400 hover:text-purple-300 inline-block mb-4">
              ← 返回首页
            </Link>
            <h1 className="text-3xl font-bold text-white mb-2">数据分析</h1>
            <p className="text-gray-400">查看账单的核心统计分析</p>
          </div>

          {/* 无数据提示 */}
          <div className="bg-gray-800 rounded-xl p-12 border border-gray-700 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-semibold text-white mb-2">暂无分析数据</h2>
            <p className="text-gray-400 mb-6">
              请先上传并转换账单文件，即可查看分析数据
            </p>
            <Link
              to="/"
              className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              开始上传账单
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 relative">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

      <div className="relative container mx-auto px-4 py-8">
        {/* 标题 */}
        <div className="mb-8">
          <Link to="/" className="text-purple-400 hover:text-purple-300 inline-block mb-4">
            ← 返回首页
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">数据分析</h1>
          <p className="text-gray-400">查看账单的核心统计分析</p>
        </div>

        {/* 时间筛选 */}
        <div className="mb-6">
          <DateRangeFilter
            currentRange={dateRange}
            onRangeChange={setDateRange}
          />
        </div>

        {/* 财务概览 - 一目了然 */}
        {summary && (
          <div className="mb-8">
            <FinancialOverview
              totalExpenses={summary.totalExpenses}
              totalIncome={summary.totalIncome}
              netSavings={summary.netSavings}
              expensesVsLastMonth={summary.expensesVsLastMonth}
              incomeVsLastMonth={summary.incomeVsLastMonth}
              savingsVsLastMonth={summary.savingsVsLastMonth}
            />
          </div>
        )}

        {/* 图表区域 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">📊 可视化分析</h2>

          {/* 第一行：饼图 */}
          {categoryStats.length > 0 && (
            <div className="mb-6">
              <CategoryPieChart categories={categoryStats} maxItems={8} />
            </div>
          )}

          {/* 第二行：折线图（月度趋势） */}
          {monthlyData.length > 0 && (
            <div className="mb-6">
              <TrendLineChart monthlyData={monthlyData} months={6} />
            </div>
          )}
        </div>

        {/* 两列布局：预算 + 异常 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 预算对比 */}
          <BudgetProgress budgets={budgetComparisons} maxItems={5} />

          {/* 异常检测 */}
          <AnomalyAlert anomalies={anomalies} />
        </div>

        {/* 底部提示 */}
        <div className="mt-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700 text-center">
          <p className="text-sm text-gray-400">
            💡 <span className="font-medium text-white">提示</span>：导出 Beancount 文件后，可使用{' '}
            <a
              href="https://beancount.github.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300"
            >
              Fava
            </a>{' '}
            查看更详细的财务分析
          </p>
        </div>
      </div>
    </div>
  );
}

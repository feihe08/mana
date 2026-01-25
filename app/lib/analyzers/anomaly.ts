/**
 * 异常检测器
 * 检测异常支出和预算超支
 */

export interface Anomaly {
  billId: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
}

export interface BillStats {
  category: string;
  average: number;
  max: number;
  count: number;
}

// 检测单笔异常支出
export function detectAnomalousBills(
  bills: Array<{
    id: string;
    amount: number;
    category: string;
  }>,
  stats: Map<string, BillStats>,
  threshold = 3 // 标准差倍数
): Anomaly[] {
  const anomalies: Anomaly[] = [];

  for (const bill of bills) {
    const categoryStats = stats.get(bill.category);

    if (!categoryStats || categoryStats.count < 3) {
      continue; // 样本太少，跳过
    }

    // 计算标准差（简化版）
    const diff = bill.amount - categoryStats.average;
    const ratio = Math.abs(diff) / categoryStats.average;

    // 检测异常高额支出
    if (bill.amount > categoryStats.max * 1.5) {
      anomalies.push({
        billId: bill.id,
        reason: `单笔支出 ${bill.amount.toFixed(2)} 元远超该类别平均值 ${categoryStats.average.toFixed(2)} 元`,
        severity: 'high',
      });
    }
  }

  return anomalies;
}

// 检测预算超支
export function detectBudgetOverruns(
  categorySpending: Map<string, number>,
  budgets: Map<string, number>
): Anomaly[] {
  const anomalies: Anomaly[] = [];

  for (const [category, spent] of categorySpending.entries()) {
    const budget = budgets.get(category);

    if (budget && spent > budget) {
      anomalies.push({
        billId: category,
        reason: `${category} 类别已支出 ${spent.toFixed(2)} 元，超出预算 ${budget.toFixed(2)} 元`,
        severity: 'medium',
      });
    }
  }

  return anomalies;
}

// 计算类别统计数据
export function calculateCategoryStats(
  bills: Array<{ category: string; amount: string | number }>
): Map<string, BillStats> {
  const categoryMap = new Map<string, Array<number>>();

  // 按类别分组
  for (const bill of bills) {
    const amount = typeof bill.amount === 'string' ? parseFloat(bill.amount) : bill.amount;
    const category = bill.category || '未分类';

    if (!categoryMap.has(category)) {
      categoryMap.set(category, []);
    }

    categoryMap.get(category)!.push(amount);
  }

  // 计算统计信息
  const stats = new Map<string, BillStats>();

  for (const [category, amounts] of categoryMap.entries()) {
    const sum = amounts.reduce((a, b) => a + b, 0);
    const average = sum / amounts.length;
    const max = Math.max(...amounts);

    stats.set(category, {
      category,
      average,
      max,
      count: amounts.length,
    });
  }

  return stats;
}

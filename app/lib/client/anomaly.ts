/**
 * 客户端异常检测器
 * 在浏览器中检测异常支出
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

export interface DetectAnomaliesOptions {
  /** 标准差倍数阈值，默认 3 */
  threshold?: number;
  /** 单笔支出超过类别平均值最大值的倍数，默认 1.5 */
  maxRatio?: number;
  /** 最小样本数，默认 3 */
  minSampleSize?: number;
}

/**
 * 主入口：检测账单中的异常
 */
export function detectAnomalies(
  bills: Array<{
    id: string;
    amount: number;
    category: string;
  }>,
  options: DetectAnomaliesOptions = {}
): Map<string, Anomaly> {
  const {
    threshold = 3,
    maxRatio = 1.5,
    minSampleSize = 3,
  } = options;

  // 1. 计算类别统计
  const stats = calculateCategoryStats(bills);

  // 2. 检测异常支出
  const anomalies = detectAnomalousBills(bills, stats, maxRatio, minSampleSize);

  // 3. 转换为 Map
  return new Map(anomalies.map(a => [a.billId, a]));
}

/**
 * 检测单笔异常支出
 */
function detectAnomalousBills(
  bills: Array<{
    id: string;
    amount: number;
    category: string;
  }>,
  stats: Map<string, BillStats>,
  maxRatio = 1.5,
  minSampleSize = 3
): Anomaly[] {
  const anomalies: Anomaly[] = [];

  for (const bill of bills) {
    const categoryStats = stats.get(bill.category);

    if (!categoryStats || categoryStats.count < minSampleSize) {
      continue; // 样本太少，跳过
    }

    // 检测异常高额支出（超过该类别最大值的 1.5 倍）
    if (bill.amount > categoryStats.max * maxRatio) {
      anomalies.push({
        billId: bill.id,
        reason: `单笔支出 ¥${bill.amount.toFixed(2)} 远超该类别平均值 ¥${categoryStats.average.toFixed(2)}`,
        severity: 'high',
      });
    }
    // 检测较高支出（超过该类别平均值但未达到异常阈值）
    else if (bill.amount > categoryStats.average * 2) {
      anomalies.push({
        billId: bill.id,
        reason: `单笔支出 ¥${bill.amount.toFixed(2)} 高于该类别平均值 ¥${categoryStats.average.toFixed(2)}`,
        severity: 'medium',
      });
    }
  }

  return anomalies;
}

/**
 * 计算类别统计数据
 */
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

/**
 * 检测预算超支（可选功能）
 */
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
        reason: `${category} 类别已支出 ¥${spent.toFixed(2)}，超出预算 ¥${budget.toFixed(2)}`,
        severity: 'medium',
      });
    }
  }

  return anomalies;
}

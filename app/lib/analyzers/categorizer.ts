/**
 * 智能分类器
 * 根据关键词自动分类账单
 */

export interface Category {
  id: string;
  name: string;
  keywords: string[];
  budget_limit: number;
}

export async function categorizeBill(
  description: string,
  categories: Category[]
): Promise<string> {
  // 默认分类
  let bestMatch = '未分类';
  let maxScore = 0;

  const normalizedDesc = description.toLowerCase();

  for (const category of categories) {
    let score = 0;

    // 检查关键词匹配
    for (const keyword of category.keywords) {
      if (normalizedDesc.includes(keyword.toLowerCase())) {
        score += 1;
      }
    }

    if (score > maxScore) {
      maxScore = score;
      bestMatch = category.name;
    }
  }

  return bestMatch;
}

// 批量分类账单
export async function categorizeBills(
  bills: Array<{ description: string }>,
  categories: Category[]
): Promise<string[]> {
  const results: string[] = [];

  for (const bill of bills) {
    const category = await categorizeBill(bill.description, categories);
    results.push(category);
  }

  return results;
}

/**
 * 数据库客户端工具
 * 适配 Cloudflare D1
 */

// 获取账单列表
export async function getBills(db: D1Database, limit = 100) {
  const result = await db
    .prepare(`
      SELECT * FROM bills
      ORDER BY transaction_date DESC
      LIMIT ?
    `)
    .bind(limit)
    .all();

  return result.results;
}

// 获取单个账单
export async function getBill(db: D1Database, id: string) {
  const result = await db
    .prepare("SELECT * FROM bills WHERE id = ?")
    .bind(id)
    .first();

  return result;
}

// 创建账单
export async function createBill(
  db: D1Database,
  bill: {
    id: string;
    source: string;
    amount: number;
    category?: string;
    description?: string;
    transactionDate: string;
    originalData?: string;
  }
) {
  await db
    .prepare(`
      INSERT INTO bills (id, source, amount, category, description, transaction_date, original_data)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      bill.id,
      bill.source,
      bill.amount,
      bill.category || 'uncategorized',
      bill.description || '',
      bill.transactionDate,
      bill.originalData || '{}'
    )
    .run();
}

// 批量创建账单
export async function createBills(db: D1Database, bills: Array<any>) {
  const stmt = db.prepare(`
    INSERT INTO bills (id, source, amount, category, description, transaction_date, original_data)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const bill of bills) {
    await stmt
      .bind(
        bill.id,
        bill.source,
        bill.amount,
        bill.category || 'uncategorized',
        bill.description || '',
        bill.transactionDate,
        JSON.stringify(bill.originalData || {})
      )
      .run();
  }
}

// 获取分类统计
export async function getCategoryStats(db: D1Database) {
  const result = await db
    .prepare(`
      SELECT
        category,
        COUNT(*) as count,
        SUM(amount) as total,
        AVG(amount) as average
      FROM bills
      GROUP BY category
      ORDER BY total DESC
    `)
    .all();

  return result.results;
}

// 检测异常
export async function detectAnomalies(db: D1Database) {
  // 检测超过预算的分类
  const result = await db
    .prepare(`
      SELECT
        c.name as category,
        c.budget_limit,
        SUM(b.amount) as spent
      FROM categories c
      JOIN bills b ON b.category = c.name
      GROUP BY c.name
      HAVING SUM(b.amount) > c.budget_limit
    `)
    .all();

  return result.results;
}

/**
 * D1 数据库操作层 - uploads 表
 */

// ========================================
// 类型定义
// ========================================

export interface Upload {
  id: string;
  original_filename: string;
  file_type: 'alipay' | 'wechat' | 'csv' | 'excel';
  upload_date: string;
  file_hash: string | null; // 文件哈希（用于去重）
  raw_file_key: string;
  bean_file_key: string;
  transaction_count: number;
  total_amount: number;
  parsed_data: string; // JSON 字符串
  created_at: string;
}

export interface UploadData {
  id: string;
  original_filename: string;
  file_type: 'alipay' | 'wechat' | 'csv' | 'excel';
  upload_date: string;
  file_hash?: string; // 文件哈希（可选）
  raw_file_key: string;
  bean_file_key: string;
  transaction_count: number;
  total_amount: number;
  parsed_data: any[]; // 解析后的账单数组
}

export interface UploadFilters {
  file_type?: 'alipay' | 'wechat' | 'csv' | 'excel';
  date_from?: string;
  date_to?: string;
  search?: string; // 搜索文件名
}

export interface UploadStats {
  total_uploads: number;
  total_transactions: number;
  total_amount: number;
  by_type: Record<string, number>;
}

// ========================================
// 数据库操作函数
// ========================================

/**
 * 保存上传记录
 */
export async function saveUpload(
  db: D1Database,
  data: UploadData
): Promise<string> {
  const stmt = db.prepare(`
    INSERT INTO uploads (
      id, original_filename, file_type, upload_date,
      file_hash, raw_file_key, bean_file_key,
      transaction_count, total_amount, parsed_data
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const parsedDataJson = JSON.stringify(data.parsed_data);

  await stmt.bind(
    data.id,
    data.original_filename,
    data.file_type,
    data.upload_date,
    data.file_hash || null,
    data.raw_file_key,
    data.bean_file_key,
    data.transaction_count,
    data.total_amount,
    parsedDataJson
  ).run();

  return data.id;
}

/**
 * 获取所有上传记录（支持筛选）
 */
export async function getUploads(
  db: D1Database,
  filters?: UploadFilters
): Promise<Upload[]> {
  let query = 'SELECT * FROM uploads WHERE 1=1';
  const params: any[] = [];

  if (filters?.file_type) {
    query += ' AND file_type = ?';
    params.push(filters.file_type);
  }

  if (filters?.date_from) {
    query += ' AND upload_date >= ?';
    params.push(filters.date_from);
  }

  if (filters?.date_to) {
    query += ' AND upload_date <= ?';
    params.push(filters.date_to);
  }

  if (filters?.search) {
    query += ' AND original_filename LIKE ?';
    params.push(`%${filters.search}%`);
  }

  query += ' ORDER BY created_at DESC';

  const stmt = db.prepare(query);
  const result = await stmt.bind(...params).all<Upload>();

  return result.results || [];
}

/**
 * 根据 ID 获取上传记录
 */
export async function getUploadById(
  db: D1Database,
  id: string
): Promise<Upload | null> {
  const stmt = db.prepare('SELECT * FROM uploads WHERE id = ?');
  const result = await stmt.bind(id).first<Upload>();

  return result || null;
}

/**
 * 删除上传记录
 */
export async function deleteUpload(
  db: D1Database,
  id: string
): Promise<boolean> {
  const stmt = db.prepare('DELETE FROM uploads WHERE id = ?');
  const result = await stmt.bind(id).run();

  return (result.meta?.changes || 0) > 0;
}

/**
 * 获取统计信息
 */
export async function getUploadStats(
  db: D1Database
): Promise<UploadStats> {
  // 总上传数
  const totalUploadsStmt = db.prepare('SELECT COUNT(*) as count FROM uploads');
  const totalUploadsResult = await totalUploadsStmt.first<{ count: number }>();
  const total_uploads = totalUploadsResult?.count || 0;

  // 总交易数和总金额
  const statsStmt = db.prepare(`
    SELECT
      SUM(transaction_count) as total_transactions,
      SUM(total_amount) as total_amount
    FROM uploads
  `);
  const statsResult = await statsStmt.first<{
    total_transactions: number;
    total_amount: number;
  }>();

  const total_transactions = statsResult?.total_transactions || 0;
  const total_amount = statsResult?.total_amount || 0;

  // 按类型分组
  const byTypeStmt = db.prepare(`
    SELECT file_type, COUNT(*) as count
    FROM uploads
    GROUP BY file_type
  `);
  const byTypeResult = await byTypeStmt.all<{ file_type: string; count: number }>();

  const by_type: Record<string, number> = {};
  for (const row of byTypeResult.results || []) {
    by_type[row.file_type] = row.count;
  }

  return {
    total_uploads,
    total_transactions,
    total_amount,
    by_type,
  };
}

/**
 * 文件哈希工具
 * 用于计算文件内容的 SHA-256 哈希值，实现文件去重
 */

/**
 * 计算文件的 SHA-256 哈希值
 * @param file 要计算哈希的文件
 * @returns 十六进制格式的哈希字符串
 */
export async function calculateFileHash(file: File): Promise<string> {
  // 读取文件内容
  const buffer = await file.arrayBuffer();

  // 使用 Web Crypto API 计算 SHA-256 哈希
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);

  // 转换为十六进制字符串
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

/**
 * 检查文件是否已存在（基于哈希）
 * @param db D1 数据库实例
 * @param fileHash 文件哈希值
 * @returns 如果文件已存在，返回已存在的上传记录；否则返回 null
 */
export async function checkFileDuplicate(
  db: D1Database,
  fileHash: string
): Promise<any | null> {
  const stmt = db.prepare('SELECT * FROM uploads WHERE file_hash = ?');
  const result = await stmt.bind(fileHash).first();
  return result || null;
}

/**
 * 格式化文件哈希为短格式（用于显示）
 * @param hash 完整的哈希字符串
 * @returns 短格式哈希（前8位 + ... + 后8位）
 */
export function formatHashShort(hash: string): string {
  if (hash.length <= 16) {
    return hash;
  }
  return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
}

/**
 * 验证哈希格式是否正确
 * @param hash 哈希字符串
 * @returns 是否为有效的 SHA-256 哈希
 */
export function isValidHash(hash: string): boolean {
  // SHA-256 哈希应该是 64 个十六进制字符
  return /^[a-f0-9]{64}$/i.test(hash);
}

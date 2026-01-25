/**
 * R2 文件存储操作层
 */

// ========================================
// 类型定义
// ========================================

export interface StoredFile {
  key: string;
  uploadId: string;
  size?: number;
}

// ========================================
// 辅助函数
// ========================================

/**
 * 生成 R2 文件路径
 */
export function generateRawFilePath(uploadId: string, filename: string): string {
  const ext = filename.split('.').pop() || 'bin';
  return `raw-files/${uploadId}/original.${ext}`;
}

export function generateBeanFilePath(uploadId: string): string {
  return `bean-files/${uploadId}.bean`;
}

/**
 * 从 key 中提取 uploadId
 */
export function extractUploadId(key: string): string {
  // raw-files/{uploadId}/original.ext
  const rawMatch = key.match(/raw-files\/([^/]+)\//);
  if (rawMatch) return rawMatch[1];

  // bean-files/{uploadId}.bean
  const beanMatch = key.match(/bean-files\/(.+)\.bean/);
  if (beanMatch) return beanMatch[1];

  throw new Error(`Invalid file key: ${key}`);
}

// ========================================
// R2 操作函数
// ========================================

/**
 * 保存原始文件到 R2
 */
export async function saveRawFile(
  bucket: R2Bucket,
  uploadId: string,
  file: File | Blob
): Promise<string> {
  const key = generateRawFilePath(uploadId, (file as File).name || 'unknown');

  await bucket.put(key, file, {
    httpMetadata: {
      contentType: file.type || 'application/octet-stream',
    },
  });

  return key;
}

/**
 * 保存 bean 文件到 R2
 */
export async function saveBeanFile(
  bucket: R2Bucket,
  uploadId: string,
  content: string
): Promise<string> {
  const key = generateBeanFilePath(uploadId);

  await bucket.put(key, content, {
    httpMetadata: {
      contentType: 'text/plain',
    },
  });

  return key;
}

/**
 * 从 R2 获取 bean 文件内容
 */
export async function getBeanFile(
  bucket: R2Bucket,
  key: string
): Promise<string | null> {
  const object = await bucket.get(key);

  if (!object) {
    return null;
  }

  const text = await object.text();
  return text;
}

/**
 * 删除上传相关的所有文件
 */
export async function deleteUploadFiles(
  bucket: R2Bucket,
  uploadId: string
): Promise<void> {
  // 列出所有相关文件
  const rawFilesList = await bucket.list({
    prefix: `raw-files/${uploadId}/`,
  });

  const beanFileKey = generateBeanFilePath(uploadId);

  // 删除原始文件
  const deletePromises: Promise<any>[] = [];

  if (rawFilesList.objects) {
    for (const object of rawFilesList.objects) {
      deletePromises.push(bucket.delete(object.key));
    }
  }

  // 删除 bean 文件
  deletePromises.push(bucket.delete(beanFileKey));

  await Promise.all(deletePromises);
}

/**
 * 获取文件大小（用于统计）
 */
export async function getFileSize(
  bucket: R2Bucket,
  key: string
): Promise<number | null> {
  const object = await bucket.head(key);

  if (!object) {
    return null;
  }

  return object.size || null;
}

/**
 * 检查文件是否存在
 */
export async function fileExists(
  bucket: R2Bucket,
  key: string
): Promise<boolean> {
  const object = await bucket.head(key);
  return object !== null;
}

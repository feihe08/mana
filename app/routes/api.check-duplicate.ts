/**
 * 检查文件是否重复的 API
 * POST /api/check-duplicate
 */

import { getDB } from '../lib/server';
import { checkFileDuplicate } from '../lib/utils/file-hash';

export async function loader({ request, context }: any) {
  // 允许 POST 请求（React Router v7 要求使用 action 处理 POST）
  if (request.method === 'POST') {
    return action({ request, context });
  }

  return Response.json({ error: '方法不允许' }, { status: 405 });
}

export async function action({ request, context }: any) {
  try {
    const db = getDB({ context });
    const { fileHash } = await request.json();

    if (!fileHash) {
      return Response.json(
        { error: '缺少必要参数：fileHash' },
        { status: 400 }
      );
    }

    // 检查文件是否重复
    const duplicate = await checkFileDuplicate(db, fileHash);

    return Response.json({
      isDuplicate: !!duplicate,
      existingUpload: duplicate ? {
        id: duplicate.id,
        filename: duplicate.original_filename,
        uploadDate: duplicate.upload_date,
        transactionCount: duplicate.transaction_count,
        totalAmount: duplicate.total_amount,
      } : null,
    });
  } catch (error) {
    console.error('检查文件重复错误:', error);
    return Response.json(
      {
        error: '检查失败',
        message: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

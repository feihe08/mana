/**
 * 检查文件是否重复 API
 * POST /api/check-duplicate
 *
 * 接收文件哈希，返回是否重复
 */

import type { Route } from './+types/api.check-duplicate';
import { getDB } from '../lib/server';
import { checkFileDuplicate } from '../lib/utils/file-hash';

export async function action({ request, context }: Route.ActionArgs) {
  try {
    const db = getDB({ context });
    const body = await request.json() as { fileHash: string };
    const { fileHash } = body;

    if (!fileHash) {
      return Response.json(
        { error: '缺少必要参数：fileHash' },
        { status: 400 }
      );
    }

    // 检查文件是否已存在
    const duplicate = await checkFileDuplicate(db, fileHash);

    if (duplicate) {
      return Response.json({
        isDuplicate: true,
        existingUpload: {
          id: duplicate.id,
          filename: duplicate.original_filename,
          uploadDate: duplicate.upload_date,
          transactionCount: duplicate.transaction_count,
          totalAmount: duplicate.total_amount,
        },
      });
    }

    return Response.json({
      isDuplicate: false,
    });
  } catch (error) {
    console.error('Check duplicate error:', error);
    return Response.json(
      {
        error: '检查失败',
        message: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

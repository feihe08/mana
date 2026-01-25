/**
 * 删除上传记录 API
 * POST /api/delete-upload
 *
 * 请求参数（FormData）：
 * - id: 上传记录 ID
 */

import type { ActionFunctionArgs } from 'react-router';
import { getDB, getBucket } from '../lib/server';
import { deleteUpload as deleteFromDB } from '../lib/db/uploads';
import { deleteUploadFiles } from '../lib/storage/files';

export async function action({ request, context }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const id = formData.get('id') as string;

    if (!id) {
      return Response.json(
        { error: '缺少必要参数：id' },
        { status: 400 }
      );
    }

    const db = getDB(context);
    const bucket = getBucket(context);

    // 1. 先删除 R2 文件
    await deleteUploadFiles(bucket, id);

    // 2. 再删除 D1 记录
    const deleted = await deleteFromDB(db, id);

    if (!deleted) {
      return Response.json(
        { error: '未找到指定的上传记录' },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      message: '删除成功',
    });
  } catch (error) {
    console.error('Delete upload error:', error);
    return Response.json(
      {
        error: '删除失败',
        message: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

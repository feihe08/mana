/**
 * 下载 bean 文件 API
 * GET /api/download?id={uploadId}
 */

import type { LoaderFunctionArgs } from 'react-router';
import { getDB, getBucket } from '../lib/server';
import { getUploadById } from '../lib/db/uploads';
import { getBeanFile } from '../lib/storage/files';

export async function loader({ request, context }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response('缺少必要参数：id', { status: 400 });
    }

    const db = getDB(context);
    const bucket = getBucket(context);

    // 1. 查询上传记录
    const upload = await getUploadById(db, id);

    if (!upload) {
      return new Response('未找到指定的上传记录', { status: 404 });
    }

    // 2. 从 R2 读取 bean 文件内容
    const content = await getBeanFile(bucket, upload.bean_file_key);

    if (!content) {
      return new Response('bean 文件不存在', { status: 404 });
    }

    // 3. 返回文件下载响应
    return new Response(content, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(upload.original_filename)}.bean"`,
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return new Response(
      error instanceof Error ? error.message : '下载失败',
      { status: 500 }
    );
  }
}

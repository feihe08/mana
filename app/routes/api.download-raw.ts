/**
 * 下载原始账单文件 API
 * GET /api/download-raw?id={uploadId}
 */

import { getDB, getBucket } from '../lib/server';
import { getUploadById } from '../lib/db/uploads';

export async function loader(args: any) {
  try {
    const request = args.request;
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response('缺少必要参数：id', { status: 400 });
    }

    const db = getDB(args);
    const bucket = getBucket(args);

    // 1. 查询上传记录
    const upload = await getUploadById(db, id);

    if (!upload) {
      return new Response('未找到指定的上传记录', { status: 404 });
    }

    // 2. 从 R2 读取原始文件
    const object = await bucket.get(upload.raw_file_key);

    if (!object) {
      return new Response('原始文件不存在', { status: 404 });
    }

    // 3. 读取文件内容
    const blob = await object.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // 4. 返回文件下载响应
    return new Response(buffer, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(upload.original_filename)}"`,
      },
    });
  } catch (error) {
    console.error('Download raw file error:', error);
    return new Response(
      error instanceof Error ? error.message : '下载失败',
      { status: 500 }
    );
  }
}

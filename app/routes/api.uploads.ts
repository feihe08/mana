/**
 * 上传记录列表查询 API
 * GET /api/uploads
 *
 * 支持的查询参数：
 * - file_type: 文件类型筛选 (alipay|wechat|csv|excel)
 * - date_from: 开始日期 (YYYY-MM-DD)
 * - date_to: 结束日期 (YYYY-MM-DD)
 * - search: 文件名搜索关键词
 */

import { getDB } from '../lib/server';
import { getUploads, type UploadFilters } from '../lib/db/uploads';

export async function loader(args: any) {
  try {
    const db = getDB(args);

    // 解析查询参数
    const request = args.request;
    const url = new URL(request.url);
    const filters: UploadFilters = {};

    const file_type = url.searchParams.get('file_type');
    if (file_type && ['alipay', 'wechat', 'csv', 'excel'].includes(file_type)) {
      filters.file_type = file_type as any;
    }

    const date_from = url.searchParams.get('date_from');
    if (date_from) {
      filters.date_from = date_from;
    }

    const date_to = url.searchParams.get('date_to');
    if (date_to) {
      filters.date_to = date_to;
    }

    const search = url.searchParams.get('search');
    if (search) {
      filters.search = search;
    }

    // 查询上传记录
    const uploads = await getUploads(db, filters);

    return Response.json({
      uploads,
      count: uploads.length,
    });
  } catch (error) {
    console.error('Get uploads error:', error);
    return Response.json(
      {
        error: '查询失败',
        message: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

/**
 * 文件上传 API
 * POST /api/upload
 */

import { getDB, getBucket } from '../lib/server';
import { saveUpload } from '../lib/db/uploads';
import { saveRawFile, saveBeanFile } from '../lib/storage/files';
import { convertBillsToBeancount } from '../lib/pipeline/conversion-pipeline';

export async function action(args: any) {
  try {
    const db = getDB(args);
    const bucket = getBucket(args);
    const request = args.request;

    // 1. 接收文件和解析后的数据
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const billsJson = formData.get('bills') as string;
    const fileType = formData.get('fileType') as string;

    if (!file || !billsJson || !fileType) {
      return Response.json(
        { error: '缺少必要参数：file, bills, fileType' },
        { status: 400 }
      );
    }

    const bills = JSON.parse(billsJson);

    if (!Array.isArray(bills) || bills.length === 0) {
      return Response.json(
        { error: 'bills 必须是非空数组' },
        { status: 400 }
      );
    }

    // 2. 生成上传 ID
    const uploadId = `upload-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // 3. 保存原始文件到 R2
    const rawKey = await saveRawFile(bucket, uploadId, file);

    // 4. 生成 beancount 内容
    const result = await convertBillsToBeancount(bills, { sourceType: fileType as any });

    // 5. 保存 bean 文件到 R2
    const beanKey = await saveBeanFile(bucket, uploadId, result.beancountContent);

    // 6. 计算总金额
    const totalAmount = bills.reduce((sum: number, b: any) => sum + (b.amount || 0), 0);

    // 7. 保存元数据到 D1
    await saveUpload(db, {
      id: uploadId,
      original_filename: file.name,
      file_type: fileType as 'alipay' | 'wechat' | 'csv' | 'excel',
      upload_date: new Date().toISOString().split('T')[0],
      raw_file_key: rawKey,
      bean_file_key: beanKey,
      transaction_count: bills.length,
      total_amount: totalAmount,
      parsed_data: bills,
    });

    // 8. 返回上传记录 ID 和 bean 内容
    return Response.json({
      uploadId,
      success: true,
      beancountContent: result.beancountContent,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return Response.json(
      {
        error: '上传失败',
        message: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

/**
 * 文件上传 API
 * POST /api/upload
 */

import { getDB, getBucket } from '../lib/server';
import { saveUpload, getAllTransactions } from '../lib/db/uploads';
import { saveRawFile, saveBeanFile } from '../lib/storage/files';
import { convertBillsToBeancount } from '../lib/pipeline/conversion-pipeline';
import { validateFile, formatValidationError } from '../lib/utils/file-validation';
import { validateBills, formatValidationErrors, sanitizeBills } from '../lib/utils/data-validation';
import { deduplicateBills, generateDeduplicationReport } from '../lib/utils/deduplication';

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

    // 2. 验证文件
    const fileValidation = validateFile(file);
    if (!fileValidation.valid) {
      const errorMessage = formatValidationError(fileValidation.error);
      return Response.json(
        {
          error: '文件验证失败',
          message: errorMessage,
          details: fileValidation.error,
        },
        { status: 400 }
      );
    }

    // 3. 解析账单数据
    let bills;
    try {
      bills = JSON.parse(billsJson);
    } catch (parseError) {
      return Response.json(
        {
          error: '数据解析失败',
          message: '无法解析账单数据，请确保数据格式正确',
        },
        { status: 400 }
      );
    }

    // 4. 验证账单数据
    const dataValidation = validateBills(bills);
    if (!dataValidation.valid) {
      const errorMessage = formatValidationErrors(dataValidation.errors);
      return Response.json(
        {
          error: '数据验证失败',
          message: errorMessage,
          details: dataValidation.errors,
          errorCount: dataValidation.errors.length,
        },
        { status: 400 }
      );
    }

    // 5. 清理数据（移除无效记录，如果有）
    const { valid: cleanBills, invalid } = sanitizeBills(bills);
    if (invalid > 0) {
      console.warn(`清理了 ${invalid} 条无效记录，保留 ${cleanBills.length} 条有效记录`);
    }

    if (cleanBills.length === 0) {
      return Response.json(
        {
          error: '数据验证失败',
          message: '未找到有效的账单记录，请检查文件格式',
        },
        { status: 400 }
      );
    }

    // 6. 去重：与历史记录对比
    console.log('🔍 开始去重检查...');
    const existingTransactions = await getAllTransactions(db);
    console.log(`📊 历史记录数量: ${existingTransactions.length}`);

    const deduplicationResult = deduplicateBills(cleanBills, existingTransactions);
    const deduplicationReport = generateDeduplicationReport(deduplicationResult);

    console.log(`✅ 唯一记录: ${deduplicationResult.uniqueCount}`);
    console.log(`⚠️ 重复记录: ${deduplicationResult.duplicateCount}`);
    console.log(`📈 重复率: ${deduplicationReport.duplicateRate}%`);

    // 如果所有记录都是重复的，返回提示
    if (deduplicationResult.uniqueCount === 0) {
      return Response.json(
        {
          error: '所有记录都是重复的',
          message: '上传的账单中所有交易记录都已存在，未发现新的交易',
          deduplication: deduplicationReport,
        },
        { status: 400 }
      );
    }

    // 使用去重后的唯一记录
    const uniqueBills = deduplicationResult.unique;

    // 7. 生成上传 ID
    const uploadId = `upload-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // 8. 保存原始文件到 R2
    const rawKey = await saveRawFile(bucket, uploadId, file);

    // 9. 生成 beancount 内容（使用去重后的记录）
    const result = await convertBillsToBeancount(uniqueBills, { sourceType: fileType as any });

    // 10. 保存 bean 文件到 R2
    const beanKey = await saveBeanFile(bucket, uploadId, result.beancountContent);

    // 11. 计算总金额（使用去重后的记录）
    const totalAmount = uniqueBills.reduce((sum: number, b: any) => sum + (b.amount || 0), 0);

    // 12. 保存元数据到 D1（使用去重后的记录）
    await saveUpload(db, {
      id: uploadId,
      original_filename: file.name,
      file_type: fileType as 'alipay' | 'wechat' | 'csv' | 'excel',
      upload_date: new Date().toISOString().split('T')[0],
      raw_file_key: rawKey,
      bean_file_key: beanKey,
      transaction_count: uniqueBills.length,
      total_amount: totalAmount,
      parsed_data: uniqueBills,
    });

    // 13. 返回上传记录 ID、bean 内容和去重统计
    return Response.json({
      uploadId,
      success: true,
      beancountContent: result.beancountContent,
      stats: {
        totalRecords: bills.length,
        validRecords: cleanBills.length,
        invalidRecords: invalid,
        uniqueRecords: uniqueBills.length,
        duplicateRecords: deduplicationResult.duplicateCount,
      },
      deduplication: deduplicationReport,
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

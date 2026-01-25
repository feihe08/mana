/**
 * 文件验证工具
 * 用于验证上传文件的合法性
 */

/**
 * 文件大小限制（字节）
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * 允许的文件扩展名
 */
export const ALLOWED_EXTENSIONS = [
  '.csv',
  '.xlsx',
  '.xls',
  '.txt',
];

/**
 * 允许的 MIME 类型
 */
export const ALLOWED_MIME_TYPES = [
  'text/csv',
  'text/plain',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/octet-stream',
];

/**
 * 文件验证错误类型
 */
export enum FileValidationError {
  TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_TYPE = 'INVALID_FILE_TYPE',
  INVALID_EXTENSION = 'INVALID_EXTENSION',
  EMPTY_FILE = 'EMPTY_FILE',
}

/**
 * 文件验证结果
 */
export interface ValidationResult {
  valid: boolean;
  error?: {
    type: FileValidationError;
    message: string;
  };
}

/**
 * 验证文件大小
 */
export function validateFileSize(file: File): ValidationResult {
  if (file.size === 0) {
    return {
      valid: false,
      error: {
        type: FileValidationError.EMPTY_FILE,
        message: '文件为空，请检查文件是否损坏',
      },
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: {
        type: FileValidationError.TOO_LARGE,
        message: `文件过大（${sizeMB}MB），最大允许 ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      },
    };
  }

  return { valid: true };
}

/**
 * 验证文件扩展名
 */
export function validateFileExtension(filename: string): ValidationResult {
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));

  if (!extension) {
    return {
      valid: false,
      error: {
        type: FileValidationError.INVALID_EXTENSION,
        message: '文件缺少扩展名，无法识别文件类型',
      },
    };
  }

  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: {
        type: FileValidationError.INVALID_EXTENSION,
        message: `不支持的文件类型：${extension}，允许的类型：${ALLOWED_EXTENSIONS.join(', ')}`,
      },
    };
  }

  return { valid: true };
}

/**
 * 验证 MIME 类型
 */
export function validateMimeType(file: File): ValidationResult {
  // 有些浏览器可能不提供 MIME 类型，或者提供 'application/octet-stream'
  // 这种情况下我们依赖文件扩展名验证
  if (!file.type || file.type === 'application/octet-stream') {
    return { valid: true };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: {
        type: FileValidationError.INVALID_TYPE,
        message: `不支持的文件类型：${file.type}`,
      },
    };
  }

  return { valid: true };
}

/**
 * 综合文件验证
 */
export function validateFile(file: File): ValidationResult {
  // 1. 验证文件大小
  const sizeCheck = validateFileSize(file);
  if (!sizeCheck.valid) {
    return sizeCheck;
  }

  // 2. 验证文件扩展名
  const extensionCheck = validateFileExtension(file.name);
  if (!extensionCheck.valid) {
    return extensionCheck;
  }

  // 3. 验证 MIME 类型（宽松）
  const mimeCheck = validateMimeType(file);
  if (!mimeCheck.valid) {
    return mimeCheck;
  }

  return { valid: true };
}

/**
 * 格式化验证错误为用户友好的提示
 */
export function formatValidationError(error: ValidationResult['error']): string {
  if (!error) return '';

  return error.message;
}

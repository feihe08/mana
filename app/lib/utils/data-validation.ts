/**
 * 数据验证工具
 * 用于验证解析后的账单数据的合法性
 */

import type { ParsedBill } from '../parsers/csv';

/**
 * 数据验证错误类型
 */
export enum DataValidationError {
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  INVALID_DATE = 'INVALID_DATE',
  MISSING_FIELD = 'MISSING_FIELD',
  EMPTY_BILLS = 'EMPTY_BILLS',
  INVALID_STRUCTURE = 'INVALID_STRUCTURE',
}

/**
 * 验证结果
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * 验证错误详情
 */
export interface ValidationError {
  type: DataValidationError;
  message: string;
  field?: string;
  index?: number; // 在数组中的索引
}

/**
 * 验证金额字段
 */
export function validateAmount(amount: any): boolean {
  if (amount === null || amount === undefined) {
    return false;
  }

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (typeof numAmount !== 'number' || isNaN(numAmount)) {
    return false;
  }

  // 金额不能为 0（可以是很小的正数或负数）
  if (Math.abs(numAmount) < 0.01) {
    return false;
  }

  // 金额不能过大（单笔交易不超过 1000 万）
  if (Math.abs(numAmount) > 10_000_000) {
    return false;
  }

  return true;
}

/**
 * 验证日期字段
 */
export function validateDate(dateStr: string): boolean {
  if (!dateStr || typeof dateStr !== 'string') {
    return false;
  }

  const date = new Date(dateStr);

  // 检查是否是有效日期
  if (isNaN(date.getTime())) {
    return false;
  }

  // 检查日期是否在合理范围内（1990-01-01 到 2030-12-31）
  const minDate = new Date('1990-01-01');
  const maxDate = new Date('2030-12-31');

  if (date < minDate || date > maxDate) {
    return false;
  }

  return true;
}

/**
 * 验证单个账单记录
 */
export function validateBill(bill: any, index: number): ValidationError[] {
  const errors: ValidationError[] = [];

  // 检查必填字段
  if (!bill.description || typeof bill.description !== 'string') {
    errors.push({
      type: DataValidationError.MISSING_FIELD,
      message: `缺少交易描述`,
      field: 'description',
      index,
    });
  }

  // 验证金额
  if (!validateAmount(bill.amount)) {
    errors.push({
      type: DataValidationError.INVALID_AMOUNT,
      message: `金额无效：${bill.amount}（必须为非零数字）`,
      field: 'amount',
      index,
    });
  }

  // 验证日期
  if (!validateDate(bill.transactionDate)) {
    errors.push({
      type: DataValidationError.INVALID_DATE,
      message: `日期无效：${bill.transactionDate}`,
      field: 'transactionDate',
      index,
    });
  }

  return errors;
}

/**
 * 验证账单数组
 */
export function validateBills(bills: any[]): ValidationResult {
  const errors: ValidationError[] = [];

  // 检查是否为空数组
  if (!Array.isArray(bills)) {
    return {
      valid: false,
      errors: [
        {
          type: DataValidationError.INVALID_STRUCTURE,
          message: '账单数据格式错误：不是数组',
        },
      ],
    };
  }

  if (bills.length === 0) {
    return {
      valid: false,
      errors: [
        {
          type: DataValidationError.EMPTY_BILLS,
          message: '账单数据为空，未找到任何交易记录',
        },
      ],
    };
  }

  // 验证每一笔账单
  bills.forEach((bill, index) => {
    const billErrors = validateBill(bill, index);
    errors.push(...billErrors);
  });

  // 统计错误数量
  const errorCount = errors.length;

  return {
    valid: errorCount === 0,
    errors,
  };
}

/**
 * 格式化验证错误为用户友好的提示
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) {
    return '';
  }

  // 按错误类型分组
  const errorsByType = errors.reduce((acc, error) => {
    if (!acc[error.type]) {
      acc[error.type] = [];
    }
    acc[error.type].push(error);
    return acc;
  }, {} as Record<string, ValidationError[]>);

  // 生成友好提示
  const lines: string[] = [];

  if (errorsByType[DataValidationError.EMPTY_BILLS]) {
    lines.push('❌ 账单文件为空或无法解析');
  }

  if (errorsByType[DataValidationError.INVALID_AMOUNT]) {
    const amountErrors = errorsByType[DataValidationError.INVALID_AMOUNT];
    lines.push(`❌ ${amountErrors.length} 笔交易的金额无效`);
  }

  if (errorsByType[DataValidationError.INVALID_DATE]) {
    const dateErrors = errorsByType[DataValidationError.INVALID_DATE];
    lines.push(`❌ ${dateErrors.length} 笔交易的日期无效`);
  }

  if (errorsByType[DataValidationError.MISSING_FIELD]) {
    const fieldErrors = errorsByType[DataValidationError.MISSING_FIELD];
    lines.push(`❌ ${fieldErrors.length} 笔交易缺少必填字段`);
  }

  // 如果错误超过 5 条，显示统计信息
  if (errors.length > 5) {
    lines.push(`\n📊 共发现 ${errors.length} 个错误，请检查文件格式`);
  } else {
    // 显示详细错误（前 5 条）
    lines.push('\n详细错误：');
    errors.slice(0, 5).forEach((error) => {
      const prefix = error.index !== undefined ? `[第 ${error.index + 1} 条] ` : '';
      lines.push(`  ${prefix}${error.message}`);
    });
  }

  return lines.join('\n');
}

/**
 * 清理无效的账单记录
 */
export function sanitizeBills(bills: any[]): { valid: ParsedBill[]; invalid: number } {
  const valid: ParsedBill[] = [];
  let invalid = 0;

  bills.forEach((bill) => {
    const errors = validateBill(bill, 0);
    if (errors.length === 0) {
      valid.push(bill as ParsedBill);
    } else {
      invalid++;
    }
  });

  return { valid, invalid };
}

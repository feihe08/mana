/**
 * 账单转换管道
 *
 * 将账单文件转换为 Beancount 格式的完整流程：
 * 1. 识别账单类型（支付宝/微信/银行卡/通用CSV）
 * 2. 解析账单文件
 * 3. 提取支付方式信息
 * 4. 智能分类每笔交易
 * 5. 生成 Beancount 格式
 */

import type { ParsedBill } from '../parsers/csv';
import { parseAlipayCSV } from '../parsers/alipay';
import { parseWeChatCSV } from '../parsers/wechat';
import { parseCSV } from '../parsers/csv';
import { BeancountGenerator } from '../beancount/generator';
import { AccountMapper } from '../beancount/account-mapper';
import { DEFAULT_ACCOUNT_MAPPING } from '../beancount/default-accounts';

/**
 * 账单类型
 */
export type BillSourceType = 'alipay' | 'wechat' | 'bank' | 'csv' | 'auto';

/**
 * 转换选项
 */
export interface ConversionOptions {
  /** 账单来源类型（auto 表示自动识别） */
  sourceType?: BillSourceType;
  /** 是否包含 Open 指令 */
  includeOpenDirectives?: boolean;
  /** 是否使用 AI 进行分类（作为规则匹配的补充） */
  useAI?: boolean;
  /** 自定义账户映射 */
  customAccountMapping?: Partial<typeof DEFAULT_ACCOUNT_MAPPING>;
}

/**
 * 转换结果
 */
export interface ConversionResult {
  /** 生成的 Beancount 文本 */
  beancountContent: string;
  /** 解析的账单数量 */
  billCount: number;
  /** 成功生成的交易数量 */
  transactionCount: number;
  /** 账单来源 */
  sources: string[];
  /** 使用的账户列表 */
  accountsUsed: string[];
  /** 警告信息（如有） */
  warnings: string[];
}

/**
 * 识别账单类型（基于文件名）
 */
function identifyBillType(fileName: string): BillSourceType {
  const name = fileName.toLowerCase();

  if (name.includes('支付宝') || name.includes('alipay')) {
    return 'alipay';
  }
  if (name.includes('微信') || name.includes('wechat')) {
    return 'wechat';
  }
  if (name.includes('银行卡') || name.includes('bank')) {
    return 'bank';
  }

  return 'csv'; // 默认使用通用 CSV 解析器
}

/**
 * 根据来源类型解析账单
 */
async function parseBillByType(
  file: File,
  sourceType: BillSourceType
): Promise<ParsedBill[]> {
  const type = sourceType === 'auto'
    ? identifyBillType(file.name)
    : sourceType;

  switch (type) {
    case 'alipay':
      return await parseAlipayCSV(file);
    case 'wechat':
      return await parseWeChatCSV(file);
    case 'bank':
    case 'csv':
      return await parseCSV(file);
    default:
      throw new Error(`不支持的账单类型: ${type}`);
  }
}

/**
 * 账单转换主函数
 */
export async function convertBillsToBeancount(
  files: File | File[],
  options: ConversionOptions = {}
): Promise<ConversionResult> {
  // 规范化输入
  const fileArray = Array.isArray(files) ? files : [files];
  const warnings: string[] = [];
  const sources: string[] = [];
  const accountsUsed = new Set<string>();

  // 1. 解析所有账单文件
  const allBills: ParsedBill[] = [];
  for (const file of fileArray) {
    try {
      const bills = await parseBillByType(file, options.sourceType || 'auto');
      allBills.push(...bills);
      sources.push(identifyBillType(file.name));

      // 收集支付方式账户
      bills.forEach(bill => {
        if (bill.paymentMethodInfo?.beancountAccount) {
          accountsUsed.add(bill.paymentMethodInfo.beancountAccount);
        }
      });
    } catch (error) {
      warnings.push(
        `解析文件 ${file.name} 失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }

  if (allBills.length === 0) {
    return {
      beancountContent: '; No transactions found\n',
      billCount: 0,
      transactionCount: 0,
      sources: [],
      accountsUsed: [],
      warnings: ['未解析到任何交易记录'],
    };
  }

  // 2. 创建账户映射器
  const accountMapping = {
    ...DEFAULT_ACCOUNT_MAPPING,
    ...options.customAccountMapping,
  };
  const mapper = new AccountMapper(accountMapping);

  // 3. 创建 Beancount 生成器
  const generator = new BeancountGenerator(mapper, {
    includeOpenDirectives: options.includeOpenDirectives !== false,
    currency: 'CNY',
  });

  // 4. 生成 Beancount 内容
  const beancountContent = generator.generateFromBills(allBills);

  // 5. 统计交易数量
  const transactionCount = (beancountContent.match(/^\d{4}-\d{2}-\d{2}/gm) || []).length;

  return {
    beancountContent,
    billCount: allBills.length,
    transactionCount,
    sources: [...new Set(sources)],
    accountsUsed: Array.from(accountsUsed),
    warnings,
  };
}

/**
 * 快速转换单个文件
 */
export async function quickConvert(
  file: File,
  options?: Omit<ConversionOptions, 'sourceType'>
): Promise<string> {
  const result = await convertBillsToBeancount(file, {
    ...options,
    sourceType: 'auto',
  });

  return result.beancountContent;
}

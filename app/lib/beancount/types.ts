/**
 * Beancount 类型定义
 *
 * 参考: https://beancount.github.io/docs/beancount_language_syntax.html
 */

/**
 * Beancount 账户类型（五大类）
 */
export type AccountType =
  | "Assets"      // 资产
  | "Liabilities" // 负债
  | "Equity"      // 权益
  | "Income"      // 收入
  | "Expenses";   // 费用

/**
 * 交易标记（Flag）
 */
export type TransactionFlag =
  | "*"  // 已确认（Complete）
  | "!"; // 待定/未清除（Incomplete/Pending）

/**
 * Beancount 金额单位
 */
export interface Amount {
  number: number;
  currency: string;
}

/**
 * Beancount Posting（交易行）
 */
export interface Posting {
  account: string;      // 账户完整路径，如 "Assets:Bank:Checking"
  amount?: Amount;      // 金额（可为空，表示自动计算）
  cost?: Amount;        // 成本（用于投资交易）
  price?: Amount;       // 价格（用于外币或投资）
}

/**
 * Beancount 交易（Transaction）
 */
export interface Transaction {
  date: Date;           // 交易日期
  flag: TransactionFlag;// 标记
  payee?: string;       // 交易对手（可选）
  narration: string;    // 交易描述
  tags: string[];       // 标签（可选）
  links: string[];      // 链接（可选）
  postings: Posting[];  // 交易行（至少 2 个）
}

/**
 * Beancount 条目类型联合
 */
export type Directive = Transaction;

/**
 * 账户映射配置
 */
export interface AccountMappingConfig {
  /** 支付方式到账户的映射 */
  paymentMethodToAccount: Record<string, string>;

  /** 分类规则 */
  categoryRules: CategoryRule[];

  /** 默认费用账户（当无法分类时使用） */
  defaultExpenseAccount: string;

  /** 默认收入账户 */
  defaultIncomeAccount: string;

  /** 默认资产账户（当无法识别支付方式时使用） */
  defaultAssetAccount: string;
}

/**
 * 分类规则
 */
export interface CategoryRule {
  /** 匹配模式（正则表达式或字符串） */
  pattern: RegExp | string;

  /** 目标账户 */
  account: string;

  /** 优先级（数字越大优先级越高） */
  priority?: number;

  /** 规则描述 */
  description?: string;
}

/**
 * 支付方式信息
 */
export interface PaymentMethodInfo {
  /** 银行/支付平台名称 */
  bankName: string;
  /** 支付类型（信用卡/储蓄卡/余额等） */
  paymentType: string;
  /** 卡号后四位 */
  lastFourDigits?: string;
  /** 完整的支付方式描述 */
  fullDescription: string;
  /** 标准化的 Beancount 账户名 */
  beancountAccount: string;
}

/**
 * 解析后的账单数据（来自现有 Parser）
 */
export interface ParsedBill {
  id: string;
  amount: number;
  description: string;
  transactionDate: string;
  originalData: Record<string, any>;
  /** 数据来源（wechat, alipay, bank, csv） */
  source?: string;
  /** 已分类的类别 */
  category?: string;
  /** 支付方式信息（如果可提取） */
  paymentMethodInfo?: PaymentMethodInfo;
}

/**
 * Beancount 生成选项
 */
export interface GenerateOptions {
  /** 文件头部信息（可选） */
  header?: {
    author?: string;
    title?: string;
    description?: string;
  };

  /** 是否包含 open 指令 */
  includeOpenDirectives?: boolean;

  /** 自定义账户映射配置 */
  accountMapping?: Partial<AccountMappingConfig>;

  /** 货币代码（默认 CNY） */
  currency?: string;
}

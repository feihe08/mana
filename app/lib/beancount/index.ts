/**
 * Beancount 模块导出
 */

// 类型
export type {
  AccountType,
  TransactionFlag,
  Amount,
  Posting,
  Transaction,
  Directive,
  AccountMappingConfig,
  CategoryRule,
  ParsedBill,
  PaymentMethodInfo,
  GenerateOptions,
} from "./types";

// 核心生成器
export {
  BeancountGenerator,
  generateBeancount,
  billToTransaction,
} from "./generator";

// 账户映射
export {
  AccountMapper,
  getAssetAccount,
  getCategoryAccount,
  mapBillToAccounts,
} from "./account-mapper";

// 默认配置
export {
  DEFAULT_ACCOUNT_MAPPING,
  COMMON_ACCOUNTS,
  getDefaultAccountMapping,
  getCategoryRules,
} from "./default-accounts";

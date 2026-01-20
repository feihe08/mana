/**
 * 账户映射器
 *
 * 负责将原始账单数据映射到 Beancount 账户
 */

import type { AccountMappingConfig, ParsedBill } from "./types";
import { getDefaultAccountMapping, getCategoryRules } from "./default-accounts";

/**
 * 账户映射器类
 */
export class AccountMapper {
  private config: AccountMappingConfig;

  constructor(config?: Partial<AccountMappingConfig>) {
    const defaultConfig = getDefaultAccountMapping();
    this.config = {
      ...defaultConfig,
      ...config,
    };
  }

  /**
   * 根据账单来源获取资产账户
   */
  getAssetAccount(source?: string): string {
    if (!source) {
      return this.config.defaultAssetAccount;
    }

    // 支付方式映射
    const mapped = this.config.paymentMethodToAccount[source.toLowerCase()];
    if (mapped) {
      return mapped;
    }

    // 默认资产账户
    return this.config.defaultAssetAccount;
  }

  /**
   * 根据描述获取费用/收入账户
   */
  getCategoryAccount(description: string, amount: number): string {
    // 支出为负数，收入为正数
    const isExpense = amount < 0;

    if (!isExpense) {
      return this.config.defaultIncomeAccount;
    }

    // 尝试规则匹配
    for (const rule of getCategoryRules()) {
      if (this.matchPattern(rule.pattern, description)) {
        return rule.account;
      }
    }

    // 未找到匹配规则，返回默认费用账户
    return this.config.defaultExpenseAccount;
  }

  /**
   * 模式匹配（支持字符串和正则表达式）
   */
  private matchPattern(pattern: RegExp | string, text: string): boolean {
    if (pattern instanceof RegExp) {
      return pattern.test(text);
    }

    // 字符串匹配（不区分大小写）
    return text.toLowerCase().includes(pattern.toLowerCase());
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<AccountMappingConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  /**
   * 获取当前配置
   */
  getConfig(): AccountMappingConfig {
    return { ...this.config };
  }
}

/**
 * 快捷函数：获取资产账户
 */
export function getAssetAccount(source?: string): string {
  const mapper = new AccountMapper();
  return mapper.getAssetAccount(source);
}

/**
 * 快捷函数：获取分类账户
 */
export function getCategoryAccount(description: string, amount: number): string {
  const mapper = new AccountMapper();
  return mapper.getCategoryAccount(description, amount);
}

/**
 * 快捷函数：智能映射账单到账户
 *
 * @param bill 账单数据
 * @returns [资产账户, 分类账户]
 */
export function mapBillToAccounts(bill: ParsedBill): [string, string] {
  const mapper = new AccountMapper();

  const assetAccount = mapper.getAssetAccount(bill.source);
  const categoryAccount = mapper.getCategoryAccount(
    bill.description,
    bill.amount
  );

  return [assetAccount, categoryAccount];
}

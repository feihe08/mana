/**
 * AI 分类器
 *
 * 使用 Cloudflare Workers AI 进行交易分类
 */

import type { CategoryRule } from "../beancount/types";
import { getCategoryRules } from "../beancount/default-accounts";

/**
 * AI 分类请求
 */
export interface AICategorizeRequest {
  description: string;
  amount: number;
  availableAccounts: string[];
}

/**
 * AI 分类响应
 */
export interface AICategorizeResponse {
  account: string;
  confidence: number;
  reasoning?: string;
}

/**
 * Cloudflare AI API 端点
 */
const AI_API_ENDPOINT = "/api/categorize";

/**
 * AI 分类器类
 */
export class AICategorizer {
  private availableAccounts: string[];
  private fallbackAccount: string;

  constructor(options?: {
    availableAccounts?: string[];
    fallbackAccount?: string;
  }) {
    this.availableAccounts =
      options?.availableAccounts || this.extractAccountsFromRules();
    this.fallbackAccount = options?.fallbackAccount || "Expenses:Uncategorized";
  }

  /**
   * 使用 AI 对交易进行分类
   */
  async categorize(
    description: string,
    amount: number,
    signal?: AbortSignal
  ): Promise<AICategorizeResponse> {
    try {
      const request: AICategorizeRequest = {
        description,
        amount,
        availableAccounts: this.availableAccounts,
      };

      const response = await fetch(AI_API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
        signal,
      });

      if (!response.ok) {
        throw new Error(`AI API 请求失败: ${response.statusText}`);
      }

      const result = await response.json() as AICategorizeResponse;

      return {
        account: result.account || this.fallbackAccount,
        confidence: result.confidence || 0.5,
        reasoning: result.reasoning,
      };
    } catch (error) {
      console.error("AI 分类失败:", error);
      // 降级：返回默认账户
      return {
        account: this.fallbackAccount,
        confidence: 0,
        reasoning: "AI 服务不可用，使用默认账户",
      };
    }
  }

  /**
   * 批量分类
   */
  async categorizeBatch(
    items: Array<{ description: string; amount: number }>,
    signal?: AbortSignal
  ): Promise<AICategorizeResponse[]> {
    return Promise.all(
      items.map((item) => this.categorize(item.description, item.amount, signal))
    );
  }

  /**
   * 从规则中提取可用账户
   */
  private extractAccountsFromRules(): string[] {
    const rules = getCategoryRules();
    const accounts = new Set<string>();

    rules.forEach((rule) => {
      accounts.add(rule.account);
    });

    // 添加常用账户
    accounts.add("Expenses:Uncategorized");
    accounts.add("Income:Other");
    accounts.add("Assets:Cash");

    return Array.from(accounts);
  }

  /**
   * 更新可用账户列表
   */
  setAvailableAccounts(accounts: string[]): void {
    this.availableAccounts = accounts;
  }
}

/**
 * 快捷函数：AI 分类单个交易
 */
export async function categorizeByAI(
  description: string,
  amount: number,
  options?: {
    fallbackAccount?: string;
    signal?: AbortSignal;
  }
): Promise<string> {
  const categorizer = new AICategorizer({
    fallbackAccount: options?.fallbackAccount,
  });

  const result = await categorizer.categorize(
    description,
    amount,
    options?.signal
  );

  return result.account;
}

/**
 * 快捷函数：智能分类（规则优先，AI fallback）
 *
 * @param description 交易描述
 * @param amount 金额
 * @param signal AbortController（可选）
 * @returns 分类账户
 */
export async function smartCategorize(
  description: string,
  amount: number,
  signal?: AbortSignal
): Promise<string> {
  // 1. 尝试规则匹配（快速、免费）
  const ruleAccount = matchByRules(description, amount);
  if (ruleAccount) {
    return ruleAccount;
  }

  // 2. 规则失败时使用 AI
  try {
    return await categorizeByAI(description, amount, { signal });
  } catch (error) {
    console.error("AI 分类失败，使用默认账户:", error);
    return "Expenses:Uncategorized";
  }
}

/**
 * 基于规则匹配分类（内部函数）
 */
function matchByRules(description: string, amount: number): string | null {
  const rules = getCategoryRules();

  for (const rule of rules) {
    const pattern = rule.pattern instanceof RegExp
      ? rule.pattern
      : new RegExp(rule.pattern, "i");

    if (pattern.test(description)) {
      return rule.account;
    }
  }

  return null;
}

/**
 * 判断是否应该使用 AI（启发式）
 *
 * 如果描述包含以下特征，规则匹配可能不够准确，建议使用 AI：
 * - 长度超过 20 个字符
 * - 包含英文或数字
 * - 不是常见的支付平台名称
 */
export function shouldUseAI(description: string): boolean {
  // 长描述
  if (description.length > 20) {
    return true;
  }

  // 包含英文或数字
  if (/[a-zA-Z0-9]/.test(description)) {
    return true;
  }

  return false;
}

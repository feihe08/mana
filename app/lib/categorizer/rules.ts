/**
 * 规则引擎
 *
 * 基于关键词的交易分类
 */

import type { CategoryRule } from "../beancount/types";
import { getCategoryRules as getDefaultRules } from "../beancount/default-accounts";

/**
 * 规则引擎类
 */
export class RulesEngine {
  private rules: CategoryRule[];

  constructor(customRules?: CategoryRule[]) {
    // 合并默认规则和自定义规则
    const defaultRules = getDefaultRules();
    this.rules = customRules
      ? [...defaultRules, ...customRules]
      : defaultRules;

    // 按优先级排序（降序）
    this.sortByPriority();
  }

  /**
   * 根据描述匹配账户
   *
   * @param description 交易描述
   * @returns 匹配的账户，如果未匹配返回 null
   */
  match(description: string): string | null {
    for (const rule of this.rules) {
      if (this.testPattern(rule.pattern, description)) {
        return rule.account;
      }
    }

    return null;
  }

  /**
   * 批量匹配
   */
  matchBatch(descriptions: string[]): Array<string | null> {
    return descriptions.map((desc) => this.match(desc));
  }

  /**
   * 测试模式是否匹配
   */
  private testPattern(pattern: RegExp | string, text: string): boolean {
    if (pattern instanceof RegExp) {
      return pattern.test(text);
    }

    // 字符串匹配（不区分大小写）
    return text.toLowerCase().includes(pattern.toLowerCase());
  }

  /**
   * 按优先级排序规则
   */
  private sortByPriority(): void {
    this.rules.sort((a, b) => {
      const priorityA = a.priority || 0;
      const priorityB = b.priority || 0;
      return priorityB - priorityA; // 降序
    });
  }

  /**
   * 添加自定义规则
   */
  addRule(rule: CategoryRule): void {
    this.rules.push(rule);
    this.sortByPriority();
  }

  /**
   * 批量添加规则
   */
  addRules(rules: CategoryRule[]): void {
    this.rules.push(...rules);
    this.sortByPriority();
  }

  /**
   * 移除规则（按账户名）
   */
  removeRule(account: string): void {
    this.rules = this.rules.filter((rule) => rule.account !== account);
  }

  /**
   * 获取所有规则
   */
  getRules(): CategoryRule[] {
    return [...this.rules];
  }

  /**
   * 重置为默认规则
   */
  reset(): void {
    this.rules = getDefaultRules();
    this.sortByPriority();
  }

  /**
   * 导出规则配置（用于持久化）
   */
  export(): CategoryRule[] {
    return this.rules.map((rule) => ({
      ...rule,
      // 将 RegExp 转换为字符串以便序列化
      pattern: rule.pattern instanceof RegExp
        ? rule.pattern.source
        : rule.pattern,
    }));
  }

  /**
   * 导入规则配置
   */
  import(rules: Array<{ pattern: string; account: string; priority?: number }>): void {
    this.rules = rules.map((rule) => ({
      ...rule,
      pattern: new RegExp(rule.pattern, "i"), // 不区分大小写
    }));

    this.sortByPriority();
  }

  /**
   * 验证规则语法
   */
  static validateRule(rule: CategoryRule): { valid: boolean; error?: string } {
    if (!rule.pattern) {
      return { valid: false, error: "模式不能为空" };
    }

    if (!rule.account) {
      return { valid: false, error: "账户不能为空" };
    }

    // 验证账户格式（必须是 Capitalized:Words:Like:This）
    if (!/^[A-Z][A-Za-z0-9]*(:[A-Z][A-Za-z0-9]*)+$/.test(rule.account)) {
      return {
        valid: false,
        error: `账户格式无效: ${rule.account}（应为 Capitalized:Words:Like:This）`,
      };
    }

    // 尝试编译正则表达式
    if (typeof rule.pattern === "string") {
      try {
        new RegExp(rule.pattern);
      } catch (error) {
        return {
          valid: false,
          error: `正则表达式语法错误: ${rule.pattern}`,
        };
      }
    }

    return { valid: true };
  }
}

/**
 * 快捷函数：规则匹配分类
 */
export function categorizeByRules(description: string): string | null {
  const engine = new RulesEngine();
  return engine.match(description);
}

/**
 * 快捷函数：获取所有规则
 */
export function getAllRules(): CategoryRule[] {
  const engine = new RulesEngine();
  return engine.getRules();
}

/**
 * 快捷函数：添加自定义规则
 */
export function addCustomRule(rule: CategoryRule): void {
  const engine = new RulesEngine();
  engine.addRule(rule);
}

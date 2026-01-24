/**
 * Beancount 生成器
 *
 * 将账单数据转换为 Beancount 格式文本
 */

import type {
  Transaction,
  Posting,
  TransactionFlag,
  Amount,
  Directive,
  GenerateOptions,
  ParsedBill,
} from "./types";
import { AccountMapper } from "./account-mapper";
import { COMMON_ACCOUNTS } from "./default-accounts";

/**
 * Beancount 生成器类
 */
export class BeancountGenerator {
  private options: GenerateOptions;
  private mapper: AccountMapper;

  constructor(mapper?: AccountMapper, options?: GenerateOptions);
  constructor(options?: GenerateOptions);
  constructor(mapperOrOptions?: AccountMapper | GenerateOptions, options?: GenerateOptions) {
    // 重载：如果第一个参数是 AccountMapper
    if (mapperOrOptions && 'getAssetAccount' in mapperOrOptions) {
      this.mapper = mapperOrOptions as AccountMapper;
      this.options = options || {};
    } else {
      // 如果第一个参数是 GenerateOptions 或未提供
      this.mapper = new AccountMapper();
      this.options = mapperOrOptions || {};
    }
  }

  /**
   * 从账单列表生成 Beancount 文本
   */
  generateFromBills(bills: ParsedBill[]): string {
    const lines: string[] = [];

    // 添加文件头（可选）
    if (this.options.header) {
      lines.push(this.generateHeader());
      lines.push("");
    }

    // 添加 Open 指令（可选）
    if (this.options.includeOpenDirectives) {
      lines.push(this.generateOpenDirectives());
      lines.push("");
    }

    // 添加交易
    const transactions = bills.map((bill) => this.billToTransaction(bill));
    transactions.forEach((txn) => {
      lines.push(this.formatTransaction(txn));
      lines.push("");
    });

    return lines.join("\n");
  }

  /**
   * 生成文件头注释
   */
  private generateHeader(): string {
    const lines: string[] = [];

    if (this.options.header) {
      const { author, title, description } = this.options.header;

      lines.push(";");
      if (title) lines.push(`; Title: ${title}`);
      if (author) lines.push(`; Author: ${author}`);
      if (description) lines.push(`; Description: ${description}`);
      lines.push(";");
      lines.push(`; Generated: ${new Date().toISOString()}`);
      lines.push(";");
    }

    return lines.join("\n");
  }

  /**
   * 生成 Open 指令
   */
  private generateOpenDirectives(): string {
    const today = this.formatDate(new Date());
    return COMMON_ACCOUNTS.map((account) => {
      return `${today} open ${account}`;
    }).join("\n");
  }

  /**
   * 将账单转换为交易
   */
  private billToTransaction(bill: ParsedBill): Transaction {
    // 判断是支出还是收入
    const isExpense = bill.amount < 0;
    const absoluteAmount = Math.abs(bill.amount);
    const currency = this.options.currency || "CNY";

    // 获取账户
    // 优先使用支付方式信息中的账户，否则使用 source 映射的默认账户
    const assetAccount = bill.paymentMethodInfo?.beancountAccount
      || this.mapper.getAssetAccount(bill.source);
    const categoryAccount = this.mapper.getCategoryAccount(
      bill.description,
      bill.amount
    );

    // 构建交易
    const txnDate = new Date(bill.transactionDate);

    // 解析描述（提取 payee 和 narration）
    const { payee, narration } = this.parseDescription(bill.description);

    const postings: Posting[] = [];

    if (isExpense) {
      // 支出：费用账户借方（正数），资产账户贷方（负数）
      postings.push({
        account: categoryAccount,
        amount: { number: absoluteAmount, currency },
      });
      postings.push({
        account: assetAccount,
        amount: { number: -absoluteAmount, currency },
      });
    } else {
      // 收入：资产账户借方（正数），收入账户贷方（负数）
      postings.push({
        account: assetAccount,
        amount: { number: absoluteAmount, currency },
      });
      postings.push({
        account: categoryAccount,
        amount: { number: -absoluteAmount, currency },
      });
    }

    return {
      date: txnDate,
      flag: "*", // 默认为已确认
      payee,
      narration,
      tags: [],
      links: [],
      postings,
    };
  }

  /**
   * 解析描述，分离 Payee 和 Narration
   */
  private parseDescription(description: string): {
    payee?: string;
    narration: string;
  } {
    // 尝试提取商家名称（Payee）
    // 常见格式："美团外卖-北京朝阳店"、"滴滴出行"

    // 简单策略：第一个词或词组作为 Payee
    const parts = description.split(/[-—–_]/, 2);

    if (parts.length === 2) {
      return {
        payee: parts[0].trim(),
        narration: parts[1].trim(),
      };
    }

    // 如果没有分隔符，整个描述作为 narration
    return {
      narration: description.trim(),
    };
  }

  /**
   * 格式化交易为 Beancount 文本
   */
  private formatTransaction(txn: Transaction): string {
    const lines: string[] = [];

    // 交易头：日期 标记 "Payee" "Narration"
    const dateStr = this.formatDate(txn.date);
    const flagStr = txn.flag;

    let header = `${dateStr} ${flagStr}`;
    if (txn.payee) {
      header += ` "${txn.payee}" "${txn.narration}"`;
    } else {
      header += ` "${txn.narration}"`;
    }

    // 添加标签和链接（如果有）
    if (txn.tags.length > 0) {
      header += " " + txn.tags.map((t) => `#${t}`).join(" ");
    }
    if (txn.links.length > 0) {
      header += " " + txn.links.map((l) => `^${l}`).join(" ");
    }

    lines.push(header);

    // 交易行（Posting）
    txn.postings.forEach((posting) => {
      const amountStr = posting.amount
        ? `${posting.amount.number.toFixed(2)} ${posting.amount.currency}`
        : "";

      lines.push(`    ${posting.account.padEnd(35)}  ${amountStr}`);
    });

    return lines.join("\n");
  }

  /**
   * 格式化日期为 YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
}

/**
 * 快捷函数：生成 Beancount 文本
 */
export function generateBeancount(
  bills: ParsedBill[],
  options?: GenerateOptions
): string {
  const generator = new BeancountGenerator(options);
  return generator.generateFromBills(bills);
}

/**
 * 快捷函数：单笔账单转换为交易
 */
export function billToTransaction(bill: ParsedBill): Transaction {
  const generator = new BeancountGenerator();
  return (generator as any).billToTransaction(bill);
}

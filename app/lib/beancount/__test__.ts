/**
 * Beancount 生成器测试
 *
 * 运行: npx tsx app/lib/beancount/__test__.ts
 */

import { generateBeancount } from "./generator";
import type { ParsedBill } from "./types";

// 模拟账单数据
const testBills: ParsedBill[] = [
  {
    id: "1",
    amount: -35.5,
    description: "美团外卖-午餐",
    transactionDate: "2025-01-15 12:30:00",
    originalData: {},
    source: "wechat",
  },
  {
    id: "2",
    amount: -200,
    description: "滴滴出行",
    transactionDate: "2025-01-15 18:00:00",
    originalData: {},
    source: "alipay",
  },
  {
    id: "3",
    amount: 15000,
    description: "工资-1月",
    transactionDate: "2025-01-25 10:00:00",
    originalData: {},
    source: "bank",
  },
];

// 生成 Beancount
const beancountText = generateBeancount(testBills, {
  header: {
    title: "我的账本",
    author: "Mana",
    description: "从微信、支付宝、银行账单自动生成",
  },
  includeOpenDirectives: true,
});

console.log("=".repeat(60));
console.log("生成的 Beancount 文本:");
console.log("=".repeat(60));
console.log(beancountText);
console.log("=".repeat(60));

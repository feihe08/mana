/**
 * Beancount 默认账户配置
 *
 * 提供中文用户友好的账户结构和映射
 */

import type { AccountMappingConfig, CategoryRule } from "./types";

/**
 * 默认账户映射配置
 */
export const DEFAULT_ACCOUNT_MAPPING: AccountMappingConfig = {
  // 支付方式映射 → 资产账户
  paymentMethodToAccount: {
    wechat: "Assets:WeChat:Cash",           // 微信零钱
    alipay: "Assets:Alipay:Balance",        // 支付宝余额
    bank: "Assets:Bank:Checking",           // 银行卡
    creditcard: "Liabilities:CreditCard:Generic", // 信用卡
    cash: "Assets:Cash",                    // 现金
  },

  // 分类规则（关键词 → 费用/收入账户）
  categoryRules: [
    // 餐饮
    { pattern: /美团|饿了么|外卖|配送/, account: "Expenses:Food:Delivery", priority: 10 },
    { pattern: /餐厅|饭店|美食|小吃|火锅|烧烤/, account: "Expenses:Food:Restaurant", priority: 10 },
    { pattern: /超市|便利|生鲜|水果|蔬菜|肉类/, account: "Expenses:Food:Groceries", priority: 10 },

    // 交通
    { pattern: /滴滴|打车|出租|网约车/, account: "Expenses:Transport:Taxi", priority: 10 },
    { pattern: /地铁|公交|充值/, account: "Expenses:Transport:Public", priority: 10 },
    { pattern: /加油|充电|停车|高速|ETC/, account: "Expenses:Transport:Car", priority: 10 },
    { pattern: /火车|高铁|飞机|机票/, account: "Expenses:Transport:Travel", priority: 10 },

    // 购物
    { pattern: /淘宝|天猫|京东|拼多多|购物/, account: "Expenses:Shopping:Online", priority: 10 },
    { pattern: /服装|鞋帽|箱包|化妆品/, account: "Expenses:Shopping:Clothing", priority: 9 },
    { pattern: /数码|电子|电器/, account: "Expenses:Shopping:Electronics", priority: 9 },

    // 居住
    { pattern: /房租|水电|燃气|物业/, account: "Expenses:Housing:Utilities", priority: 10 },
    { pattern: /宽带|网络|通讯|话费/, account: "Expenses:Housing:Internet", priority: 10 },

    // 娱乐
    { pattern: /电影|游戏|KTV|演出/, account: "Expenses:Entertainment:Leisure", priority: 10 },
    { pattern: /健身|运动|游泳/, account: "Expenses:Entertainment:Fitness", priority: 10 },

    // 医疗
    { pattern: /医院|药店|诊所|体检/, account: "Expenses:Health:Medical", priority: 10 },

    // 教育
    { pattern: /培训|课程|书籍|教育/, account: "Expenses:Education:Learning", priority: 10 },

    // 收入
    { pattern: /工资|薪资|奖金|提成/, account: "Income:Salary:Tech", priority: 10 },
    { pattern: /退款|返还/, account: "Income:Refunds", priority: 10 },

    // 特殊规则
    { pattern: /对外经贸大学|电费|电力/, account: "Expenses:Utilities:Electricity", priority: 10 },
    { pattern: /群收款|AA|分摊/, account: "Expenses:Food:Restaurant", priority: 9 },
    { pattern: /亲情卡|代付/, account: "Expenses:Gift:Others", priority: 10 },
    { pattern: /服务费/, account: "Expenses:Misc:Fees", priority: 8 },
  ],

  // 默认账户
  defaultExpenseAccount: "Expenses:Uncategorized",
  defaultIncomeAccount: "Income:Other",
  defaultAssetAccount: "Assets:Cash",
};

/**
 * 常用的 Beancount 账户结构
 *
 * 可用于生成 Open 指令
 */
export const COMMON_ACCOUNTS = [
  // 资产
  "Assets:Bank:Checking",
  "Assets:Bank:Savings",
  "Assets:WeChat:Cash",
  "Assets:Alipay:Balance",
  "Assets:Cash",

  // 负债
  "Liabilities:CreditCard:Generic",
  "Liabilities:Alipay:Huabei",
  "Liabilities:WeChat:Credit",

  // 收入
  "Income:Salary:Tech",
  "Income:Refunds",
  "Income:Other",

  // 费用
  "Expenses:Food:Delivery",
  "Expenses:Food:Restaurant",
  "Expenses:Food:Groceries",
  "Expenses:Transport:Taxi",
  "Expenses:Transport:Public",
  "Expenses:Transport:Car",
  "Expenses:Shopping:Online",
  "Expenses:Shopping:Clothing",
  "Expenses:Housing:Utilities",
  "Expenses:Housing:Internet",
  "Expenses:Entertainment:Leisure",
  "Expenses:Health:Medical",
  "Expenses:Education:Learning",
  "Expenses:Utilities:Electricity",
  "Expenses:Gift:Others",
  "Expenses:Misc:Fees",
  "Expenses:Uncategorized",
];

/**
 * 获取默认账户映射
 */
export function getDefaultAccountMapping(): AccountMappingConfig {
  return { ...DEFAULT_ACCOUNT_MAPPING };
}

/**
 * 获取分类规则（按优先级排序）
 */
export function getCategoryRules(): CategoryRule[] {
  return [...DEFAULT_ACCOUNT_MAPPING.categoryRules].sort((a, b) => {
    const priorityA = a.priority || 0;
    const priorityB = b.priority || 0;
    return priorityB - priorityA; // 降序
  });
}

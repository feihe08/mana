/**
 * Beancount 默认账户配置
 *
 * 提供中文用户友好的账户结构和映射
 * 所有分类都映射到 15 个标准分类（见 category-taxonomy.ts）
 */

import type { AccountMappingConfig, CategoryRule } from "./types";
import {
  CATEGORY_TO_BEANCOUNT,
  STANDARD_CATEGORIES,
  type StandardCategory,
} from "./category-taxonomy";

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
  // 所有规则都映射到 15 个标准分类
  categoryRules: [
    // === 餐饮 ===
    { pattern: /美团|饿了么|外卖|配送|汉堡王/, account: "Expenses:Food:Delivery", priority: 10 },
    { pattern: /餐厅|饭店|食堂|菜馆|火锅|烧烤|烤肉|小笼包|牛肉面|砂锅/, account: "Expenses:Food:Restaurant", priority: 10 },
    { pattern: /超市|便利|生鲜|水果|蔬菜|肉类|菜鲜/, account: "Expenses:Food:Groceries", priority: 10 },

    // === 交通 ===
    { pattern: /滴滴|打车|出租|网约车|快车|专车|顺风车/, account: "Expenses:Transport:Taxi", priority: 10 },
    { pattern: /地铁|公交|一卡通/, account: "Expenses:Transport:Public", priority: 10 },

    // === 购物 ===
    { pattern: /淘宝|天猫|京东|拼多多|购物/, account: "Expenses:Shopping:Online", priority: 10 },
    { pattern: /名创优品|便利店|杂货|百货/, account: "Expenses:Shopping:Daily", priority: 10 },

    // === 医疗健康 ===
    { pattern: /医院|诊所|体检|药店|医保|医疗|药房|口腔/, account: "Expenses:Health:Medical", priority: 10 },
    { pattern: /按摩|修脚|健身|瑜伽|美容/, account: "Expenses:Health:Wellness", priority: 10 },

    // === 居住 ===
    { pattern: /房租|水电|燃气|物业|暖气|桶装水|充电/, account: "Expenses:Housing:Utilities", priority: 10 },
    { pattern: /宽带|网络|话费|通讯|充值/, account: "Expenses:Housing:Internet", priority: 10 },

    // === 教育 ===
    { pattern: /培训|课程|书籍|教育|学校|大学/, account: "Expenses:Education:Learning", priority: 10 },

    // === 其他 ===
    { pattern: /服务费|手续费|代理费/, account: "Expenses:Misc:Fees", priority: 10 },
    { pattern: /公益|慈善|捐赠/, account: "Expenses:Misc:Charity", priority: 10 },

    // === 收入 ===
    { pattern: /工资|薪资|奖金|提成|报销/, account: "Income:Salary", priority: 10 },
    { pattern: /退款|返还|转入|转账/, account: "Income:Refunds", priority: 10 },

    // === 默认（兜底）- 归类为日用品 ===
    { pattern: /./, account: "Expenses:Shopping:Daily", priority: 0 },
  ],

  // 默认账户
  defaultExpenseAccount: "Expenses:Shopping:Daily", // 兜底到日用品
  defaultIncomeAccount: "Income:Refunds",
  defaultAssetAccount: "Assets:Cash",
};

/**
 * 常用的 Beancount 账户结构（15个标准分类）
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

  // 收入（2个）
  "Income:Salary",
  "Income:Refunds",

  // 费用（13个）
  // 餐饮
  "Expenses:Food:Delivery",
  "Expenses:Food:Restaurant",
  "Expenses:Food:Groceries",
  // 交通
  "Expenses:Transport:Taxi",
  "Expenses:Transport:Public",
  // 购物
  "Expenses:Shopping:Online",
  "Expenses:Shopping:Daily",
  // 医疗健康
  "Expenses:Health:Medical",
  "Expenses:Health:Wellness",
  // 居住
  "Expenses:Housing:Utilities",
  "Expenses:Housing:Internet",
  // 教育
  "Expenses:Education:Learning",
  // 其他
  "Expenses:Misc:Fees",
  "Expenses:Misc:Charity",
];

/**
 * 获取所有标准分类的 Beancount 账户列表
 */
export function getStandardCategoryAccounts(): string[] {
  return STANDARD_CATEGORIES.map((cat) => CATEGORY_TO_BEANCOUNT[cat as StandardCategory]);
}

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

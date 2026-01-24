/**
 * Mana 分类体系
 *
 * 定义了15个标准分类，所有分类（规则分类 + AI分类）都应该落在这个分类体系内
 * 这是分类的单一数据源，便于维护
 */

/**
 * 标准分类类型
 */
export type StandardCategory =
  // 餐饮
  | "Food-Delivery"
  | "Food-Restaurant"
  | "Food-Groceries"
  // 交通
  | "Transport-Taxi"
  | "Transport-Public"
  // 购物
  | "Shopping-Online"
  | "Shopping-Daily"
  // 医疗健康
  | "Health-Medical"
  | "Health-Wellness"
  // 居住
  | "Housing-Utilities"
  | "Housing-Internet"
  // 教育
  | "Education-Learning"
  // 其他
  | "Misc-Fees"
  | "Misc-Charity"
  // 收入
  | "Income-Salary"
  | "Income-Refunds";

/**
 * 标准分类列表（用于 AI 提示词和验证）
 */
export const STANDARD_CATEGORIES: StandardCategory[] = [
  // 餐饮
  "Food-Delivery",
  "Food-Restaurant",
  "Food-Groceries",
  // 交通
  "Transport-Taxi",
  "Transport-Public",
  // 购物
  "Shopping-Online",
  "Shopping-Daily",
  // 医疗健康
  "Health-Medical",
  "Health-Wellness",
  // 居住
  "Housing-Utilities",
  "Housing-Internet",
  // 教育
  "Education-Learning",
  // 其他
  "Misc-Fees",
  "Misc-Charity",
  // 收入
  "Income-Salary",
  "Income-Refunds",
];

/**
 * 分类显示名称映射（用于前端展示）
 */
export const CATEGORY_DISPLAY_NAMES: Record<StandardCategory, string> = {
  // 餐饮
  "Food-Delivery": "外卖",
  "Food-Restaurant": "餐厅",
  "Food-Groceries": "生鲜食品",
  // 交通
  "Transport-Taxi": "打车",
  "Transport-Public": "公共交通",
  // 购物
  "Shopping-Online": "网购",
  "Shopping-Daily": "日用品",
  // 医疗健康
  "Health-Medical": "医疗",
  "Health-Wellness": "保健",
  // 居住
  "Housing-Utilities": "水电燃气",
  "Housing-Internet": "网络通讯",
  // 教育
  "Education-Learning": "教育",
  // 其他
  "Misc-Fees": "服务费用",
  "Misc-Charity": "公益捐赠",
  // 收入
  "Income-Salary": "工资收入",
  "Income-Refunds": "退款/转账",
};

/**
 * 分类描述（用于 AI 提示词）
 */
export const CATEGORY_DESCRIPTIONS: Record<StandardCategory, string> = {
  // 餐饮
  "Food-Delivery": "外卖配送（美团、饿了么、汉堡王外卖等）",
  "Food-Restaurant": "餐厅用餐（小笼包、牛肉面、餐厅等）",
  "Food-Groceries": "生鲜食品（菜鲜果美、超市、菜市场等）",
  // 交通
  "Transport-Taxi": "打车出行（滴滴、网约车、出租车等）",
  "Transport-Public": "公共交通（地铁、公交、一卡通等）",
  // 购物
  "Shopping-Online": "网购（京东、淘宝、拼多多等电商平台）",
  "Shopping-Daily": "日用品（名创优品、便利店、百货等）",
  // 医疗健康
  "Health-Medical": "医疗（医院、体检、药品、医保支付等）",
  "Health-Wellness": "保健（按摩、修脚、健身、美容等）",
  // 居住
  "Housing-Utilities": "水电燃气（水费、电费、燃气、桶装水、充电等）",
  "Housing-Internet": "网络通讯（宽带、话费、充值等）",
  // 教育
  "Education-Learning": "教育（培训、课程、书籍、学校等）",
  // 其他
  "Misc-Fees": "服务费用（手续费、代理费、服务费等）",
  "Misc-Charity": "公益捐赠（慈善捐款、公益组织等）",
  // 收入
  "Income-Salary": "工资收入（工资、奖金、薪资等）",
  "Income-Refunds": "退款/转账（退款、转账收入等）",
};

/**
 * Beancount 账户到标准分类的映射
 *
 * 用于将 Beancount 格式的账户转换为标准分类
 */
export const BEANCOUNT_TO_CATEGORY: Record<string, StandardCategory> = {
  // 餐饮
  "Expenses:Food:Delivery": "Food-Delivery",
  "Expenses:Food:Restaurant": "Food-Restaurant",
  "Expenses:Food:Groceries": "Food-Groceries",
  // 交通
  "Expenses:Transport:Taxi": "Transport-Taxi",
  "Expenses:Transport:Public": "Transport-Public",
  // 购物
  "Expenses:Shopping:Online": "Shopping-Online",
  "Expenses:Shopping:Daily": "Shopping-Daily",
  // 医疗健康
  "Expenses:Health:Medical": "Health-Medical",
  "Expenses:Health:Wellness": "Health-Wellness",
  // 居住
  "Expenses:Housing:Utilities": "Housing-Utilities",
  "Expenses:Housing:Internet": "Housing-Internet",
  // 教育
  "Expenses:Education:Learning": "Education-Learning",
  // 其他
  "Expenses:Misc:Fees": "Misc-Fees",
  "Expenses:Misc:Charity": "Misc-Charity",
  // 收入
  "Income:Salary": "Income-Salary",
  "Income:Refunds": "Income-Refunds",
};

/**
 * 标准分类到 Beancount 账户的映射（反向）
 */
export const CATEGORY_TO_BEANCOUNT: Record<StandardCategory, string> = Object.fromEntries(
  Object.entries(BEANCOUNT_TO_CATEGORY).map(([account, category]) => [category, account])
) as Record<StandardCategory, string>;

/**
 * 验证分类是否在标准分类列表中
 */
export function isValidCategory(category: string): category is StandardCategory {
  return STANDARD_CATEGORIES.includes(category as StandardCategory);
}

/**
 * 获取分类显示名称
 */
export function getCategoryDisplayName(category: StandardCategory): string {
  return CATEGORY_DISPLAY_NAMES[category];
}

/**
 * 获取分类描述
 */
export function getCategoryDescription(category: StandardCategory): string {
  return CATEGORY_DESCRIPTIONS[category];
}

/**
 * 将 Beancount 账户转换为标准分类
 */
export function beancountToCategory(account: string): StandardCategory | null {
  return BEANCOUNT_TO_CATEGORY[account] || null;
}

/**
 * 将标准分类转换为 Beancount 账户
 */
export function categoryToBeancount(category: StandardCategory): string {
  return CATEGORY_TO_BEANCOUNT[category];
}

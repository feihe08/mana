/**
 * D1 数据库操作层 - user_settings 表
 */

import type { CategoryRule } from '../beancount/types';
import type { StandardCategory } from '../beancount/category-taxonomy';

// ========================================
// 类型定义
// ========================================

export interface UserSettingsDB {
  user_id: string;
  custom_rules: string; // JSON 字符串
  budgets: string;      // JSON 字符串
  ai_enabled: number;   // 0 or 1
  default_category: string;
  updated_at: string;
}

export interface UserSettings {
  customRules: CategoryRule[];
  budgets: BudgetConfig[];
  aiEnabled: boolean;
  defaultCategory: StandardCategory;
}

export interface BudgetConfig {
  category: StandardCategory;
  monthlyLimit: number;
  alertThreshold: number;
}

export const DEFAULT_SETTINGS: UserSettings = {
  customRules: [],
  budgets: [],
  aiEnabled: true,
  defaultCategory: 'Shopping-Daily',
};

// ========================================
// 数据库操作函数
// ========================================

/**
 * 获取用户设置
 */
export async function getUserSettings(
  db: D1Database,
  userId: string
): Promise<UserSettings> {
  const stmt = db.prepare('SELECT * FROM user_settings WHERE user_id = ?');
  const result = await stmt.bind(userId).first<UserSettingsDB>();

  if (!result) {
    return DEFAULT_SETTINGS;
  }

  return {
    customRules: JSON.parse(result.custom_rules),
    budgets: JSON.parse(result.budgets),
    aiEnabled: result.ai_enabled === 1,
    defaultCategory: result.default_category as StandardCategory,
  };
}

/**
 * 保存用户设置（完整替换）
 */
export async function saveUserSettings(
  db: D1Database,
  userId: string,
  settings: UserSettings
): Promise<void> {
  const stmt = db.prepare(`
    INSERT INTO user_settings (user_id, custom_rules, budgets, ai_enabled, default_category)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      custom_rules = excluded.custom_rules,
      budgets = excluded.budgets,
      ai_enabled = excluded.ai_enabled,
      default_category = excluded.default_category,
      updated_at = datetime('now')
  `);

  await stmt.bind(
    userId,
    JSON.stringify(settings.customRules),
    JSON.stringify(settings.budgets),
    settings.aiEnabled ? 1 : 0,
    settings.defaultCategory
  ).run();
}

/**
 * 添加自定义规则
 */
export async function addCustomRule(
  db: D1Database,
  userId: string,
  rule: CategoryRule
): Promise<void> {
  const settings = await getUserSettings(db, userId);
  settings.customRules.push(rule);
  await saveUserSettings(db, userId, settings);
}

/**
 * 删除自定义规则
 */
export async function removeCustomRule(
  db: D1Database,
  userId: string,
  index: number
): Promise<void> {
  const settings = await getUserSettings(db, userId);
  settings.customRules.splice(index, 1);
  await saveUserSettings(db, userId, settings);
}

/**
 * 更新自定义规则
 */
export async function updateCustomRule(
  db: D1Database,
  userId: string,
  index: number,
  rule: CategoryRule
): Promise<void> {
  const settings = await getUserSettings(db, userId);
  settings.customRules[index] = rule;
  await saveUserSettings(db, userId, settings);
}

/**
 * 设置预算
 */
export async function setBudget(
  db: D1Database,
  userId: string,
  category: StandardCategory,
  budget: Omit<BudgetConfig, 'category'>
): Promise<void> {
  const settings = await getUserSettings(db, userId);
  const existingIndex = settings.budgets.findIndex((b) => b.category === category);

  if (existingIndex >= 0) {
    settings.budgets[existingIndex] = { category, ...budget };
  } else {
    settings.budgets.push({ category, ...budget });
  }

  await saveUserSettings(db, userId, settings);
}

/**
 * 删除预算
 */
export async function removeBudget(
  db: D1Database,
  userId: string,
  category: StandardCategory
): Promise<void> {
  const settings = await getUserSettings(db, userId);
  settings.budgets = settings.budgets.filter((b) => b.category !== category);
  await saveUserSettings(db, userId, settings);
}

/**
 * 重置设置为默认
 */
export async function resetUserSettings(
  db: D1Database,
  userId: string
): Promise<void> {
  await saveUserSettings(db, userId, DEFAULT_SETTINGS);
}

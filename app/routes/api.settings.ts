/**
 * 用户设置 API
 * GET /api/settings - 获取用户设置
 * POST /api/settings - 保存用户设置
 */

import { getDB } from '../lib/server';
import {
  getUserSettings,
  saveUserSettings,
  addCustomRule,
  removeCustomRule,
  updateCustomRule,
  setBudget,
  removeBudget,
  resetUserSettings,
  type UserSettings,
} from '../lib/db/settings';
import { DEFAULT_ACCOUNT_MAPPING } from '../lib/beancount/default-accounts';

/**
 * 获取或生成用户 ID
 * 从请求头或 cookie 中读取，如果没有则生成新的
 */
function getUserId(request: Request): string {
  // 先尝试从 cookie 获取
  const cookieHeader = request.headers.get('Cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map(c => c.trim());
    const userIdCookie = cookies.find(c => c.startsWith('mana-user-id='));
    if (userIdCookie) {
      return userIdCookie.split('=')[1];
    }
  }

  // 如果没有 cookie，生成新的用户 ID
  // 在实际使用中，这应该在第一次访问时设置 cookie
  return 'default';
}

export async function loader(args: any) {
  const db = getDB(args);
  const request = args.request;

  const userId = getUserId(request);
  const settings = await getUserSettings(db, userId);

  // 合并默认规则
  const defaultRules = DEFAULT_ACCOUNT_MAPPING.categoryRules;
  const allRules = [...defaultRules, ...settings.customRules].sort(
    (a, b) => (b.priority || 0) - (a.priority || 0)
  );

  // 将 RegExp 对象序列化为字符串（JSON 无法序列化 RegExp）
  const serializedRules = allRules.map(rule => ({
    ...rule,
    pattern: rule.pattern instanceof RegExp
      ? rule.pattern.source
      : rule.pattern,
  }));

  return Response.json({
    ...settings,
    allRules: serializedRules,
  });
}

export async function action(args: any) {
  const db = getDB(args);
  const request = args.request;
  const userId = getUserId(request);

  // 处理不同的操作类型
  const url = new URL(request.url);
  const operation = url.searchParams.get('operation');

  try {
    if (request.method === 'POST') {
      const body = await request.json();

      switch (operation) {
        case 'save':
          // 保存完整设置
          await saveUserSettings(db, userId, body);
          return Response.json({ success: true });

        case 'addRule':
          // 添加规则
          await addCustomRule(db, userId, body.rule);
          return Response.json({ success: true });

        case 'removeRule':
          // 删除规则
          await removeCustomRule(db, userId, body.index);
          return Response.json({ success: true });

        case 'updateRule':
          // 更新规则
          await updateCustomRule(db, userId, body.index, body.rule);
          return Response.json({ success: true });

        case 'setBudget':
          // 设置预算
          await setBudget(db, userId, body.category, body.budget);
          return Response.json({ success: true });

        case 'removeBudget':
          // 删除预算
          await removeBudget(db, userId, body.category);
          return Response.json({ success: true });

        case 'reset':
          // 重置设置
          await resetUserSettings(db, userId);
          return Response.json({ success: true });

        default:
          return Response.json({ error: 'Invalid operation' }, { status: 400 });
      }
    }

    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error) {
    console.error('Settings API error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

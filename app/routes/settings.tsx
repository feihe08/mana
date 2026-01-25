/**
 * 设置页面
 * 管理分类规则和预算（云端存储）
 */

import { useState } from 'react';
import { Link, useLoaderData } from 'react-router';
import { getDB } from '../lib/server';
import { getUserSettings } from '../lib/db/settings';
import { DEFAULT_ACCOUNT_MAPPING } from '../lib/beancount/default-accounts';
import {
  STANDARD_CATEGORIES,
  getCategoryDisplayName,
  type StandardCategory,
} from '../lib/beancount/category-taxonomy';
import type { CategoryRule } from '../lib/beancount/types';

export function meta() {
  return [
    { title: '设置 - Mana' },
    { name: 'description', content: '管理分类规则和预算设置' },
  ];
}

// 从服务端加载的设置
interface SettingsData {
  customRules: CategoryRule[];
  budgets: Array<{
    category: StandardCategory;
    monthlyLimit: number;
    alertThreshold: number;
  }>;
  aiEnabled: boolean;
  defaultCategory: StandardCategory;
  allRules: CategoryRule[];
}

export async function loader(args: any) {
  const db = getDB(args);
  const userId = 'default'; // 暂时使用固定用户 ID

  const settings = await getUserSettings(db, userId);

  // 合并默认规则
  const defaultRules = DEFAULT_ACCOUNT_MAPPING.categoryRules;
  const allRules = [...defaultRules, ...settings.customRules].sort(
    (a, b) => (b.priority || 0) - (a.priority || 0)
  );

  return {
    ...settings,
    allRules,
  };
}

export default function SettingsPage() {
  const initialData = useLoaderData<SettingsData>();
  const [settings, setSettings] = useState<SettingsData>(initialData);
  const [activeTab, setActiveTab] = useState<'rules' | 'budgets'>('rules');
  const [editingRule, setEditingRule] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 添加新规则表单
  const [newRuleKeywords, setNewRuleKeywords] = useState('');
  const [newRuleCategory, setNewRuleCategory] = useState<StandardCategory>('Shopping-Daily');
  const [newRulePriority, setNewRulePriority] = useState(10);

  // 测试规则
  const [testText, setTestText] = useState('');
  const [testResults, setTestResults] = useState<Array<{ rule: CategoryRule; matched: boolean }>>([]);

  // 编辑模式
  const [editKeywords, setEditKeywords] = useState('');
  const [editCategory, setEditCategory] = useState<StandardCategory>('Shopping-Daily');
  const [editPriority, setEditPriority] = useState(10);

  // 刷新设置
  const refreshSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('加载设置失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 添加规则
  const handleAddRule = async () => {
    if (!newRuleKeywords.trim()) return;

    setIsLoading(true);
    try {
      const pattern = new RegExp(newRuleKeywords, 'i');
      const rule: CategoryRule = {
        pattern,
        account: `Expenses:${newRuleCategory.replace('-', ':')}`,
        priority: newRulePriority,
      };

      const response = await fetch('/api/settings?operation=addRule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rule }),
      });

      if (response.ok) {
        setNewRuleKeywords('');
        setNewRulePriority(10);
        await refreshSettings();
      }
    } catch (error) {
      console.error('添加规则失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 删除规则
  const handleDeleteRule = async (index: number) => {
    if (!confirm('确定要删除这条规则吗？')) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/settings?operation=removeRule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index }),
      });

      if (response.ok) {
        await refreshSettings();
      }
    } catch (error) {
      console.error('删除规则失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 编辑规则
  const handleEditRule = (index: number) => {
    const rule = settings.customRules[index];
    setEditingRule(index);
    setEditKeywords(rule.pattern instanceof RegExp ? rule.pattern.source : String(rule.pattern));
    setEditCategory(
      rule.account.split(':').slice(1).join('-').replace(/:/g, '-') as StandardCategory
    );
    setEditPriority(rule.priority || 10);
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    if (editingRule === null) return;

    setIsLoading(true);
    try {
      const pattern = new RegExp(editKeywords, 'i');
      const rule: CategoryRule = {
        pattern,
        account: `Expenses:${editCategory.replace('-', ':')}`,
        priority: editPriority,
      };

      const response = await fetch('/api/settings?operation=updateRule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index: editingRule, rule }),
      });

      if (response.ok) {
        setEditingRule(null);
        await refreshSettings();
      }
    } catch (error) {
      console.error('更新规则失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 测试规则
  const handleTestRule = () => {
    if (!testText.trim()) {
      setTestResults([]);
      return;
    }

    const results = settings.allRules.map((rule) => ({
      rule,
      matched: testRule(rule.pattern, testText),
    }));

    setTestResults(results.filter((r) => r.matched));
  };

  // 判断是否默认规则
  const isDefaultRule = (rule: CategoryRule) => {
    return DEFAULT_ACCOUNT_MAPPING.categoryRules.some(
      (r) => r.account === rule.account && r.priority === rule.priority
    );
  };

  // 获取预算
  const getBudgetForCategory = (category: StandardCategory) => {
    return settings.budgets.find((b) => b.category === category);
  };

  // 设置预算
  const handleSetBudget = async (category: StandardCategory, limit: number) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/settings?operation=setBudget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          budget: { monthlyLimit: limit, alertThreshold: 0.8 },
        }),
      });

      if (response.ok) {
        await refreshSettings();
      }
    } catch (error) {
      console.error('设置预算失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 删除预算
  const handleRemoveBudget = async (category: StandardCategory) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/settings?operation=removeBudget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category }),
      });

      if (response.ok) {
        await refreshSettings();
      }
    } catch (error) {
      console.error('删除预算失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 重置设置
  const handleReset = async () => {
    if (!confirm('确定要重置所有设置为默认值吗？这将删除所有自定义规则和预算。')) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/settings?operation=reset', {
        method: 'POST',
      });

      if (response.ok) {
        await refreshSettings();
      }
    } catch (error) {
      console.error('重置设置失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 relative">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

      <div className="relative container mx-auto px-4 py-8">
        {/* 标题 */}
        <div className="mb-8">
          <Link to="/" className="text-purple-400 hover:text-purple-300 inline-block mb-4">
            ← 返回首页
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">设置</h1>
          <p className="text-gray-400">管理分类规则和预算（云端存储）</p>
        </div>

        {/* 标签页 */}
        <div className="flex gap-4 mb-8 border-b border-gray-800">
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'rules'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
            disabled={isLoading}
          >
            📌 分类规则
          </button>
          <button
            onClick={() => setActiveTab('budgets')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'budgets'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
            disabled={isLoading}
          >
            💰 预算设置
          </button>
        </div>

        {activeTab === 'rules' ? (
          <>
            {/* 规则管理 */}
            <div className="space-y-6">
              {/* 添加规则表单 */}
              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <h2 className="text-xl font-semibold text-white mb-4">添加自定义规则</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-400 mb-2">
                      关键词（正则表达式）
                    </label>
                    <input
                      type="text"
                      value={newRuleKeywords}
                      onChange={(e) => setNewRuleKeywords(e.target.value)}
                      placeholder="例如: 瑞幸|星巴克|咖啡"
                      disabled={isLoading}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 disabled:opacity-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      使用 | 分隔多个关键词，支持正则表达式
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">分类</label>
                    <select
                      value={newRuleCategory}
                      onChange={(e) => setNewRuleCategory(e.target.value as StandardCategory)}
                      disabled={isLoading}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 disabled:opacity-50"
                    >
                      {STANDARD_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {getCategoryDisplayName(cat)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">优先级</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={newRulePriority}
                      onChange={(e) => setNewRulePriority(Number(e.target.value))}
                      disabled={isLoading}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 disabled:opacity-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">数字越大优先级越高</p>
                  </div>
                </div>
                <button
                  onClick={handleAddRule}
                  disabled={!newRuleKeywords.trim() || isLoading}
                  className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  {isLoading ? '处理中...' : '添加规则'}
                </button>
              </div>

              {/* 规则测试器 */}
              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <h2 className="text-xl font-semibold text-white mb-4">规则测试器</h2>
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={testText}
                    onChange={(e) => setTestText(e.target.value)}
                    placeholder="输入交易描述进行测试"
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 disabled:opacity-50"
                  />
                  <button
                    onClick={handleTestRule}
                    disabled={!testText.trim() || isLoading}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                  >
                    测试
                  </button>
                </div>
                {testResults.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-gray-400">匹配的规则：</p>
                    {testResults.map(({ rule, matched }, index) => (
                      <div key={index} className="px-4 py-2 bg-green-500/10 border border-green-500/50 rounded-lg">
                        <p className="text-sm text-green-400">
                          {rule.pattern instanceof RegExp ? rule.pattern.source : rule.pattern}
                          {' '}
                          →{' '}
                          {rule.account}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 规则列表 */}
              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <h2 className="text-xl font-semibold text-white mb-2">
                  所有规则（{settings.allRules.length} 条）
                </h2>
                <p className="text-sm text-gray-400 mb-4">包含默认规则和自定义规则</p>
                <div className="space-y-3">
                  {settings.allRules.map((rule, index) => {
                    const isDefault = isDefaultRule(rule);
                    const isEditing = editingRule === index;

                    return (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${
                          isDefault
                            ? 'bg-gray-800 border-gray-700'
                            : 'bg-gray-800/50 border-purple-500/30'
                        }`}
                      >
                        {isEditing ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <input
                                type="text"
                                value={editKeywords}
                                onChange={(e) => setEditKeywords(e.target.value)}
                                disabled={isLoading}
                                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm disabled:opacity-50"
                              />
                              <select
                                value={editCategory}
                                onChange={(e) => setEditCategory(e.target.value as StandardCategory)}
                                disabled={isLoading}
                                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm disabled:opacity-50"
                              >
                                {STANDARD_CATEGORIES.map((cat) => (
                                  <option key={cat} value={cat}>
                                    {getCategoryDisplayName(cat)}
                                  </option>
                                ))}
                              </select>
                              <input
                                type="number"
                                min="1"
                                max="100"
                                value={editPriority}
                                onChange={(e) => setEditPriority(Number(e.target.value))}
                                disabled={isLoading}
                                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm disabled:opacity-50"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={handleSaveEdit}
                                disabled={isLoading}
                                className="px-4 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white rounded text-sm"
                              >
                                保存
                              </button>
                              <button
                                onClick={() => setEditingRule(null)}
                                disabled={isLoading}
                                className="px-4 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white rounded text-sm"
                              >
                                取消
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <code className="px-2 py-1 bg-gray-950 rounded text-sm text-purple-400">
                                  {rule.pattern instanceof RegExp ? rule.pattern.source : rule.pattern}
                                </code>
                                {isDefault && (
                                  <span className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-400">
                                    默认
                                  </span>
                                )}
                                {rule.priority > 10 && (
                                  <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 rounded text-xs">
                                    优先级 {rule.priority}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-300">→ {rule.account}</p>
                            </div>
                            {!isDefault && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEditRule(index)}
                                  disabled={isLoading}
                                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded text-sm"
                                >
                                  编辑
                                </button>
                                <button
                                  onClick={() => handleDeleteRule(index)}
                                  disabled={isLoading}
                                  className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white rounded text-sm"
                                >
                                  删除
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* 预算设置 */}
            <div className="space-y-6">
              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <h2 className="text-xl font-semibold text-white mb-4">月度预算设置</h2>
                <div className="space-y-4">
                  {STANDARD_CATEGORIES.map((category) => {
                    const budget = getBudgetForCategory(category);
                    return (
                      <div
                        key={category}
                        className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700"
                      >
                        <div className="flex-1">
                          <p className="text-white font-medium">{getCategoryDisplayName(category)}</p>
                          {budget && (
                            <p className="text-sm text-gray-400 mt-1">
                              预算: ¥{budget.monthlyLimit} / 月
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {budget ? (
                            <>
                              <button
                                onClick={() => handleRemoveBudget(category)}
                                disabled={isLoading}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white rounded text-sm"
                              >
                                删除
                              </button>
                              <button
                                onClick={() => {
                                  const newLimit = prompt('输入新的月度预算（元）:', String(budget.monthlyLimit));
                                  if (newLimit && !isNaN(Number(newLimit))) {
                                    handleSetBudget(category, Number(newLimit));
                                  }
                                }}
                                disabled={isLoading}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded text-sm"
                              >
                                修改
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => {
                                const limit = prompt(`输入 ${getCategoryDisplayName(category)} 的月度预算（元）:`, '1000');
                                if (limit && !isNaN(Number(limit))) {
                                  handleSetBudget(category, Number(limit));
                                }
                              }}
                              disabled={isLoading}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white rounded text-sm"
                            >
                              设置
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        {/* 重置按钮 */}
        <div className="mt-8 pt-8 border-t border-gray-800">
          <button
            onClick={handleReset}
            disabled={isLoading}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            {isLoading ? '处理中...' : '重置所有设置'}
          </button>
        </div>
      </div>
    </div>
  );
}

// 规则测试函数（从客户端工具复用）
function testRule(pattern: string | RegExp, text: string): boolean {
  if (pattern instanceof RegExp) {
    return pattern.test(text);
  }
  return text.toLowerCase().includes(pattern.toLowerCase());
}

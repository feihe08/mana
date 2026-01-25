/**
 * 客户端解析器
 * 在浏览器中解析账单文件
 */

import * as XLSX from "xlsx";
import { parseAlipayCSV } from "../parsers/alipay";
import { parseWeChatCSV } from "../parsers/wechat";
import { parseCSV } from "../parsers/csv";
import { parseBillWithAI } from "../parsers/smart-parser";
import { getCategoryRules, DEFAULT_ACCOUNT_MAPPING } from "../beancount/default-accounts";
import {
  beancountToCategory,
  getCategoryDisplayName,
  isValidCategory,
  type StandardCategory,
} from "../beancount/category-taxonomy";
import type { ParsedBill } from "../parsers/csv";
import type { CategoryRule } from "../beancount/types";

export type { ParsedBill };

/**
 * 智能解析选项
 */
export interface SmartParseOptions {
  forceReidentify?: boolean;
  onRecognizing?: (isRecognizing: boolean) => void;
}

/**
 * 从云端获取用户规则（包括自定义规则）
 * 如果请求失败，返回默认规则
 */
async function fetchUserRules(): Promise<CategoryRule[]> {
  try {
    const response = await fetch('/api/settings');
    if (!response.ok) {
      console.warn('⚠️ [fetchUserRules] 获取云端规则失败，使用默认规则');
      return getCategoryRules();
    }

    const data = await response.json();

    // 将字符串 pattern 转换回 RegExp 对象
    const rules = (data.allRules || getCategoryRules()).map((rule: any) => ({
      ...rule,
      pattern: typeof rule.pattern === 'string'
        ? new RegExp(rule.pattern, 'i')
        : rule.pattern,
    }));

    console.log('📋 [fetchUserRules] 获取到规则:', rules.length, '条');
    return rules;
  } catch (error) {
    console.error('❌ [fetchUserRules] 获取云端规则出错:', error);
    return getCategoryRules();
  }
}

/**
 * 读取文件为文本（支持 CSV 和 Excel）
 */
async function readFileAsText(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();

  // 如果是 Excel 文件，先转换为 CSV
  if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // 将 Excel 转换为 CSV 格式的字符串
    const csvData = XLSX.utils.sheet_to_csv(worksheet);
    return csvData;
  }

  // CSV 文件直接读取
  return await file.text();
}

/**
 * 根据来源解析账单文件（使用 AI 智能识别）
 */
export async function parseBillFile(
  file: File,
  source: string,
  options?: SmartParseOptions
): Promise<ParsedBill[]> {
  console.log('🔍 [parseBillFile] 开始解析文件:', {
    fileName: file.name,
    fileSize: file.size,
    source,
    fileType: file.type
  });

  try {
    // 使用智能解析器（AI + 缓存）
    console.log('🤖 [parseBillFile] 尝试使用 AI 解析器...');
    const result = await parseBillWithAI(file, source, {
      forceReidentify: options?.forceReidentify,
      onRecognizing: options?.onRecognizing,
    });
    console.log('✅ [parseBillFile] AI 解析成功，返回', result.length, '条记录');
    return result;
  } catch (error) {
    // 如果 AI 解析失败，降级到传统解析器
    console.warn('⚠️ [parseBillFile] AI 解析失败，使用传统解析器:', error);
    console.log('📋 [parseBillFile] 降级到传统解析器，source =', source);

    // 如果是 auto，先根据文件名识别类型
    let actualSource = source;
    if (source === 'auto') {
      const fileName = file.name.toLowerCase();
      if (fileName.includes('支付宝') || fileName.includes('alipay')) {
        actualSource = 'alipay';
        console.log('🔍 [parseBillFile] 文件名识别为支付宝账单');
      } else if (fileName.includes('微信') || fileName.includes('wechat')) {
        actualSource = 'wechat';
        console.log('🔍 [parseBillFile] 文件名识别为微信账单');
      } else {
        actualSource = 'csv';
        console.log('🔍 [parseBillFile] 文件名识别为通用 CSV');
      }
    }

    console.log('📋 [parseBillFile] 实际使用的解析器:', actualSource);

    let result: ParsedBill[] = [];

    switch (actualSource) {
      case "alipay":
        console.log('🔵 [parseBillFile] 使用支付宝解析器...');
        result = await parseAlipayCSV(file);
        console.log('✅ [parseBillFile] 支付宝解析器返回', result.length, '条记录');
        return result;
      case "wechat":
        console.log('💬 [parseBillFile] 使用微信解析器...');
        result = await parseWeChatCSV(file);
        console.log('✅ [parseBillFile] 微信解析器返回', result.length, '条记录');
        return result;
      case "bank":
      case "csv":
      default:
        console.log('📄 [parseBillFile] 使用通用 CSV 解析器...');
        result = await parseCSV(file);
        console.log('✅ [parseBillFile] 通用 CSV 解析器返回', result.length, '条记录');
        return result;
    }
  }
}

/**
 * 使用 AI 进行批量分类（fallback）
 */
async function categorizeByAI(
  bills: Array<{ description: string; amount: number }>
): Promise<Map<string, string>> {
  console.log('🤖 [categorizeByAI] 使用 AI 分类', bills.length, '条未分类账单');

  // 批量调用 AI API
  const request = await fetch('/api/batch-categorize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bills }),
  });

  if (!request.ok) {
    console.error('❌ [categorizeByAI] AI 请求失败:', request.statusText);
    return new Map();
  }

  const result = await request.json();
  const categoryMap = new Map<string, string>();

  result.categories.forEach((item: { description: string; category: string }) => {
    categoryMap.set(item.description, item.category);
  });

  console.log('✅ [categorizeByAI] AI 分类完成');
  return categoryMap;
}

/**
 * 单条账单分类（三层策略）
 */
async function categorizeSingleBill(
  bill: ParsedBill,
  aiCategoryCache: Map<string, string>
): Promise<{ category: string; source: string }> {
  const description = bill.description;

  // 第一层：优先使用原始账单的分类
  if (bill.originalData?.category) {
    const originalCategory = bill.originalData.category as string;
    if (originalCategory && originalCategory.trim() !== '') {
      console.log('📋 [categorizeBill] 使用原始分类:', originalCategory);
      return { category: originalCategory, source: 'original' };
    }
  }

  // 第二层：规则匹配（暂时只使用默认规则）
  // TODO: 支持用户自定义规则
  const defaultRules = getCategoryRules();
  const allRules = defaultRules.sort((a, b) => (b.priority || 0) - (a.priority || 0));

  for (const rule of allRules) {
    // 跳过默认规则（priority: 0）
    if (rule.priority === 0) continue;

    const pattern = rule.pattern instanceof RegExp
      ? rule.pattern
      : new RegExp(rule.pattern, 'i');

    if (pattern.test(description)) {
      const categoryParts = rule.account.split(':');
      const mainCategory = categoryParts[1] || 'Uncategorized';
      const subCategory = categoryParts[2] || '';
      const categoryDisplayName = subCategory ? `${mainCategory}-${subCategory}` : mainCategory;

      console.log('✅ [categorizeBill] 规则匹配:', rule.account, '→', categoryDisplayName);
      return { category: categoryDisplayName, source: 'rule' };
    }
  }

  // 第三层：AI Fallback
  if (aiCategoryCache.has(description)) {
    const aiCategory = aiCategoryCache.get(description)!;
    const categoryParts = aiCategory.split(':');
    const mainCategory = categoryParts[1] || 'Uncategorized';
    const subCategory = categoryParts[2] || '';
    const categoryDisplayName = subCategory ? `${mainCategory}-${subCategory}` : mainCategory;

    console.log('🤖 [categorizeBill] AI 分类:', aiCategory, '→', categoryDisplayName);
    return { category: categoryDisplayName, source: 'ai' };
  }

  console.log('❓ [categorizeBill] 未分类，返回默认值');
  return { category: '未分类', source: 'none' };
}

/**
 * 批量分类账单（三层策略）
 * 返回标准分类（15个分类之一）
 */
export async function categorizeBills(
  bills: ParsedBill[]
): Promise<Array<ParsedBill & { category: string }>> {
  console.log('🏷️ [categorizeBills] 开始分类', bills.length, '条账单');

  // 从云端获取规则（包含用户自定义规则）
  const rules = await fetchUserRules();

  // 第一步：规则匹配，找出未分类的账单
  const categorized: Array<ParsedBill & { category: string }> = [];
  const uncategorized: Array<{ description: string; amount: number }> = [];

  for (const bill of bills) {
    // 第一层：检查原始分类
    if (bill.originalData?.category) {
      const originalCategory = bill.originalData.category as string;
      if (originalCategory && originalCategory.trim() !== '') {
        // 尝试将原始分类映射到标准分类
        // 先尝试直接映射
        if (isValidCategory(originalCategory)) {
          categorized.push({ ...bill, category: getCategoryDisplayName(originalCategory as StandardCategory) });
          continue;
        }
      }
    }

    // 第二层：规则匹配（使用云端规则）
    const sortedRules = [...rules].sort((a, b) => (b.priority || 0) - (a.priority || 0));
    let matched = false;

    for (const rule of sortedRules) {
      if (rule.priority === 0) continue; // 跳过默认规则

      const pattern = rule.pattern instanceof RegExp
        ? rule.pattern
        : new RegExp(rule.pattern, 'i');

      if (pattern.test(bill.description)) {
        // 将 Beancount 账户转换为标准分类
        const standardCategory = beancountToCategory(rule.account);
        if (standardCategory) {
          const displayName = getCategoryDisplayName(standardCategory);
          categorized.push({ ...bill, category: displayName });
          matched = true;
          break;
        }
      }
    }

    if (!matched) {
      uncategorized.push({ description: bill.description, amount: bill.amount });
    }
  }

  console.log('📊 [categorizeBills] 规则匹配完成:', categorized.length, '已分类,', uncategorized.length, '待 AI 分类');

  // 第三步：如果有未分类的，使用 AI 批量分类
  if (uncategorized.length > 0) {
    console.log('🤖 [categorizeBills] 调用 AI 分类剩余', uncategorized.length, '条账单...');

    try {
      const aiCategoryCache = await categorizeByAI(uncategorized);

      // 处理 AI 分类结果
      uncategorized.forEach((item, index) => {
        const bill = bills.find(b => b.description === item.description);
        if (!bill) return;

        if (aiCategoryCache.has(item.description)) {
          const aiCategory = aiCategoryCache.get(item.description)!;
          // AI 返回的应该是标准分类
          if (isValidCategory(aiCategory)) {
            const displayName = getCategoryDisplayName(aiCategory as StandardCategory);
            categorized.push({ ...bill, category: displayName });
          } else {
            // AI 返回的不是标准分类，使用兜底
            categorized.push({ ...bill, category: getCategoryDisplayName('Shopping-Daily' as StandardCategory) });
          }
        } else {
          categorized.push({ ...bill, category: getCategoryDisplayName('Shopping-Daily' as StandardCategory) });
        }
      });
    } catch (error) {
      console.error('❌ [categorizeBills] AI 分类失败:', error);
      // AI 失败，将未分类的标记为日用品（兜底）
      uncategorized.forEach((item) => {
        const bill = bills.find(b => b.description === item.description);
        if (bill) {
          categorized.push({ ...bill, category: getCategoryDisplayName('Shopping-Daily' as StandardCategory) });
        }
      });
    }
  }

  // 统计分类分布
  const categoryStats: Record<string, number> = {};
  categorized.forEach(bill => {
    categoryStats[bill.category] = (categoryStats[bill.category] || 0) + 1;
  });

  console.log('📊 [categorizeBills] 最终分类统计:', categoryStats);

  return categorized;
}

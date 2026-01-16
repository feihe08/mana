/**
 * 客户端解析器
 * 在浏览器中解析账单文件
 */

import * as XLSX from "xlsx";
import { parseAlipayCSV } from "../parsers/alipay";
import { parseWechatCSV } from "../parsers/wechat";
import { parseCSV } from "../parsers/csv";
import type { ParsedBill } from "../parsers/csv";

export type { ParsedBill };

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
 * 根据来源解析账单文件
 */
export async function parseBillFile(file: File, source: string): Promise<ParsedBill[]> {
  switch (source) {
    case "alipay":
      return await parseAlipayCSV(file);
    case "wechat":
      return await parseWechatCSV(file);
    case "bank":
    case "csv":
      return await parseCSV(file);
    default:
      throw new Error(`不支持的账单来源: ${source}`);
  }
}

/**
 * 默认分类规则（从数据库 schema 复制）
 * 在客户端预览时使用
 */
export const DEFAULT_CATEGORIES: Array<{
  id: string;
  name: string;
  keywords: string[];
}> = [
  {
    id: "cat-food",
    name: "餐饮",
    keywords: ["餐饮", "美食", "外卖", "饭", "面", "菜"],
  },
  {
    id: "cat-transport",
    name: "交通",
    keywords: ["交通", "打车", "地铁", "公交", "加油", "停车"],
  },
  {
    id: "cat-shopping",
    name: "购物",
    keywords: ["购物", "淘宝", "京东", "超市", "便利店"],
  },
  {
    id: "cat-entertainment",
    name: "娱乐",
    keywords: ["娱乐", "电影", "游戏", "KTV", "健身"],
  },
  {
    id: "cat-housing",
    name: "居住",
    keywords: ["房租", "水电", "燃气", "物业", "宽带"],
  },
  {
    id: "cat-uncategorized",
    name: "未分类",
    keywords: [],
  },
];

/**
 * 客户端智能分类
 * 基于关键词匹配
 */
export function categorizeBill(description: string, categories: typeof DEFAULT_CATEGORIES): string {
  let bestMatch = "未分类";
  let maxScore = 0;

  const normalizedDesc = description.toLowerCase();

  for (const category of categories) {
    let score = 0;

    // 检查关键词匹配
    for (const keyword of category.keywords) {
      if (normalizedDesc.includes(keyword.toLowerCase())) {
        score += 1;
      }
    }

    if (score > maxScore) {
      maxScore = score;
      bestMatch = category.name;
    }
  }

  return bestMatch;
}

/**
 * 批量分类账单
 */
export function categorizeBills(
  bills: ParsedBill[],
  categories: typeof DEFAULT_CATEGORIES = DEFAULT_CATEGORIES
): Array<ParsedBill & { category: string }> {
  return bills.map((bill) => ({
    ...bill,
    category: categorizeBill(bill.description, categories),
  }));
}

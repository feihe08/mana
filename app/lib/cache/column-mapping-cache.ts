/**
 * 列映射缓存管理
 * 使用 localStorage 缓存已识别的列映射，避免重复调用 AI API
 */

import type { ColumnMapping } from "../api/column-recognizer-client";

interface CacheEntry {
  source: string;          // 'wechat', 'alipay', etc.
  headerHash: string;      // 表头签名的哈希
  mapping: ColumnMapping;
  confidence: number;      // 0-1
  timestamp: number;       // 识别时间戳
}

export class ColumnMappingCache {
  private readonly STORAGE_KEY = 'mana:column_mappings';

  /**
   * 获取缓存的列映射
   * @param source 账单来源
   * @param headers CSV 表头
   * @returns 列映射，如果不存在则返回 null
   */
  get(source: string, headers: string[]): ColumnMapping | null {
    const headerHash = this.hashHeaders(headers);
    const all = this.getAll();

    const entry = all.find(
      e => e.source === source && e.headerHash === headerHash
    );

    return entry?.mapping || null;
  }

  /**
   * 缓存列映射
   * @param source 账单来源
   * @param headers CSV 表头
   * @param mapping 列映射
   * @param confidence 识别置信度
   */
  set(source: string, headers: string[], mapping: ColumnMapping, confidence: number): void {
    const headerHash = this.hashHeaders(headers);
    const all = this.getAll();

    // 移除旧的同名映射
    const filtered = all.filter(
      e => !(e.source === source && e.headerHash === headerHash)
    );

    // 添加新映射
    filtered.push({
      source,
      headerHash,
      mapping,
      confidence,
      timestamp: Date.now(),
    });

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
  }

  /**
   * 清除所有缓存
   */
  clear(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * 获取所有缓存条目
   */
  getAll(): CacheEntry[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * 生成表头签名的哈希
   * @param headers CSV 表头
   * @returns 哈希字符串
   */
  private hashHeaders(headers: string[]): string {
    return headers.join('|').toLowerCase().trim();
  }
}

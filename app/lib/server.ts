/**
 * 服务器端工具函数
 * 用于在 loader 和 action 中访问 Cloudflare 资源
 */

import type { Env } from "../cloudflare";

/**
 * 从 context 中获取数据库实例
 */
export function getDB(context: { env: Env }): D1Database {
  if (!context.env.DB) {
    throw new Error("Database not available. Make sure D1 is configured in wrangler.toml");
  }
  return context.env.DB;
}

/**
 * 从 context 中获取 R2 存储桶实例
 */
export function getBucket(context: { env: Env }): R2Bucket {
  if (!context.env.BUCKET) {
    throw new Error("R2 Bucket not available. Make sure R2 is configured in wrangler.toml");
  }
  return context.env.BUCKET;
}

/**
 * 验证 Cloudflare 环境是否正确配置
 */
export function validateEnv(context: { env: Env }): void {
  if (!context.env.DB) {
    throw new Error("D1 Database is not configured");
  }
  if (!context.env.BUCKET) {
    throw new Error("R2 Bucket is not configured");
  }
}

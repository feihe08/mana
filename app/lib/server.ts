/**
 * 服务器端工具函数
 * 用于在 loader 和 action 中访问 Cloudflare 资源
 */

import type { Env } from "../cloudflare";

/**
 * 从 loader/action args 中获取数据库实例
 * React Router v7 的 Cloudflare 适配器将 env 放在 args.context.cloudflare.env
 */
export function getDB(args: { context?: { cloudflare?: { env?: Env } } }): D1Database {
  if (!args?.context?.cloudflare?.env?.DB) {
    throw new Error("Database not available. Make sure D1 is configured in wrangler.toml");
  }
  return args.context.cloudflare.env.DB;
}

/**
 * 从 loader/action args 中获取 R2 存储桶实例
 */
export function getBucket(args: { context?: { cloudflare?: { env?: Env } } }): R2Bucket {
  if (!args?.context?.cloudflare?.env?.BUCKET) {
    throw new Error("R2 Bucket not available. Make sure R2 is configured in wrangler.toml");
  }
  return args.context.cloudflare.env.BUCKET;
}

/**
 * 验证 Cloudflare 环境是否正确配置
 */
export function validateEnv(args: { context?: { cloudflare?: { env?: Env } } }): void {
  if (!args?.context?.cloudflare?.env?.DB) {
    throw new Error("D1 Database is not configured");
  }
  if (!args?.context?.cloudflare?.env?.BUCKET) {
    throw new Error("R2 Bucket is not configured");
  }
}

/**
 * Cloudflare 环境变量类型定义
 */

export interface Env {
  // D1 数据库实例
  DB: D1Database;

  // R2 存储桶实例
  BUCKET: R2Bucket;
}

/**
 * 获取 Cloudflare 环境变量的辅助函数
 * 用于在 loader 和 action 中访问数据库和存储
 */
export function getEnv(request: Request): Env {
  // 在 Cloudflare Workers 环境中，env 通过 context 传递
  // 这个函数会在实际使用时被 React Router 的 loader/action 替换
  throw new Error(
    "getEnv should not be called directly. " +
    "Use context.env from Route.LoaderArgs or Route.ActionArgs instead."
  );
}

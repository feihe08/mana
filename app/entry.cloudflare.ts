/**
 * Cloudflare Workers 入口文件
 * 这个文件用于在 Cloudflare Pages Functions 环境中运行应用
 */

import { createRequestHandler } from "react-router";

// @ts-ignore - build 文件在构建时生成
import * as build from "./build/server";

// 创建 Cloudflare Pages 需要的 fetch handler
export const fetch = createRequestHandler({
  // @ts-ignore - 类型定义问题，实际运行时正确
  build,
  mode: import.meta.env.MODE,
  // 获取 Cloudflare 环境变量
  getLoadContext: (context: any) => {
    return {
      ...context.env,
      // 将 Cloudflare 的 env 传递给 loader/action
      env: context.env,
    };
  },
});

import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    reactRouter({
      // 配置 Cloudflare 适配器
      cloudflare: {
        // 在开发模式下使用 wrangler 代理
        devProxy: {
          enabled: true,
        },
      },
    }),
    tsconfigPaths(),
    tailwindcss(),
  ],
  // 启用 sourcemap 用于调试
  build: {
    sourcemap: true,
    // 不压缩代码以获得更好的错误信息
    minify: false,
    // 保留源代码结构
    target: "esnext",
  },
});

import { type Config } from "@react-router/dev/config";

export default {
  ssr: true,

  future: {
    v8_viteEnvironmentApi: true,
  },

  // 确保 React Router 自动生成 entry.client
  buildEnd: async ({ buildManifest }) => {
    // React Router 会自动处理
  },
} satisfies Config;

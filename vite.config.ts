import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { execSync } from "child_process";

// 获取 git 信息
function getGitInfo() {
  try {
    const commit = execSync("git rev-parse --short HEAD", { encoding: "utf-8" }).trim();
    const message = execSync("git log -1 --pretty=%s", { encoding: "utf-8" }).trim();
    const time = execSync("git log -1 --pretty=%ci", { encoding: "utf-8" }).trim();
    return { commit, message, time };
  } catch {
    return {
      commit: "unknown",
      message: "No git info available",
      time: new Date().toISOString(),
    };
  }
}

const gitInfo = getGitInfo();

export default defineConfig({
  plugins: [
    reactRouter(),
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
  // 定义全局常量，在构建时注入 git 信息
  define: {
    __GIT_COMMIT__: JSON.stringify(gitInfo.commit),
    __GIT_MESSAGE__: JSON.stringify(gitInfo.message),
    __GIT_TIME__: JSON.stringify(gitInfo.time),
  },
});

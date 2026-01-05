import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import stylesheet from "@/app/styles.css?url";
import type { Env } from "./cloudflare";

export const links = () => [
  { rel: "stylesheet", href: stylesheet },
];

/**
 * Root loader - 获取 Cloudflare 环境变量
 * 这些变量会通过 context 传递给所有子路由的 loader 和 action
 */
export async function loader({ context }: { context: { env: Env } }) {
  // 验证必需的环境变量
  if (!context.env.DB) {
    throw new Error("DB is not available in context.env");
  }

  return {
    env: {
      hasDB: !!context.env.DB,
      hasBucket: !!context.env.BUCKET,
    },
  };
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

/**
 * Cloudflare Workers 入口文件
 * 这个文件包装 React Router 应用，添加 AI 端点
 */

import { createRequestHandler } from "@react-router/cloudflare";

// 创建 React Router 请求处理器
const requestHandler = createRequestHandler({
  build: () => import("../build/server/index.js"),
  mode: "production",
});

/**
 * 构建给 AI 的提示词
 */
function buildPrompt(headers, source) {
  return `你是一个账单解析专家。请分析以下 CSV 表头，识别关键列的索引位置。

来源：${source}
表头：[${headers.join(', ')}]

请返回 JSON 格式的列映射：
{
  "time": 列索引（0开始）,
  "description": 列索引,
  "amount": 列索引,
  "direction": 列索引（可选，-1表示不存在）,
  "counterparty": 列索引（可选，-1表示不存在）,
  "confidence": 识别置信度 (0-1)
}

规则：
- 时间列可能命名为：交易时间、时间、日期、Time、日期时间、DateTime
- 描述列可能命名为：商品、商品说明、说明、描述、Description、备注、Remark
- 金额列可能命名为：金额、金额(元)、Amount、价格、Price、交易金额
- 收支方向可能命名为：收/支、收支、方向、Direction、类型、Type
- 交易对方可能命名为：交易对方、对方、商户、Merchant、收款方
- 如果某个列不存在，设为 -1
- confidence 表示你对识别结果的信心（列名越明确越高，范围 0-1）`;
}

/**
 * 解析 AI 响应为 JSON
 */
function parseAIResponse(responseText) {
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error('Failed to parse AI response');
  }

  const parsed = JSON.parse(jsonMatch[0]);
  const { confidence, ...mapping } = parsed;

  return {
    mapping,
    confidence: confidence || 0.8,
  };
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 优先处理静态资产请求
    if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/.vite/') || url.pathname === '/favicon.ico' || url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i)) {
      try {
        return await env.ASSETS.fetch(request);
      } catch (e) {
        // 静态文件不存在，继续处理
      }
    }

    // 日志端点 - 用于调试
    if (url.pathname === '/_debug' && url.searchParams.get('token') === 'debug123') {
      const debugInfo = {
        timestamp: new Date().toISOString(),
        url: request.url,
        method: request.method,
        hasAI: !!env.AI,
        hasAssets: !!env.ASSETS,
        hasEnv: !!env,
      };
      return new Response(JSON.stringify(debugInfo, null, 2), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 处理 AI 列识别请求
    if (url.pathname === '/api/recognize-columns' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { headers, source } = body;

        if (!env.AI) {
          return new Response(JSON.stringify({
            error: 'AI 服务未配置'
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const response = await env.AI.run(
          '@cf/meta/llama-3.1-8b-instruct',
          {
            messages: [{
              role: 'user',
              content: buildPrompt(headers, source),
            }],
            max_tokens: 1024,
          }
        );

        const responseText = response.response || response;
        const result = parseAIResponse(responseText);

        return new Response(JSON.stringify(result), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: error instanceof Error ? error.message : '识别失败'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // 调用 React Router 处理其他请求
    try {
      console.log('Handling request with React Router:', url.pathname);

      // 使用 @react-router/cloudflare 的 handler
      const cloudflareContext = {
        request,
        env,
        waitUntil: ctx?.waitUntil?.bind(ctx) || (() => {}),
        passThroughOnException: ctx?.passThroughOnException?.bind(ctx) || (() => {}),
      };

      const response = await requestHandler(cloudflareContext);
      console.log('Response status:', response.status);
      return response;
    } catch (error) {
      console.error('Error:', error);
      return new Response(JSON.stringify({
        error: String(error),
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      }, null, 2), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};

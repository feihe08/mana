/**
 * Cloudflare Workers 入口文件
 * 这个文件包装 React Router 应用，添加 AI 端点
 */

import { createRequestHandler } from "@react-router/cloudflare";
import type { ServerBuild } from "react-router";

// 创建 React Router 请求处理器
const requestHandler = createRequestHandler({
  build: () => import("../build/server/index.js") as unknown as Promise<ServerBuild>,
  mode: "production",
});

/**
 * 构建给 AI 的提示词 - 用于列识别
 */
function buildPrompt(headers: string[], source: string) {
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
 * 构建给 AI 的提示词 - 用于交易分类
 */
function buildCategorizePrompt(description: string, amount: number, availableAccounts: string[]) {
  return `你是一个财务专家。请根据交易描述选择最合适的 Beancount 账户。

交易描述：${description}
金额：${Math.abs(amount)} 元
${amount < 0 ? '类型：支出（费用账户）' : '类型：收入（收入账户）'}

可用账户列表：
${availableAccounts.map((acc: string, i: number) => `${i + 1}. ${acc}`).join('\n')}

请返回 JSON 格式：
{
  "account": "选择的账户名称",
  "confidence": 置信度 (0-1),
  "reasoning": "选择理由（简短说明）"
}

规则：
- 支出选择 Expenses 开头的账户
- 收入选择 Income 开头的账户
- 选择最具体、最相关的账户
- confidence 应基于描述的清晰程度`;
}

/**
 * 解析 AI 响应为 JSON
 */
function parseAIResponse(responseText: string) {
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
  async fetch(request: Request, env: any, ctx: any) {
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
        const body = await request.json() as { headers: string[]; source: string };
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

    // 处理 AI 交易分类请求
    if (url.pathname === '/api/categorize' && request.method === 'POST') {
      try {
        const body = await request.json() as { description: string; amount: number; availableAccounts?: string[] };
        const { description, amount, availableAccounts } = body;

        if (!env.AI) {
          return new Response(JSON.stringify({
            error: 'AI 服务未配置'
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        if (!description || amount === undefined) {
          return new Response(JSON.stringify({
            error: '缺少必要参数：description 或 amount'
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const response = await env.AI.run(
          '@cf/meta/llama-3.1-8b-instruct',
          {
            messages: [{
              role: 'user',
              content: buildCategorizePrompt(
                description,
                amount,
                availableAccounts || []
              ),
            }],
            max_tokens: 512,
          }
        );

        const responseText = response.response || response;

        // 解析 AI 响应
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('Failed to parse AI response');
        }

        const result = JSON.parse(jsonMatch[0]);

        return new Response(JSON.stringify(result), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: error instanceof Error ? error.message : '分类失败'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // 处理批量 AI 交易分类请求
    if (url.pathname === '/api/batch-categorize' && request.method === 'POST') {
      try {
        const body = await request.json() as { bills: Array<{ description: string; amount: number }> };
        const { bills } = body;

        if (!env.AI) {
          return new Response(JSON.stringify({
            error: 'AI 服务未配置'
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        if (!bills || !Array.isArray(bills) || bills.length === 0) {
          return new Response(JSON.stringify({
            error: '缺少必要参数：bills (数组)'
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        console.log(`批量分类 ${bills.length} 条账单`);

        // 构建批量提示词
        const prompt = `你是一个财务专家。请根据交易描述为以下 ${bills.length} 笔交易选择最合适的分类。

可用分类列表（15个标准分类）：
1. Food-Delivery - 外卖配送（美团、饿了么、汉堡王外卖等）
2. Food-Restaurant - 餐厅用餐（小笼包、牛肉面、餐厅等）
3. Food-Groceries - 生鲜食品（菜鲜果美、超市、菜市场等）
4. Transport-Taxi - 打车出行（滴滴、网约车、出租车等）
5. Transport-Public - 公共交通（地铁、公交、一卡通等）
6. Shopping-Online - 网购（京东、淘宝、拼多多等电商平台）
7. Shopping-Daily - 日用品（名创优品、便利店、百货等）
8. Health-Medical - 医疗（医院、体检、药品、医保支付等）
9. Health-Wellness - 保健（按摩、修脚、健身、美容等）
10. Housing-Utilities - 水电燃气（水费、电费、燃气、桶装水、充电等）
11. Housing-Internet - 网络通讯（宽带、话费、充值等）
12. Education-Learning - 教育（培训、课程、书籍、学校等）
13. Misc-Fees - 服务费用（手续费、代理费、服务费等）
14. Misc-Charity - 公益捐赠（慈善捐款、公益组织等）
15. Income-Refunds - 退款/转账（退款、转账收入等）
16. Income-Salary - 工资收入（工资、奖金、薪资等）

交易列表：
${bills.map((b, i) => `${i + 1}. "${b.description}" (${Math.abs(b.amount)}元)`).join('\n')}

请返回 JSON 格式：
{
  "categories": [
    {"description": "交易描述1", "category": "Food-Delivery", "reasoning": "理由"},
    {"description": "交易描述2", "category": "Transport-Taxi", "reasoning": "理由"}
  ]
}

重要规则：
- 必须从上述15个标准分类中选择
- 支出选择 Food/Transport/Shopping/Health/Housing/Education/Misc 开头的分类
- 收入选择 Income 开头的分类
- 选择最具体、最相关的分类
- 描述不明确的返回 Shopping-Daily`;

        const response = await env.AI.run(
          '@cf/meta/llama-3.1-8b-instruct',
          {
            messages: [{
              role: 'user',
              content: prompt,
            }],
            max_tokens: 4096,
          }
        );

        // 正确处理 Cloudflare AI 响应格式
        let responseText: string;
        if (typeof response === 'string') {
          responseText = response;
        } else if (response && typeof response === 'object') {
          // Cloudflare AI 返回格式：{ response: string } 或 { result: { response: string } }
          responseText = (response as any).response || (response as any).result?.response || JSON.stringify(response);
        } else {
          throw new Error('Invalid AI response format');
        }

        console.log('AI 响应类型:', typeof responseText);
        console.log('AI 响应前500字符:', responseText.substring(0, 500));

        // 解析 AI 响应 - 改进的 JSON 提取逻辑
        let result;
        try {
          // 尝试直接解析（如果整个响应就是 JSON）
          result = JSON.parse(responseText);
        } catch (e) {
          // 如果直接解析失败，尝试提取 JSON 对象
          const jsonMatch = responseText.match(/\{[\s\S]*"categories"[\s\S]*\}/);
          if (!jsonMatch) {
            console.error('无法从 AI 响应中提取 JSON:', responseText);
            throw new Error('AI 响应中未找到有效的 JSON 格式');
          }

          try {
            result = JSON.parse(jsonMatch[0]);
          } catch (parseError) {
            console.error('JSON 解析失败:', jsonMatch[0]);
            throw new Error('AI 返回的 JSON 格式无效');
          }
        }

        // 验证结果格式
        if (!result.categories || !Array.isArray(result.categories)) {
          console.error('AI 响应格式错误，缺少 categories 数组:', result);
          throw new Error('AI 响应格式错误：缺少 categories 数组');
        }

        console.log(`✅ 成功解析 ${result.categories.length} 条分类结果`);

        return new Response(JSON.stringify(result), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (error) {
        console.error('批量分类错误:', error);
        console.error('错误堆栈:', error instanceof Error ? error.stack : 'N/A');

        // 返回详细的错误信息
        const errorMessage = error instanceof Error ? error.message : '批量分类失败';
        const errorDetails = error instanceof Error ? error.stack : String(error);

        return new Response(JSON.stringify({
          error: errorMessage,
          details: errorDetails,
          timestamp: new Date().toISOString(),
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
        functionPath: "",
        next: () => {},
        params: {},
        data: {},
      };

      const response = await requestHandler(cloudflareContext as any);
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

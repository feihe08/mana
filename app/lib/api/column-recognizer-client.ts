/**
 * AI 列识别 API 客户端
 * 调用 Mana Workers 的 /api/recognize-columns 端点
 */

export interface ColumnMapping {
  time: number;
  description: number;
  amount: number;
  direction?: number;
  counterparty?: number;
}

export interface RecognizeResult {
  mapping: ColumnMapping;
  confidence: number; // 0-1
}

/**
 * 调用 AI 列识别 API
 * @param headers CSV 表头数组
 * @param source 账单来源（wechat, alipay, csv, bank）
 * @returns 列映射和置信度
 */
export async function recognizeColumns(
  headers: string[],
  source: string
): Promise<RecognizeResult> {
  const API_ENDPOINT = "/api/recognize-columns";

  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ headers, source }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' })) as { error?: string };
    console.error('❌ [AI API] Error:', errorData);
    throw new Error(errorData.error || 'AI 识别服务暂时不可用');
  }

  return response.json();
}

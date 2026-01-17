import { useState } from "react";
import { useActionData, useNavigation } from "react-router";
import { BillPreview, type BillRecord } from "~/components/BillPreview";
import { parseBillFile, categorizeBills, DEFAULT_CATEGORIES } from "~/lib/client/parsers";

export function meta() {
  return [
    { title: "上传账单 - Mana" },
  ];
}

/**
 * Action - 接收解析后的账单数据
 */
export async function action({ request, context }: {
  request: Request;
  context: { env: import("../cloudflare").Env };
}) {
  const db = context.env?.DB;

  // 检查数据库是否可用
  if (!db) {
    return {
      error: "数据库未配置。请在本地开发环境运行 `pnpm db:init` 初始化数据库。",
    };
  }

  try {
    const body = await request.json();
    const { bills } = body as { bills: Array<BillRecord & { source: string }> };

    if (!bills || !Array.isArray(bills) || bills.length === 0) {
      return { error: "没有有效的账单数据" };
    }

    // 转换数据格式以匹配数据库
    const dbBills = bills.map((bill) => ({
      id: bill.id,
      source: bill.source,
      amount: bill.amount,
      category: bill.category,
      description: bill.description,
      transactionDate: bill.date,
      originalData: JSON.stringify(bill.originalData || {}),
    }));

    // 批量保存到数据库
    const { createBills } = await import("~/lib/db");
    await createBills(db, dbBills);

    return {
      success: true,
      message: `成功导入 ${bills.length} 条账单记录`,
      count: bills.length,
    };
  } catch (error) {
    console.error("保存失败:", error);
    return {
      error: `保存失败: ${error instanceof Error ? error.message : "未知错误"}`,
    };
  }
}

export default function NewBill() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();

  // 状态管理
  const [step, setStep] = useState<"upload" | "preview">("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedSource, setSelectedSource] = useState<string>("");
  const [bills, setBills] = useState<Array<BillRecord & { source: string }>>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  // AI 识别状态
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [mappingInfo, setMappingInfo] = useState<{ confidence: number } | null>(null);
  const [recognizeError, setRecognizeError] = useState<string | null>(null);

  const isSubmitting = navigation.state === "submitting";

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleFileChange 被调用');
    console.log('event.target:', e.target);
    console.log('event.target.files:', e.target.files);

    const file = e.target.files?.[0];
    console.log('提取的文件:', file);

    if (file) {
      console.log('准备 setSelectedFile');
      setSelectedFile(file);
      setParseError(null);
      setRecognizeError(null);
      setMappingInfo(null);
      console.log('setSelectedFile 完成');
    } else {
      console.log('文件为空，不设置状态');
    }
  };

  // 处理重新识别
  const handleReidentify = async () => {
    if (!selectedFile || !selectedSource) return;

    setIsParsing(true);
    setRecognizeError(null);

    try {
      // 强制重新识别
      const parsedBills = await parseBillFile(selectedFile, selectedSource, {
        forceReidentify: true,
        onRecognizing: (recognizing) => {
          setIsRecognizing(recognizing);
        },
      });

      if (parsedBills.length === 0) {
        setParseError("未找到有效的账单数据，请检查文件格式");
        return;
      }

      // 自动分类
      const categorizedBills = categorizeBills(parsedBills).map((bill) => ({
        id: bill.id,
        date: bill.transactionDate,
        description: bill.description,
        amount: bill.amount,
        category: bill.category,
        source: selectedSource,
        originalData: bill.originalData,
      }));

      setBills(categorizedBills);
      setStep("preview");
    } catch (error) {
      console.error("重新识别失败:", error);
      setRecognizeError(`AI 识别失败: ${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setIsParsing(false);
      setIsRecognizing(false);
    }
  };

  // 处理解析
  const handleParse = async () => {
    if (!selectedFile || !selectedSource) {
      setParseError("请选择文件和账单来源");
      return;
    }

    // 验证文件大小（10MB）
    const MAX_SIZE = 10 * 1024 * 1024;
    if (selectedFile.size > MAX_SIZE) {
      setParseError("文件大小不能超过 10MB");
      return;
    }

    // 验证文件类型
    const fileName = selectedFile.name.toLowerCase();
    const isValidExtension = fileName.endsWith(".csv") || fileName.endsWith(".xlsx") || fileName.endsWith(".xls");

    if (!isValidExtension) {
      setParseError("不支持的文件格式，请上传 CSV 或 Excel 文件");
      return;
    }

    setIsParsing(true);
    setParseError(null);
    setRecognizeError(null);

    try {
      // 解析文件（使用 AI 智能识别）
      const parsedBills = await parseBillFile(selectedFile, selectedSource, {
        onRecognizing: (recognizing) => {
          setIsRecognizing(recognizing);
        },
      });

      if (parsedBills.length === 0) {
        setParseError("未找到有效的账单数据，请检查文件格式");
        setIsParsing(false);
        return;
      }

      // 自动分类
      const categorizedBills = categorizeBills(parsedBills).map((bill) => ({
        id: bill.id,
        date: bill.transactionDate,
        description: bill.description,
        amount: bill.amount,
        category: bill.category,
        source: selectedSource,
        originalData: bill.originalData,
      }));

      setBills(categorizedBills);
      setStep("preview");
    } catch (error) {
      console.error("解析失败:", error);
      const errorMessage = error instanceof Error ? error.message : "未知错误";

      // 判断是否是 AI 识别错误
      if (errorMessage.includes("AI") || errorMessage.includes("识别")) {
        setRecognizeError(errorMessage);
      } else {
        setParseError(`文件解析失败: ${errorMessage}`);
      }
    } finally {
      setIsParsing(false);
      setIsRecognizing(false);
    }
  };

  // 处理重新分类
  const handleRecategorize = async (selectedBills: BillRecord[]) => {
    // 对选中的记录使用不同的分类策略（随机打乱关键词顺序）
    const shuffledCategories = [...DEFAULT_CATEGORIES].sort(() => Math.random() - 0.5);

    const updatedBills = bills.map((bill) => {
      if (selectedBills.some(sb => sb.id === bill.id)) {
        // 重新分类
        let bestMatch = "未分类";
        let maxScore = 0;

        const normalizedDesc = bill.description.toLowerCase();

        for (const category of shuffledCategories) {
          let score = 0;

          for (const keyword of category.keywords) {
            if (normalizedDesc.includes(keyword.toLowerCase())) {
              score += 1 + Math.random(); // 添加随机权重
            }
          }

          if (score > maxScore) {
            maxScore = score;
            bestMatch = category.name;
          }
        }

        return { ...bill, category: bestMatch };
      }
      return bill;
    });

    setBills(updatedBills);
  };

  // 处理确认上传
  const handleConfirm = async (billsToUpload: BillRecord[]) => {
    try {
      await fetch("", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bills: billsToUpload }),
      });
      // 成功后会刷新页面，actionData 会包含结果
    } catch (error) {
      console.error("上传失败:", error);
    }
  };

  // 重置表单
  const handleReset = () => {
    setStep("upload");
    setSelectedFile(null);
    setSelectedSource("");
    setBills([]);
    setParseError(null);
  };

  return (
    <div className="min-h-screen bg-gray-950 relative">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />

      <div className="relative container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* 返回链接 */}
          <a
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 group"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            返回首页
          </a>

          <h1 className="text-4xl font-bold text-white mb-2">上传账单</h1>
          <p className="text-gray-400 mb-8">支持支付宝、微信、银行卡等多种格式</p>

          {/* Action 消息 */}
          {actionData?.error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/50 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-red-400 font-semibold mb-1">上传失败</h3>
                  <p className="text-red-300 text-sm">{actionData.error}</p>
                </div>
              </div>
            </div>
          )}

          {actionData?.success && (
            <div className="mb-6 bg-green-500/10 border border-green-500/50 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-green-400 font-semibold mb-1">上传成功</h3>
                  <p className="text-green-300 text-sm">{actionData.message}</p>
                </div>
              </div>
            </div>
          )}

          {/* AI 识别状态 */}
          {isRecognizing && (
            <div className="mb-6 bg-purple-500/10 border border-purple-500/50 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <svg className="animate-spin h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-purple-300">
                  🤖 正在使用 AI 智能识别列格式...
                </span>
              </div>
            </div>
          )}

          {mappingInfo && !isRecognizing && (
            <div className="mb-6 bg-green-500/10 border border-green-500/50 rounded-xl p-4 backdrop-blur-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-green-300">
                  ✨ AI 已识别列映射（置信度: {Math.round(mappingInfo.confidence * 100)}%）
                </span>
              </div>
              <button
                onClick={handleReidentify}
                disabled={isParsing}
                className="text-sm text-gray-400 hover:text-white flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                重新识别
              </button>
            </div>
          )}

          {recognizeError && (
            <div className="mb-6 bg-red-500/10 border border-red-500/50 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-red-400 font-semibold mb-1">AI 识别失败</h3>
                  <p className="text-red-300 text-sm">{recognizeError}</p>
                  <p className="text-red-300/70 text-xs mt-2">
                    请稍后重试，或联系客服
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 步骤 1: 上传表单 */}
          {step === "upload" && (
            <>
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 backdrop-blur-sm">
                <div className="space-y-6">
                  <div>
                    <label htmlFor="source" className="block text-sm font-medium text-gray-300 mb-3">
                      账单来源
                    </label>
                    <select
                      id="source"
                      value={selectedSource}
                      onChange={(e) => {
                        console.log('下拉菜单改变:', e.target.value);
                        setSelectedSource(e.target.value);
                      }}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    >
                      <option value="">请选择</option>
                      <option value="alipay">支付宝</option>
                      <option value="wechat">微信支付</option>
                      <option value="bank">银行卡</option>
                      <option value="csv">CSV 文件</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="file" className="block text-sm font-medium text-gray-300 mb-3">
                      账单文件
                    </label>
                    <input
                      type="file"
                      id="file"
                      onChange={handleFileChange}
                      accept=".csv,.xlsx,.xls"
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white file:cursor-pointer hover:file:bg-purple-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                    {selectedFile && (
                      <p className="mt-3 text-sm text-gray-400">
                        已选择: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </p>
                    )}
                    <p className="mt-2 text-sm text-gray-500 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      支持 CSV、Excel 格式，文件大小不超过 10MB
                    </p>
                  </div>

                  {/* 解析错误提示 */}
                  {parseError && (
                    <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4">
                      <p className="text-red-300 text-sm">{parseError}</p>
                    </div>
                  )}

                  <div className="flex gap-4">
                    {/* 调试信息 */}
                    <div className="w-full mb-4 p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-xl">
                      <p className="text-sm text-yellow-300 mb-2">
                        <strong>调试信息：</strong><br/>
                        文件: {selectedFile ? selectedFile.name : 'null'}<br/>
                        来源: {selectedSource || 'null'}<br/>
                        解析中: {isParsing ? '是' : '否'}<br/>
                        按钮禁用: {!selectedFile || !selectedSource || isParsing ? '是' : '否'}
                      </p>
                      <button
                        onClick={() => {
                          console.log('测试按钮被点击');
                          alert('React 事件处理器正常工作！');
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
                      >
                        测试 React 事件
                      </button>
                      <button
                        onClick={() => {
                          console.log('手动设置状态');
                          setSelectedFile(new File([''], 'test.csv'));
                          setSelectedSource('wechat');
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm"
                      >
                        手动设置状态
                      </button>
                    </div>
                    <button
                      onClick={handleParse}
                      disabled={!selectedFile || !selectedSource || isParsing}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    >
                      {isParsing ? (
                        <>
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          解析中...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          解析文件
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* 使用提示 */}
              <div className="mt-8 bg-gray-900/30 border border-gray-800/50 rounded-2xl p-6 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  使用提示
                </h3>
                <ul className="space-y-3 text-sm text-gray-400">
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                    <span><strong className="text-gray-300">支付宝：</strong>在支付宝 App 中搜索"账单"，导出 CSV 格式账单</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                    <span><strong className="text-gray-300">微信支付：</strong>在微信钱包中点击"账单"，下载交易明细</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-pink-500 mt-2 flex-shrink-0" />
                    <span><strong className="text-gray-300">银行卡：</strong>从网上银行或手机银行导出对账单</span>
                  </li>
                </ul>
              </div>
            </>
          )}

          {/* 步骤 2: 预览和确认 */}
          {step === "preview" && (
            <BillPreview
              bills={bills}
              onRecategorize={handleRecategorize}
              onConfirm={handleConfirm}
              onCancel={handleReset}
            />
          )}
        </div>
      </div>
    </div>
  );
}

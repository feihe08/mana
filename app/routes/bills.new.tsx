export function meta() {
  return [
    { title: "上传账单 - Mana" },
  ];
}

/**
 * Loader - 验证环境配置
 */
export async function loader({ context }: { context: { env: import("../cloudflare").Env } }) {
  // TODO: 在下一个任务中实现文件上传 action
  return {
    ready: true,
  };
}

/**
 * Action - 处理文件上传
 * TODO: 在下一个任务中实现完整的上传逻辑
 */
export async function action({ request, context }: {
  request: Request;
  context: { env: import("../cloudflare").Env };
}) {
  // 占位符 - 下一个任务实现
  return { message: "File upload not implemented yet" };
}

export default function NewBill() {
  return (
    <div className="min-h-screen bg-gray-950 relative">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />

      <div className="relative container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
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

          {/* 上传表单 */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 backdrop-blur-sm">
            <form method="post" encType="multipart/form-data" className="space-y-6">
              <div>
                <label htmlFor="source" className="block text-sm font-medium text-gray-300 mb-3">
                  账单来源
                </label>
                <select
                  id="source"
                  name="source"
                  required
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
                <div className="relative">
                  <input
                    type="file"
                    id="file"
                    name="file"
                    required
                    accept=".csv,.xlsx,.xls"
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white file:cursor-pointer hover:file:bg-purple-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>
                <p className="mt-3 text-sm text-gray-500 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  支持 CSV、Excel 格式，文件大小不超过 10MB
                </p>
              </div>

              <button
                type="submit"
                className="group w-full relative bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                开始分析
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </form>
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
        </div>
      </div>
    </div>
  );
}

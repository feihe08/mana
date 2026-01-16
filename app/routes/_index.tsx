export function meta() {
  return [
    { title: "Mana - 智能账单分析" },
    { name: "description", content: "自动分析您的支付宝、微信、银行卡账单" },
  ];
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

      <div className="relative container mx-auto px-4 py-16">
        <div className="text-center">
          {/* Logo / 标题 */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-gray-800/50 border border-gray-700/50 backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 animate-pulse" />
              <span className="text-sm text-gray-300">智能财务分析</span>
            </div>
          </div>

          <h1 className="text-7xl font-bold text-white mb-6 tracking-tight">
            Mana
          </h1>
          <p className="text-2xl text-gray-400 mb-6 font-light">
            智能账单分析平台
          </p>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            自动分析您的支付宝、微信、银行卡账单，智能分类统计，异常检测提醒
          </p>
        </div>

        {/* 功能卡片 */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="group relative bg-gray-900/50 border border-gray-800 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-300 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mb-6 border border-purple-500/20">
                <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">智能分类</h3>
              <p className="text-gray-400 leading-relaxed">自动识别消费类别，精准统计收支</p>
            </div>
          </div>

          <div className="group relative bg-gray-900/50 border border-gray-800 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-300 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mb-6 border border-blue-500/20">
                <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">多格式支持</h3>
              <p className="text-gray-400 leading-relaxed">支持支付宝、微信、银行账单导入</p>
            </div>
          </div>

          <div className="group relative bg-gray-900/50 border border-gray-800 rounded-2xl p-8 hover:border-pink-500/50 transition-all duration-300 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center mb-6 border border-pink-500/20">
                <svg className="w-6 h-6 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">异常检测</h3>
              <p className="text-gray-400 leading-relaxed">自动识别异常支出，预算超支提醒</p>
            </div>
          </div>
        </div>

        {/* CTA 按钮 */}
        <div className="mt-20 text-center">
          <a
            href="/bills/new"
            className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
          >
            开始分析账单
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}

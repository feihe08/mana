export function meta() {
  return [
    { title: "Mana - 智能账单分析" },
    { name: "description", content: "自动分析您的支付宝、微信、银行卡账单" },
  ];
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">Mana</h1>
          <p className="text-2xl text-gray-600 mb-8">智能账单分析平台</p>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            自动分析您的支付宝、微信、银行卡账单，智能分类统计，异常检测提醒
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">智能分类</h3>
            <p className="text-gray-600">自动识别消费类别，精准统计收支</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-4xl mb-4">📁</div>
            <h3 className="text-xl font-semibold mb-2">多格式支持</h3>
            <p className="text-gray-600">支持支付宝、微信、银行账单导入</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-4xl mb-4">🔔</div>
            <h3 className="text-xl font-semibold mb-2">异常检测</h3>
            <p className="text-gray-600">自动识别异常支出，预算超支提醒</p>
          </div>
        </div>

        <div className="mt-16 text-center">
          <a
            href="/bills/new"
            className="inline-block bg-indigo-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            开始分析账单
          </a>
        </div>
      </div>
    </div>
  );
}

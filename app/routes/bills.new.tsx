export function meta() {
  return [
    { title: "上传账单 - Mana" },
  ];
}

export default function NewBill() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">上传账单</h1>

          <div className="bg-white rounded-lg shadow p-8">
            <form method="post" encType="multipart/form-data" className="space-y-6">
              <div>
                <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-2">
                  账单来源
                </label>
                <select
                  id="source"
                  name="source"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">请选择</option>
                  <option value="alipay">支付宝</option>
                  <option value="wechat">微信支付</option>
                  <option value="bank">银行卡</option>
                  <option value="csv">CSV 文件</option>
                </select>
              </div>

              <div>
                <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
                  账单文件
                </label>
                <input
                  type="file"
                  id="file"
                  name="file"
                  required
                  accept=".csv,.xlsx,.xls"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <p className="mt-2 text-sm text-gray-500">
                  支持 CSV、Excel 格式
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                开始分析
              </button>
            </form>
          </div>

          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 使用提示</h3>
            <ul className="text-blue-800 space-y-2 text-sm">
              <li>• 支付宝：在支付宝App中导出 CSV 格式账单</li>
              <li>• 微信支付：在微信钱包中下载账单</li>
              <li>• 银行卡：从网上银行导出对账单</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

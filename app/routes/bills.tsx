/**
 * 账单列表页面
 * 展示所有已转换的账单历史
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { getBillsHistory, deleteBill, type SavedBill } from '../lib/client/storage';

export function meta() {
  return [
    { title: '账单列表 - Mana' },
    { name: 'description', content: '查看和管理已转换的账单历史' },
  ];
}

export default function BillsList() {
  const [bills, setBills] = useState<SavedBill[]>([]);
  const [filteredBills, setFilteredBills] = useState<SavedBill[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'amount'>('date');
  const [loading, setLoading] = useState(true);

  // 加载账单列表
  useEffect(() => {
    loadBills();
  }, []);

  // 筛选和排序
  useEffect(() => {
    let filtered = [...bills];

    // 搜索筛选
    if (searchQuery) {
      filtered = filtered.filter((bill) =>
        bill.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        case 'amount':
          return b.totalAmount - a.totalAmount;
        default:
          return 0;
      }
    });

    setFilteredBills(filtered);
  }, [bills, searchQuery, sortBy]);

  const loadBills = () => {
    setLoading(true);
    const history = getBillsHistory();
    setBills(history);
    setLoading(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这条账单记录吗？')) {
      deleteBill(id);
      loadBills();
    }
  };

  const handleDownload = (bill: SavedBill) => {
    const blob = new Blob([bill.beancountContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${bill.name}.bean`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN');
  };

  return (
    <div className="min-h-screen bg-gray-950 relative">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

      <div className="relative container mx-auto px-4 py-8">
        {/* 标题 */}
        <div className="mb-8">
          <Link to="/" className="text-purple-400 hover:text-purple-300 inline-block mb-4">
            ← 返回首页
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">账单历史</h1>
          <p className="text-gray-400">
            {bills.length} 条记录，
            共 {bills.reduce((sum, b) => sum + b.transactionCount, 0)} 笔交易
          </p>
        </div>

        {/* 筛选和搜索 */}
        <div className="mb-6 flex gap-4">
          <input
            type="text"
            placeholder="搜索账单名称..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'amount')}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
          >
            <option value="date">按日期排序</option>
            <option value="name">按名称排序</option>
            <option value="amount">按金额排序</option>
          </select>
        </div>

        {/* 账单列表 */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">加载中...</div>
        ) : filteredBills.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            {searchQuery ? '没有找到匹配的账单' : '还没有转换记录'}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBills.map((bill) => (
              <div
                key={bill.id}
                className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-purple-500/50 transition-colors"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {bill.name}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {formatDate(bill.date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400 mb-1">
                      {bill.transactionCount} 笔交易
                    </p>
                    <p className="text-lg font-bold text-white">
                      {formatAmount(Math.abs(bill.totalAmount))}
                    </p>
                  </div>
                </div>

                {/* 分类统计 */}
                <div className="mb-4">
                  <p className="text-sm text-gray-400 mb-2">分类分布：</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(
                      bill.bills.reduce((acc, b) => {
                        acc[b.category] = (acc[b.category] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    )
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 5)
                      .map(([category, count]) => (
                        <span
                          key={category}
                          className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm"
                        >
                          {category}: {count}
                        </span>
                      ))}
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleDownload(bill)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
                  >
                    下载
                  </button>
                  <button
                    onClick={() => handleDelete(bill.id)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

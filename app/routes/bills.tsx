/**
 * 账单列表页面
 * 展示所有已转换的账单历史（从云端加载）
 */

import { useState } from 'react';
import { Link, Form, useLoaderData, useNavigation } from 'react-router';
import { getDB } from '../lib/server';
import { getUploads, type Upload } from '../lib/db/uploads';

export function meta() {
  return [
    { title: '账单列表 - Mana' },
    { name: 'description', content: '查看和管理已转换的账单历史' },
  ];
}

export async function loader(args: any) {
  const db = getDB(args);
  const uploads = await getUploads(db);
  return { uploads };
}

export default function BillsList() {
  const { uploads } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'amount'>('date');

  // 筛选和排序
  let filtered = [...uploads];

  // 搜索筛选
  if (searchQuery) {
    filtered = filtered.filter((upload) =>
      upload.original_filename.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // 排序
  filtered.sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime();
      case 'name':
        return a.original_filename.localeCompare(b.original_filename);
      case 'amount':
        return b.total_amount - a.total_amount;
      default:
        return 0;
    }
  });

  const isDeleting = navigation.state === 'submitting';

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

  // 从 parsed_data 中提取分类统计
  const getCategoryStats = (upload: Upload): Record<string, number> => {
    try {
      const bills = JSON.parse(upload.parsed_data || '[]') as Array<{ category?: string }>;
      return bills.reduce((acc: Record<string, number>, b) => {
        const category = b.category || '未分类';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    } catch {
      return {};
    }
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
          <div className="flex justify-between items-center mb-4">
            <Link to="/" className="text-purple-400 hover:text-purple-300">
              ← 返回首页
            </Link>
            <Link
              to="/settings"
              className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-2"
            >
              ⚙️ 设置
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">账单历史</h1>
          <p className="text-gray-400">
            {uploads.length} 条记录，
            共 {uploads.reduce((sum, u) => sum + u.transaction_count, 0)} 笔交易
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
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            {searchQuery ? '没有找到匹配的账单' : '还没有转换记录'}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((upload) => {
              const categoryStats = getCategoryStats(upload);

              return (
                <div
                  key={upload.id}
                  className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-purple-500/50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {upload.original_filename}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {formatDate(upload.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400 mb-1">
                        {upload.transaction_count} 笔交易
                      </p>
                      <p className="text-lg font-bold text-white">
                        {formatAmount(Math.abs(upload.total_amount))}
                      </p>
                    </div>
                  </div>

                  {/* 分类统计 */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-400 mb-2">分类分布：</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(categoryStats)
                        .sort(([, a]: [string, number], [, b]: [string, number]) => b - a)
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
                  <div className="flex flex-wrap gap-3">
                    <a
                      href={`/api/download-raw?id=${upload.id}`}
                      download={upload.original_filename}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      下载原始文件
                    </a>
                    <a
                      href={`/api/download?id=${upload.id}`}
                      download={`${upload.original_filename.replace(/\.[^/.]+$/, '')}.bean`}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      下载 Beancount
                    </a>
                    <Form method="post" action="/api/delete-upload">
                      <input type="hidden" name="id" value={upload.id} />
                      <button
                        type="submit"
                        disabled={isDeleting}
                        onClick={(e) => {
                          if (!confirm('确定要删除这条账单记录吗？')) {
                            e.preventDefault();
                          }
                        }}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
                      >
                        {isDeleting ? '删除中...' : '删除'}
                      </button>
                    </Form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

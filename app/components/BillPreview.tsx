/**
 * 账单预览组件
 * 展示解析后的账单记录，支持标记和重新分类
 */

import { useState } from "react";

export interface BillRecord {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  originalData?: Record<string, any>;
}

interface BillPreviewProps {
  bills: BillRecord[];
  onRecategorize: (bills: BillRecord[]) => Promise<void>;
  onConfirm: (bills: BillRecord[]) => void;
  onCancel: () => void;
}

/**
 * 安全的日期格式化函数
 * 确保服务器和客户端输出一致，避免 hydration 错误
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';

    // 使用固定格式，避免时区问题
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  } catch {
    return '-';
  }
}

export function BillPreview({ bills, onRecategorize, onConfirm, onCancel }: BillPreviewProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isRecategorizing, setIsRecategorizing] = useState(false);

  // 计算总金额
  const totalAmount = bills.reduce((sum, bill) => sum + bill.amount, 0);

  // 按分类统计
  const categoryStats = bills.reduce((acc, bill) => {
    acc[bill.category] = (acc[bill.category] || 0) + bill.amount;
    return acc;
  }, {} as Record<string, number>);

  // 切换选择状态
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedIds.size === bills.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(bills.map(b => b.id)));
    }
  };

  // 重新分类选中的记录
  const handleRecategorize = async () => {
    if (selectedIds.size === 0) return;

    setIsRecategorizing(true);
    const selectedBills = bills.filter(b => selectedIds.has(b.id));
    await onRecategorize(selectedBills);
    setSelectedIds(new Set());
    setIsRecategorizing(false);
  };

  return (
    <div className="space-y-6">
      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <div className="text-sm text-gray-400 mb-1">总记录数</div>
          <div className="text-3xl font-bold text-white">{bills.length}</div>
          <div className="text-xs text-gray-500 mt-1">条消费记录</div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <div className="text-sm text-gray-400 mb-1">总金额</div>
          <div className="text-3xl font-bold text-green-400">
            ¥{totalAmount.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 mt-1">合计支出</div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <div className="text-sm text-gray-400 mb-1">分类数</div>
          <div className="text-3xl font-bold text-purple-400">
            {Object.keys(categoryStats).length}
          </div>
          <div className="text-xs text-gray-500 mt-1">个消费类别</div>
        </div>
      </div>

      {/* 分类统计 */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">分类统计</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(categoryStats).map(([category, amount]) => (
            <div key={category} className="bg-gray-800/50 rounded-lg p-3">
              <div className="text-sm text-gray-400">{category}</div>
              <div className="text-lg font-semibold text-white">¥{amount.toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 操作栏 */}
      {selectedIds.size > 0 && (
        <div className="bg-purple-500/10 border border-purple-500/50 rounded-xl p-4 flex items-center justify-between backdrop-blur-sm">
          <div className="text-white">
            已选择 <span className="font-bold text-purple-400">{selectedIds.size}</span> 条记录
          </div>
          <button
            onClick={handleRecategorize}
            disabled={isRecategorizing}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isRecategorizing ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                重新识别中...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                重新识别分类
              </>
            )}
          </button>
        </div>
      )}

      {/* 账单列表 */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
        {/* 表头 */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-800/50 border-b border-gray-700">
          <div className="col-span-1">
            <input
              type="checkbox"
              checked={selectedIds.size === bills.length && bills.length > 0}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500 focus:ring-offset-gray-900"
            />
          </div>
          <div className="col-span-3 text-sm font-medium text-gray-300">日期</div>
          <div className="col-span-4 text-sm font-medium text-gray-300">描述</div>
          <div className="col-span-2 text-sm font-medium text-gray-300">分类</div>
          <div className="col-span-2 text-sm font-medium text-gray-300 text-right">金额</div>
        </div>

        {/* 表格内容 */}
        <div className="max-h-[500px] overflow-y-auto">
          {bills.map((bill, index) => (
            <div
              key={bill.id}
              className={`grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-800 hover:bg-gray-800/30 transition-colors ${
                selectedIds.has(bill.id) ? "bg-purple-500/10" : ""
              }`}
            >
              <div className="col-span-1 flex items-center">
                <input
                  type="checkbox"
                  checked={selectedIds.has(bill.id)}
                  onChange={() => toggleSelect(bill.id)}
                  className="w-4 h-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500 focus:ring-offset-gray-900"
                />
              </div>
              <div className="col-span-3 text-sm text-gray-300 flex items-center">
                {formatDate(bill.date)}
              </div>
              <div className="col-span-4 text-sm text-gray-300 flex items-center truncate">
                {bill.description}
              </div>
              <div className="col-span-2 flex items-center">
                <span className="px-2 py-1 rounded-md text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {bill.category}
                </span>
              </div>
              <div className="col-span-2 text-sm font-semibold text-green-400 text-right flex items-center justify-end">
                ¥{bill.amount.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 底部操作按钮 */}
      <div className="flex justify-between items-center">
        <button
          onClick={onCancel}
          className="px-6 py-3 text-gray-400 hover:text-white transition-colors font-medium"
        >
          取消
        </button>
        <button
          onClick={() => onConfirm(bills)}
          className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-purple-500/25 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          确认导入 {bills.length} 条记录
        </button>
      </div>
    </div>
  );
}

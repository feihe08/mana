/**
 * 可编辑账单表格组件
 * 支持删除单行、批量删除、异常检测提示
 */

import { AnomalyBadge } from './AnomalyBadge';
import { type Anomaly } from '../lib/client/anomaly';

export interface BillRecord {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  originalData?: Record<string, any>;
}

interface EditableBillTableProps {
  bills: BillRecord[];
  anomalies: Map<string, Anomaly>;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onDelete: (ids: string[]) => void;
  showStats?: boolean;
}

/**
 * 安全的日期格式化函数
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  } catch {
    return '-';
  }
}

export function EditableBillTable({
  bills,
  anomalies,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onDelete,
  showStats = true,
}: EditableBillTableProps) {
  // 计算总金额
  const totalAmount = bills.reduce((sum, bill) => sum + bill.amount, 0);

  // 按分类统计
  const categoryStats = bills.reduce((acc, bill) => {
    acc[bill.category] = (acc[bill.category] || 0) + bill.amount;
    return acc;
  }, {} as Record<string, number>);

  // 删除单个账单
  const handleDeleteSingle = (id: string) => {
    if (confirm('确定要删除这条记录吗？')) {
      onDelete([id]);
    }
  };

  // 批量删除选中的账单
  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;

    if (confirm(`确定要删除选中的 ${selectedIds.size} 条记录吗？`)) {
      onDelete(Array.from(selectedIds));
    }
  };

  return (
    <div className="space-y-6">
      {/* 统计信息 */}
      {showStats && (
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
      )}

      {/* 分类统计 */}
      {showStats && Object.keys(categoryStats).length > 0 && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">分类统计</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(categoryStats)
              .sort(([, a], [, b]) => b - a)
              .map(([category, amount]) => (
                <div key={category} className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-sm text-gray-400">{category}</div>
                  <div className="text-lg font-semibold text-white">¥{amount.toFixed(2)}</div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 批量操作栏 */}
      {selectedIds.size > 0 && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 flex items-center justify-between backdrop-blur-sm">
          <div className="text-white">
            已选择 <span className="font-bold text-red-400">{selectedIds.size}</span> 条记录
          </div>
          <button
            onClick={handleDeleteSelected}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            删除选中
          </button>
        </div>
      )}

      {/* 账单列表 */}
      {bills.length === 0 ? (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-12 text-center">
          <svg className="w-16 h-16 text-gray-700 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div className="text-gray-400 text-lg">暂无数据</div>
          <div className="text-gray-600 text-sm mt-2">已删除所有账单或上传失败</div>
        </div>
      ) : (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
          {/* 表头 */}
          <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-800/50 border-b border-gray-700">
            <div className="col-span-1">
              <input
                type="checkbox"
                checked={selectedIds.size === bills.length && bills.length > 0}
                onChange={onToggleSelectAll}
                className="w-4 h-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500 focus:ring-offset-gray-900"
              />
            </div>
            <div className="col-span-2 text-sm font-medium text-gray-300">日期</div>
            <div className="col-span-3 text-sm font-medium text-gray-300">描述</div>
            <div className="col-span-2 text-sm font-medium text-gray-300">分类</div>
            <div className="col-span-3 text-sm font-medium text-gray-300 text-right">金额</div>
            <div className="col-span-1 text-sm font-medium text-gray-300 text-center">操作</div>
          </div>

          {/* 表格内容 */}
          <div className="max-h-[500px] overflow-y-auto">
            {bills.map((bill) => (
              <div
                key={bill.id}
                className={`grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-800 hover:bg-gray-800/30 transition-colors ${
                  selectedIds.has(bill.id) ? 'bg-purple-500/10' : ''
                }`}
              >
                {/* 复选框 */}
                <div className="col-span-1 flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(bill.id)}
                    onChange={() => onToggleSelect(bill.id)}
                    className="w-4 h-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500 focus:ring-offset-gray-900"
                  />
                </div>

                {/* 日期 */}
                <div className="col-span-2 text-sm text-gray-300 flex items-center">
                  {formatDate(bill.date)}
                </div>

                {/* 描述 */}
                <div className="col-span-3 text-sm text-gray-300 flex items-center truncate">
                  {bill.description}
                </div>

                {/* 分类 */}
                <div className="col-span-2 flex items-center">
                  <span className="px-2 py-1 rounded-md text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {bill.category}
                  </span>
                </div>

                {/* 金额 + 异常标记 */}
                <div className="col-span-3 text-sm font-semibold text-green-400 text-right flex items-center justify-end gap-2">
                  <span>¥{bill.amount.toFixed(2)}</span>
                  {anomalies.has(bill.id) && (
                    <span className="flex-shrink-0">
                      <AnomalyBadge anomaly={anomalies.get(bill.id)!} showTooltip={false} />
                    </span>
                  )}
                </div>

                {/* 删除按钮 */}
                <div className="col-span-1 flex items-center justify-center">
                  <button
                    onClick={() => handleDeleteSingle(bill.id)}
                    className="text-gray-400 hover:text-red-400 transition-colors p-1"
                    title="删除此记录"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

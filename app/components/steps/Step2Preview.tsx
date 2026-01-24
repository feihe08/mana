/**
 * 步骤 2：预览和调整组件
 */

import { EditableBillTable, type BillRecord } from '../EditableBillTable';
import { AnomalyBadge, AnomalyList } from '../AnomalyBadge';
import { type Anomaly } from '../../lib/client/anomaly';

interface Step2PreviewProps {
  bills: Array<BillRecord & { category: string }>;
  anomalies: Map<string, Anomaly>;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onDelete: (ids: string[]) => void;
  onPrevious: () => void;
  onNext: () => void;
  isConverting?: boolean;
}

export function Step2Preview({
  bills,
  anomalies,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onDelete,
  onPrevious,
  onNext,
  isConverting = false,
}: Step2PreviewProps) {
  const anomalyList = Array.from(anomalies.values());

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-white mb-2">预览和调整</h2>
        <p className="text-gray-400">
          共解析 <span className="text-purple-400 font-semibold">{bills.length}</span> 条记录，
          检测到 <span className="text-red-400 font-semibold">{anomalyList.length}</span> 笔异常交易
        </p>
      </div>

      {/* 异常检测提示 */}
      {anomalyList.length > 0 && <AnomalyList anomalies={anomalyList} />}

      {/* 可编辑表格 */}
      <EditableBillTable
        bills={bills}
        anomalies={anomalies}
        selectedIds={selectedIds}
        onToggleSelect={onToggleSelect}
        onToggleSelectAll={onToggleSelectAll}
        onDelete={onDelete}
        showStats={false}
      />

      {/* 操作按钮 */}
      <div className="flex justify-between items-center">
        <button
          onClick={onPrevious}
          className="px-6 py-3 text-gray-400 hover:text-white transition-colors font-medium flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
          </svg>
          上一步
        </button>
        <button
          onClick={onNext}
          disabled={bills.length === 0 || isConverting}
          className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
        >
          {isConverting ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              转换中...
            </>
          ) : (
            <>
              <span>转换为 Beancount</span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

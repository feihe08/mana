/**
 * 异常警告组件
 * 显示高额支出、预算超支等异常
 */

import type { Anomaly } from '../../lib/analyzers/anomaly';

interface AnomalyAlertProps {
  anomalies: Anomaly[];
}

function getSeverityColor(severity: Anomaly['severity']): string {
  switch (severity) {
    case 'high':
      return 'bg-red-500/10 border-red-500/50';
    case 'medium':
      return 'bg-yellow-500/10 border-yellow-500/50';
    case 'low':
      return 'bg-blue-500/10 border-blue-500/50';
    default:
      return 'bg-gray-500/10 border-gray-500/50';
  }
}

function getSeverityIcon(severity: Anomaly['severity']): string {
  switch (severity) {
    case 'high':
      return '🔴';
    case 'medium':
      return '🟡';
    case 'low':
      return '🟢';
    default:
      return '⚪️';
  }
}

function AnomalyItem({ anomaly }: { anomaly: Anomaly }) {
  return (
    <div className={`p-3 rounded-lg border ${getSeverityColor(anomaly.severity)}`}>
      <div className="flex items-start gap-2">
        <span className="flex-shrink-0 text-lg">{getSeverityIcon(anomaly.severity)}</span>
        <p className="text-sm text-gray-300 flex-1">{anomaly.reason}</p>
      </div>
    </div>
  );
}

export function AnomalyAlert({ anomalies }: AnomalyAlertProps) {
  // 如果没有异常
  if (anomalies.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-4">⚠️ 异常检测</h2>
        <div className="flex items-center gap-2 text-green-400">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm">本月未检测到异常支出，财务状况良好！</p>
        </div>
      </div>
    );
  }

  // 按严重程度分组
  const highAnomalies = anomalies.filter(a => a.severity === 'high');
  const mediumAnomalies = anomalies.filter(a => a.severity === 'medium');
  const lowAnomalies = anomalies.filter(a => a.severity === 'low');

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h2 className="text-xl font-semibold text-white mb-4">
        ⚠️ 异常检测 ({anomalies.length})
      </h2>

      <div className="space-y-3">
        {/* 高风险异常 */}
        {highAnomalies.length > 0 && (
          <div>
            <p className="text-xs text-red-400 mb-2 font-medium">高风险异常</p>
            {highAnomalies.map((anomaly, index) => (
              <AnomalyItem key={index} anomaly={anomaly} />
            ))}
          </div>
        )}

        {/* 中风险异常 */}
        {mediumAnomalies.length > 0 && (
          <div>
            <p className="text-xs text-yellow-400 mb-2 font-medium">中等风险异常</p>
            {mediumAnomalies.map((anomaly, index) => (
              <AnomalyItem key={index} anomaly={anomaly} />
            ))}
          </div>
        )}

        {/* 低风险提示 */}
        {lowAnomalies.length > 0 && (
          <div>
            <p className="text-xs text-blue-400 mb-2 font-medium">提示</p>
            {lowAnomalies.map((anomaly, index) => (
              <AnomalyItem key={index} anomaly={anomaly} />
            ))}
          </div>
        )}
      </div>

      {/* 汇总建议 */}
      {highAnomalies.length > 0 && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">
            💡 建议：检查高风险异常交易，确认是否为正常消费
          </p>
        </div>
      )}
    </div>
  );
}

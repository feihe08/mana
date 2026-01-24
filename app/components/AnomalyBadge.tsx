/**
 * 异常标记组件
 * 展示单笔交易的异常状态
 */

import { type Anomaly } from '../lib/client/anomaly';

interface AnomalyBadgeProps {
  anomaly: Anomaly;
  showTooltip?: boolean;
}

export function AnomalyBadge({ anomaly, showTooltip = true }: AnomalyBadgeProps) {
  const severityConfig = {
    high: {
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/50',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    medium: {
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/50',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    low: {
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/50',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  };

  const config = severityConfig[anomaly.severity];

  if (!showTooltip) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md ${config.bgColor} ${config.borderColor} border ${config.color}`}>
        {config.icon}
      </div>
    );
  }

  return (
    <div className="group relative inline-block">
      {/* 警告图标 */}
      <div
        className={`
          inline-flex items-center gap-1.5 px-2 py-1 rounded-md cursor-help
          ${config.bgColor} ${config.borderColor} border ${config.color}
          transition-all duration-200 hover:scale-105
        `}
      >
        {config.icon}
      </div>

      {/* Tooltip */}
      <div
        className={`
          absolute left-1/2 -translate-x-1/2 bottom-full mb-2
          w-48 px-3 py-2 rounded-lg shadow-lg
          ${config.bgColor} ${config.borderColor} border
          text-xs text-gray-300
          opacity-0 invisible group-hover:opacity-100 group-hover:visible
          transition-all duration-200 z-10
        `}
      >
        <div className="font-semibold text-gray-200 mb-1">
          {anomaly.severity === 'high' ? '⚠️ 异常高额支出' : anomaly.severity === 'medium' ? '💡 较高支出' : 'ℹ️ 注意'}
        </div>
        <div className="text-gray-400">{anomaly.reason}</div>
      </div>
    </div>
  );
}

interface AnomalyListProps {
  anomalies: Anomaly[];
}

export function AnomalyList({ anomalies }: AnomalyListProps) {
  if (anomalies.length === 0) {
    return null;
  }

  const highCount = anomalies.filter(a => a.severity === 'high').length;
  const mediumCount = anomalies.filter(a => a.severity === 'medium').length;
  const lowCount = anomalies.filter(a => a.severity === 'low').length;

  return (
    <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span className="text-white font-semibold">检测到异常交易</span>
      </div>
      <div className="text-sm text-gray-300 space-y-1">
        {highCount > 0 && <div className="text-red-400">• {highCount} 笔高额异常支出</div>}
        {mediumCount > 0 && <div className="text-yellow-400">• {mediumCount} 笔较高支出</div>}
        {lowCount > 0 && <div className="text-blue-400">• {lowCount} 笔需要注意的交易</div>}
      </div>
    </div>
  );
}

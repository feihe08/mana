/**
 * 步骤 3：转换结果组件
 */

import { Link } from 'react-router';
import type { ConversionResult } from '../../lib/pipeline/conversion-pipeline';

interface Step3ResultProps {
  result: ConversionResult | null;
  onDownload: () => void;
  onRestart: () => void;
}

export function Step3Result({ result, onDownload, onRestart }: Step3ResultProps) {
  if (!result) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-12 text-center">
        <svg className="w-16 h-16 text-gray-700 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <div className="text-gray-400 text-lg">暂无转换结果</div>
      </div>
    );
  }

  const previewLines = result.beancountContent.split('\n').slice(0, 50);

  return (
    <div className="space-y-6">
      {/* 转换成功标题 */}
      <div className="bg-green-500/10 border border-green-500/50 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-4">
          <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-bold text-white">转换成功！</h2>
        </div>
        <p className="text-gray-300 mb-3">
          已成功将 {result.billCount} 条账单转换为 Beancount 格式
        </p>
        <div className="flex items-center gap-2 text-sm text-green-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          文件已自动保存到云端
        </div>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <div className="text-sm text-gray-400 mb-1">交易数量</div>
          <div className="text-3xl font-bold text-white">{result.transactionCount}</div>
          <div className="text-xs text-gray-500 mt-1">笔交易</div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <div className="text-sm text-gray-400 mb-1">账单来源</div>
          <div className="text-3xl font-bold text-purple-400">{result.sources.length}</div>
          <div className="text-xs text-gray-500 mt-1">个来源</div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <div className="text-sm text-gray-400 mb-1">账户数量</div>
          <div className="text-3xl font-bold text-blue-400">{result.accountsUsed.length}</div>
          <div className="text-xs text-gray-500 mt-1">个账户</div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <div className="text-sm text-gray-400 mb-1">警告数量</div>
          <div className="text-3xl font-bold text-yellow-400">{result.warnings.length}</div>
          <div className="text-xs text-gray-500 mt-1">个警告</div>
        </div>
      </div>

      {/* 警告信息 */}
      {result.warnings.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-yellow-400 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            警告信息
          </h3>
          <ul className="space-y-2">
            {result.warnings.map((warning, index) => (
              <li key={index} className="text-sm text-gray-300">• {warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Beancount 内容预览 */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 bg-gray-800/50 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Beancount 内容预览（前 50 行）</h3>
        </div>
        <div className="p-6">
          <pre className="bg-gray-950 rounded-lg p-4 text-sm text-gray-300 overflow-x-auto font-mono">
            <code>{previewLines.join('\n')}</code>
            {result.beancountContent.split('\n').length > 50 && (
              <div className="text-gray-500 mt-4">
                ... 还有 {result.beancountContent.split('\n').length - 50} 行
              </div>
            )}
          </pre>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="flex gap-3">
          <button
            onClick={onRestart}
            className="px-6 py-3 text-gray-400 hover:text-white transition-colors font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            重新开始
          </button>
          <Link
            to="/bills"
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            查看账单历史
          </Link>
        </div>
        <button
          onClick={onDownload}
          className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-green-500/25 flex items-center gap-3"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          下载 .bean 文件
        </button>
      </div>
    </div>
  );
}

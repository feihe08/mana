/**
 * 步骤 1：上传文件组件
 */

import React, { useCallback, useState, useEffect, useRef } from 'react';
import { calculateFileHash } from '../../lib/utils/file-hash';

interface Step1UploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  onNext: () => void;
  isParsing?: boolean;
}

interface DuplicateInfo {
  filename: string;
  uploadDate: string;
  transactionCount: number;
  totalAmount: number;
}

interface FileStatus {
  file: File;
  isChecking: boolean;
  isDuplicate: boolean;
  duplicateInfo?: DuplicateInfo;
}

export function Step1Upload({
  files,
  onFilesChange,
  onNext,
  isParsing = false,
}: Step1UploadProps) {
  const [dragActive, setDragActive] = React.useState(false);
  const [fileStatuses, setFileStatuses] = useState<Map<string, FileStatus>>(new Map());
  // 用于重置 input 元素的 key
  const [inputKey, setInputKey] = useState(0);

  // 检查文件是否重复 - 使用 ref 避免闭包问题
  const checkFileDuplicateRef = useRef(async (file: File) => {
    const fileKey = `${file.name}-${file.size}`;

    // 设置检查中状态
    setFileStatuses(prev => new Map(prev).set(fileKey, {
      file,
      isChecking: true,
      isDuplicate: false,
    }));

    try {
      // 计算文件哈希
      const fileHash = await calculateFileHash(file);

      // 调用 API 检查是否重复
      const response = await fetch('/api/check-duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileHash }),
      });

      const result = await response.json() as {
        isDuplicate: boolean;
        existingUpload?: DuplicateInfo;
      };

      // 更新状态
      setFileStatuses(prev => new Map(prev).set(fileKey, {
        file,
        isChecking: false,
        isDuplicate: result.isDuplicate,
        duplicateInfo: result.existingUpload,
      }));
    } catch (error) {
      console.error('检查文件重复失败:', error);
      // 检查失败时，标记为非重复（允许继续）
      setFileStatuses(prev => new Map(prev).set(fileKey, {
        file,
        isChecking: false,
        isDuplicate: false,
      }));
    }
  });

  // 当文件列表变化时，检查新文件
  useEffect(() => {
    files.forEach(file => {
      // 每次都重新检测
      checkFileDuplicateRef.current(file);
    });
  }, [files]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    onFilesChange([...files, ...droppedFiles]);
  }, [files, onFilesChange]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    onFilesChange([...files, ...selectedFiles]);
    // 重置 input 元素，以便下次可以选择同一个文件
    setInputKey(prev => prev + 1);
  };

  const removeFile = (index: number) => {
    const removedFile = files[index];
    const fileKey = `${removedFile.name}-${removedFile.size}`;

    // 移除文件和状态
    onFilesChange(files.filter((_, i) => i !== index));
    setFileStatuses(prev => {
      const newMap = new Map(prev);
      newMap.delete(fileKey);
      return newMap;
    });
    // 重置 input 元素，以便下次可以选择同一个文件
    setInputKey(prev => prev + 1);
  };

  // 检查是否有重复文件
  const hasDuplicates = Array.from(fileStatuses.values()).some(status => status.isDuplicate);
  const isCheckingAny = Array.from(fileStatuses.values()).some(status => status.isChecking);

  return (
    <div className="space-y-8">
      {/* 上传区域 */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-white mb-2">上传账单文件</h2>
        <p className="text-gray-400 mb-6">支持支付宝、微信支付账单（CSV/Excel格式），自动识别类型</p>

        {/* 拖拽上传区域 */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200
            ${dragActive
              ? 'border-purple-500 bg-purple-500/10'
              : 'border-gray-700 hover:border-gray-600'
            }
          `}
        >
          <input
            key={inputKey}
            type="file"
            multiple
            accept=".csv,.xlsx,.xls"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-lg text-gray-300 mb-2">拖拽文件到这里，或点击选择文件</p>
          <p className="text-sm text-gray-500">支持 CSV、Excel 格式，可同时上传多个文件</p>
        </div>

        {/* 文件列表 */}
        {files.length > 0 && (
          <div className="mt-6 space-y-3">
            <h3 className="text-sm font-medium text-gray-300">已选择的文件</h3>
            {files.map((file, index) => {
              const fileKey = `${file.name}-${file.size}`;
              const status = fileStatuses.get(fileKey);

              return (
                <div key={index} className={`flex items-center justify-between rounded-lg p-4 border ${
                  status?.isDuplicate
                    ? 'bg-yellow-500/10 border-yellow-500/50'
                    : 'bg-gray-800/50 border-gray-700'
                }`}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {status?.isChecking ? (
                      <svg className="animate-spin h-8 w-8 text-purple-400 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : status?.isDuplicate ? (
                      <svg className="w-8 h-8 text-yellow-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    ) : (
                      <svg className="w-8 h-8 text-purple-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{file.name}</div>
                      <div className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</div>
                      {status?.isChecking && (
                        <div className="text-xs text-purple-400 mt-1">正在检查是否重复...</div>
                      )}
                      {status?.isDuplicate && status.duplicateInfo && (
                        <div className="text-xs text-yellow-400 mt-1">
                          ⚠️ 该文件已于 {status.duplicateInfo.uploadDate} 上传
                          （{status.duplicateInfo.transactionCount} 条记录）
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-gray-400 hover:text-red-400 transition-colors p-1"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 下一步按钮 */}
      <div className="flex justify-end">
        {hasDuplicates && (
          <div className="flex-1 bg-yellow-500/10 border border-yellow-500/50 rounded-xl p-4 mr-4">
            <div className="flex items-center gap-2 text-yellow-400">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-sm font-medium">检测到重复文件，建议移除后再继续</span>
            </div>
          </div>
        )}
        <button
          onClick={onNext}
          disabled={files.length === 0 || isParsing || isCheckingAny}
          className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
        >
          {isParsing ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              解析中...
            </>
          ) : isCheckingAny ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              检查中...
            </>
          ) : (
            <>
              <span>解析账单</span>
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

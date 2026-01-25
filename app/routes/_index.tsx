/**
 * Mana 主页 - 账单转 Beancount 工具
 * 三步骤流程：上传 → 预览 → 转换
 */

import { useState } from 'react';
import { Link } from 'react-router';
import { StepIndicator } from '../components/StepIndicator';
import { Step1Upload } from '../components/steps/Step1Upload';
import { Step2Preview } from '../components/steps/Step2Preview';
import { Step3Result } from '../components/steps/Step3Result';
import { parseBillFile } from '../lib/client/parsers';
import { categorizeBills } from '../lib/client/parsers';
import { detectAnomalies } from '../lib/client/anomaly';
import { convertBillsToBeancount } from '../lib/pipeline/conversion-pipeline';
import type { ParsedBill } from '../lib/parsers/csv';
import type { ConversionResult } from '../lib/pipeline/conversion-pipeline';
import type { Anomaly } from '../lib/client/anomaly';

export function meta() {
  return [
    { title: 'Mana - 账单转 Beancount 工具' },
    { name: 'description', content: '三步完成账单格式转换：上传支付宝/微信账单，预览调整，一键转换为 Beancount 格式' },
  ];
}

export default function ConvertTool() {
  // 步骤状态
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // 步骤 1 数据
  const [files, setFiles] = useState<File[]>([]);

  // 步骤 2 数据
  const [parsedBills, setParsedBills] = useState<ParsedBill[]>([]);
  const [categorizedBills, setCategorizedBills] = useState<Array<ParsedBill & { category: string }>>([]);
  const [selectedBillIds, setSelectedBillIds] = useState<Set<string>>(new Set());
  const [deletedBillIds, setDeletedBillIds] = useState<Set<string>>(new Set());
  const [anomalies, setAnomalies] = useState<Map<string, Anomaly>>(new Map());

  // 步骤 3 数据
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);

  // 加载状态
  const [isParsing, setIsParsing] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 步骤定义
  const steps = [
    { id: 1, label: '上传文件' },
    { id: 2, label: '预览调整' },
    { id: 3, label: '转换下载' },
  ];

  // 步骤 1 → 2：解析文件
  const handleParseFiles = async () => {
    if (files.length === 0) {
      setError('请先上传账单文件');
      return;
    }

    setIsParsing(true);
    setError(null);

    try {
      // 解析所有文件（自动识别类型）
      const allBills = await Promise.all(
        files.map((file) => parseBillFile(file, 'auto'))
      ).then((bills) => bills.flat());

      setParsedBills(allBills);

      // 自动分类（现在包含 AI Fallback）
      const categorized = await categorizeBills(allBills);
      setCategorizedBills(categorized);

      // 异常检测
      const detectedAnomalies = detectAnomalies(categorized);
      setAnomalies(detectedAnomalies);

      // 清空已删除的 ID（重新解析）
      setDeletedBillIds(new Set());
      setSelectedBillIds(new Set());

      setCurrentStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : '解析失败');
    } finally {
      setIsParsing(false);
    }
  };

  // 步骤 2 → 3：转换
  const handleConvert = async () => {
    setIsConverting(true);
    setError(null);

    try {
      // 过滤删除的账单
      const filteredBills = categorizedBills.filter((b) => !deletedBillIds.has(b.id));

      if (filteredBills.length === 0) {
        setError('没有有效的账单可以转换');
        return;
      }

      // 转换（自动识别类型）
      const result = await convertBillsToBeancount(filteredBills, { sourceType: 'auto' });

      // 上传到服务器
      if (files.length > 0) {
        const formData = new FormData();
        formData.append('file', files[0]);
        formData.append('bills', JSON.stringify(filteredBills));
        formData.append('fileType', 'auto');

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json() as { error?: string; message?: string };
          throw new Error(errorData.message || errorData.error || '上传失败');
        }

        // API 返回的 beancountContent 与本地的相同
        setConversionResult(result);
      } else {
        setConversionResult(result);
      }

      setCurrentStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : '转换失败');
    } finally {
      setIsConverting(false);
    }
  };

  // 删除账单
  const handleDeleteBills = (ids: string[]) => {
    setDeletedBillIds((prev) => new Set([...prev, ...ids]));
    setSelectedBillIds(new Set()); // 清空选择
  };

  // 切换选择状态
  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedBillIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedBillIds(newSelected);
  };

  // 全选/取消全选
  const handleToggleSelectAll = () => {
    const activeBills = categorizedBills.filter((b) => !deletedBillIds.has(b.id));
    if (selectedBillIds.size === activeBills.length) {
      setSelectedBillIds(new Set());
    } else {
      setSelectedBillIds(new Set(activeBills.map((b) => b.id)));
    }
  };

  // 下载文件
  const handleDownload = () => {
    if (!conversionResult) return;

    const blob = new Blob([conversionResult.beancountContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `beancount-${new Date().toISOString().split('T')[0]}.bean`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 重新开始
  const handleReset = () => {
    setCurrentStep(1);
    setFiles([]);
    setParsedBills([]);
    setCategorizedBills([]);
    setSelectedBillIds(new Set());
    setDeletedBillIds(new Set());
    setAnomalies(new Map());
    setConversionResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-950 relative">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

      <div className="relative container mx-auto px-4 py-8">
        {/* 标题 */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-4 mb-4">
            <Link
              to="/bills"
              className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-2"
            >
              📊 查看账单历史
            </Link>
          </div>
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-gray-800/50 border border-gray-700/50 backdrop-blur-sm mb-4">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 animate-pulse" />
            <span className="text-sm text-gray-300">账单转换工具</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-3 tracking-tight">Mana</h1>
          <p className="text-lg text-gray-400">三步完成账单格式转换</p>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="max-w-6xl mx-auto mb-6">
            <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 text-red-400">
              {error}
            </div>
          </div>
        )}

        {/* 步骤导航 */}
        <div className="max-w-6xl mx-auto mb-8">
          <StepIndicator steps={steps} currentStep={currentStep} />
        </div>

        {/* 步骤内容 */}
        <div className="max-w-6xl mx-auto">
          {currentStep === 1 && (
            <Step1Upload
              files={files}
              onFilesChange={setFiles}
              onNext={handleParseFiles}
              isParsing={isParsing}
            />
          )}

          {currentStep === 2 && (
            <Step2Preview
              bills={categorizedBills.filter((b) => !deletedBillIds.has(b.id))}
              anomalies={anomalies}
              selectedIds={selectedBillIds}
              onToggleSelect={handleToggleSelect}
              onToggleSelectAll={handleToggleSelectAll}
              onDelete={handleDeleteBills}
              onPrevious={() => setCurrentStep(1)}
              onNext={handleConvert}
              isConverting={isConverting}
            />
          )}

          {currentStep === 3 && (
            <Step3Result
              result={conversionResult}
              onDownload={handleDownload}
              onRestart={handleReset}
            />
          )}
        </div>
      </div>
    </div>
  );
}

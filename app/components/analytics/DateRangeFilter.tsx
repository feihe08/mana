/**
 * 时间筛选组件
 * 支持切换不同时间范围
 */

import { useState } from 'react';

export type DateRangeOption = 'current' | 'last' | '3months' | '6months' | 'year';

interface DateRangeFilterProps {
  currentRange: DateRangeOption;
  onRangeChange: (range: DateRangeOption) => void;
}

const RANGE_OPTIONS = [
  { value: 'current' as DateRangeOption, label: '本月' },
  { value: 'last' as DateRangeOption, label: '上月' },
  { value: '3months' as DateRangeOption, label: '近3个月' },
  { value: '6months' as DateRangeOption, label: '近6个月' },
  { value: 'year' as DateRangeOption, label: '本年' },
];

export function DateRangeFilter({ currentRange, onRangeChange }: DateRangeFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-400">时间范围:</span>
      <div className="flex gap-1 bg-gray-800 rounded-lg p-1 border border-gray-700">
        {RANGE_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onRangeChange(option.value)}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              currentRange === option.value
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * 步骤导航组件
 * 展示当前步骤进度
 */

export interface Step {
  id: number;
  label: string;
  icon?: React.ReactNode;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-4 mb-8">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          {/* 步骤圆圈 */}
          <div
            className={`
              w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300
              ${
                currentStep === step.id
                  ? 'bg-purple-600 text-white scale-110 shadow-lg shadow-purple-600/50'
                  : currentStep > step.id
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-800 text-gray-400'
              }
            `}
          >
            {currentStep > step.id ? (
              // 已完成：显示对勾
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              // 未完成或当前步骤：显示步骤号
              <span>{step.id}</span>
            )}
          </div>

          {/* 步骤标签 */}
          <span
            className={`
              ml-2 text-sm font-medium transition-colors duration-300
              ${currentStep === step.id ? 'text-white' : 'text-gray-400'}
            `}
          >
            {step.label}
          </span>

          {/* 连接线（除最后一个步骤外） */}
          {index < steps.length - 1 && (
            <div
              className={`
                w-16 h-0.5 mx-4 transition-colors duration-300
                ${currentStep > step.id ? 'bg-green-600' : 'bg-gray-800'}
              `}
            />
          )}
        </div>
      ))}
    </div>
  );
}

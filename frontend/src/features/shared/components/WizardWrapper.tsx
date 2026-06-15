"use client";

import React from "react";

interface Step {
  id: string;
  title: string;
}

interface WizardWrapperProps {
  steps: Step[];
  currentStepId: string;
  onStepChange: (stepId: string) => void;
  children: React.ReactNode;
}

export const WizardWrapper: React.FC<WizardWrapperProps> = ({
  steps,
  currentStepId,
  onStepChange,
  children,
}) => {
  const currentIndex = steps.findIndex((step) => step.id === currentStepId);

  return (
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-md overflow-hidden p-6 transition-all duration-300">
      {/* Progress timeline bar */}
      <div className="flex items-center justify-between mb-6 relative">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0"></div>
        <div
          className="absolute top-1/2 left-0 h-0.5 bg-blue-600 dark:bg-blue-500 -translate-y-1/2 z-0 transition-all duration-500"
          style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
        ></div>

        {steps.map((step, idx) => {
          const isActive = idx === currentIndex;
          const isCompleted = idx < currentIndex;

          return (
            <button
              key={step.id}
              onClick={() => idx <= currentIndex && onStepChange(step.id)}
              disabled={idx > currentIndex}
              className="relative z-10 flex flex-col items-center group focus:outline-none"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border-2 ${
                  isActive
                    ? "bg-blue-600 border-blue-600 text-white shadow-lg ring-4 ring-blue-100 dark:ring-blue-900/40"
                    : isCompleted
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400"
                }`}
              >
                {isCompleted ? "✓" : idx + 1}
              </div>
              <span
                className={`text-[10px] font-semibold mt-2 hidden sm:block transition-all duration-300 ${
                  isActive
                    ? "text-blue-600 dark:text-blue-400 font-bold"
                    : "text-slate-400"
                }`}
              >
                {step.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* Slide transitions content wrapper */}
      <div className="min-h-[200px] py-4">{children}</div>
    </div>
  );
};
export default WizardWrapper;

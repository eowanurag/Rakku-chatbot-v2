"use client";

import React from "react";
import { useTranslation } from "../../hooks/useTranslation";

interface ErrorCardProps {
  message?: string;
  details?: string;
  onReset?: () => void;
}

export const ErrorCard: React.FC<ErrorCardProps> = ({ message, details, onReset }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-xl p-5 shadow-lg max-w-md mx-auto my-6">
      <div className="flex items-start gap-4">
        <span className="text-2xl text-rose-500">❌</span>
        <div className="flex-1">
          <h4 className="font-bold text-rose-900 dark:text-rose-400 text-sm mb-1">
            {message || t("error_occurred")}
          </h4>
          {details && (
            <pre className="text-xs text-rose-700 dark:text-rose-500 bg-rose-100/50 dark:bg-rose-950/40 p-3 rounded-lg overflow-x-auto max-h-40 my-3 font-mono">
              {details}
            </pre>
          )}
          {onReset && (
            <button
              onClick={onReset}
              className="mt-2 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
            >
              {t("retry")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
export default ErrorCard;

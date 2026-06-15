"use client";

import React from "react";
import { useTranslation } from "../../hooks/useTranslation";

interface RetryCardProps {
  title?: string;
  description?: string;
  onRetry: () => void;
  isLoading?: boolean;
}

export const RetryCard: React.FC<RetryCardProps> = ({ title, description, onRetry, isLoading }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 text-center shadow-sm max-w-sm mx-auto my-4">
      <div className="text-xl mb-2">🔄</div>
      <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-1">
        {title || "Connection Interrupted"}
      </h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
        {description || "Unable to establish communication with the server. Please click below to try again."}
      </p>
      <button
        onClick={onRetry}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
      >
        {isLoading ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            <span>Retrying...</span>
          </>
        ) : (
          <span>{t("retry")}</span>
        )}
      </button>
    </div>
  );
};
export default RetryCard;

// src/components/ui/EmptyState.tsx
import React from 'react';

interface EmptyStateProps {
  title?: string;
  description?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ title = 'No data found', description }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-3-3v6" />
    </svg>
    <h2 className="text-lg font-medium text-gray-800 mb-2">{title}</h2>
    {description && <p className="text-sm text-gray-600">{description}</p>}
  </div>
);

export default EmptyState;

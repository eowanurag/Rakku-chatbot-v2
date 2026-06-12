// src/components/ui/PageContainer.tsx
import React from 'react';

interface Props {
  children: React.ReactNode;
  className?: string;
}

const PageContainer: React.FC<Props> = ({ children, className = '' }) => (
  <div className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 ${className}`}>
    {children}
  </div>
);

export default PageContainer;

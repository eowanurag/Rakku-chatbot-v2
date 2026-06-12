// src/components/ui/LoadingCard.tsx
import React from 'react';

interface LoadingCardProps {
  message?: string;
}

const LoadingCard: React.FC<LoadingCardProps> = ({ message }) => (
  <div className="animate-pulse rounded-xl bg-gray-200 h-24 w-full flex items-center justify-center text-gray-500">
    {message && <span>{message}</span>}
  </div>
);

export default LoadingCard;

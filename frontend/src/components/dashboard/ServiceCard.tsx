import React from 'react';
import { serviceIcons } from '@/utils/iconMap';

interface Props {
  title: string;
  type: string;
  onClick: () => void;
}

const ServiceCard: React.FC<Props> = ({ title, type, onClick }) => {
  const Icon = serviceIcons[type] || serviceIcons['Success'];

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center p-4 border rounded-xl shadow-sm hover:shadow-md transition-shadow bg-white gap-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
    >
      <div className="p-3 rounded-full bg-primary/10 text-primary">
        <Icon size={24} />
      </div>
      <span className="font-medium text-sm text-center">{title}</span>
    </button>
  );
};

export default ServiceCard;

import React from 'react';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

export type Status =
  | 'Submitted'
  | 'Under Review'
  | 'Assigned Officer'
  | 'Verification In Progress'
  | 'Approved'
  | 'Rejected'
  | 'Completed';

const statusColors: Record<Status, string> = {
  'Submitted': 'bg-primary text-white',
  'Under Review': 'bg-secondary text-white',
  'Assigned Officer': 'bg-accent text-white',
  'Verification In Progress': 'bg-yellow-500 text-white',
  'Approved': 'bg-green-600 text-white',
  'Rejected': 'bg-red-600 text-white',
  'Completed': 'bg-gray-600 text-white',
};

const statusIcons: Record<Status, React.ElementType> = {
  'Submitted': CheckCircle,
  'Under Review': CheckCircle,
  'Assigned Officer': CheckCircle,
  'Verification In Progress': AlertTriangle,
  'Approved': CheckCircle,
  'Rejected': XCircle,
  'Completed': CheckCircle,
};

interface StatusBadgeProps {
  status: Status;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const Icon = statusIcons[status];
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
      <Icon className="w-3 h-3 mr-1" />
      {status}
    </span>
  );
};

export default StatusBadge;

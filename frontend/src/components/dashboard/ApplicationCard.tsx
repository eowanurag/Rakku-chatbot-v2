import React from 'react';
import StatusBadge, { Status } from '@/components/ui/StatusBadge';

interface Application {
  id: string;
  type: string;
  status: Status;
  submittedAt: string;
}

interface Props {
  application: Application;
  onClick?: () => void;
}

const ApplicationCard: React.FC<Props> = ({ application, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`p-4 border rounded-xl bg-white shadow-sm transition-shadow ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {application.id}
          </span>
          <h4 className="font-medium text-slate-900 mt-1">{application.type}</h4>
        </div>
        <StatusBadge status={application.status} />
      </div>
      <div className="text-xs text-slate-500 mt-3 flex items-center">
        <span className="mr-1">📅</span> Submitted on {new Date(application.submittedAt).toLocaleDateString()}
      </div>
    </div>
  );
};

export default ApplicationCard;

import React from 'react';

interface Props {
  serviceName: string;
  details: Record<string, string>;
}

const ServiceReviewCard: React.FC<Props> = ({ serviceName, details }) => {
  return (
    <div className="border rounded-xl shadow-sm p-4 bg-white max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-2 flex items-center">
        <span className="mr-2">📝</span> {serviceName} Details
      </h3>
      <div className="grid grid-cols-1 gap-2 text-sm">
        {Object.entries(details).map(([key, value]) => (
          <div key={key} className="flex">
            <span className="font-medium w-1/3 capitalize">{key.replace(/_/g, ' ')}</span>
            <span className="w-2/3">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServiceReviewCard;

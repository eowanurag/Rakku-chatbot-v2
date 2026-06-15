import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';

interface Props {
  serviceName: string;
  details: Record<string, string>;
  profileSource?: 'VERIFIED_PROFILE' | 'MANUAL_ENTRY' | string;
}

const ServiceReviewCard: React.FC<Props> = ({ serviceName, details, profileSource }) => {
  const { t } = useTranslation();

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
        {profileSource && (
          <div className="flex mt-2 pt-2 border-t text-xs text-gray-500 justify-between" id="prp-service-profile-source-container">
            <span className="font-medium">{t('prp.profile_source')}</span>
            <span className="font-semibold text-blue-600" id="prp-service-profile-source-badge">
              {profileSource === 'VERIFIED_PROFILE' ? t('prp.verified_profile') : t('prp.manual_entry')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceReviewCard;

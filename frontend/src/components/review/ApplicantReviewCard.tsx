// src/components/review/ApplicantReviewCard.tsx
import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';

interface Props {
  name: string;
  mobile: string;
  location: string;
  address: string;
  profileSource?: 'VERIFIED_PROFILE' | 'MANUAL_ENTRY' | string;
}

const ApplicantReviewCard: React.FC<Props> = ({ name, mobile, location, address, profileSource }) => {
  const { t } = useTranslation();

  return (
    <div className="border rounded-xl shadow-sm p-4 bg-white max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-2 flex items-center">
        <span className="mr-2">👤</span> {t('prp.applicant')}
      </h3>
      <div className="grid grid-cols-1 gap-2 text-sm">
        <div className="flex">
          <span className="font-medium w-24">Name</span>
          <span>{name}</span>
        </div>
        <div className="flex">
          <span className="font-medium w-24">Mobile</span>
          <span>{mobile}</span>
        </div>
        <div className="flex">
          <span className="font-medium w-24">Location</span>
          <span>{location}</span>
        </div>
        <div className="flex">
          <span className="font-medium w-24">Address</span>
          <span>{address}</span>
        </div>
        {profileSource && (
          <div className="flex mt-2 pt-2 border-t text-xs text-gray-500 justify-between" id="prp-profile-source-container">
            <span className="font-medium">{t('prp.profile_source')}</span>
            <span className="font-semibold text-blue-600" id="prp-profile-source-badge">
              {profileSource === 'VERIFIED_PROFILE' ? t('prp.verified_profile') : t('prp.manual_entry')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicantReviewCard;

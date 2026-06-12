// src/components/review/ApplicantReviewCard.tsx
import React from 'react';

interface Props {
  name: string;
  mobile: string;
  location: string;
  address: string;
}

const ApplicantReviewCard: React.FC<Props> = ({ name, mobile, location, address }) => (
  <div className="border rounded-xl shadow-sm p-4 bg-white max-w-md mx-auto">
    <h3 className="text-lg font-semibold mb-2 flex items-center">
      <span className="mr-2">👤</span> Applicant Information
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
    </div>
  </div>
);

export default ApplicantReviewCard;

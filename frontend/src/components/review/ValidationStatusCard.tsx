// src/components/review/ValidationStatusCard.tsx
import React from 'react';
import { CheckCircle } from 'lucide-react';

const items = [
  'Profile Complete',
  'Contact Verified',
  'Location Confirmed',
  'Required Fields Complete',
  'Ready For Submission',
];

const ValidationStatusCard: React.FC = () => (
  <div className="border rounded-xl shadow-sm p-4 bg-white max-w-md mx-auto">
    <h3 className="text-lg font-semibold mb-3 flex items-center">
      <CheckCircle className="w-5 h-5 mr-2" /> Validation Status
    </h3>
    <ul className="space-y-1 text-sm">
      {items.map((item, i) => (
        <li key={i} className="flex items-center">
          <CheckCircle className="w-3 h-3 mr-2 text-green-600" /> {item}
        </li>
      ))}
    </ul>
  </div>
);

export default ValidationStatusCard;

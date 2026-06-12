// src/components/layout/Footer.tsx
import React from 'react';

const Footer: React.FC = () => (
  <footer className="bg-gray-100 text-center py-4 text-sm text-gray-600">
    © {new Date().getFullYear()} Uttar Pradesh Police. All rights reserved.
  </footer>
);

export default Footer;

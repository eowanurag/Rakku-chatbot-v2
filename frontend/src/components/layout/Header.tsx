// src/components/layout/Header.tsx
import React from 'react';
import Image from 'next/image';

const Header: React.FC = () => (
  <header className="flex items-center justify-between bg-primary text-white py-4 px-6 shadow-md">
    <div className="flex items-center space-x-2">
      {/* Placeholder for UP Police logo */}
      <Image src="/logo.png" alt="UP Police" width={40} height={40} priority />
      <h1 className="text-xl font-semibold">RAKKU</h1>
    </div>
    <span className="text-sm">Digital Citizen Assistant</span>
  </header>
);

export default Header;

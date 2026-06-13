import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Globe } from 'lucide-react';

export default function LanguageBadge() {
  const { selectedLanguage, changeLanguage } = useLanguage();

  if (!selectedLanguage) return null;

  const labels = {
    en: "English",
    hi: "हिंदी"
  };

  return (
    <button
      onClick={() => changeLanguage(null)}
      className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-police-gold rounded-lg text-xs font-medium text-slate-300 transition-colors shadow-sm"
      title="Change Language"
    >
      <Globe className="w-3.5 h-3.5 text-police-gold" />
      <span>{labels[selectedLanguage]}</span>
    </button>
  );
}

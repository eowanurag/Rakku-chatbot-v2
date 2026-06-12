import React from 'react';
import { useLanguage, Language } from '@/context/LanguageContext';

export default function LanguageSelector() {
  const { changeLanguage } = useLanguage();

  const handleSelect = (lang: Language) => {
    changeLanguage(lang);
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-police-navy-dark p-6 animate-fade-in">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden text-center p-8 relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-police-red via-police-gold to-police-red"></div>
        
        <img src="/up_police_logo.png" alt="UP Police Logo" className="w-20 h-20 mx-auto mb-4 object-contain" />
        
        <h2 className="text-xl font-bold text-white mb-1">
          👮 Welcome to Rakku
        </h2>
        <p className="text-sm text-slate-400 mb-6">
          Digital Citizen Assistance Officer<br />
          Uttar Pradesh Police
        </p>

        <p className="text-sm text-slate-300 font-medium mb-4">
          Please choose your preferred language:
        </p>

        <div className="space-y-3">
          <button 
            onClick={() => handleSelect('en')}
            className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-police-gold rounded-xl text-white font-medium transition-all shadow-sm flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span className="text-lg">🇬🇧</span>
            <span>English</span>
          </button>
          
          <button 
            onClick={() => handleSelect('hi')}
            className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-police-gold rounded-xl text-white font-medium transition-all shadow-sm flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span className="text-lg">🇮🇳</span>
            <span>हिंदी</span>
          </button>

          <button 
            onClick={() => handleSelect('hinglish')}
            className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-police-gold rounded-xl text-white font-medium transition-all shadow-sm flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span className="text-lg">🗣️</span>
            <span>Hinglish</span>
          </button>
        </div>
      </div>
    </div>
  );
}

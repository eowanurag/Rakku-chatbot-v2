import React, { useState, useEffect } from "react";
import { avatarImages } from "../../utils/avatarConfig";

interface RakkuWelcomeCardProps {
  onComplete: () => void;
}

export default function RakkuWelcomeCard({ onComplete }: RakkuWelcomeCardProps) {
  const [step, setStep] = useState<"SALUTE" | "WELCOME">("SALUTE");
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // 3 seconds on SALUTE
    const t1 = setTimeout(() => {
      setStep("WELCOME");
      
      // 2 seconds on WELCOME
      const t2 = setTimeout(() => {
        setFading(true);
        // Fade duration is 500ms
        const t3 = setTimeout(() => {
          setVisible(false);
          onComplete();
        }, 500);
        return () => clearTimeout(t3);
      }, 2000);
      
      return () => clearTimeout(t2);
    }, 3000);

    return () => clearTimeout(t1);
  }, [onComplete]);

  if (!visible) return null;

  const avatarSrc = avatarImages[step];

  return (
    <div className={`fixed inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-md z-50 p-4 transition-opacity duration-500 ${fading ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
      <div className="bg-white rounded-[28px] border border-slate-200 shadow-2xl p-6 sm:p-8 max-w-sm w-full flex flex-col items-center animate-rakku-scale-bounce text-slate-800">
        
        {/* Header Branding */}
        <div className="w-full flex items-center justify-center space-x-2 border-b border-slate-100 pb-3 mb-5">
          <span className="text-xl">👮</span>
          <span className="text-xs font-black uppercase tracking-widest text-slate-400">UP Police Digital Portal</span>
        </div>

        {/* Large Sequence Avatar */}
        <div className="w-36 h-36 sm:w-44 sm:h-44 bg-slate-50 border border-slate-100 rounded-2xl p-1 mb-5 flex items-center justify-center overflow-hidden shadow-inner">
          <img
            src={avatarSrc}
            alt={`Inspector Rakku - Welcome Sequence`}
            className={`w-full h-full object-contain object-top transition-transform duration-300 ${
              step === "SALUTE" ? "animate-pulse" : "animate-rakku-float"
            }`}
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/rakku_officer.png";
            }}
          />
        </div>

        {/* Dynamic State Status */}
        <div className="flex items-center space-x-1.5 bg-police-navy-light/5 border border-slate-100 px-3 py-1 rounded-full mb-4">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500">
            {step === "SALUTE" ? "Namaste Greeting" : "Welcome Message"}
          </span>
        </div>

        {/* Main Welcome Content */}
        <div className="text-center space-y-4">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            {step === "SALUTE" ? "🫡 Namaste!" : "👋 Welcome!"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">
            I am <strong className="text-police-gold font-bold">Inspector Rakku</strong>, your UP Police Virtual Assistant.
          </p>
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-left text-xs text-slate-500 space-y-1.5 shadow-inner">
            <span className="font-bold text-slate-700 block mb-1">I can assist with:</span>
            <div className="grid grid-cols-1 gap-1">
              <span>• Complaint Registration</span>
              <span>• Complaint Status Tracking</span>
              <span>• Police Station Information</span>
              <span>• Verification Services</span>
              <span>• Emergency Guidance</span>
            </div>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pt-2">
            Loading Chat Workspace...
          </p>
        </div>

      </div>
    </div>
  );
}

import React from "react";
import { useLanguage } from "@/context/LanguageContext";

interface RakkuStatusBadgeProps {
  state: string;
}

export default function RakkuStatusBadge({ state }: RakkuStatusBadgeProps) {
  const { selectedLanguage } = useLanguage();
  
  const getStatusDetails = () => {
    const isHi = selectedLanguage === "hi";
    
    if (state === "THINKING") {
      return {
        label: isHi ? "जानकारी प्राप्त की जा रही है" : "Processing Request",
        dotColor: "bg-amber-500",
        textColor: "text-amber-700",
      };
    }
    if (state === "POINTING" || state === "TALKING") {
      return {
        label: isHi ? "मार्गदर्शन किया जा रहा है" : "Providing Guidance",
        dotColor: "bg-blue-500",
        textColor: "text-blue-700",
      };
    }
    if (state === "SUCCESS" || state === "COMPLETED") {
      return {
        label: isHi ? "कार्य सफलतापूर्वक पूर्ण हुआ" : "Task Completed",
        dotColor: "bg-emerald-500",
        textColor: "text-emerald-700",
      };
    }
    if (state === "EMERGENCY" || state === "ERROR") {
      return {
        label: isHi ? "आपातकालीन सहायता" : "Emergency Assistance",
        dotColor: "bg-red-500",
        textColor: "text-red-700",
      };
    }
    return {
      label: isHi ? "सहायता हेतु उपलब्ध" : "Ready to Assist",
      dotColor: "bg-emerald-500",
      textColor: "text-slate-600",
    };
  };

  const config = getStatusDetails();

  return (
    <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-100 px-2.5 py-0.5 rounded-full shadow-sm">
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor} ${state === "THINKING" || state === "EMERGENCY" ? "animate-pulse" : ""}`}></span>
      <span className={`text-[10px] font-bold ${config.textColor}`}>
        {config.label}
      </span>
    </div>
  );
}

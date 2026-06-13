export const avatarImages: Record<string, string> = {
  SALUTE: "/avatars/Salute Pose.png",
  WELCOME: "/avatars/welcome pose.png",
  NAMASTE: "/avatars/Namaste.png",
  IDLE: "/avatars/Ideal pose.png",
  THINKING: "/avatars/Thinking pose.png",
  TALKING: "/avatars/Taking pose.png",
  POINTING: "/avatars/pointing pose.png",
  COMPLETED: "/avatars/Completed.png",
  SUCCESS: "/avatars/success pose.png",
  EMERGENCY: "/avatars/Emergency pose.png",
  GOODBYE: "/avatars/Goodbye.png",
  ERROR: "/avatars/Emergency pose.png", // fallback since error.png doesn't exist
};

export interface StatusConfig {
  label: string;
  dotColor: string;
  textColor: string;
}

export const statusConfigs: Record<string, StatusConfig> = {
  SALUTE: { label: "Saluting", dotColor: "bg-emerald-500", textColor: "text-emerald-700" },
  WELCOME: { label: "Welcome", dotColor: "bg-emerald-500", textColor: "text-emerald-700" },
  NAMASTE: { label: "Namaste", dotColor: "bg-emerald-500", textColor: "text-emerald-700" },
  IDLE: { label: "Ready to Assist", dotColor: "bg-emerald-500", textColor: "text-slate-600" },
  THINKING: { label: "Processing Request", dotColor: "bg-amber-500", textColor: "text-amber-700" },
  TALKING: { label: "Providing Information", dotColor: "bg-emerald-500", textColor: "text-emerald-700" },
  POINTING: { label: "Guiding Citizen", dotColor: "bg-blue-500", textColor: "text-blue-700" },
  SUCCESS: { label: "Task Completed", dotColor: "bg-emerald-500", textColor: "text-emerald-700" },
  COMPLETED: { label: "Process Completed", dotColor: "bg-emerald-500", textColor: "text-emerald-700" },
  EMERGENCY: { label: "Emergency Assistance", dotColor: "bg-red-500", textColor: "text-red-700" },
  GOODBYE: { label: "Session Ended", dotColor: "bg-slate-400", textColor: "text-slate-500" },
  ERROR: { label: "Service Unavailable", dotColor: "bg-orange-500", textColor: "text-orange-750" },
};

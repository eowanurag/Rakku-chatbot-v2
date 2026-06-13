import React from "react";
import DOMPurify from "dompurify";
import RakkuFloatingAssistant from "./RakkuFloatingAssistant";

interface Message {
  role: "user" | "assistant";
  text: string;
  isStreaming?: boolean;
  avatarState?: string;
}

interface ChatMessageProps {
  msg: Message;
  idx: number;
  isLatestAssistant: boolean;
  onOptionClick: (value: string) => void;
  translate: (key: string) => string;
}

export default function ChatMessage({
  msg,
  idx,
  isLatestAssistant,
  onOptionClick,
  translate,
}: ChatMessageProps) {
  const isAssistant = msg.role === "assistant";

  // If it's the latest assistant message, render the floating active assistant
  if (isAssistant && isLatestAssistant) {
    return (
      <div className="w-full py-4 px-2 sm:px-4 bg-slate-950/20 border-y border-slate-900/40 rounded-3xl my-2">
        <RakkuFloatingAssistant
          state={msg.avatarState || "IDLE"}
          speechBubbleText={msg.text}
          onOptionClick={onOptionClick}
          showQuickActions={true}
        />
      </div>
    );
  }

  // Otherwise, render the standard conversational message bubble
  return (
    <div className={`flex ${isAssistant ? "justify-start" : "justify-end"} animate-fade-in-up`}>
      <div className={`flex items-start space-x-3 max-w-[85%] ${isAssistant ? "" : "flex-row-reverse space-x-reverse"}`}>
        {/* Avatar Icon */}
        {isAssistant ? (
          <img 
            src={
              msg.avatarState === "SALUTE" ? "/avatars/Salute Pose.png" :
              msg.avatarState === "WELCOME" ? "/avatars/welcome pose.png" :
              msg.avatarState === "NAMASTE" ? "/avatars/Namaste.png" :
              msg.avatarState === "IDLE" ? "/avatars/Ideal pose.png" :
              msg.avatarState === "THINKING" ? "/avatars/Thinking pose.png" :
              msg.avatarState === "TALKING" ? "/avatars/Taking pose.png" :
              msg.avatarState === "POINTING" ? "/avatars/pointing pose.png" :
              msg.avatarState === "COMPLETED" ? "/avatars/Completed.png" :
              msg.avatarState === "SUCCESS" ? "/avatars/success pose.png" :
              msg.avatarState === "EMERGENCY" ? "/avatars/Emergency pose.png" :
              msg.avatarState === "GOODBYE" ? "/avatars/Goodbye.png" :
              "/avatars/Ideal pose.png"
            } 
            alt="Rakku" 
            className="w-8 h-8 rounded-full object-cover object-top border border-police-gold/30 shadow flex-shrink-0 bg-slate-800" 
            onError={(e) => { (e.target as HTMLImageElement).src = '/rakku_officer.png'; }}
          />
        ) : (
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm shadow flex-shrink-0 bg-slate-800 text-slate-300">
            👤
          </div>
        )}

        {/* Text Bubble */}
        <div className={`rounded-2xl p-4 border text-xs sm:text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
          isAssistant 
            ? "bubble-assistant glow-gold/5" 
            : "bubble-user"
        }`}>
          {(typeof window !== "undefined" ? DOMPurify.sanitize(msg.text) : msg.text).split("\n").map((line, lIdx) => {
            const isBullet = line.trim().startsWith("-") || line.trim().startsWith("👉") || line.trim().startsWith("•");

            // Parse markdown elements: **bold** and [label](url-or-option)
            const parseMarkdown = (text: string) => {
              const regex = /(\*\*.*?\*\*|\[.*?\]\(.*?\))/g;
              const elements = text.split(regex);
              
              return elements.map((part, index) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return (
                    <strong key={index} className="text-police-gold font-bold">
                      {part.slice(2, -2)}
                    </strong>
                  );
                } else if (part.startsWith('[') && part.endsWith(')')) {
                  const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
                  if (linkMatch) {
                    const label = linkMatch[1];
                    const url = linkMatch[2];
                    if (url.startsWith('option:')) {
                      const optionVal = url.substring(7);
                      return (
                        <button
                          key={index}
                          onClick={() => onOptionClick(optionVal)}
                          className="text-police-gold hover:text-white underline font-semibold mx-1 cursor-pointer transition-colors text-left bg-transparent border-0 p-0 inline align-baseline"
                        >
                          {label}
                        </button>
                      );
                    } else {
                      return (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-police-gold hover:underline font-semibold mx-1 inline"
                        >
                          {label}
                        </a>
                      );
                    }
                  }
                }
                return part;
              });
            };

            return (
              <p 
                key={lIdx} 
                className={`${isBullet ? "pl-4 py-0.5" : ""} ${line.trim() === "" ? "h-3" : ""}`}
              >
                {parseMarkdown(line)}
              </p>
            );
          })}

          {/* If first message, show action buttons grid */}
          {isAssistant && idx === 0 && (
            <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-slate-800/80">
              <button
                onClick={() => onOptionClick(translate("SERVICE_NEAREST_STATION") === "नजदीकी थाना खोजें" ? "📍 नजदीकी थाना खोजें" : "nearest police station")}
                className="p-3 bg-slate-900/60 hover:bg-slate-850 border border-slate-800 hover:border-police-gold rounded-xl transition-all flex flex-col items-center justify-center text-center space-y-1.5 group cursor-pointer"
              >
                <span className="text-xl">📍</span>
                <span className="text-[11px] font-bold text-slate-300 group-hover:text-police-gold transition-colors">{translate("SERVICE_NEAREST_STATION")}</span>
              </button>
              
              <button
                onClick={() => onOptionClick(translate("SERVICE_EMERGENCY") === "आपातकालीन सहायता" ? "🆘 आपातकालीन सहायता" : "Emergency Contacts")}
                className="p-3 bg-slate-900/60 hover:bg-slate-850 border border-slate-800 hover:border-police-gold rounded-xl transition-all flex flex-col items-center justify-center text-center space-y-1.5 group cursor-pointer"
              >
                <span className="text-xl animate-pulse">🆘</span>
                <span className="text-[11px] font-bold text-slate-300 group-hover:text-police-gold transition-colors">{translate("SERVICE_EMERGENCY")}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React from "react";
import DOMPurify from "dompurify";

interface RakkuSpeechBubbleProps {
  text: string;
  state: string;
  onOptionClick: (value: string) => void;
}

export default function RakkuSpeechBubble({ text, state, onOptionClick }: RakkuSpeechBubbleProps) {
  const isEmergency = state === "EMERGENCY";

  const parseMarkdown = (rawLine: string) => {
    const regex = /(\*\*.*?\*\*|\[.*?\]\(.*?\))/g;
    const elements = rawLine.split(regex);
    
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

  const sanitizedText = typeof window !== "undefined" ? DOMPurify.sanitize(text) : text;
  const lines = sanitizedText.split("\n");

  return (
    <div className={`rounded-2xl p-4 border text-xs sm:text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
      isEmergency 
        ? "bg-red-50 border-red-200 text-red-950 font-medium" 
        : "bubble-assistant glow-gold/5"
    }`}>
      {lines.map((line, idx) => {
        const isBullet = line.trim().startsWith("-") || line.trim().startsWith("👉") || line.trim().startsWith("•");
        return (
          <p 
            key={idx} 
            className={`${isBullet ? "pl-4 py-0.5" : ""} ${line.trim() === "" ? "h-3" : ""}`}
          >
            {parseMarkdown(line)}
          </p>
        );
      })}
    </div>
  );
}

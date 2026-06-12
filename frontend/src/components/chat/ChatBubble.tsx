// src/components/chat/ChatBubble.tsx
import React from 'react';
import { format } from 'date-fns';

interface ChatBubbleProps {
  sender: 'user' | 'bot';
  message: string;
  timestamp?: Date;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ sender, message, timestamp }) => {
  const isUser = sender === 'user';
  const containerClasses = `flex ${isUser ? 'justify-end' : 'justify-start'} mb-2`;
  const bubbleClasses = `max-w-xs px-4 py-2 rounded-xl break-words ${isUser ? 'bg-primary text-white' : 'bg-gray-100 text-gray-900'}`;
  const timeString = timestamp ? format(timestamp, 'p') : '';

  return (
    <div className={containerClasses}>
      <div className={bubbleClasses}>
        <p>{message}</p>
        {timeString && (
          <span className="block text-xs text-gray-500 text-right mt-1">{timeString}</span>
        )}
      </div>
    </div>
  );
};

export default ChatBubble;

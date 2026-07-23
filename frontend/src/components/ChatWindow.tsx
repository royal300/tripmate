import React, { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { PackageCard } from './PackageCard';
import { TypingIndicator } from './TypingIndicator';
import { LeadCaptureForm } from './LeadCaptureForm';
import { Package } from '../data/mockPackages';

export interface ChatMessage {
  id: string;
  isUser: boolean;
  text: string;
  packages?: Package[];
  showLeadForm?: boolean;
}

interface ChatWindowProps {
  messages: ChatMessage[];
  isTyping: boolean;
  onLeadSubmit: (name: string, phone: string) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isTyping, onLeadSubmit }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="flex-1 w-full max-w-3xl mx-auto px-2 pt-20 pb-28 flex flex-col z-10 relative">
      {messages.map((msg, idx) => {
        const isLastAiMessage = !msg.isUser && idx === messages.filter(m => !m.isUser).length - 1;
        
        return (
          <React.Fragment key={msg.id}>
            <MessageBubble 
              isUser={msg.isUser} 
              text={msg.text} 
              isLastAiMessage={isLastAiMessage}
            />
            {msg.packages && <PackageCard packages={msg.packages} />}
            {msg.showLeadForm && <LeadCaptureForm onSubmit={onLeadSubmit} />}
          </React.Fragment>
        );
      })}
      
      {isTyping && <TypingIndicator />}
      <div ref={bottomRef} className="h-4" />
    </div>
  );
};

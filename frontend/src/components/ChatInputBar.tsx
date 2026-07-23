import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, Send, Paperclip } from 'lucide-react';

interface ChatInputBarProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({ onSendMessage, disabled }) => {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-safe bg-gradient-to-t from-[#091a14] via-[#091a14]/90 to-transparent">
      <div className="max-w-3xl mx-auto">
        <div className="relative flex items-center bg-white/10 backdrop-blur-xl border border-white/20 rounded-full p-1.5 shadow-lg">
          <button className="p-3 text-emerald-300 hover:text-emerald-100 transition-colors rounded-full">
            <Paperclip size={20} />
          </button>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Type your message..."
            className="flex-1 bg-transparent text-white placeholder-white/50 px-3 py-3 outline-none text-base disabled:opacity-50"
          />
          
          {input.trim() ? (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleSend}
              className="p-3 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full text-white shadow-md flex items-center justify-center mr-1"
            >
              <Send size={18} className="ml-0.5" />
            </motion.button>
          ) : (
            <button className="p-3 text-emerald-300 hover:text-emerald-100 transition-colors rounded-full mr-1">
              <Mic size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

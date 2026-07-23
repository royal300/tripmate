import React, { useState } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { Compass, Smile } from 'lucide-react';

interface MessageBubbleProps {
  isUser: boolean;
  text: string;
  isLastAiMessage?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ isUser, text, isLastAiMessage }) => {
  const [rated, setRated] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={clsx("flex w-full mb-4 px-2", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && (
        <div className="flex-shrink-0 mr-2 self-end mb-1">
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-md">
            <Compass size={18} />
          </div>
        </div>
      )}
      
      <div className="relative group max-w-[85%]">
        <div
          className={clsx(
            "px-4 py-3 shadow-md text-[15px] leading-relaxed",
            isUser
              ? "bg-gradient-to-br from-[#6EE7B7] to-[#10B981] text-[#064E3B] rounded-2xl rounded-tr-sm font-medium"
              : "bg-white/90 backdrop-blur-md text-slate-800 rounded-2xl rounded-tl-sm border border-white/20"
          )}
        >
          {text}
        </div>
        
        {/* Contextual satisfaction indicator (tap-to-rate) */}
        {!isUser && isLastAiMessage && !rated && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setRated(true)}
            className="absolute -top-3 -right-3 bg-white shadow-sm border border-emerald-100 rounded-full p-1 text-emerald-500 hover:bg-emerald-50 transition-colors opacity-0 group-hover:opacity-100 sm:opacity-100"
            title="Rate this response"
          >
            <Smile size={16} />
          </motion.button>
        )}
        {!isUser && rated && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute -top-3 -right-3 bg-emerald-100 shadow-sm border border-emerald-200 rounded-full p-1 text-emerald-600"
          >
            <Smile size={16} className="fill-emerald-200" />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

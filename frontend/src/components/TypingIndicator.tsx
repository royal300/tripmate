import React from 'react';
import { motion } from 'framer-motion';
import { Compass } from 'lucide-react';

export const TypingIndicator: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex justify-start mb-4 pl-2"
    >
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center space-x-2">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="text-emerald-600"
        >
          <Compass size={18} />
        </motion.div>
        <span className="text-sm text-slate-500 font-medium tracking-wide">TripMate is typing...</span>
      </div>
    </motion.div>
  );
};

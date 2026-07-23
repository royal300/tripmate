import React from 'react';
import { motion } from 'framer-motion';

interface QuickReplyChipsProps {
  chips: string[];
  onSelect: (chip: string) => void;
  disabled?: boolean;
}

export const QuickReplyChips: React.FC<QuickReplyChipsProps> = ({ chips, onSelect, disabled }) => {
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4 px-2">
      {chips.map((chip, idx) => (
        <motion.button
          key={chip}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => !disabled && onSelect(chip)}
          disabled={disabled}
          className="px-4 py-2 bg-emerald-900/40 backdrop-blur-md border border-emerald-500/50 rounded-full text-emerald-100 text-sm font-medium hover:bg-emerald-800/60 transition-colors shadow-sm disabled:opacity-50"
        >
          {chip}
        </motion.button>
      ))}
    </div>
  );
};

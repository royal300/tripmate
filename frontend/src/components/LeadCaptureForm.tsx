import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, User, Phone, CheckCircle2 } from 'lucide-react';

interface LeadCaptureFormProps {
  onSubmit: (name: string, phone: string) => void;
}

export const LeadCaptureForm: React.FC<LeadCaptureFormProps> = ({ onSubmit }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && phone.trim()) {
      setSubmitted(true);
      setTimeout(() => onSubmit(name, phone), 800); // Simulate network delay
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="ml-12 mr-4 mb-4 bg-emerald-50/90 backdrop-blur-sm border-2 border-emerald-500 rounded-2xl p-4 flex flex-col items-center justify-center space-y-2 shadow-sm"
      >
        <CheckCircle2 size={32} className="text-emerald-500" />
        <p className="text-emerald-800 font-semibold text-center">Thanks! We'll send the itinerary shortly.</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="ml-12 mr-4 mb-4 bg-white/95 backdrop-blur-md border border-dashed border-emerald-400 rounded-2xl overflow-hidden shadow-lg"
    >
      <div className="bg-emerald-50 px-4 py-3 border-b border-dashed border-emerald-200 flex justify-between items-center">
        <span className="text-emerald-800 font-bold uppercase tracking-wider text-xs">TripMate Pass</span>
        <span className="text-emerald-500/50">✈</span>
      </div>
      
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div>
          <div className="relative">
            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Full Name"
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-2.5 pl-10 pr-3 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 text-sm font-medium transition-all"
            />
          </div>
        </div>
        
        <div>
          <div className="relative">
            <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone Number"
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-2.5 pl-10 pr-3 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 text-sm font-medium transition-all"
            />
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.96 }}
          type="submit"
          className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-xl shadow-md flex items-center justify-center space-x-2"
        >
          <span>Send Details</span>
          <Send size={16} />
        </motion.button>
      </form>
    </motion.div>
  );
};

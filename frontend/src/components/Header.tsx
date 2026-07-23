import React from 'react';
import { PlaneTakeoff, MoreVertical, Compass } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-4 py-3 bg-white/10 backdrop-blur-md border-b border-white/10 safe-area-top">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white">
              <Compass size={24} />
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-[#092e22] rounded-full"></div>
          </div>
          <div>
            <h1 className="text-white font-semibold text-lg leading-tight tracking-wide">TripMate AI</h1>
            <p className="text-emerald-300 text-xs font-medium flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
              Online 24/7
            </p>
          </div>
        </div>
        
        <button className="text-white/80 hover:text-white p-2 transition-colors rounded-full hover:bg-white/10">
          <MoreVertical size={20} />
        </button>
      </div>
    </div>
  );
};

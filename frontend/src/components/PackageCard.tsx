import React from 'react';
import { motion } from 'framer-motion';
import type { Package } from '../data/mockPackages';

interface PackageCardProps {
  packages: Package[];
}

export const PackageCard: React.FC<PackageCardProps> = ({ packages }) => {
  if (!packages || packages.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="flex overflow-x-auto no-scrollbar gap-3 pl-12 pr-4 pb-4 snap-x"
    >
      {packages.map((pkg, idx) => (
        <motion.div
          key={pkg.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: idx * 0.1 }}
          className="snap-start flex-shrink-0 w-[260px] bg-white/90 backdrop-blur-md border border-emerald-200/50 rounded-2xl overflow-hidden shadow-lg"
        >
          {/* Image with gradient overlay */}
          <div className="relative h-36 w-full">
            <img src={pkg.imageUrl} alt={pkg.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            <div className="absolute bottom-3 left-3 pr-2">
              <h3 className="text-white font-bold text-lg leading-tight">{pkg.destination}</h3>
              <p className="text-emerald-300 text-sm font-semibold">₹{pkg.price.toLocaleString()} <span className="text-white/70 text-xs font-normal">/ person</span></p>
            </div>
          </div>
          
          <div className="p-4">
            <p className="font-semibold text-slate-800 text-[15px] mb-1 truncate">{pkg.name}</p>
            <p className="text-slate-500 text-xs mb-3 font-medium">{pkg.days} Days &bull; {pkg.days - 1} Nights</p>
            
            <div className="flex flex-wrap gap-1 mb-4">
              {pkg.inclusions.slice(0, 3).map(inc => (
                <span key={inc} className="text-[10px] font-medium px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                  {inc}
                </span>
              ))}
              {pkg.inclusions.length > 3 && (
                <span className="text-[10px] font-medium px-2 py-1 bg-slate-50 text-slate-500 rounded-full border border-slate-100">
                  +{pkg.inclusions.length - 3}
                </span>
              )}
            </div>

            <motion.button
              whileTap={{ scale: 0.96 }}
              className="w-full py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold rounded-xl shadow-md shadow-emerald-500/20"
            >
              View Details
            </motion.button>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

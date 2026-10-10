import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Calendar, Award, Building, Compass, ArrowRight, ShieldCheck } from 'lucide-react';

interface HeritageEra {
  id: string;
  year: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  stats: string;
  highlight: string;
}

const HERITAGE_ERAS: HeritageEra[] = [
  {
    id: 'era-foundation',
    year: '1999',
    title: 'The Foundational Charter',
    subtitle: 'Virtus, Scientia & Charitas',
    description: 'Established in Cebu with a steadfast vision to form academically distinguished, morally grounded leaders in maritime, computing, education, and commerce.',
    image: '/assets/landing-building-2.jpg',
    stats: '150 Charter Graduates',
    highlight: 'Official Institutional Seal Inception'
  },
  {
    id: 'era-expansion',
    year: '2015',
    title: 'Tower of Academic Innovation',
    subtitle: 'Campus Expansion & Modern Facilities',
    description: 'Erection of the state-of-the-art modern academic tower, advanced laboratories, and institutional convocation auditoriums for multi-discipline research.',
    image: '/assets/landing-building-1.jpg',
    stats: '4,500+ Active Alumni Roster',
    highlight: 'Regional Computing & Maritime Centers'
  },
  {
    id: 'era-future',
    year: '2026',
    title: 'The Global Alumni Network',
    subtitle: 'Connecting Generations Worldwide',
    description: 'A cutting-edge unified digital network linking over 12,000 alumni across 28 countries with instant verification, career mentorship, and pass reservations.',
    image: '/assets/landing-building-3.jpg',
    stats: '12,000+ Worldwide Network',
    highlight: 'Digital Pass & Real-Time Directory'
  }
];

export const LandingHeritage3D: React.FC = () => {
  const [selectedEra, setSelectedEra] = useState<HeritageEra>(HERITAGE_ERAS[2]);

  return (
    <div className="w-full bg-stone-900 text-white rounded-3xl p-6 sm:p-10 lg:p-12 relative overflow-hidden border border-amber-500/20 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
      {/* 3D Ambient Backdrop Lights */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#8B181B]/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-8 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-[0.25em] text-amber-400">
            <span className="w-6 h-[1.5px] bg-amber-400" />
            <span>Interactive Campus Heritage</span>
          </div>
          <h3 className="font-display text-3xl sm:text-4xl lg:text-5xl font-normal text-white tracking-tight">
            Our Living Legacy Through Time
          </h3>
        </div>

        {/* Timeline Era Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-black/50 backdrop-blur-md rounded-2xl border border-white/10 shrink-0">
          {HERITAGE_ERAS.map((era) => {
            const isSelected = era.id === selectedEra.id;
            return (
              <button
                key={era.id}
                onClick={() => setSelectedEra(era)}
                className={`relative px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${
                  isSelected ? 'text-white' : 'text-stone-400 hover:text-white'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="activeHeritageEra"
                    className="absolute inset-0 bg-[#8B181B] rounded-xl shadow-md border border-red-500/30"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{era.year}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3D Interactive Stage */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Era Details */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedEra.id}
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-6 space-y-5"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-mono font-semibold">
              <Calendar className="w-3.5 h-3.5" />
              <span>ERA • {selectedEra.year}</span>
            </div>

            <h4 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
              {selectedEra.title}
            </h4>

            <p className="text-amber-200/90 font-serif italic text-sm sm:text-base">
              "{selectedEra.subtitle}"
            </p>

            <p className="text-stone-300 text-sm sm:text-base leading-relaxed font-light">
              {selectedEra.description}
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] text-stone-400 uppercase font-mono block">Impact Scale</span>
                <span className="text-sm sm:text-base font-bold text-white mt-0.5 block">{selectedEra.stats}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] text-stone-400 uppercase font-mono block">Key Milestone</span>
                <span className="text-sm sm:text-base font-bold text-amber-300 mt-0.5 block">{selectedEra.highlight}</span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Right 3D Layered Image Projection */}
        <div className="lg:col-span-6 relative" style={{ perspective: 1000 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedEra.id}
              initial={{ opacity: 0, rotateY: 18, scale: 0.94 }}
              animate={{ opacity: 1, rotateY: -6, scale: 1 }}
              exit={{ opacity: 0, rotateY: -18, scale: 0.94 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ rotateY: 0, scale: 1.03 }}
              className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden shadow-[0_25px_50px_rgba(0,0,0,0.7)] border-2 border-white/20 group cursor-pointer"
            >
              <img
                src={selectedEra.image}
                alt={selectedEra.title}
                className="w-full h-full object-cover filter brightness-95 group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-white">
                <span className="font-mono text-amber-300 font-bold bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/15">
                  ST. CECILIA'S ARCHIVES • {selectedEra.year}
                </span>
                <span className="text-[11px] text-stone-300 hidden sm:inline">
                  Interactive 3D Perspective
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

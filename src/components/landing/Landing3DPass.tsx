import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ShieldCheck, Sparkles, QrCode, RotateCw, ExternalLink, GraduationCap, CheckCircle2 } from 'lucide-react';

interface Landing3DPassProps {
  onRegisterClick?: () => void;
}

export const Landing3DPass: React.FC<Landing3DPassProps> = ({ onRegisterClick }) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);

  // Motion values for smooth 3D tilt
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for high-end organic physics
  const springConfig = { damping: 22, stiffness: 260 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [14, -14]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-16, 16]), springConfig);

  // Dynamic glare coordinates
  const glareX = useTransform(mouseX, [-0.5, 0.5], ['0%', '100%']);
  const glareY = useTransform(mouseY, [-0.5, 0.5], ['0%', '100%']);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    mouseX.set(x);
    mouseY.set(y);
  };

  const handlePointerLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative w-full max-w-sm sm:max-w-md mx-auto select-none"
      style={{ perspective: 1200 }}
    >
      {/* 3D Ambient Glow Drop Shadow */}
      <div className="absolute -inset-2 bg-gradient-to-r from-[#8B181B]/40 via-amber-500/20 to-red-900/30 rounded-3xl blur-2xl opacity-75 pointer-events-none" />

      {/* Main 3D Tilt Container */}
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d'
        }}
        animate={{
          rotateY: isFlipped ? 180 : 0
        }}
        transition={{
          rotateY: { duration: 0.65, ease: [0.22, 1, 0.36, 1] }
        }}
        className="relative w-full aspect-[1.58/1] rounded-2xl cursor-grab active:cursor-grabbing"
      >
        {/* ========================================================
            CARD FRONT
            ======================================================== */}
        <div
          style={{
            backfaceVisibility: 'hidden',
            transformStyle: 'preserve-3d'
          }}
          className="absolute inset-0 w-full h-full rounded-2xl p-5 sm:p-6 bg-gradient-to-br from-stone-900 via-[#181214] to-stone-950 border border-amber-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.6)] text-white overflow-hidden flex flex-col justify-between"
        >
          {/* Holographic Specular Glare Overlay */}
          <motion.div
            style={{
              background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.18) 0%, rgba(217,119,6,0.08) 35%, transparent 70%)`
            }}
            className="absolute inset-0 pointer-events-none rounded-2xl z-20"
          />

          {/* Micro Guilloche / Security Pattern */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(rgba(217, 119, 6, 0.4) 1px, transparent 0)`,
              backgroundSize: '16px 16px'
            }}
          />

          {/* Top Header Row (3D Lift: translateZ 35px) */}
          <div
            style={{ transform: 'translateZ(35px)' }}
            className="flex items-center justify-between gap-3 relative z-10"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full p-0.5 bg-gradient-to-tr from-amber-400 via-[#8B181B] to-amber-200 shadow-md shrink-0">
                <img
                  src="/assets/cecilians-seal.jpg"
                  alt="Seal"
                  className="w-full h-full rounded-full object-cover bg-white"
                />
              </div>
              <div>
                <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] uppercase text-amber-300 block">
                  St. Cecilia's College
                </span>
                <span className="text-xs sm:text-sm font-display tracking-tight text-white font-bold block">
                  Digital Alumni Credential
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-400/40 text-[10px] font-bold text-emerald-300 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>VERIFIED</span>
            </div>
          </div>

          {/* Middle Body Info (3D Lift: translateZ 45px) */}
          <div
            style={{ transform: 'translateZ(45px)' }}
            className="my-auto py-2 relative z-10 flex items-center justify-between gap-4"
          >
            <div>
              <span className="text-[9px] font-mono uppercase tracking-[0.24em] text-stone-400 block mb-0.5">
                CLASS OF 2024 • BSIT
              </span>
              <h4 className="text-lg sm:text-xl font-bold tracking-tight text-white font-serif">
                Alexandria M. Santos
              </h4>
              <p className="text-[11px] text-amber-200/90 font-medium mt-0.5">
                Alumni Council Fellow • Chapter Cebu
              </p>
            </div>

            {/* Micro QR Entrance Pass */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 p-1 rounded-lg bg-white/95 text-stone-950 shadow-md shrink-0 flex items-center justify-center">
              <QrCode className="w-full h-full text-stone-900" />
            </div>
          </div>

          {/* Bottom Card Footer (3D Lift: translateZ 30px) */}
          <div
            style={{ transform: 'translateZ(30px)' }}
            className="flex items-center justify-between text-[9px] sm:text-[10px] text-stone-400 font-mono pt-2 border-t border-white/10 relative z-10"
          >
            <span>ID: SCC-2024-08842</span>
            <span className="text-amber-400/90 font-semibold uppercase">VIRTUS • SCIENTIA • CHARITAS</span>
          </div>
        </div>

        {/* ========================================================
            CARD REVERSE (Rotated 180deg)
            ======================================================== */}
        <div
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            transformStyle: 'preserve-3d'
          }}
          className="absolute inset-0 w-full h-full rounded-2xl p-5 sm:p-6 bg-gradient-to-br from-stone-950 via-[#141215] to-stone-900 border border-amber-500/25 shadow-[0_20px_50px_rgba(0,0,0,0.6)] text-white flex flex-col justify-between overflow-hidden"
        >
          {/* Magnetic Stripe */}
          <div className="w-full h-8 sm:h-9 bg-stone-950/90 border-y border-stone-800 -mx-6 px-6 flex items-center">
            <div className="w-full h-2 bg-gradient-to-r from-amber-500/30 via-red-500/30 to-amber-500/30 rounded" />
          </div>

          {/* Reverse Details */}
          <div className="space-y-2 text-center my-auto px-4" style={{ transform: 'translateZ(30px)' }}>
            <p className="text-[11px] sm:text-xs text-stone-300 font-serif italic leading-relaxed">
              "This official digital credential identifies a proud alumnus of St. Cecilia's College - Cebu, Inc. entitled to all institutional privileges, alumni convocations, and library access."
            </p>
            <span className="text-[9px] font-mono tracking-[0.2em] text-amber-400 uppercase block">
              OFFICE OF ALUMNI RELATIONS & RECORD ARCHIVES
            </span>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-stone-400 pt-2 border-t border-white/10">
            <span>ISSUED: CEBU, PH</span>
            <span className="text-emerald-400">STATUS: ACTIVE</span>
          </div>
        </div>
      </motion.div>

      {/* Floating 3D Interaction Controls Under Card */}
      <div className="mt-4 flex items-center justify-between px-2 text-xs">
        <button
          type="button"
          onClick={() => setIsFlipped(!isFlipped)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-stone-200 hover:text-white border border-white/15 text-[11px] font-semibold backdrop-blur-md transition-all active:scale-95 cursor-pointer"
        >
          <RotateCw className="w-3.5 h-3.5 text-amber-300" />
          <span>{isFlipped ? 'Show Front' : 'Flip 3D Card'}</span>
        </button>

        <span className="text-[11px] text-stone-400 font-medium hidden sm:inline">
          Move cursor to tilt 3D angle
        </span>

        {onRegisterClick && (
          <button
            type="button"
            onClick={onRegisterClick}
            className="text-[11px] font-bold text-amber-300 hover:text-amber-200 transition-colors cursor-pointer"
          >
            Claim Yours →
          </button>
        )}
      </div>
    </div>
  );
};

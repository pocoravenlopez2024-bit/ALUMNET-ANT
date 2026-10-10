import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
import { UserProfile } from '../../types';
import { getUserAvatar, handleUserAvatarError } from '../../lib/defaultImages';

interface HeartParticle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

interface InteractiveHeartReactionProps {
  isHearted: boolean;
  heartsCount: number;
  onToggle: () => void;
  reactorUids?: string[];
  allUsers?: UserProfile[];
  variant?: 'button' | 'inline' | 'icon-only';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  label?: string;
}

export const InteractiveHeartReaction: React.FC<InteractiveHeartReactionProps> = ({
  isHearted,
  heartsCount,
  onToggle,
  reactorUids = [],
  allUsers = [],
  variant = 'button',
  size = 'md',
  disabled = false,
  className = '',
  label = 'Heart'
}) => {
  const [particles, setParticles] = useState<HeartParticle[]>([]);
  const [showReactorsTooltip, setShowReactorsTooltip] = useState(false);

  // Trigger floating hearts burst upon user activation
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;

    if (!isHearted) {
      // Spawn 5 burst particles with varied trajectories
      const newParticles: HeartParticle[] = Array.from({ length: 5 }).map((_, i) => ({
        id: Date.now() + i + Math.random(),
        x: (Math.random() - 0.5) * 48,
        y: -24 - Math.random() * 32,
        rotation: (Math.random() - 0.5) * 45,
        scale: 0.65 + Math.random() * 0.55
      }));
      setParticles(newParticles);
      setTimeout(() => setParticles([]), 850);
    }

    onToggle();
  };

  // Find user profiles for reactors to display avatar stack
  const reactorProfiles = React.useMemo(() => {
    if (!reactorUids || reactorUids.length === 0 || !allUsers || allUsers.length === 0) return [];
    return reactorUids
      .map((uid) => allUsers.find((u) => u.uid === uid))
      .filter((u): u is UserProfile => Boolean(u))
      .slice(0, 4);
  }, [reactorUids, allUsers]);

  const sizeClasses = {
    sm: {
      btn: 'px-2 py-1 text-xs gap-1.5 rounded-lg',
      icon: 'w-3.5 h-3.5'
    },
    md: {
      btn: 'px-3 py-2 text-xs font-semibold gap-2 rounded-xl',
      icon: 'w-4 h-4'
    },
    lg: {
      btn: 'px-4 py-2.5 text-sm font-semibold gap-2.5 rounded-xl',
      icon: 'w-5 h-5'
    }
  }[size];

  return (
    <div className="relative inline-flex items-center">
      {/* Floating Heart Particles Burst */}
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 1, scale: 0.3, x: 0, y: 0, rotate: 0 }}
            animate={{
              opacity: 0,
              scale: p.scale,
              x: p.x,
              y: p.y,
              rotate: p.rotation
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="absolute pointer-events-none z-30 select-none text-rose-500 drop-shadow-sm"
            style={{ left: '50%', top: '20%' }}
          >
            <Heart className="w-3.5 h-3.5 fill-current" />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Main Interactive Button */}
      {variant === 'button' ? (
        <motion.button
          type="button"
          onClick={handleClick}
          whileTap={{ scale: 0.92 }}
          className={`flex items-center justify-center transition-all duration-200 cursor-pointer select-none relative group ${sizeClasses.btn} ${
            isHearted
              ? 'text-rose-600 dark:text-rose-400 bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 font-bold shadow-2xs'
              : 'text-stone-600 dark:text-stone-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 border border-transparent'
          } ${className}`}
          title={isHearted ? 'Remove Heart' : 'Heart this post'}
        >
          <motion.div
            animate={isHearted ? { scale: [1, 1.45, 0.88, 1.15, 1] } : { scale: 1 }}
            transition={{ duration: 0.45 }}
            className="relative"
          >
            <Heart
              className={`${sizeClasses.icon} transition-colors ${
                isHearted
                  ? 'fill-rose-600 dark:fill-rose-500 text-rose-600 dark:text-rose-500 stroke-rose-600 dark:stroke-rose-500'
                  : 'stroke-[1.85] group-hover:text-rose-600 dark:group-hover:text-rose-400'
              }`}
            />
          </motion.div>
          <span>{isHearted ? 'Hearted' : label}</span>
          {heartsCount > 0 && (
            <span
              className={`text-[11px] font-bold px-1.5 py-0.2 rounded-full transition-colors ${
                isHearted
                  ? 'bg-rose-200/70 dark:bg-rose-900/80 text-rose-800 dark:text-rose-200'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 group-hover:bg-rose-100 dark:group-hover:bg-rose-900/40 group-hover:text-rose-700'
              }`}
            >
              {heartsCount}
            </span>
          )}
        </motion.button>
      ) : variant === 'inline' ? (
        <div className="flex items-center gap-2">
          <motion.button
            type="button"
            onClick={handleClick}
            whileTap={{ scale: 0.9 }}
            className={`flex items-center gap-1.5 text-xs font-semibold py-1 px-2.5 rounded-lg transition-colors cursor-pointer ${
              isHearted
                ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/50'
                : 'text-stone-600 dark:text-stone-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-700'
            } ${className}`}
          >
            <motion.div
              animate={isHearted ? { scale: [1, 1.4, 0.9, 1.1, 1] } : { scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <Heart
                className={`w-3.5 h-3.5 ${
                  isHearted
                    ? 'fill-rose-600 dark:fill-rose-500 text-rose-600 dark:text-rose-500'
                    : 'stroke-[1.75]'
                }`}
              />
            </motion.div>
            <span>{heartsCount > 0 ? heartsCount : 'Heart'}</span>
          </motion.button>

          {/* Reactor Avatars Stack */}
          {reactorProfiles.length > 0 && (
            <div
              className="flex items-center -space-x-1.5 cursor-pointer relative"
              onMouseEnter={() => setShowReactorsTooltip(true)}
              onMouseLeave={() => setShowReactorsTooltip(false)}
            >
              {reactorProfiles.map((user) => (
                <img
                  key={user.uid}
                  src={getUserAvatar(user.profilePictureUrl)}
                  alt={user.name}
                  onError={handleUserAvatarError}
                  className="w-5 h-5 rounded-full object-cover border border-white dark:border-stone-850 shadow-2xs"
                />
              ))}
              {reactorUids.length > reactorProfiles.length && (
                <span className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[9px] font-bold border border-white dark:border-stone-850 flex items-center justify-center">
                  +{reactorUids.length - reactorProfiles.length}
                </span>
              )}

              {/* Reactors Tooltip */}
              {showReactorsTooltip && (
                <div className="absolute bottom-full left-0 mb-1.5 px-2.5 py-1.5 bg-stone-900 dark:bg-stone-800 text-white text-[11px] rounded-lg shadow-lg whitespace-nowrap z-40 border border-stone-700 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                  <p className="font-semibold">
                    {reactorProfiles.map((p) => p.name).join(', ')}
                    {reactorUids.length > reactorProfiles.length ? ` and ${reactorUids.length - reactorProfiles.length} more` : ''}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <motion.button
          type="button"
          onClick={handleClick}
          whileTap={{ scale: 0.88 }}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            isHearted
              ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40'
              : 'text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          } ${className}`}
          title={isHearted ? 'Hearted' : 'Give Heart'}
        >
          <motion.div animate={isHearted ? { scale: [1, 1.4, 0.9, 1.1, 1] } : { scale: 1 }}>
            <Heart
              className={`${sizeClasses.icon} ${
                isHearted ? 'fill-rose-600 text-rose-600 dark:fill-rose-500 dark:text-rose-400' : 'stroke-[1.75]'
              }`}
            />
          </motion.div>
        </motion.button>
      )}
    </div>
  );
};

/**
 * Double Tap / Double Click animated heart burst overlay for feed photos
 */
export const DoubleTapHeartOverlay: React.FC<{
  onTrigger: () => void;
  children: React.ReactNode;
  className?: string;
}> = ({ onTrigger, children, className = '' }) => {
  const [showPopHeart, setShowPopHeart] = useState(false);
  const lastTapRef = React.useRef<number>(0);

  const handlePointerDown = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 320;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap recognized!
      onTrigger();
      setShowPopHeart(true);
      setTimeout(() => setShowPopHeart(false), 900);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      className={`relative select-none overflow-hidden ${className}`}
    >
      {children}
      <AnimatePresence>
        {showPopHeart && (
          <motion.div
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [0.3, 1.35, 1.1, 0.85]
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 drop-shadow-[0_4px_16px_rgba(225,29,72,0.6)]"
          >
            <div className="p-4 rounded-full bg-white/20 backdrop-blur-xs ring-4 ring-rose-500/40">
              <Heart className="w-16 h-16 sm:w-20 sm:h-20 text-rose-600 fill-rose-600" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

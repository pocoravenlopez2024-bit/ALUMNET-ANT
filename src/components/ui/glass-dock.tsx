'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import gsap from 'gsap';

type DockIcon = React.ComponentType<{ className?: string }>;

export interface DockItem {
  id?: string;
  title: string;
  icon: DockIcon;
  onClick?: () => void;
  href?: string;
  isActive?: boolean;
  badge?: number | string | null;
  animated?: boolean;
}

export interface GlassDockProps extends React.HTMLAttributes<HTMLDivElement> {
  items: DockItem[];
  dockClassName?: string;
  showLabels?: boolean;
}

// Attempt to register MorphSVGPlugin if available
if (typeof window !== 'undefined') {
  try {
    // @ts-ignore
    import('gsap/MorphSVGPlugin')
      .then((plugin) => {
        gsap.registerPlugin(plugin.MorphSVGPlugin);
      })
      .catch((e) => {
        // Optional morphing plugin
      });
  } catch (e) {
    // Graceful fallback
  }
}

// Helper component for Morphing Icons with fallback
const MorphingIcon = ({
  type,
  isActive,
  onClick,
  onMouseEnter
}: {
  type: string;
  isActive: boolean;
  onClick: () => void;
  onMouseEnter?: () => void;
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  const animateHome = () => {
    if (!buttonRef.current || !pathRef.current) return;
    const button = buttonRef.current;
    const path = pathRef.current;

    gsap.to(button, {
      scale: 0.9,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: 'power2.out'
    });
  };

  const handleMouseEnter = () => {
    onMouseEnter && onMouseEnter();
    if (type === 'home') animateHome();
  };

  if (type === 'home') {
    return (
      <button
        ref={buttonRef}
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        className={cn(
          'w-full h-full flex items-center justify-center p-0.5 transition-colors cursor-pointer',
          isActive ? 'text-[#8B181B] dark:text-red-400' : 'text-stone-600 dark:text-stone-300'
        )}
      >
        <svg
          viewBox="0 0 24 24"
          className="w-5 h-5 fill-none stroke-current stroke-2 stroke-linecap-round stroke-linejoin-round"
        >
          <path
            ref={pathRef}
            d="M3 18V10.5339C3 9.57062 3.46259 8.66591 4.24353 8.1019L10.2435 3.76856C11.2921 3.01128 12.7079 3.01128 13.7565 3.76856L19.7565 8.1019C20.5374 8.66591 21 9.57062 21 10.5339V18C21 19.6569 19.6569 21 18 21H6C4.34315 21 3 19.6569 3 18Z"
          />
        </svg>
      </button>
    );
  }
  return null;
};

export const GlassDock = React.forwardRef<HTMLDivElement, GlassDockProps>(
  ({ items, className, dockClassName, showLabels = true, ...props }, ref) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [direction, setDirection] = useState(0);
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

    const handleMouseEnter = (index: number) => {
      if (hoveredIndex !== null && index !== hoveredIndex) {
        setDirection(index > hoveredIndex ? 1 : -1);
      }
      setHoveredIndex(index);
    };

    const getTooltipPosition = (index: number) => {
      const el = itemRefs.current[index];
      if (el) {
        // Center the 100px width tooltip above the element
        return el.offsetLeft + el.offsetWidth / 2 - 50;
      }
      return index * 60 + 10;
    };

    return (
      <div ref={ref} className={cn('w-max max-w-full relative', className)} {...props}>
        <div
          className={cn(
            'glass-dock relative flex items-center justify-center gap-1 sm:gap-2 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-2xl sm:rounded-3xl',
            'bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl',
            'border border-stone-200/80 dark:border-stone-700/80',
            'shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-black/5 dark:ring-white/10',
            dockClassName
          )}
          onMouseLeave={() => {
            setHoveredIndex(null);
            setDirection(0);
          }}
        >
          {/* Animated Spring Tooltip floating above dock */}
          <AnimatePresence>
            {hoveredIndex !== null && items[hoveredIndex] && (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9, y: 8 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: -54,
                  x: getTooltipPosition(hoveredIndex)
                }}
                exit={{ opacity: 0, scale: 0.9, y: 8 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className="absolute top-0 left-0 pointer-events-none z-50 hidden sm:block"
              >
                <div
                  className={cn(
                    'px-3.5 py-1.5 rounded-lg',
                    'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900',
                    'shadow-[0_4px_16px_rgba(0,0,0,0.2)] flex items-center justify-center',
                    'border border-stone-700/50 dark:border-stone-300/50',
                    'min-w-[90px]'
                  )}
                >
                  <div className="relative h-4 flex items-center justify-center overflow-hidden w-full">
                    <AnimatePresence mode="popLayout" custom={direction}>
                      <motion.span
                        key={items[hoveredIndex].title}
                        custom={direction}
                        initial={{
                          x: direction > 0 ? 25 : -25,
                          opacity: 0,
                          filter: 'blur(4px)'
                        }}
                        animate={{
                          x: 0,
                          opacity: 1,
                          filter: 'blur(0px)'
                        }}
                        exit={{
                          x: direction > 0 ? -25 : 25,
                          opacity: 0,
                          filter: 'blur(4px)'
                        }}
                        transition={{
                          duration: 0.2,
                          ease: 'easeOut'
                        }}
                        className="text-[12px] font-bold tracking-tight whitespace-nowrap"
                      >
                        {items[hoveredIndex].title}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Dock Items */}
          {items.map((el, index) => {
            const Icon = el.icon;
            const isHovered = hoveredIndex === index;
            const isCurrentActive = el.isActive ?? false;

            const handleClick = (e: React.MouseEvent) => {
              e.stopPropagation();
              if (el.onClick) {
                el.onClick();
              } else if (el.href) {
                window.location.href = el.href;
              }
            };

            const type = el.title.toLowerCase();
            const shouldUseMorph = el.animated && type === 'home';

            return (
              <div
                key={el.id || el.title}
                ref={(node) => {
                  itemRefs.current[index] = node;
                }}
                onMouseEnter={() => handleMouseEnter(index)}
                onClick={handleClick}
                className={cn(
                  'relative flex flex-col items-center justify-center min-w-[54px] sm:min-w-[62px] min-h-[46px] sm:min-h-[50px] px-1 py-1 rounded-xl cursor-pointer transition-all duration-200 select-none group',
                  isCurrentActive ? 'text-[#8B181B]' : 'text-stone-500 hover:text-stone-900'
                )}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleClick(e as any);
                  }
                }}
              >
                {/* Active Soft Glow Background */}
                {isCurrentActive && (
                  <motion.div
                    layoutId="activeGlassDockPill"
                    className="absolute inset-0 bg-red-50/90 dark:bg-red-950/40 rounded-xl border border-red-200/60 dark:border-red-900/40 -z-10 shadow-2xs"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  />
                )}

                {/* Icon Wrapper with Tap/Hover Feedback */}
                <motion.div
                  whileTap={{ scale: 0.88 }}
                  animate={{
                    scale: isHovered ? 1.08 : 1,
                    y: isHovered ? -2 : 0
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                  className="relative flex items-center justify-center"
                >
                  {shouldUseMorph ? (
                    <MorphingIcon
                      type={type}
                      isActive={isCurrentActive || isHovered}
                      onClick={() => {}}
                    />
                  ) : (
                    <Icon
                      className={cn(
                        'w-5 h-5 transition-all duration-200',
                        isCurrentActive
                          ? 'text-[#8B181B] dark:text-red-400 stroke-[2.5]'
                          : isHovered
                          ? 'text-stone-900 dark:text-white stroke-[2.2]'
                          : 'text-stone-500 dark:text-stone-400 stroke-[1.8]'
                      )}
                    />
                  )}

                  {/* Badge Notification Indicator */}
                  {el.badge !== undefined && el.badge !== null && (
                    <span className="absolute -top-1 -right-2 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-red-600 text-white shadow-xs leading-tight">
                      {el.badge}
                    </span>
                  )}
                </motion.div>

                {/* Mobile Micro-Label */}
                {showLabels && (
                  <span
                    className={cn(
                      'text-[10px] tracking-tight mt-0.5 text-center leading-none transition-colors duration-150',
                      isCurrentActive
                        ? 'font-bold text-[#8B181B] dark:text-red-400'
                        : 'font-medium text-stone-500 dark:text-stone-400 group-hover:text-stone-800'
                    )}
                  >
                    {el.title}
                  </span>
                )}

                {/* Micro Active Indicator Dot */}
                {isCurrentActive && (
                  <motion.div
                    layoutId="activeDockDot"
                    className="w-1 h-1 rounded-full bg-[#8B181B] dark:bg-red-400 mt-0.5"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

GlassDock.displayName = 'GlassDock';
export default GlassDock;

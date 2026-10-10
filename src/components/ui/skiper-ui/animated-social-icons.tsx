'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, type LucideIcon, ArrowUpRight } from 'lucide-react';
import { cn } from '../../../lib/utils';

export interface SocialWordItem {
  /** The primary word or title to display (User request: instead of logo only, make it with Words) */
  word?: string;
  label?: string;
  title?: string;
  /** Optional icon to accompany the word */
  Icon?: LucideIcon;
  /** Optional web destination link */
  href?: string;
  /** Optional click event handler */
  onClick?: (e: React.MouseEvent) => void;
  /** Optional status or count badge (e.g. "01", "Live", "New") */
  badge?: string;
  /** Optional secondary subtitle */
  description?: string;
  /** Custom extra styling classes */
  className?: string;
  /** Custom accent color for border/hover */
  accentColor?: string;
}

export interface AnimatedSocialIconsProps {
  /** List of words and companion icons */
  items?: SocialWordItem[];
  /** Alias for items to maintain full compatibility with user's snippet */
  icons?: (SocialWordItem & { Icon?: LucideIcon })[];
  /** Custom container wrapper class name */
  className?: string;
  /** Size for companion icons (default: 18) */
  iconSize?: number;
  /** Label shown next to the plus trigger button */
  triggerLabel?: string;
  /** Initial active state (default: true for immediate discoverability) */
  defaultActive?: boolean;
  /** Visual variant: 'pills' (compact capsules) | 'cards' (rich collegiate cards) */
  variant?: 'pills' | 'cards';
  /** Alignment: 'left' | 'center' | 'between' */
  align?: 'left' | 'center' | 'between';
}

/**
 * AnimatedSocialIcons (Redesigned with Words)
 * Features an expandable trigger button with a rotating Plus icon (0 -> 45deg)
 * and animated word capsules that transition with blur-to-crisp, scale, and rotation.
 */
export function AnimatedSocialIcons({
  items,
  icons,
  className,
  iconSize = 18,
  triggerLabel,
  defaultActive = true,
  variant = 'pills',
  align = 'left'
}: AnimatedSocialIconsProps) {
  const [active, setActive] = useState(defaultActive);

  // Combine either items or icons prop
  const activeList: SocialWordItem[] = items || icons || [];

  return (
    <div
      className={cn(
        'w-full relative flex flex-col sm:flex-row items-stretch sm:items-center gap-3',
        align === 'center' && 'sm:justify-center',
        align === 'between' && 'sm:justify-between',
        align === 'left' && 'sm:justify-start',
        className
      )}
    >
      {/* Interactive Trigger Button: Signature Rotating Plus & Optional Directive Word */}
      <div className="flex items-center gap-2.5 shrink-0 select-none">
        <motion.button
          type="button"
          onClick={() => setActive((prev) => !prev)}
          className={cn(
            'group relative h-10 sm:h-11 px-3.5 sm:px-4 rounded-full flex items-center gap-2.5 font-bold text-xs sm:text-sm tracking-tight transition-all duration-200 cursor-pointer shadow-[0_1px_3px_rgba(0,0,0,0.06),0_6px_16px_rgba(139,24,27,0.12)] border',
            active
              ? 'bg-[#8B181B] text-white border-[#721316] hover:bg-[#7a1518]'
              : 'bg-white text-stone-800 border-stone-200 hover:border-stone-300 hover:bg-stone-50'
          )}
          whileTap={{ scale: 0.96 }}
          aria-expanded={active}
          aria-label={triggerLabel || 'Toggle Cecilian directives'}
          title={active ? 'Collapse Directives' : 'Expand Directives'}
        >
          {/* Animated Plus Icon: Rotates 45 degrees into an X when active */}
          <motion.div
            animate={{ rotate: active ? 45 : 0 }}
            transition={{
              type: 'spring',
              stiffness: 260,
              damping: 20,
              duration: 0.4
            }}
            className="flex items-center justify-center"
          >
            <Plus
              size={iconSize}
              strokeWidth={2.5}
              className={cn(
                'transition-colors',
                active ? 'text-white' : 'text-[#8B181B]'
              )}
            />
          </motion.div>

          <span className="font-bold tracking-normal whitespace-nowrap">
            {triggerLabel || (active ? 'Close Words' : 'Explore Words')}
          </span>

          <span
            className={cn(
              'px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold transition-colors',
              active
                ? 'bg-white/20 text-white'
                : 'bg-stone-100 text-stone-600'
            )}
          >
            {activeList.length}
          </span>
        </motion.button>
      </div>

      {/* Animated Words Container */}
      <div
        className={cn(
          'flex-1 flex flex-wrap items-center gap-2 sm:gap-2.5 min-w-0 transition-all duration-300',
          align === 'center' && 'justify-center',
          align === 'between' && 'justify-end'
        )}
      >
        {activeList.map((item, index) => {
          const displayText =
            item.word ||
            item.label ||
            item.title ||
            (item.Icon ? item.Icon.name : `Directive ${index + 1}`);

          const IconComponent = item.Icon;

          const isCardVariant = variant === 'cards';

          return (
            <motion.div
              key={index}
              animate={{
                filter: active ? 'blur(0px)' : 'blur(3px)',
                scale: active ? 1 : 0.92,
                opacity: active ? 1 : 0.4,
                y: active ? 0 : 4,
                rotate: active ? 0 : index % 2 === 0 ? 1.5 : -1.5
              }}
              transition={{
                type: 'spring',
                stiffness: 280,
                damping: 22,
                delay: active ? index * 0.04 : 0
              }}
              className="inline-flex"
            >
              {item.href ? (
                <a
                  href={item.href}
                  target={item.href.startsWith('http') ? '_blank' : undefined}
                  rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  onClick={item.onClick}
                  className={cn(
                    'group relative flex items-center transition-all duration-200 select-none cursor-pointer',
                    isCardVariant
                      ? 'px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-white hover:bg-stone-50/90 border border-stone-200/90 hover:border-red-200 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] hover:shadow-sm'
                      : 'h-9 sm:h-10 px-3.5 sm:px-4 rounded-full bg-white hover:bg-stone-50 border border-stone-200 hover:border-[#8B181B]/40 shadow-2xs hover:shadow-xs',
                    item.className
                  )}
                >
                  <WordContent
                    item={item}
                    displayText={displayText}
                    IconComponent={IconComponent}
                    iconSize={iconSize}
                    isCardVariant={isCardVariant}
                  />
                </a>
              ) : (
                <button
                  type="button"
                  onClick={item.onClick}
                  className={cn(
                    'group relative flex items-center text-left transition-all duration-200 select-none cursor-pointer',
                    isCardVariant
                      ? 'px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-white hover:bg-stone-50/90 border border-stone-200/90 hover:border-red-200 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] hover:shadow-sm'
                      : 'h-9 sm:h-10 px-3.5 sm:px-4 rounded-full bg-white hover:bg-stone-50 border border-stone-200 hover:border-[#8B181B]/40 shadow-2xs hover:shadow-xs',
                    item.className
                  )}
                >
                  <WordContent
                    item={item}
                    displayText={displayText}
                    IconComponent={IconComponent}
                    iconSize={iconSize}
                    isCardVariant={isCardVariant}
                  />
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/** Internal helper component to render the word text, companion icon, and badges */
function WordContent({
  item,
  displayText,
  IconComponent,
  iconSize,
  isCardVariant
}: {
  item: SocialWordItem;
  displayText: string;
  IconComponent?: LucideIcon;
  iconSize: number;
  isCardVariant: boolean;
}) {
  return (
    <div className="flex items-center gap-2 sm:gap-2.5">
      {/* Companion Lucide Icon (Optional with Words) */}
      {IconComponent && (
        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-red-50 group-hover:bg-[#8B181B] text-[#8B181B] group-hover:text-white flex items-center justify-center shrink-0 transition-colors duration-200 border border-red-100/80">
          <IconComponent size={Math.max(iconSize - 4, 13)} strokeWidth={2} />
        </div>
      )}

      {/* Primary Word / Text Label */}
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-xs sm:text-[13px] text-stone-900 group-hover:text-[#8B181B] tracking-tight whitespace-nowrap transition-colors">
            {displayText}
          </span>
          {item.href?.startsWith('http') && (
            <ArrowUpRight className="w-3 h-3 text-stone-400 group-hover:text-[#8B181B] transition-colors shrink-0" />
          )}
        </div>
        {isCardVariant && item.description && (
          <span className="text-[10px] text-stone-500 line-clamp-1">
            {item.description}
          </span>
        )}
      </div>

      {/* Optional Badge (Counter or Code) */}
      {item.badge && (
        <span className="px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold bg-stone-100 group-hover:bg-red-50 text-stone-600 group-hover:text-[#8B181B] border border-stone-200 group-hover:border-red-200 transition-colors shrink-0">
          {item.badge}
        </span>
      )}
    </div>
  );
}

// Named exports to match user's naming convention
export { AnimatedSocialIcons as AnimatedActionWords };
export default AnimatedSocialIcons;

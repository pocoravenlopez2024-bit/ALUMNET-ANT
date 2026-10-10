import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, X, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "../../../lib/utils";

export interface Skiper23CardProps {
  id?: string;
  title: string;
  subtitle?: string;
  category?: string;
  badge?: string;
  badgeColor?: string;
  dateOrMeta?: string;
  icon?: React.ComponentType<{ className?: string }>;
  iconBg?: string;
  summary: React.ReactNode;
  expandedContent: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  defaultExpanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
}

/**
 * Skiper 23 — Minimal Card Expand
 * Clean, modern expandable card with spring physics morphing between compact
 * summary state and rich detailed layout.
 */
export const Skiper23MinimalCardExpand: React.FC<Skiper23CardProps> = ({
  title,
  subtitle,
  category,
  badge,
  badgeColor = "bg-stone-100 text-stone-700 border-stone-200",
  dateOrMeta,
  icon: Icon,
  iconBg = "bg-stone-100 text-stone-700",
  summary,
  expandedContent,
  actions,
  className,
  defaultExpanded = false,
  onExpandChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpand = () => {
    const nextState = !isExpanded;
    setIsExpanded(nextState);
    if (onExpandChange) onExpandChange(nextState);
  };

  return (
    <motion.div
      layout
      transition={{
        type: "spring",
        stiffness: 380,
        damping: 28,
        mass: 0.8,
      }}
      className={cn(
        "rounded-2xl border transition-all duration-200 overflow-hidden",
        isExpanded
          ? "bg-white border-[#8B181B]/40 shadow-[0_8px_30px_rgb(0,0,0,0.08)] ring-1 ring-[#8B181B]/15"
          : "bg-white border-stone-200/80 hover:border-stone-300 hover:shadow-sm",
        className
      )}
    >
      {/* Header Bar */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            {Icon && (
              <div
                className={cn(
                  "p-2.5 rounded-xl shrink-0 transition-transform duration-200",
                  isExpanded ? "bg-[#8B181B] text-white shadow-xs" : iconBg
                )}
              >
                <Icon className="w-4 h-4" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {category && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B181B]">
                    {category}
                  </span>
                )}
                {badge && (
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                      badgeColor
                    )}
                  >
                    {badge}
                  </span>
                )}
              </div>
              <h3 className="text-sm sm:text-base font-bold text-stone-900 tracking-tight mt-0.5">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-stone-500 font-medium mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Expand / Collapse Action Button */}
          <div className="flex items-center gap-1.5 shrink-0">
            {dateOrMeta && (
              <span className="hidden sm:inline-block text-[11px] font-medium text-stone-400 mr-1">
                {dateOrMeta}
              </span>
            )}
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={toggleExpand}
              className={cn(
                "p-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold select-none",
                isExpanded
                  ? "bg-red-50 text-[#8B181B] hover:bg-red-100"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200/80 hover:text-stone-900"
              )}
              aria-label={isExpanded ? "Collapse card" : "Expand card"}
            >
              {isExpanded ? (
                <>
                  <span className="hidden xs:inline text-[11px]">Less</span>
                  <Minimize2 className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span className="hidden xs:inline text-[11px]">Details</span>
                  <Maximize2 className="w-3.5 h-3.5" />
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* Compact Summary View */}
        <div className="mt-3 text-xs sm:text-[13px] text-stone-600 leading-relaxed">
          {summary}
        </div>
      </div>

      {/* Expandable Rich Details Panel */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="expanded-details"
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: "auto",
              opacity: 1,
              transition: {
                height: {
                  type: "spring",
                  stiffness: 380,
                  damping: 26,
                  bounce: 0.2,
                },
                opacity: { duration: 0.25, delay: 0.05 },
              },
            }}
            exit={{
              height: 0,
              opacity: 0,
              transition: {
                height: {
                  type: "spring",
                  stiffness: 420,
                  damping: 32,
                },
                opacity: { duration: 0.15 },
              },
            }}
            className="overflow-hidden border-t border-stone-100 bg-stone-50/50"
          >
            <motion.div
              initial={{ y: -6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -6, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 24 }}
              className="p-4 sm:p-5 space-y-4"
            >
              {expandedContent}

              {actions && (
                <div className="pt-3 border-t border-stone-200/70 flex flex-wrap items-center justify-end gap-2.5">
                  {actions}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Skiper23MinimalCardExpand;

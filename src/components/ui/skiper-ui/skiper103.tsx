import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "../../../lib/utils";

export interface BouncyAccordionItem {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string | number;
  icon?: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  iconBg?: string;
  content?: React.ReactNode;
}

export interface BouncyAccordionProps {
  items: BouncyAccordionItem[];
  defaultOpenId?: string;
  allowMultiple?: boolean;
  className?: string;
  itemClassName?: string;
}

/**
 * Skiper 103 — Bouncy Accordion
 * Features spring-driven physics with glassmorphic styling, bouncy chevrons,
 * and fluid content expansion.
 */
export const BouncyAccordion: React.FC<BouncyAccordionProps> = ({
  items,
  defaultOpenId,
  allowMultiple = false,
  className,
  itemClassName,
}) => {
  const [openIds, setOpenIds] = useState<string[]>(
    defaultOpenId ? [defaultOpenId] : []
  );

  const toggleItem = (id: string) => {
    setOpenIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id);
      }
      return allowMultiple ? [...prev, id] : [id];
    });
  };

  return (
    <div className={cn("space-y-2.5 w-full", className)}>
      {items.map((item) => {
        const isOpen = openIds.includes(item.id);
        const Icon = item.icon;

        return (
          <motion.div
            key={item.id}
            layout
            transition={{
              duration: 0.22,
              ease: [0.22, 1, 0.36, 1],
            }}
            className={cn(
              "rounded-2xl border transition-colors overflow-hidden",
              isOpen
                ? "bg-white/90 border-[#8B181B]/30 shadow-[0_4px_20px_-4px_rgba(139,24,27,0.12)] backdrop-blur-md"
                : "bg-white/60 border-stone-200/80 hover:border-stone-300 hover:bg-white/80 shadow-2xs backdrop-blur-xs",
              itemClassName
            )}
          >
            {/* Header Trigger */}
            <motion.button
              type="button"
              layout="position"
              whileTap={{ scale: 0.985 }}
              onClick={() => toggleItem(item.id)}
              className="w-full flex items-center justify-between p-3.5 sm:p-4 text-left cursor-pointer select-none group"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                {Icon && (
                  <div
                    className={cn(
                      "p-2.5 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105",
                      item.iconBg || (isOpen ? "bg-[#8B181B] text-white" : "bg-stone-100 text-stone-700")
                    )}
                  >
                    <Icon className={cn("w-4 h-4", item.iconColor)} />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-xs sm:text-sm font-bold tracking-tight transition-colors",
                        isOpen ? "text-[#8B181B]" : "text-stone-900 group-hover:text-stone-950"
                      )}
                    >
                      {item.title}
                    </span>
                    {item.badge !== undefined && item.badge !== null && (
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-[#8B181B] text-white shrink-0 shadow-xs">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  {item.subtitle && (
                    <p className="text-[11px] text-stone-500 font-medium truncate mt-0.5">
                      {item.subtitle}
                    </p>
                  )}
                </div>
              </div>

              {/* Rotating Chevron with smooth transition */}
              <motion.div
                animate={{
                  rotate: isOpen ? 180 : 0,
                  scale: 1,
                }}
                transition={{
                  duration: 0.2,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={cn(
                  "p-1.5 rounded-full shrink-0 transition-colors",
                  isOpen
                    ? "bg-red-50 text-[#8B181B]"
                    : "bg-stone-100 text-stone-400 group-hover:text-stone-600"
                )}
              >
                <ChevronDown className="w-4 h-4" />
              </motion.div>
            </motion.button>

            {/* Expandable Content Container */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{
                    height: "auto",
                    opacity: 1,
                    transition: {
                      height: {
                        duration: 0.22,
                        ease: [0.22, 1, 0.36, 1],
                      },
                      opacity: { duration: 0.2, delay: 0.04 },
                    },
                  }}
                  exit={{
                    height: 0,
                    opacity: 0,
                    transition: {
                      height: {
                        duration: 0.18,
                        ease: [0.22, 1, 0.36, 1],
                      },
                      opacity: { duration: 0.12 },
                    },
                  }}
                  className="overflow-hidden"
                >
                  <motion.div
                    initial={{ y: -6, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -4, opacity: 0 }}
                    transition={{
                      duration: 0.18,
                      ease: "easeOut",
                    }}
                    className="px-3.5 pb-3.5 sm:px-4 sm:pb-4 pt-1 border-t border-stone-100/80"
                  >
                    {item.content}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
};

export default BouncyAccordion;

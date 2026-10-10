import React, { useEffect, useState, useRef } from 'react';
import { useInView } from 'framer-motion';

interface AnimatedStatProps {
  value: number;
  suffix?: string;
  label: string;
  sublabel?: string;
}

export const AnimatedStat: React.FC<AnimatedStatProps> = ({
  value,
  suffix = '',
  label,
  sublabel
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number | null = null;
    const duration = 1800; // ms

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(ease * value));

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };

    const anim = requestAnimationFrame(step);
    return () => cancelAnimationFrame(anim);
  }, [isInView, value]);

  return (
    <div ref={ref} className="text-center py-5 md:py-3 px-4 select-none">
      <div className="font-display text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-white mb-1.5 flex items-center justify-center font-serif">
        <span>{displayValue.toLocaleString()}</span>
        <span className="text-amber-300 font-light ml-0.5">{suffix}</span>
      </div>
      <div className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.24em] text-white/90">
        {label}
      </div>
      {sublabel && (
        <div className="text-[10px] text-red-200/80 mt-0.5 tracking-wider font-medium">
          {sublabel}
        </div>
      )}
    </div>
  );
};

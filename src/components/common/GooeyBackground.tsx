/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface GooeyBackgroundProps {
  className?: string;
  intensity?: 'subtle' | 'vibrant';
  variant?: 'crimson' | 'amber' | 'emerald' | 'multi';
}

/**
 * GooeyBackground: Renders smooth, organic, animated liquid gooey blobs
 * adhering to St. Cecilia's deep crimson and warm amber academic aesthetics.
 */
export const GooeyBackground: React.FC<GooeyBackgroundProps> = ({
  className = '',
  intensity = 'subtle',
  variant = 'crimson'
}) => {
  const getBlobColors = () => {
    switch (variant) {
      case 'amber':
        return {
          blob1: 'bg-amber-400/20',
          blob2: 'bg-orange-400/20',
          blob3: 'bg-amber-300/15'
        };
      case 'emerald':
        return {
          blob1: 'bg-emerald-500/15',
          blob2: 'bg-teal-500/15',
          blob3: 'bg-emerald-300/10'
        };
      case 'multi':
        return {
          blob1: 'bg-[#8B181B]/15',
          blob2: 'bg-amber-500/15',
          blob3: 'bg-rose-400/10'
        };
      case 'crimson':
      default:
        return {
          blob1: 'bg-[#8B181B]/15',
          blob2: 'bg-[#991B1B]/12',
          blob3: 'bg-amber-500/10'
        };
    }
  };

  const colors = getBlobColors();
  const blurClass = intensity === 'vibrant' ? 'blur-2xl' : 'blur-3xl';

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden rounded-inherit ${className}`}
    >
      <div className="gooey-subtle relative h-full w-full opacity-70">
        {/* Blob 1 */}
        <div
          className={`animate-gooey-blob-1 absolute -top-10 -left-10 h-36 w-36 sm:h-48 sm:w-48 rounded-full ${colors.blob1} ${blurClass}`}
        />
        {/* Blob 2 */}
        <div
          className={`animate-gooey-blob-2 absolute top-1/4 -right-10 h-40 w-40 sm:h-52 sm:w-52 rounded-full ${colors.blob2} ${blurClass}`}
        />
        {/* Blob 3 */}
        <div
          className={`animate-gooey-blob-3 absolute -bottom-10 left-1/3 h-32 w-32 sm:h-44 sm:w-44 rounded-full ${colors.blob3} ${blurClass}`}
        />
      </div>
    </div>
  );
};

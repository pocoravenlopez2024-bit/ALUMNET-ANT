import React from 'react';

interface CecilianLoaderProps {
  size?: number;
  colorVariant?: 'institutional' | 'vibrant';
  text?: string;
  className?: string;
}

export const CecilianLoader: React.FC<CecilianLoaderProps> = ({
  size = 50,
  colorVariant = 'institutional',
  text,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div
        className={`cecilian-loader ${colorVariant === 'vibrant' ? 'cecilian-loader-red' : ''}`}
        style={{
          width: `${size}px`,
          ...(size !== 50 ? { transform: `scale(${size / 50})` } : {})
        }}
        aria-label="Loading animation"
        role="status"
      />
      {text && (
        <span className="text-xs font-medium text-stone-600 animate-pulse tracking-wide">
          {text}
        </span>
      )}
    </div>
  );
};

export default CecilianLoader;

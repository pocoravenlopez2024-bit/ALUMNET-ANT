import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ExternalLink } from 'lucide-react';

interface ImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  altText?: string;
  title?: string;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  altText = 'Enlarged view',
  title = 'Image Viewer'
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Lock body scroll while modal is active
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('applet:close-image-viewer', onClose);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('applet:close-image-viewer', onClose);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl || typeof document === 'undefined') return null;

  const modalContent = (
    <div
      data-image-viewer-modal="true"
      className="fixed inset-0 z-[9999999] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md overflow-y-auto pt-safe pb-safe"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100dvh',
        margin: 0,
        padding: '1rem',
        boxSizing: 'border-box',
        zIndex: 9999999
      }}
    >
      <div className="relative max-w-4xl w-full max-h-[92vh] flex flex-col items-center justify-center my-auto pointer-events-auto">
        {/* Header Bar */}
        <div className="w-full flex items-center justify-between gap-3 text-white pb-3 px-1 select-none">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8B181B] ring-2 ring-white/20" />
            <h3 className="text-xs sm:text-sm font-semibold tracking-tight truncate text-stone-200">
              {title}
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 text-stone-200 hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1.5"
              title="Open full image in new tab"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Open Original</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/25 text-stone-200 hover:text-white transition-all cursor-pointer"
              aria-label="Close image viewer"
            >
              <X className="w-5 h-5 stroke-[2]" />
            </button>
          </div>
        </div>

        {/* Image Frame - Centered regardless of screen size or scroll position */}
        <div className="relative w-full max-h-[82vh] flex items-center justify-center overflow-hidden rounded-2xl bg-stone-950/80 border border-white/15 shadow-2xl p-1 sm:p-2">
          <img
            src={imageUrl}
            alt={altText}
            className="max-w-full max-h-[76vh] w-auto h-auto object-contain select-none transition-transform duration-200 rounded-lg mx-auto my-auto block"
          />
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Share, PlusSquare, X, Smartphone } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'full' | 'header';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'compact',
  className = ''
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Suppress if already running in standalone PWA mode
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    if (variant === 'header') {
      return (
        <button
          onClick={install}
          title="Install Alumni App to Home Screen"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 transition-colors cursor-pointer border border-stone-200/80 shadow-2xs ${className}`}
        >
          <Download className="w-3.5 h-3.5 text-[#8B181B] stroke-[2]" />
          <span className="hidden sm:inline">Install App</span>
        </button>
      );
    }

    return (
      <button
        onClick={install}
        className={`flex items-center justify-center gap-2 rounded-xl bg-[#8B181B] hover:bg-[#721316] text-white px-3.5 py-2 text-xs font-semibold shadow-sm transition-all duration-200 active:scale-95 cursor-pointer ${className}`}
      >
        <Download className="w-4 h-4 stroke-[2]" />
        <span>Install Cecilian App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 transition-colors cursor-pointer border border-stone-200/80 ${className}`}
        >
          <Smartphone className="w-3.5 h-3.5 text-[#8B181B]" />
          <span>Add to iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-stone-200 relative">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-3.5 right-3.5 p-1 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-10 h-10 rounded-xl bg-red-50 text-[#8B181B] border border-red-100 flex items-center justify-center mb-3">
                <Smartphone className="w-5 h-5 stroke-[1.75]" />
              </div>

              <h3 className="text-base font-bold text-stone-900 tracking-tight">
                Install on iPhone or iPad
              </h3>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                Add St. Cecilia's College Alumni Network to your home screen for quick offline access and full mobile immersion.
              </p>

              <div className="mt-4 space-y-2.5 bg-stone-50 p-3 rounded-xl border border-stone-100 text-xs text-stone-700">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#8B181B] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    1
                  </span>
                  <p>
                    Tap the <strong>Share</strong> button <Share className="w-3 h-3 inline mx-0.5 text-stone-600" /> at the bottom of Safari.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#8B181B] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    2
                  </span>
                  <p>
                    Scroll down and tap <strong>Add to Home Screen</strong> <PlusSquare className="w-3 h-3 inline mx-0.5 text-stone-600" />.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-xl bg-stone-900 py-2.5 text-xs font-semibold text-white hover:bg-stone-800 transition cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

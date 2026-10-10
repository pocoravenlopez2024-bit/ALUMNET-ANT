import React, { useState } from 'react';
import { Share2, Check, Copy } from 'lucide-react';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { useAlumni } from '../../context/AlumniContext';

export interface ShareButtonProps {
  title: string;
  text?: string;
  url?: string;
  className?: string;
  variant?: 'icon' | 'button' | 'pill';
  label?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  title,
  text,
  url,
  className = '',
  variant = 'button',
  label = 'Share'
}) => {
  const { showToast } = useAlumni();
  const [copied, setCopied] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://alumni.stcecilia.edu';
    const currentHref = typeof window !== 'undefined' ? window.location.href : origin;
    const shareUrl = url || currentHref;
    const shareTitle = title || "St. Cecilia's College Alumni Network";
    const shareText = text || `Check out "${shareTitle}" on the St. Cecilia's Alumni Network!`;

    // 1. Try Capacitor Share plugin directly (native and web)
    try {
      const canShareResult = await Share.canShare().catch(() => ({ value: false }));
      if (canShareResult.value || Capacitor.isNativePlatform()) {
        await Share.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
          dialogTitle: `Share ${shareTitle}`
        });
        showToast('Shared successfully to external app!', 'success');
        return;
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      console.warn('Capacitor Share failed, trying Web Share fallback:', err);
    }

    // 2. Try Web Share API (navigator.share)
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl
        });
        showToast('Shared successfully!', 'success');
        return;
      } catch (err: any) {
        // If user cancelled (AbortError), do nothing
        if (err?.name === 'AbortError') {
          return;
        }
        console.warn('Web Share API call failed, falling back to clipboard copy:', err);
      }
    }

    // Fallback: Copy link to clipboard
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      setCopied(true);
      showToast('Link copied to clipboard! Ready to share.', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast('Could not copy link to clipboard.', 'error');
    }
  };

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleShare}
        title={`Share ${title}`}
        className={`p-2 rounded-lg text-stone-500 hover:text-[#991B1B] hover:bg-stone-100 transition-colors flex items-center justify-center ${className}`}
        aria-label={`Share ${title}`}
      >
        {copied ? (
          <Check className="w-4 h-4 text-emerald-600 animate-in zoom-in" />
        ) : (
          <Share2 className="w-4 h-4" />
        )}
      </button>
    );
  }

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={handleShare}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors ${className}`}
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-emerald-700">Copied!</span>
          </>
        ) : (
          <>
            <Share2 className="w-3.5 h-3.5 text-stone-500" />
            <span>{label}</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 transition-all active:scale-95 ${className}`}
      title={`Share ${title}`}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-600 animate-in zoom-in" />
          <span className="text-emerald-700 font-bold">Copied Link!</span>
        </>
      ) : (
        <>
          <Share2 className="w-3.5 h-3.5 text-[#991B1B]" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
};

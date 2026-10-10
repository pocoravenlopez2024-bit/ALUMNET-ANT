import React, { useState } from 'react';
import {
  Share2,
  Copy,
  Check,
  X,
  Mail,
  Smartphone,
  ExternalLink,
  MessageCircle,
  Globe
} from 'lucide-react';
import { shareAlumniPortal } from '../../services/nativeShareService';
import { openExternalUrl } from '../../services/externalLinkService';

export interface ShareItem {
  title: string;
  text?: string;
  url?: string;
  type?: 'event' | 'reunion' | 'announcement' | 'job' | 'general';
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ShareItem;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  item
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://alumni.stcecilia.edu';
  const shareUrl = item.url || (typeof window !== 'undefined' ? window.location.href : currentOrigin);
  const shareTitle = item.title || "St. Cecilia's College Alumni Network";
  const shareText = item.text || `Check this out on the St. Cecilia's Alumni Network: ${shareTitle}`;

  // Encoded components for social links
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(shareTitle);
  const encodedText = encodeURIComponent(`${shareText}\n${shareUrl}`);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    const res = await shareAlumniPortal({
      title: shareTitle,
      text: shareText,
      url: shareUrl
    });
    if (res.shared || res.copiedToClipboard) {
      onClose();
    }
  };

  const socialChannels = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-emerald-500 hover:bg-emerald-600 text-white',
      badge: 'Chat',
      url: `https://api.whatsapp.com/send?text=${encodedText}`
    },
    {
      name: 'Facebook',
      icon: Globe,
      color: 'bg-[#1877F2] hover:bg-[#166fe5] text-white',
      badge: 'Feed',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`
    },
    {
      name: 'X (Twitter)',
      icon: Share2,
      color: 'bg-stone-900 hover:bg-black text-white',
      badge: 'Post',
      url: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`
    },
    {
      name: 'LinkedIn',
      icon: ExternalLink,
      color: 'bg-[#0A66C2] hover:bg-[#095196] text-white',
      badge: 'Network',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
    },
    {
      name: 'Telegram',
      icon: MessageCircle,
      color: 'bg-[#229ED9] hover:bg-[#1e8bc0] text-white',
      badge: 'Message',
      url: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'bg-red-700 hover:bg-red-800 text-white',
      badge: 'Send',
      url: `mailto:?subject=${encodedTitle}&body=${encodedText}`
    }
  ];

  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-stone-200 max-w-md w-full p-5 sm:p-6 animate-in zoom-in-95 text-stone-900 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-50 text-[#991B1B]">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-stone-900">
                Share Across Apps
              </h3>
              <p className="text-[11px] text-stone-500">
                Send to social media, messaging apps, or copy link
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Item Preview Card */}
        <div className="my-4 p-3 bg-stone-50 rounded-xl border border-stone-200/80">
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white text-stone-700 border border-stone-200 inline-block mb-1.5">
            {item.type ? item.type.toUpperCase() : 'PORTAL POST'}
          </span>
          <h4 className="text-xs sm:text-sm font-bold text-stone-900 line-clamp-2">
            {shareTitle}
          </h4>
          {item.text && (
            <p className="text-[11px] text-stone-500 mt-1 line-clamp-2 leading-relaxed">
              {item.text}
            </p>
          )}
        </div>

        {/* Native Mobile / System Share Sheet Trigger */}
        {hasNativeShare && (
          <div className="mb-4">
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-[#991B1B] to-[#b91c1c] hover:from-[#7f1616] hover:to-[#991B1B] text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              <Smartphone className="w-4 h-4" />
              <span>Share via Device Apps (WhatsApp, Messenger, etc.)</span>
            </button>
          </div>
        )}

        {/* Quick Social Share Buttons */}
        <div className="mb-4">
          <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block mb-2">
            Direct Share to Apps
          </label>
          <div className="grid grid-cols-3 gap-2">
            {socialChannels.map((soc) => {
              const Icon = soc.icon;
              return (
                <a
                  key={soc.name}
                  href={soc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    // brief delay to let click through
                    setTimeout(onClose, 500);
                  }}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl transition-all shadow-2xs hover:shadow-xs active:scale-95 text-center ${soc.color}`}
                >
                  <Icon className="w-4 h-4 mb-1" />
                  <span className="text-[11px] font-bold leading-tight truncate w-full">
                    {soc.name}
                  </span>
                </a>
              );
            })}
          </div>
        </div>

        {/* Copy Link Input Bar */}
        <div>
          <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block mb-1.5">
            Copy Link
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 px-3 py-2 text-xs bg-stone-100 border border-stone-200 rounded-xl text-stone-700 font-mono truncate select-all focus:outline-hidden focus:ring-1 focus:ring-[#991B1B]"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shrink-0 ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-stone-900 hover:bg-black text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

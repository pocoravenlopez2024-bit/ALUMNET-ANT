import React, { useState } from 'react';
import {
  CreditCard,
  RotateCw,
  QrCode,
  ShieldCheck,
  Wifi,
  Copy,
  Check,
  Download,
  Maximize2,
  X,
  GraduationCap
} from 'lucide-react';
import { UserProfile } from '../../types';
import { useAlumni } from '../../context/AlumniContext';
import { generateAlumniId } from '../../services/studentVerificationService';
import { triggerHaptic } from '../../services/hapticsService';

interface DigitalAlumniCardProps {
  user?: UserProfile;
  compact?: boolean;
}

export const DigitalAlumniCard: React.FC<DigitalAlumniCardProps> = ({ user: propUser, compact = false }) => {
  const { currentUser, showToast } = useAlumni();
  const user = propUser || currentUser;

  const [isFlipped, setIsFlipped] = useState(false);
  const [showFullNumber, setShowFullNumber] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [sealImgSrc, setSealImgSrc] = useState('/assets/cecilians-seal.jpg');

  if (!user) return null;

  const getFormattedId = (u: UserProfile) => {
    // Official Alumni have their own distinct Alumni ID (not the student ID)
    if (u.role === 'alumni') {
      if (u.alumniId) return u.alumniId;
      return generateAlumniId(u.batch || '2024', u.studentId, u.uid);
    }
    if (u.studentId) {
      const clean = u.studentId.trim();
      return clean.startsWith('SCC-')
        ? clean
        : clean.startsWith('SC-')
        ? `SCC-${clean.slice(3)}`
        : `SCC-${clean}`;
    }
    if (u.employeeId) {
      const clean = u.employeeId.trim();
      return clean.startsWith('SCC-') ? clean : `SCC-${clean}`;
    }
    const uidStr = u.uid || '0000';
    if (u.role === 'admin') return `SCC-ADM-${uidStr.slice(-3).toUpperCase()}`;
    if (u.role === 'registrar') return `SCC-REG-${uidStr.slice(-3).toUpperCase()}`;
    if (u.role === 'staff') return `SCC-STAFF-${uidStr.slice(-3).toUpperCase()}`;
    if (u.role === 'employer') return `SCC-EMP-${uidStr.slice(-3).toUpperCase()}`;
    if (u.role === 'moderator') return `SCC-MOD-${uidStr.slice(-3).toUpperCase()}`;
    return `SCC-ALUM-${u.batch || '2024'}-${uidStr.slice(-4).toUpperCase()}`;
  };

  const formattedId = getFormattedId(user);

  const getRolePassTitle = (role?: string) => {
    switch (role) {
      case 'superadmin':
        return 'EXECUTIVE CONSOLE PASS';
      case 'admin':
        return 'ADMINISTRATIVE PASS';
      case 'registrar':
        return 'OFFICIAL REGISTRAR PASS';
      case 'staff':
        return 'STAFF OFFICER PASS';
      case 'employer':
        return 'CORPORATE PARTNER PASS';
      case 'moderator':
        return 'MODERATOR PASS';
      case 'alumni':
      default:
        return 'ALUMNI DIGITAL PASS';
    }
  };

  // Mask card number like a credit card: SCC •••• •••• 2024
  const maskedId = showFullNumber
    ? formattedId
    : `SCC •••• •••• ${user.batch || formattedId.slice(-4)}`;

  const handleCopyCard = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(formattedId);
    setCopied(true);
    showToast(`Digital ID (${formattedId}) copied to clipboard!`, 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCard = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.print();
    showToast('Digital ID Pass ready for printing or saving as PDF.', 'info');
  };

  const cardFront = (
    <div className="relative w-full h-full rounded-2xl overflow-hidden bg-gradient-to-br from-[#800000] via-[#520000] to-[#260000] text-white p-3.5 sm:p-5 flex flex-col justify-between shadow-2xl border border-amber-500/30 select-none">
      {/* Background Guilloche Wave / Holographic Effect */}
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(circle_at_30%_30%,rgba(245,158,11,0.4),transparent_50%),linear-gradient(45deg,transparent_40%,rgba(255,255,255,0.2)_50%,transparent_60%)]" />
      <div className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full border border-amber-400/20 pointer-events-none" />
      <div className="absolute -right-6 -bottom-6 w-36 h-36 rounded-full border border-amber-400/20 pointer-events-none" />

      {/* Card Header: Institution Logo + Chip & NFC */}
      <div className="relative z-10 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <img
            src={sealImgSrc}
            alt="St. Cecilia's College Seal"
            onError={() => setSealImgSrc('/assets/st-cecilias-college-seal.jpg')}
            referrerPolicy="no-referrer"
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-amber-400/80 shadow-md object-cover bg-white shrink-0"
          />
          <div className="min-w-0">
            <span className="text-[8px] sm:text-[10px] tracking-widest text-amber-300 font-semibold uppercase block truncate">
              St. Cecilia’s College
            </span>
            <span className="text-xs sm:text-sm font-black tracking-wide text-white drop-shadow-xs block truncate">
              {getRolePassTitle(user.role)}
            </span>
          </div>
        </div>

        {/* Contactless Wave Logo */}
        <div className="flex items-center gap-1 text-amber-300/80 shrink-0">
          <Wifi className="w-3.5 h-3.5 sm:w-5 sm:h-5 rotate-90" />
        </div>
      </div>

      {/* Middle Row: EMV Chip & QR Code */}
      <div className="relative z-10 flex items-center justify-between my-auto py-0.5 sm:py-2">
        {/* Metallic EMV Smart Chip */}
        <div className="w-9 h-6 sm:w-11 sm:h-8 rounded-md bg-gradient-to-tr from-amber-400 via-amber-200 to-amber-500 border border-amber-600 shadow-inner flex flex-col justify-around p-0.5 sm:p-1">
          <div className="w-full h-0.5 bg-amber-700/50 rounded-xs" />
          <div className="flex justify-between">
            <div className="w-2 h-1 sm:w-3 sm:h-2 border border-amber-700/50 rounded-xs" />
            <div className="w-2 h-1 sm:w-3 sm:h-2 border border-amber-700/50 rounded-xs" />
          </div>
          <div className="w-full h-0.5 bg-amber-700/50 rounded-xs" />
        </div>

        {/* Dynamic Campus Gate Pass Mini QR Code */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-black/40 backdrop-blur-xs p-1 sm:p-1.5 rounded-lg border border-amber-400/30">
          <QrCode className="w-6 h-6 sm:w-8 sm:h-8 text-amber-200" />
          <div className="text-[8px] sm:text-[9px] leading-tight text-amber-100 hidden min-[400px]:block">
            <div className="font-bold uppercase tracking-wider text-amber-300">GATE PASS</div>
            <div className="text-amber-200/80">Scan for entry</div>
          </div>
        </div>
      </div>

      {/* Card Number */}
      <div className="relative z-10 my-0.5 sm:my-1">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-amber-300 font-mono font-bold">
            {user.role === 'alumni' ? 'OFFICIAL ALUMNI ID' : 'DIGITAL PASS ID'}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowFullNumber(!showFullNumber);
            }}
            className="text-[8px] sm:text-[10px] uppercase font-bold tracking-wider px-1.5 sm:px-2 py-0.5 rounded bg-black/40 hover:bg-black/60 text-amber-200 border border-amber-400/20 transition-colors shrink-0 cursor-pointer"
          >
            {showFullNumber ? 'Hide' : 'Reveal'}
          </button>
        </div>
        <div className="flex items-center justify-between gap-1">
          <span className="font-mono text-xs sm:text-base md:text-lg tracking-wider sm:tracking-widest text-amber-100 font-bold drop-shadow-sm truncate">
            {maskedId}
          </span>
        </div>
      </div>

      {/* Card Footer: Member Name, Program & Batch */}
      <div className="relative z-10 pt-1 sm:pt-2 border-t border-amber-500/20 flex items-end justify-between gap-2">
        <div className="min-w-0 pr-1 sm:pr-2">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <span className="text-[11px] sm:text-sm font-extrabold tracking-wide uppercase truncate block text-white drop-shadow-sm">
              {user.name}
            </span>
            {user.isVerified && (
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" aria-label="Verified Credential" />
            )}
          </div>
          <span className="text-[8px] sm:text-[10px] text-amber-200/90 tracking-wide truncate block">
            {user.course || user.department || user.headline || 'St. Cecilia’s College Member'}
          </span>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[7px] sm:text-[9px] text-amber-300/80 uppercase tracking-widest block font-medium">
            ROLE / CLASS
          </span>
          <span className="text-[9px] sm:text-[11px] font-bold text-amber-100 uppercase tracking-wider">
            {user.batch ? `BATCH ${user.batch}` : (user.role || 'alumni').toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );

  const cardBack = (
    <div className="relative w-full h-full rounded-2xl overflow-hidden bg-gradient-to-br from-[#1E0303] via-[#330505] to-[#120000] text-white p-3.5 sm:p-5 flex flex-col justify-between shadow-2xl border border-amber-500/30 select-none">
      {/* Magnetic Stripe */}
      <div className="absolute top-3 sm:top-4 left-0 right-0 h-7 sm:h-9 bg-stone-900 border-y border-stone-800 shadow-inner" />

      <div className="pt-7 sm:pt-10 space-y-1 sm:space-y-2">
        {/* Signature Strip */}
        <div className="bg-white/95 rounded px-2.5 sm:px-3 py-1 sm:py-1.5 flex items-center justify-between text-stone-900">
          <span className="font-serif italic text-[11px] sm:text-xs tracking-wider text-stone-700 truncate pr-2">
            {user.name}
          </span>
          <span className="font-mono text-[9px] sm:text-[10px] font-bold text-stone-500 shrink-0">
            SEC: {user.batch || '2024'}-SCC
          </span>
        </div>

        {/* Security / Barcode representation */}
        <div className="p-1.5 sm:p-2 bg-black/40 rounded-lg border border-amber-500/20 flex items-center justify-between gap-2">
          <div className="space-y-0.5 text-[8px] sm:text-[9px] text-stone-300 min-w-0">
            <p className="font-semibold text-amber-300 truncate">OFFICIAL INSTITUTIONAL IDENTIFICATION</p>
            {user.studentId && (
              <p className="text-[7.5px] sm:text-[8.5px] font-mono text-amber-200/90 truncate">
                Academic Student ID: <span className="font-bold text-white">{user.studentId}</span>
              </p>
            )}
            <p className="text-[7px] sm:text-[8px] text-stone-400 leading-tight hidden min-[360px]:block">
              Property of St. Cecilia's College. Valid for campus entry, library access, registrar services, and certified privileges.
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[7px] sm:text-[8px] text-amber-400 block font-mono">SCC SEAL</span>
            <span className="text-[9px] sm:text-[10px] text-emerald-400 font-bold block">VALIDATED</span>
          </div>
        </div>
      </div>

      {/* Optical Barcode simulation */}
      <div className="pt-1.5 sm:pt-2 border-t border-amber-500/20 flex flex-col items-center">
        <div className="w-full flex items-center justify-center gap-0.5 sm:gap-1 h-5 sm:h-7 bg-white/10 rounded px-1.5 sm:px-2 py-0.5 sm:py-1">
          {Array.from({ length: 36 }).map((_, i) => (
            <div
              key={i}
              className={`h-full bg-amber-200 ${
                i % 3 === 0 ? 'w-1 sm:w-1' : i % 5 === 0 ? 'w-1 sm:w-1.5' : 'w-0.5 sm:w-0.5'
              }`}
            />
          ))}
        </div>
        <div className="text-[7px] sm:text-[8px] font-mono text-amber-300/80 tracking-widest mt-0.5 sm:mt-1 truncate">
          *{formattedId}*
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className={`flex flex-col items-center ${compact ? 'max-w-md w-full' : 'max-w-lg w-full'} mx-auto`}>
        {/* Card Canvas Container */}
        <div
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            triggerHaptic?.('light');
            setIsFlipped((prev) => !prev);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              triggerHaptic?.('light');
              setIsFlipped((prev) => !prev);
            }
          }}
          style={{ perspective: '1200px', WebkitPerspective: '1200px', touchAction: 'manipulation' }}
          className="w-full aspect-[1.586/1] min-h-[190px] sm:min-h-[220px] cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99] duration-300 group select-none"
          title="Tap or click card to flip between front and back"
          aria-label="Digital Alumni Card - tap to flip"
        >
          <div
            className="relative w-full h-full transition-transform duration-700"
            style={{
              transformStyle: 'preserve-3d',
              WebkitTransformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              WebkitTransform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
            }}
          >
            {/* Front Side */}
            <div
              className="absolute inset-0 transition-opacity duration-300"
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(0deg)',
                WebkitTransform: 'rotateY(0deg)',
                opacity: isFlipped ? 0 : 1,
                pointerEvents: isFlipped ? 'none' : 'auto',
                zIndex: isFlipped ? 0 : 10
              }}
            >
              {cardFront}
            </div>

            {/* Back Side */}
            <div
              className="absolute inset-0 transition-opacity duration-300"
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                WebkitTransform: 'rotateY(180deg)',
                opacity: isFlipped ? 1 : 0,
                pointerEvents: isFlipped ? 'auto' : 'none',
                zIndex: isFlipped ? 10 : 0
              }}
            >
              {cardBack}
            </div>
          </div>
        </div>

        {/* Card Action Toolbar */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 w-full mt-3 text-xs">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic?.('light');
              setIsFlipped((prev) => !prev);
            }}
            className="flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-2 rounded-xl bg-stone-800/90 hover:bg-stone-700 text-stone-200 border border-stone-700/80 font-semibold transition-colors shadow-2xs cursor-pointer text-center"
          >
            <RotateCw className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{isFlipped ? 'Front' : 'Flip'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyCard}
            className="flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-2 rounded-xl bg-stone-800/90 hover:bg-stone-700 text-stone-200 border border-stone-700/80 font-medium transition-colors shadow-2xs cursor-pointer text-center"
            title="Copy Digital ID"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Copy className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
            <span className="truncate">{copied ? 'Copied' : 'Copy ID'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFullScreen(true)}
            className="flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold transition-colors shadow-2xs cursor-pointer text-center"
            title="Full screen gate pass for campus scanning"
          >
            <Maximize2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">Gate Pass</span>
          </button>
        </div>
      </div>

      {/* Full Screen Gate Pass Modal for Campus Turnstiles & Verification */}
      {isFullScreen && (
        <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 pt-safe pb-safe animate-in fade-in">
          <div className="bg-stone-900 border border-amber-500/30 rounded-2xl p-4 sm:p-6 max-w-md w-full text-white shadow-2xl flex flex-col items-center gap-3 sm:gap-4 max-h-[92dvh] overflow-y-auto">
            <div className="w-full flex items-center justify-between pb-2.5 sm:pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-amber-400 shrink-0" />
                <span className="font-bold text-xs sm:text-sm text-amber-200 truncate">St. Cecilia's College Turnstile Pass</span>
              </div>
              <button
                type="button"
                onClick={() => setIsFullScreen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Render card front */}
            <div className="w-full aspect-[1.586/1] min-h-[190px]">{cardFront}</div>

            {/* High-Contrast Turnstile QR Code */}
            <div className="bg-white p-3 sm:p-4 rounded-xl flex flex-col items-center gap-1.5 sm:gap-2 text-stone-900 w-full">
              <QrCode className="w-28 h-28 sm:w-36 sm:h-36 text-black" />
              <div className="text-center">
                <div className="font-mono text-xs sm:text-sm font-black tracking-widest text-[#8B181B]">{formattedId}</div>
                <div className="text-[10px] sm:text-[11px] text-stone-600 font-medium">
                  Scan at Turnstile Gate • Library Circulation • Registrar
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 w-full pt-1">
              <button
                type="button"
                onClick={handleDownloadCard}
                className="flex-1 py-2 sm:py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span>Print / Save Pass</span>
              </button>
              <button
                type="button"
                onClick={() => setIsFullScreen(false)}
                className="px-4 sm:px-5 py-2 sm:py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold rounded-xl text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

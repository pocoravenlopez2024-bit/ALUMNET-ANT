import React from 'react';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useAlumni } from '../../context/AlumniContext';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, isBackgroundSyncing } = useAlumni();

  if (isOnline && !isBackgroundSyncing) return null;

  if (isBackgroundSyncing) {
    return (
      <div className="fixed bottom-16 sm:bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-50 flex items-center gap-2.5 rounded-xl bg-stone-900/95 text-white px-3.5 py-2.5 text-xs font-medium shadow-[0_8px_30px_rgba(0,0,0,0.3)] border border-stone-800 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
        <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
          <RefreshCw className="w-3.5 h-3.5 stroke-[2] animate-spin" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-emerald-300">Network Restored</p>
          <p className="text-[11px] text-stone-300 truncate">Synchronizing local cache with Firebase...</p>
        </div>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
      </div>
    );
  }

  return (
    <div className="fixed bottom-16 sm:bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-50 flex items-center gap-2.5 rounded-xl bg-stone-900/95 text-white px-3.5 py-2.5 text-xs font-medium shadow-[0_8px_30px_rgba(0,0,0,0.3)] border border-stone-800 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
      <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
        <WifiOff className="w-3.5 h-3.5 stroke-[2]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-amber-300">Offline Standalone Mode</p>
        <p className="text-[11px] text-stone-300 truncate">Cached alumni data & directories are being served.</p>
      </div>
      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
    </div>
  );
};


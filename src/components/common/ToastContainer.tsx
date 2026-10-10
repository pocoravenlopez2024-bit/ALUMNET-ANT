import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useAlumni } from '../../context/AlumniContext';
import { ToastType } from '../../types';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useAlumni();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            role="alert"
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl shadow-lg border backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-3 fade-in ${
              isSuccess
                ? 'bg-emerald-900/95 text-white border-emerald-700/80 shadow-emerald-950/20'
                : isError
                ? 'bg-rose-900/95 text-white border-rose-700/80 shadow-rose-950/20'
                : isWarning
                ? 'bg-amber-900/95 text-white border-amber-700/80 shadow-amber-950/20'
                : 'bg-stone-900/95 text-white border-stone-700/80 shadow-stone-950/20'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-300" />}
              {isError && <AlertCircle className="w-4 h-4 text-rose-300" />}
              {isWarning && <AlertTriangle className="w-4 h-4 text-amber-300" />}
              {!isSuccess && !isError && !isWarning && <Info className="w-4 h-4 text-sky-300" />}
            </div>

            <div className="flex-1 text-xs font-medium leading-snug">
              {toast.message}
            </div>

            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="shrink-0 p-1 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

import { useParking } from '../ParkingContext';
import type { ToastMsg } from '../toastTypes';
import { CheckCircle2, LogIn, LogOut, Zap, Accessibility, XCircle, Info, X } from 'lucide-react';

const KIND_CONFIG: Record<ToastMsg['kind'], { icon: typeof Info; color: string; bg: string }> = {
  entry: { icon: LogIn, color: 'text-spf-green', bg: 'border-spf-green/30' },
  exit: { icon: LogOut, color: 'text-spf-red-coral', bg: 'border-spf-red/30' },
  ev: { icon: Zap, color: 'text-spf-yellow', bg: 'border-spf-yellow/30' },
  pwd: { icon: Accessibility, color: 'text-spf-blue-bright', bg: 'border-spf-blue/30' },
  booking: { icon: CheckCircle2, color: 'text-spf-green', bg: 'border-spf-green/30' },
  cancel: { icon: XCircle, color: 'text-spf-red-coral', bg: 'border-spf-red/30' },
  info: { icon: Info, color: 'text-white/80', bg: 'border-white/15' },
};

export function Toasts() {
  const { toasts, dismissToast } = useParking();
  return (
    <div className="fixed bottom-5 left-1/2 z-[3000] flex -translate-x-1/2 flex-col items-center gap-2 px-4 pointer-events-none">
      {toasts.map((t) => {
        const cfg = KIND_CONFIG[t.kind];
        const Icon = cfg.icon;
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-2.5 rounded-xl border ${cfg.bg} bg-spf-graphite/95 px-4 py-2.5 shadow-spf-float backdrop-blur animate-toast-in`}
          >
            <Icon className={`h-4 w-4 shrink-0 ${cfg.color}`} />
            <span className="text-sm font-medium text-white">{t.text}</span>
            <button
              onClick={() => dismissToast(t.id)}
              className="ml-1 text-white/40 hover:text-white/80"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

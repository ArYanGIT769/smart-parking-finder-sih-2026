import { useState, useEffect, useRef } from 'react';
import { Lock, X, ShieldCheck } from 'lucide-react';

const SESSION_KEY = 'spf-owner-unlocked';
const CORRECT_PIN = '0000';

interface OwnerPinGateProps {
  onUnlock: () => void;
  onClose: () => void;
}

export function OwnerPinGate({ onUnlock, onClose }: OwnerPinGateProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === CORRECT_PIN && pin.length === 4) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      onUnlock();
    } else {
      setError(true);
      setPin('');
      setTimeout(() => setError(false), 1500);
    }
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPin(val);
    setError(false);
  };

  return (
    <div
      className="fixed inset-0 z-[2500] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs overflow-hidden rounded-2xl border border-spf-edge bg-spf-charcoal shadow-spf-float"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-spf-edge px-5 py-4">
          <div className="flex items-center gap-2.5">
            <Lock className="h-5 w-5 text-spf-yellow" />
            <h3 className="text-base font-bold text-white">Owner Demo Access</h3>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-white/40">
            Enter 4-digit PIN
          </label>
          <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={handlePinChange}
            placeholder="••••"
            maxLength={4}
            className={`w-full rounded-xl border bg-spf-graphite px-4 py-3.5 text-center text-2xl font-black tracking-[0.5em] text-white placeholder:text-white/20 focus:outline-none ${
              error ? 'border-spf-red animate-pulse' : 'border-spf-edge focus:border-spf-yellow/50'
            }`}
          />

          {error && (
            <p className="mt-2 text-center text-sm font-semibold text-spf-red-coral">Incorrect PIN</p>
          )}

          <button
            type="submit"
            disabled={pin.length !== 4}
            className={`mt-4 w-full rounded-xl py-3.5 text-sm font-bold transition ${
              pin.length === 4
                ? 'bg-spf-yellow text-spf-ink hover:bg-spf-yellow-bright'
                : 'cursor-not-allowed bg-spf-edge text-white/30'
            }`}
          >
            Unlock Dashboard
          </button>

          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-white/30">
            <ShieldCheck className="h-3.5 w-3.5" />
            Prototype Owner Access · PIN: 0000
          </p>
        </form>
      </div>
    </div>
  );
}

export function isOwnerUnlocked(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === 'true';
  } catch {
    return false;
  }
}

export function lockOwner() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

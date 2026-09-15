import { useState, useEffect } from 'react';
import { useParking } from '../ParkingContext';
import { useNav } from '../NavContext';
import { DirectionsModal } from '../components/DirectionsModal';
import { QRCodeSVG } from 'qrcode.react';
import type { Booking, ParkingFacility } from '../types';
import {
  CalendarClock,
  MapPin,
  Navigation,
  X,
  QrCode,
  Clock,
  Zap,
  Accessibility,
  Car,
  CheckCircle2,
  XCircle,
  RotateCcw,

} from 'lucide-react';
import { formatTimeShort, formatDate, formatCurrency} from '../utils';

export function Bookings() {
  const { bookings, cancelBooking, getParking } = useParking();
  const { navigate } = useNav();
  const [tab, setTab] = useState<'active' | 'history'>('active');
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [qrTarget, setQrTarget] = useState<Booking | null>(null);
  const [directionsParking, setDirectionsParking] = useState<ParkingFacility | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const active = bookings.filter((b) => b.status === 'Active');
  const history = bookings.filter((b) => b.status !== 'Active');

  const handleCancel = () => {
    if (cancelTarget) {
      cancelBooking(cancelTarget.id);
      setCancelTarget(null);
    }
  };

  const statusBadge = (status: Booking['status']) => {
    const cfg = {
      Active: { cls: 'bg-spf-green/15 text-spf-green', icon: Clock },
      Completed: { cls: 'bg-white/10 text-white/60', icon: CheckCircle2 },
      Cancelled: { cls: 'bg-spf-red/15 text-spf-red-coral', icon: XCircle },
      Refunded: { cls: 'bg-spf-amber/15 text-spf-amber', icon: RotateCcw },
    }[status];
    const Icon = cfg.icon;
    return (
      <span className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold ${cfg.cls}`}>
        <Icon className="h-3 w-3" /> {status}
      </span>
    );
  };

  return (
    <div className="min-h-[calc(100vh-68px)] bg-spf-ink px-4 py-5 pb-20 md:pb-5">
      <div className="mx-auto max-w-2xl">
        <div className="mb-5 flex items-center gap-3">
          <CalendarClock className="h-6 w-6 text-spf-yellow" />
          <div>
            <h1 className="text-xl font-bold text-white">My Bookings</h1>
            <p className="text-sm text-white/50">Manage your parking reservations</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-4 flex gap-1 rounded-xl border border-spf-edge bg-spf-charcoal p-1">
          <button
            onClick={() => setTab('active')}
            className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition ${
              tab === 'active' ? 'bg-spf-yellow text-spf-ink' : 'text-white/60 hover:text-white'
            }`}
          >
            Active ({active.length})
          </button>
          <button
            onClick={() => setTab('history')}
            className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition ${
              tab === 'history' ? 'bg-spf-yellow text-spf-ink' : 'text-white/60 hover:text-white'
            }`}
          >
            History ({history.length})
          </button>
        </div>

        {/* Active bookings */}
        {tab === 'active' && (
          <div className="space-y-3">
            {active.length === 0 ? (
              <div className="rounded-xl border border-spf-edge bg-spf-charcoal py-16 text-center">
                <CalendarClock className="mx-auto h-10 w-10 text-white/20" />
                <p className="mt-3 text-sm text-white/50">No active bookings</p>
                <button
                  onClick={() => navigate('explore')}
                  className="mt-4 rounded-lg bg-spf-yellow px-4 py-2 text-sm font-bold text-spf-ink"
                >
                  Find Parking
                </button>
              </div>
            ) : (
              active.map((b) => {
                const remaining = b.expiryTime - now;
                const remainingMin = Math.max(0, Math.floor(remaining / 60000));
                const remainingH = Math.floor(remainingMin / 60);
                const remainingM = remainingMin % 60;
                const parking = getParking(b.parkingId);
                return (
                  <div key={b.id} className="rounded-xl border border-spf-edge bg-spf-charcoal p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-white">{b.parkingName}</h3>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-white/50">
                          <MapPin className="h-3 w-3" /> {b.area}, Indore
                        </p>
                      </div>
                      {statusBadge(b.status)}
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-white/40">Vehicle</p>
                        <p className="font-bold text-white">{b.registration}</p>
                      </div>
                      <div>
                        <p className="text-xs text-white/40">Slot</p>
                        <p className="font-bold text-spf-yellow">{b.slot}</p>
                      </div>
                      <div>
                        <p className="text-xs text-white/40">Amount</p>
                        <p className="font-bold text-white">{formatCurrency(b.amount)}</p>
                      </div>
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
                      <span className="flex items-center gap-1 text-white/50">
                        {b.category === 'PWD' ? (
                          <Accessibility className="h-3 w-3 text-spf-blue-bright" />
                        ) : (
                          <Car className="h-3 w-3" />
                        )}
                        {b.category}
                      </span>
                      <span className="text-white/40">·</span>
                      <span className="text-white/50">{b.vehicleType}</span>
                      {b.charging && (
                        <>
                          <span className="text-white/40">·</span>
                          <span className="flex items-center gap-1 text-spf-yellow">
                            <Zap className="h-3 w-3" /> {b.charger}
                          </span>
                        </>
                      )}
                      <span className="text-white/40">·</span>
                      <span className="text-white/50">{b.durationHours}h</span>
                    </div>

                    {/* Countdown */}
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-spf-graphite px-3 py-2">
                      <Clock className="h-4 w-4 text-spf-yellow" />
                      <span className="text-xs text-white/50">Time remaining:</span>
                      <span className="font-mono text-sm font-bold text-white">
                        {remainingH > 0 ? `${remainingH}h ` : ''}{remainingM}m
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => setQrTarget(b)}
                        className="flex items-center gap-1.5 rounded-lg border border-spf-edge bg-spf-graphite px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-spf-slate"
                      >
                        <QrCode className="h-3.5 w-3.5" /> QR
                      </button>
                      <button
                        onClick={() => parking && setDirectionsParking(parking)}
                        className="flex items-center gap-1.5 rounded-lg border border-spf-edge bg-spf-graphite px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-spf-slate"
                      >
                        <Navigation className="h-3.5 w-3.5" /> Navigate
                      </button>
                      <button
                        onClick={() => setCancelTarget(b)}
                        className="ml-auto flex items-center gap-1.5 rounded-lg border border-spf-red/30 bg-spf-red/10 px-3 py-2 text-xs font-bold text-spf-red-coral transition hover:bg-spf-red/20"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Cancel
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* History */}
        {tab === 'history' && (
          <div className="space-y-3">
            {history.length === 0 ? (
              <div className="rounded-xl border border-spf-edge bg-spf-charcoal py-16 text-center">
                <CalendarClock className="mx-auto h-10 w-10 text-white/20" />
                <p className="mt-3 text-sm text-white/50">No booking history yet</p>
              </div>
            ) : (
              history.map((b) => (
                <div key={b.id} className="rounded-xl border border-spf-edge bg-spf-charcoal p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-white">{b.parkingName}</h3>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-white/50">
                        <MapPin className="h-3 w-3" /> {b.area}
                      </p>
                    </div>
                    {statusBadge(b.status)}
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-white/40">Vehicle</p>
                      <p className="font-bold text-white">{b.registration}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/40">Slot</p>
                      <p className="font-bold text-white">{b.slot}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/40">Amount</p>
                      <p className={`font-bold ${b.status === 'Refunded' ? 'text-spf-amber' : 'text-white'}`}>
                        {formatCurrency(b.amount)}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-white/40">
                    {formatDate(b.createdAt)} · {formatTimeShort(b.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Cancel modal */}
      {cancelTarget && (
        <div
          className="fixed inset-0 z-[2500] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setCancelTarget(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-spf-edge bg-spf-charcoal p-5 shadow-spf-float"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-spf-red/15">
                <XCircle className="h-5 w-5 text-spf-red-coral" />
              </div>
              <h3 className="text-base font-bold text-white">Cancel reservation?</h3>
            </div>
            <p className="mt-3 text-sm text-white/60">
              Slot <span className="font-bold text-spf-yellow">{cancelTarget.slot}</span> will be released.
            </p>
            <div className="mt-5 flex gap-2.5">
              <button
                onClick={() => setCancelTarget(null)}
                className="flex-1 rounded-xl border border-spf-edge bg-spf-graphite py-3 text-sm font-semibold text-white transition hover:bg-spf-slate"
              >
                Keep Reservation
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 rounded-xl bg-spf-red py-3 text-sm font-bold text-white transition hover:bg-spf-red-coral"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR modal */}
      {qrTarget && (
        <div
          className="fixed inset-0 z-[2500] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setQrTarget(null)}
        >
          <div
            className="w-full max-w-xs rounded-2xl border border-spf-edge bg-spf-charcoal p-5 text-center shadow-spf-float"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Booking QR</h3>
              <button onClick={() => setQrTarget(null)} className="text-white/40 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 flex justify-center rounded-xl bg-white p-3">
              <QRCodeSVG
                value={`SPF|${qrTarget.id}|${qrTarget.parkingId}|${qrTarget.registration}|${qrTarget.slot}`}
                size={160}
                level="M"
              />
            </div>
            <p className="mt-3 text-sm font-bold text-white">{qrTarget.parkingName}</p>
            <p className="mt-1 text-xs text-white/50">
              Slot {qrTarget.slot} · {qrTarget.registration}
            </p>
            <p className="mt-1 font-mono text-xs text-white/40">{qrTarget.id}</p>
            <p className="mt-2 text-xs text-white/50">Show this QR at the parking entrance</p>
          </div>
        </div>
      )}

      {directionsParking && (
        <DirectionsModal parking={directionsParking} onClose={() => setDirectionsParking(null)} />
      )}
    </div>
  );
}

import { useState } from 'react';
import { useParking } from '../ParkingContext';
import { useNav } from '../NavContext';
import { DirectionsModal } from '../components/DirectionsModal';
import { QRCodeSVG } from 'qrcode.react';
import type { VehicleType, ParkingCategory, Booking } from '../types';
import {
  ArrowLeft,
  MapPin,
  Star,
  Zap,
  Accessibility,
  Camera,
  Clock,
  Shield,
  Navigation,
  Check,
  Car,
  X,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { haversine, formatDistance, getOccupancyStatus, statusLabel, statusBg, formatCurrency } from '../utils';
import { INDORE_CENTER } from '../types';

type Step = 'details' | 'booking' | 'confirmed';

export function Details({ parkingId }: { parkingId: string }) {
  const { getParking, createBooking, userLocation } = useParking();
  const { navigate } = useNav();
  const parking = getParking(parkingId);

  const [step, setStep] = useState<Step>('details');
  const [directionsOpen, setDirectionsOpen] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  // Booking form state
  const [registration, setRegistration] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('Sedan');
  const [category, setCategory] = useState<ParkingCategory>('Standard');
  const [needCharging, setNeedCharging] = useState(false);
  const [duration, setDuration] = useState(2);

  if (!parking) {
    return (
      <div className="flex min-h-[calc(100vh-68px)] items-center justify-center">
        <div className="text-center">
          <p className="text-white/60">Parking not found</p>
          <button
            onClick={() => navigate('explore')}
            className="mt-3 text-sm font-semibold text-spf-yellow hover:underline"
          >
            Back to Explore
          </button>
        </div>
      </div>
    );
  }

  const status = getOccupancyStatus(parking.availableSpaces, parking.totalSpaces);
  const dist = userLocation
    ? haversine(userLocation.lat, userLocation.lng, parking.latitude, parking.longitude)
    : haversine(INDORE_CENTER[0], INDORE_CENTER[1], parking.latitude, parking.longitude);

  const total = parking.pricePerHour * duration;
  const isEv = vehicleType === 'EV';
  const canBook =
    registration.trim().length >= 4 &&
    (category === 'Standard' || parking.pwdSpacesAvailable > 0) &&
    (!isEv || parking.evSpacesAvailable > 0) &&
    (!needCharging || parking.evChargersAvailable > 0);

  const handleConfirm = () => {
    if (!canBook) return;
    const booking = createBooking({
      parkingId: parking.id,
      registration: registration.trim(),
      vehicleType,
      category,
      durationHours: duration,
      charging: isEv && needCharging,
    });
    setConfirmedBooking(booking);
    setStep('confirmed');
  };

  const resetBooking = () => {
    setRegistration('');
    setVehicleType('Sedan');
    setCategory('Standard');
    setNeedCharging(false);
    setDuration(2);
  };

  // ---- Confirmed step ----
  if (step === 'confirmed' && confirmedBooking) {
    return (
      <div className="min-h-[calc(100vh-68px)] bg-spf-ink px-4 py-6 pb-20 md:pb-6">
        <div className="mx-auto max-w-md">
          <div className="rounded-2xl border border-spf-green/30 bg-spf-charcoal p-6 text-center shadow-spf-float">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-spf-green/15">
              <CheckCircle2 className="h-7 w-7 text-spf-green" />
            </div>
            <h1 className="mt-4 text-2xl font-black text-white">Parking Reserved!</h1>
            <p className="mt-1 text-sm text-white/50">{parking.name}</p>

            <div className="mt-5 rounded-xl border border-spf-edge bg-spf-graphite p-4 text-left">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-white/40">Vehicle</p>
                  <p className="font-bold text-white">{confirmedBooking.registration}</p>
                </div>
                <div>
                  <p className="text-xs text-white/40">Slot</p>
                  <p className="font-bold text-spf-yellow">{confirmedBooking.slot}</p>
                </div>
                <div>
                  <p className="text-xs text-white/40">Duration</p>
                  <p className="font-bold text-white">{confirmedBooking.durationHours} hour{confirmedBooking.durationHours > 1 ? 's' : ''}</p>
                </div>
                <div>
                  <p className="text-xs text-white/40">Amount</p>
                  <p className="font-bold text-white">{formatCurrency(confirmedBooking.amount)}</p>
                </div>
                {confirmedBooking.charger && (
                  <div className="col-span-2">
                    <p className="text-xs text-white/40">Charger</p>
                    <p className="font-bold text-spf-yellow">{confirmedBooking.charger}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <p className="text-xs text-white/40">Booking ID</p>
                  <p className="font-mono font-bold text-white/80">{confirmedBooking.id}</p>
                </div>
              </div>
            </div>

            {/* QR */}
            <div className="mt-5 flex flex-col items-center">
              <div className="rounded-xl bg-white p-3">
                <QRCodeSVG
                  value={`SPF|${confirmedBooking.id}|${confirmedBooking.parkingId}|${confirmedBooking.registration}|${confirmedBooking.slot}`}
                  size={140}
                  level="M"
                />
              </div>
              <p className="mt-3 text-xs text-white/50">Show this QR at the parking entrance</p>
            </div>

            <div className="mt-6 flex gap-2.5">
              <button
                onClick={() => setDirectionsOpen(true)}
                className="flex-1 rounded-xl border border-spf-edge bg-spf-graphite py-3 text-sm font-semibold text-white transition hover:bg-spf-slate"
              >
                Navigate
              </button>
              <button
                onClick={() => navigate('bookings')}
                className="flex-1 rounded-xl border border-spf-edge bg-spf-graphite py-3 text-sm font-semibold text-white transition hover:bg-spf-slate"
              >
                View Booking
              </button>
              <button
                onClick={() => {
                  resetBooking();
                  setStep('details');
                  navigate('explore');
                }}
                className="flex-1 rounded-xl bg-spf-yellow py-3 text-sm font-bold text-spf-ink transition hover:bg-spf-yellow-bright"
              >
                Done
              </button>
            </div>
          </div>
        </div>

        {directionsOpen && <DirectionsModal parking={parking} onClose={() => setDirectionsOpen(false)} />}
      </div>
    );
  }

  // ---- Booking step ----
  if (step === 'booking') {
    const vehicleTypes: { key: VehicleType; label: string }[] = [
      { key: 'Sedan', label: 'Sedan' },
      { key: 'Hatchback', label: 'Hatchback' },
      { key: 'SUV', label: 'SUV' },
      { key: 'EV', label: 'EV' },
    ];
    const durations = [1, 2, 3, 4];

    return (
      <div className="min-h-[calc(100vh-68px)] bg-spf-ink px-4 py-5 pb-20 md:pb-5">
        <div className="mx-auto max-w-lg">
          <button
            onClick={() => setStep('details')}
            className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-white/60 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          <div className="rounded-2xl border border-spf-edge bg-spf-charcoal p-5">
            <h1 className="text-lg font-bold text-white">Reserve Parking</h1>
            <p className="mt-0.5 text-sm text-white/50">{parking.name}</p>

            <div className="mt-5 space-y-5">
              {/* Step 2: Registration */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-white/40">
                  Vehicle Registration
                </label>
                <input
                  type="text"
                  value={registration}
                  onChange={(e) => setRegistration(e.target.value.toUpperCase())}
                  placeholder="MP09 AB 4821"
                  className="w-full rounded-xl border border-spf-edge bg-spf-graphite px-4 py-3 text-sm font-bold text-white placeholder:text-white/30 focus:border-spf-yellow/50 focus:outline-none"
                />
              </div>

              {/* Step 3: Vehicle type */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-white/40">
                  Vehicle Type
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {vehicleTypes.map((vt) => (
                    <button
                      key={vt.key}
                      onClick={() => {
                        setVehicleType(vt.key);
                        if (vt.key !== 'EV') setNeedCharging(false);
                      }}
                      className={`rounded-lg border py-2.5 text-xs font-semibold transition ${
                        vehicleType === vt.key
                          ? 'border-spf-yellow bg-spf-yellow/10 text-spf-yellow'
                          : 'border-spf-edge bg-spf-graphite text-white/60 hover:text-white'
                      }`}
                    >
                      {vt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 4: Category */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-white/40">
                  Parking Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setCategory('Standard')}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border py-3 text-sm font-semibold transition ${
                      category === 'Standard'
                        ? 'border-spf-yellow bg-spf-yellow/10 text-spf-yellow'
                        : 'border-spf-edge bg-spf-graphite text-white/60 hover:text-white'
                    }`}
                  >
                    <Car className="h-4 w-4" /> Standard
                  </button>
                  <button
                    onClick={() => setCategory('PWD')}
                    disabled={parking.pwdSpacesAvailable <= 0}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border py-3 text-sm font-semibold transition ${
                      category === 'PWD'
                        ? 'border-spf-blue bg-spf-blue/10 text-spf-blue-bright'
                        : 'border-spf-edge bg-spf-graphite text-white/60 hover:text-white'
                    } ${parking.pwdSpacesAvailable <= 0 ? 'cursor-not-allowed opacity-40' : ''}`}
                  >
                    <Accessibility className="h-4 w-4" /> PWD Accessible
                  </button>
                </div>
                {category === 'PWD' && (
                  <p className="mt-2 rounded-lg bg-spf-blue/10 px-3 py-2 text-xs text-spf-blue-bright">
                    Accessible spaces are reserved for eligible Persons with Disabilities. Please use them responsibly.
                  </p>
                )}
              </div>

              {/* Step 5: EV charging */}
              {isEv && (
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-white/40">
                    Need charging?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setNeedCharging(true)}
                      disabled={parking.evChargersAvailable <= 0}
                      className={`flex items-center justify-center gap-1.5 rounded-lg border py-3 text-sm font-semibold transition ${
                        needCharging
                          ? 'border-spf-yellow bg-spf-yellow/10 text-spf-yellow'
                          : 'border-spf-edge bg-spf-graphite text-white/60 hover:text-white'
                      } ${parking.evChargersAvailable <= 0 ? 'cursor-not-allowed opacity-40' : ''}`}
                    >
                      <Zap className="h-4 w-4" /> Yes, charge
                    </button>
                    <button
                      onClick={() => setNeedCharging(false)}
                      className={`flex items-center justify-center gap-1.5 rounded-lg border py-3 text-sm font-semibold transition ${
                        !needCharging
                          ? 'border-spf-yellow bg-spf-yellow/10 text-spf-yellow'
                          : 'border-spf-edge bg-spf-graphite text-white/60 hover:text-white'
                      }`}
                    >
                      No, just park
                    </button>
                  </div>
                  {needCharging && parking.evChargersAvailable > 0 && (
                    <p className="mt-2 rounded-lg bg-spf-yellow/10 px-3 py-2 text-xs text-spf-yellow">
                      Charger will be assigned automatically (e.g. C2)
                    </p>
                  )}
                  {parking.evChargersAvailable <= 0 && (
                    <p className="mt-2 rounded-lg bg-spf-red/10 px-3 py-2 text-xs text-spf-red-coral">
                      No chargers currently available
                    </p>
                  )}
                </div>
              )}

              {/* Step 6: Duration */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-white/40">
                  Duration
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {durations.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      className={`rounded-lg border py-2.5 text-sm font-semibold transition ${
                        duration === d
                          ? 'border-spf-yellow bg-spf-yellow/10 text-spf-yellow'
                          : 'border-spf-edge bg-spf-graphite text-white/60 hover:text-white'
                      }`}
                    >
                      {d} hr
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-xl border border-spf-edge bg-spf-graphite p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-white/40">Summary</h3>
                <div className="mt-2.5 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">{parking.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Registration</span>
                    <span className="font-semibold text-white">{registration || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Duration</span>
                    <span className="font-semibold text-white">{duration} hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Rate</span>
                    <span className="font-semibold text-white">₹{parking.pricePerHour} × {duration}</span>
                  </div>
                  <div className="mt-2 flex justify-between border-t border-spf-edge pt-2.5">
                    <span className="font-bold text-white">TOTAL</span>
                    <span className="text-lg font-black text-spf-yellow">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleConfirm}
                disabled={!canBook}
                className={`w-full rounded-xl py-3.5 text-sm font-bold transition ${
                  canBook
                    ? 'bg-spf-yellow text-spf-ink hover:bg-spf-yellow-bright'
                    : 'cursor-not-allowed bg-spf-edge text-white/30'
                }`}
              >
                Confirm Reservation
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---- Details step ----
  const statCards = [
    { label: 'STANDARD', value: parking.standardSpacesAvailable, total: parking.standardSpacesTotal, icon: Car, color: 'text-white' },
    { label: 'EV', value: parking.evSpacesAvailable, total: parking.evSpacesTotal, icon: Zap, color: 'text-spf-yellow' },
    { label: 'ACCESSIBLE', value: parking.pwdSpacesAvailable, total: parking.pwdSpacesTotal, icon: Accessibility, color: 'text-spf-blue-bright' },
    { label: 'SECURITY', value: null, icon: Shield, color: 'text-spf-green', text: parking.securityCamera ? 'CCTV' : 'None' },
  ];

  return (
    <div className="min-h-[calc(100vh-68px)] bg-spf-ink px-4 py-5 pb-20 md:pb-5">
      <div className="mx-auto max-w-2xl">
        <button
          onClick={() => navigate('explore')}
          className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-white/60 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Explore
        </button>

        {/* Header card */}
        <div className="rounded-2xl border border-spf-edge bg-spf-charcoal p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-white">{parking.name}</h1>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-white/50">
                <MapPin className="h-3.5 w-3.5" /> {parking.area}, Indore
              </p>
              <div className="mt-2 flex items-center gap-3 text-xs text-white/50">
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 text-spf-yellow" /> {parking.rating}
                </span>
                <span>{formatDistance(dist)}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-spf-yellow">{parking.availableSpaces}</p>
              <p className="text-xs text-white/50">spaces available</p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${statusBg(status)}`} />
            <span className="text-sm font-semibold text-white/80">{statusLabel(status)}</span>
            <span className="text-xs text-white/40">
              · {parking.totalSpaces - parking.availableSpaces}/{parking.totalSpaces} occupied
            </span>
          </div>
        </div>

        {/* Space breakdown */}
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statCards.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-xl border border-spf-edge bg-spf-charcoal p-4">
                <Icon className={`h-5 w-5 ${s.color}`} />
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-white/40">{s.label}</p>
                {s.value !== null ? (
                  <p className="mt-1 text-lg font-black text-white">
                    {s.value}
                    <span className="text-sm font-normal text-white/40">/{s.total}</span>
                  </p>
                ) : (
                  <p className="mt-1 text-lg font-black text-white">{s.text}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Info row */}
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="flex items-center gap-1.5 rounded-lg border border-spf-edge bg-spf-charcoal px-3 py-1.5 text-xs font-semibold text-white/70">
            ₹{parking.pricePerHour}/hr
          </span>
          {parking.open24Hours && (
            <span className="flex items-center gap-1.5 rounded-lg border border-spf-edge bg-spf-charcoal px-3 py-1.5 text-xs font-semibold text-white/70">
              <Clock className="h-3.5 w-3.5" /> Open 24/7
            </span>
          )}
          {parking.coveredParking && (
            <span className="flex items-center gap-1.5 rounded-lg border border-spf-edge bg-spf-charcoal px-3 py-1.5 text-xs font-semibold text-white/70">
              <Shield className="h-3.5 w-3.5" /> Covered
            </span>
          )}
          {parking.securityCamera && (
            <span className="flex items-center gap-1.5 rounded-lg border border-spf-edge bg-spf-charcoal px-3 py-1.5 text-xs font-semibold text-white/70">
              <Camera className="h-3.5 w-3.5" /> CCTV
            </span>
          )}
        </div>

        {/* EV details */}
        {parking.evSpacesTotal > 0 && (
          <div className="mt-3 rounded-xl border border-spf-yellow/20 bg-spf-yellow/5 p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-spf-yellow" />
              <h3 className="text-sm font-bold text-white">EV Charging</h3>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-white/50">EV Parking Spaces</p>
                <p className="font-bold text-white">{parking.evSpacesAvailable} / {parking.evSpacesTotal} available</p>
              </div>
              <div>
                <p className="text-xs text-white/50">Chargers</p>
                <p className="font-bold text-white">{parking.evChargersAvailable} / {parking.evChargersTotal} available</p>
              </div>
            </div>
          </div>
        )}

        {/* PWD details */}
        {parking.pwdSpacesTotal > 0 && (
          <div className="mt-3 rounded-xl border border-spf-blue/20 bg-spf-blue/5 p-4">
            <div className="flex items-center gap-2">
              <Accessibility className="h-4 w-4 text-spf-blue-bright" />
              <h3 className="text-sm font-bold text-white">PWD Accessible Reserved Spaces</h3>
            </div>
            <p className="mt-2 text-sm font-bold text-white">{parking.pwdSpacesAvailable} / {parking.pwdSpacesTotal} available</p>
            <p className="mt-1 text-xs text-white/50">
              Accessible spaces are reserved for eligible Persons with Disabilities. Please use them responsibly.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-5 flex gap-3">
          <button
            onClick={() => setDirectionsOpen(true)}
            className="flex-1 rounded-xl border border-spf-edge bg-spf-graphite py-3.5 text-sm font-bold text-white transition hover:bg-spf-slate"
          >
            <Navigation className="mr-1.5 inline h-4 w-4" />
            Get Directions
          </button>
          <button
            onClick={() => setStep('booking')}
            disabled={parking.availableSpaces <= 0}
            className={`flex-1 rounded-xl py-3.5 text-sm font-bold transition ${
              parking.availableSpaces > 0
                ? 'bg-spf-yellow text-spf-ink hover:bg-spf-yellow-bright'
                : 'cursor-not-allowed bg-spf-edge text-white/30'
            }`}
          >
            Reserve Spot
          </button>
        </div>
      </div>

      {directionsOpen && <DirectionsModal parking={parking} onClose={() => setDirectionsOpen(false)} />}
    </div>
  );
}

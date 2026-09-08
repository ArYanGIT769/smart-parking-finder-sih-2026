import type { ParkingFacility } from '../types';
import { Zap, Accessibility, Camera, Clock, Star, MapPin } from 'lucide-react';
import { formatDistance, getOccupancyStatus, statusLabel, statusBg } from '../utils';

interface ParkingCardProps {
  parking: ParkingFacility;
  selected: boolean;
  onClick: () => void;
  onReserve: () => void;
  onDetails: () => void;
  cardRef?: (el: HTMLDivElement | null) => void;
}

export function ParkingCard({ parking, selected, onClick, onReserve, onDetails, cardRef }: ParkingCardProps) {
  const status = getOccupancyStatus(parking.availableSpaces, parking.totalSpaces);
  const occPct = Math.round(((parking.totalSpaces - parking.availableSpaces) / parking.totalSpaces) * 100);

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      className={`cursor-pointer rounded-xl border bg-spf-charcoal p-3.5 transition ${
        selected
          ? 'border-spf-yellow shadow-spf-glow'
          : 'border-spf-edge hover:border-white/15 hover:bg-spf-graphite'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold text-white">{parking.name}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-white/50">
            <MapPin className="h-3 w-3 shrink-0" /> {parking.area}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Star className="h-3 w-3 text-spf-yellow" />
          <span className="text-xs font-semibold text-white/70">{parking.rating}</span>
        </div>
      </div>

      {/* Availability */}
      <div className="mt-3 flex items-end justify-between">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl font-black leading-none ${selected ? 'text-spf-yellow' : 'text-white'}`}>
              {parking.availableSpaces}
            </span>
            <span className="text-xs font-medium text-white/40">of {parking.totalSpaces}</span>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${statusBg(status)}`} />
            <span className="text-xs font-semibold text-white/60">{statusLabel(status)}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-white">₹{parking.pricePerHour}<span className="text-xs font-normal text-white/40">/hr</span></p>
          <p className="mt-0.5 text-xs text-white/40">{parking.distance > 0 ? formatDistance(parking.distance) : '—'}</p>
        </div>
      </div>

      {/* Occupancy bar */}
      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-spf-edge">
        <div
          className={`h-full rounded-full transition-all duration-500 ${statusBg(status)}`}
          style={{ width: `${occPct}%` }}
        />
      </div>

      {/* Badges */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {parking.evSpacesAvailable > 0 && (
          <span className="flex items-center gap-1 rounded-md bg-spf-yellow/10 px-2 py-0.5 text-[10px] font-semibold text-spf-yellow">
            <Zap className="h-3 w-3" /> {parking.evSpacesAvailable} EV
          </span>
        )}
        {parking.pwdSpacesAvailable > 0 && (
          <span className="flex items-center gap-1 rounded-md bg-spf-blue/15 px-2 py-0.5 text-[10px] font-semibold text-spf-blue-bright">
            <Accessibility className="h-3 w-3" /> {parking.pwdSpacesAvailable} PWD
          </span>
        )}
        {parking.securityCamera && (
          <span className="flex items-center gap-1 rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-white/50">
            <Camera className="h-3 w-3" /> CCTV
          </span>
        )}
        {parking.open24Hours && (
          <span className="flex items-center gap-1 rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-white/50">
            <Clock className="h-3 w-3" /> 24/7
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="mt-3 flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDetails();
          }}
          className="flex-1 rounded-lg border border-spf-edge bg-spf-graphite py-2 text-xs font-semibold text-white/80 transition hover:bg-spf-slate"
        >
          Details
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onReserve();
          }}
          className="flex-1 rounded-lg bg-spf-yellow py-2 text-xs font-bold text-spf-ink transition hover:bg-spf-yellow-bright"
        >
          Reserve
        </button>
      </div>
    </div>
  );
}

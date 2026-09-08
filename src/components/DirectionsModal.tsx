import { useParking } from '../ParkingContext';
import type { ParkingFacility } from '../types';
import { X, Navigation, MapPin, ExternalLink, Map } from 'lucide-react';

interface DirectionsModalProps {
  parking: ParkingFacility;
  onClose: () => void;
}

export function DirectionsModal({ parking, onClose }: DirectionsModalProps) {
  const { userLocation } = useParking();

  const googleMapsUrl = userLocation
    ? `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${parking.latitude},${parking.longitude}&travelmode=driving`
    : `https://www.google.com/maps/dir/?api=1&destination=${parking.latitude},${parking.longitude}&travelmode=driving`;

  const osmUrl = userLocation
    ? `https://www.openstreetmap.org/directions?from=${userLocation.lat}%2C${userLocation.lng}&to=${parking.latitude}%2C${parking.longitude}`
    : `https://www.openstreetmap.org/?mlat=${parking.latitude}&mlon=${parking.longitude}#map=17/${parking.latitude}/${parking.longitude}`;

  return (
    <div
      className="fixed inset-0 z-[2500] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-2xl border border-spf-edge bg-spf-charcoal shadow-spf-float"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-spf-edge px-5 py-4">
          <div className="flex items-center gap-2.5">
            <Navigation className="h-5 w-5 text-spf-yellow" />
            <h3 className="text-base font-bold text-white">Navigate using</h3>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-spf-graphite px-3 py-2.5">
            <MapPin className="h-4 w-4 shrink-0 text-spf-yellow" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{parking.name}</p>
              <p className="truncate text-xs text-white/50">{parking.area}, Indore</p>
            </div>
          </div>

          <div className="space-y-2.5">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl border border-spf-edge bg-spf-graphite px-4 py-3.5 transition hover:border-spf-yellow/40 hover:bg-spf-slate"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white">
                  <span className="text-sm font-black text-spf-blue">G</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Google Maps</p>
                  <p className="text-xs text-white/50">Turn-by-turn directions</p>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-white/40" />
            </a>

            <a
              href={osmUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl border border-spf-edge bg-spf-graphite px-4 py-3.5 transition hover:border-spf-yellow/40 hover:bg-spf-slate"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-spf-green/20">
                  <Map className="h-5 w-5 text-spf-green" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">OpenStreetMap</p>
                  <p className="text-xs text-white/50">Open directions</p>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-white/40" />
            </a>
          </div>

          {!userLocation && (
            <p className="mt-3 rounded-lg bg-spf-amber/10 px-3 py-2 text-xs text-spf-amber">
              Enable location for directions from your current position.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}


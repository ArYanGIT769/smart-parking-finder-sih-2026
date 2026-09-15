import { useEffect, useRef, type ReactNode } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { ParkingFacility } from '../types';
import { INDORE_CENTER } from '../types';
import { getOccupancyStatus } from '../utils';

function createParkingIcon(availability: number, total: number, selected: boolean): L.DivIcon {
  const status = getOccupancyStatus(availability, total);
  const dotColor = status === 'available' ? 'green' : status === 'filling' ? 'amber' : 'red';
  return L.divIcon({
    className: 'spf-marker',
    html: `<div class="parking-marker ${selected ? 'is-selected' : ''}">
      <div class="pm-body">
        <span class="pm-p">P</span>
        <span class="pm-num">${availability}</span>
        <span class="pm-dot ${dotColor}"></span>
      </div>
      <div class="pm-tip"></div>
    </div>`,
    iconSize: [50, 28],
    iconAnchor: [25, 30],
    popupAnchor: [0, -26],
  });
}

function createUserIcon(): L.DivIcon {
  return L.divIcon({
    className: 'spf-marker',
    html: `<div class="gps-marker">
      <div class="gps-halo"></div>
      <div class="gps-core"></div>
      <div class="gps-label">YOU</div>
    </div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

interface MapControllerProps {
  flyTo: { lat: number; lng: number; zoom?: number } | null;
  fitBounds: [number, number][] | null;
  invalidateKey: number;
}

function MapController({ flyTo, fitBounds, invalidateKey }: MapControllerProps) {
  const map = useMap();

  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 120);
    return () => clearTimeout(t);
  }, [map, invalidateKey]);

  useEffect(() => {
    if (flyTo) {
      map.flyTo([flyTo.lat, flyTo.lng], flyTo.zoom ?? 15, {
        duration: 0.8,
        easeLinearity: 0.25,
      });
    }
  }, [flyTo, map]);

  useEffect(() => {
    if (fitBounds && fitBounds.length > 0) {
      const bounds = L.latLngBounds(fitBounds.map(([lat, lng]) => [lat, lng] as [number, number]));
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
    }
  }, [fitBounds, map]);

  return null;
}

interface ZoomControlProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
}

function ZoomButtons({ onZoomIn, onZoomOut }: ZoomControlProps) {
  const map = useMap();
  return (
    <>
      <div className="absolute right-3 top-3 z-[1000] flex flex-col gap-1.5">
        <button
          onClick={() => {
            map.zoomIn();
            onZoomIn();
          }}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-spf-edge bg-spf-charcoal/90 text-white shadow-spf-soft backdrop-blur transition hover:bg-spf-graphite hover:text-spf-yellow"
          title="Zoom in"
        >
          <span className="text-lg font-bold leading-none">+</span>
        </button>
        <button
          onClick={() => {
            map.zoomOut();
            onZoomOut();
          }}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-spf-edge bg-spf-charcoal/90 text-white shadow-spf-soft backdrop-blur transition hover:bg-spf-graphite hover:text-spf-yellow"
          title="Zoom out"
        >
          <span className="text-lg font-bold leading-none">−</span>
        </button>
      </div>
    </>
  );
}

interface ParkingMapProps {
  parkings: ParkingFacility[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  userLocation: { lat: number; lng: number } | null;
  flyTo: { lat: number; lng: number; zoom?: number } | null;
  fitBounds: [number, number][] | null;
  invalidateKey: number;
  popupContent: (p: ParkingFacility) => ReactNode;
  routeLine: [number, number][] | null;
}

export function ParkingMap({
  parkings,
  selectedId,
  onSelect,
  userLocation,
  flyTo,
  fitBounds,
  invalidateKey,
  popupContent,
  routeLine,
}: ParkingMapProps) {
  const mapRef = useRef<L.Map | null>(null);

  return (
    <MapContainer
      center={INDORE_CENTER}
      zoom={13}
      zoomControl={false}
      attributionControl={false}
      className="h-full w-full"
      ref={(m) => {
        if (m) mapRef.current = m;
      }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />

      <MapController flyTo={flyTo} fitBounds={fitBounds} invalidateKey={invalidateKey} />

      <ZoomButtons onZoomIn={() => {}} onZoomOut={() => {}} />

      {parkings.map((p) => (
        <Marker
          key={p.id}
          position={[p.latitude, p.longitude]}
          icon={createParkingIcon(p.availableSpaces, p.totalSpaces, p.id === selectedId)}
          eventHandlers={{
            click: () => onSelect(p.id),
          }}
        >
          <PopupAdapter parking={p} onSelect={onSelect} content={popupContent} />
        </Marker>
      ))}

      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={createUserIcon()} />
      )}

      {routeLine && routeLine.length >= 2 && (
        <Polyline positions={routeLine} pathOptions={{ color: '#F5C518', weight: 4, opacity: 0.7, dashArray: '8 8' }} />
      )}
    </MapContainer>
  );
}

function PopupAdapter({
  parking,

  onSelect,
  content,
}: {
  parking: ParkingFacility;

  onSelect: (id: string) => void;
  content: (p: ParkingFacility) => ReactNode;
}) {
  const map = useMap();
  return (
    <Popup eventHandlers={{ add: () => onSelect(parking.id) }}>
      <div onClick={() => map.panTo([parking.latitude, parking.longitude])}>
        {content(parking)}
      </div>
    </Popup>
  );
}

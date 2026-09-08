import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useParking } from '../ParkingContext';
import { useNav } from '../NavContext';
import { ParkingMap } from '../components/ParkingMap';
import { ParkingCard } from '../components/ParkingCard';
import { DirectionsModal } from '../components/DirectionsModal';
import {
  Search,
  LocateFixed,
  Maximize2,
  Home as HomeIcon,
  Zap,
  Accessibility,
  Camera,
  Clock,
  X,
  Star,
  MapPin,
  Navigation,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import type { ParkingFacility, FilterKey } from '../types';
import { INDORE_CENTER } from '../types';
import { haversine, formatDistance, getOccupancyStatus, statusLabel, statusBg } from '../utils';

const FILTERS: { key: FilterKey; label: string; icon?: typeof Zap }[] = [
  { key: 'nearest', label: 'Nearest' },
  { key: 'available', label: 'Available' },
  { key: 'ev', label: 'EV', icon: Zap },
  { key: 'pwd', label: 'PWD', icon: Accessibility },
  { key: '247', label: '24/7', icon: Clock },
  { key: 'cctv', label: 'CCTV', icon: Camera },
  { key: 'lowest', label: 'Lowest Price' },
  { key: 'toprated', label: 'Top Rated' },
];

export function Explore() {
  const { parkings, userLocation, setUserLocation, addToast } = useParking();
  const { navigate } = useNav();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<FilterKey>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);
  const [fitBounds, setFitBounds] = useState<[number, number][] | null>(null);
  const [invalidateKey, setInvalidateKey] = useState(0);
  const [directionsParking, setDirectionsParking] = useState<ParkingFacility | null>(null);
  const [locating, setLocating] = useState(false);

  const cardRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

  // Calculate distances
  const userLat = userLocation?.lat ?? INDORE_CENTER[0];
  const userLng = userLocation?.lng ?? INDORE_CENTER[1];

  const parkingsWithDist = useMemo(() => {
    return parkings.map((p) => ({
      ...p,
      distance: haversine(userLat, userLng, p.latitude, p.longitude),
    }));
  }, [parkings, userLat, userLng]);

  // Apply filters
  const filteredParkings = useMemo(() => {
    let result = [...parkingsWithDist];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.area.toLowerCase().includes(q),
      );
    }

    // Filters
    const has = (k: FilterKey) => activeFilters.has(k);
    if (has('ev')) result = result.filter((p) => p.evSpacesAvailable > 0);
    if (has('pwd')) result = result.filter((p) => p.pwdSpacesAvailable > 0);
    if (has('247')) result = result.filter((p) => p.open24Hours);
    if (has('cctv')) result = result.filter((p) => p.securityCamera);
    if (has('available')) result = result.filter((p) => p.availableSpaces > 0);

    if (has('lowest')) result.sort((a, b) => a.pricePerHour - b.pricePerHour);
    else if (has('toprated')) result.sort((a, b) => b.rating - a.rating);
    else result.sort((a, b) => a.distance - b.distance);

    return result;
  }, [parkingsWithDist, activeFilters, searchQuery]);

  const selectedParking = parkingsWithDist.find((p) => p.id === selectedId) ?? null;

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const handleCardClick = useCallback(
    (id: string) => {
      const p = parkingsWithDist.find((x) => x.id === id);
      if (p) {
        setSelectedId(id);
        setFlyTo({ lat: p.latitude, lng: p.longitude, zoom: 15 });
      }
    },
    [parkingsWithDist],
  );

  // Scroll card into view when selected from marker
  useEffect(() => {
    if (selectedId) {
      const el = cardRefs.current.get(selectedId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [selectedId]);

  const toggleFilter = (key: FilterKey) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const clearFilters = () => setActiveFilters(new Set());

  const handleLocate = () => {
    if (!navigator.geolocation) {
      addToast('Geolocation not supported — showing central Indore.', 'info');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setFlyTo({ lat: loc.lat, lng: loc.lng, zoom: 15 });
        setLocating(false);
        addToast('Location found — recalculating distances.', 'info');
      },
      () => {
        setLocating(false);
        addToast('Location permission denied — showing central Indore.', 'info');
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const handleViewAll = () => {
    const pts = filteredParkings.map((p) => [p.latitude, p.longitude] as [number, number]);
    if (pts.length > 0) {
      setFitBounds(null);
      setTimeout(() => setFitBounds(pts), 50);
    }
  };

  const handleIndore = () => {
    setFlyTo({ lat: INDORE_CENTER[0], lng: INDORE_CENTER[1], zoom: 13 });
  };

  const handleSearchSelect = (p: ParkingFacility) => {
    setSelectedId(p.id);
    setFlyTo({ lat: p.latitude, lng: p.longitude, zoom: 15 });
  };

  // Invalidate map on resize
  useEffect(() => {
    const handler = () => setInvalidateKey((k) => k + 1);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const popupContent = (p: ParkingFacility) => (
    <div className="w-[220px] rounded-xl border border-spf-edge bg-spf-charcoal p-3.5 shadow-spf-float">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-white">{p.name}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-white/50">
            <MapPin className="h-3 w-3" /> {p.area}, Indore
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Star className="h-3 w-3 text-spf-yellow" />
          <span className="text-xs font-semibold text-white/70">{p.rating}</span>
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-2xl font-black text-spf-yellow">{p.availableSpaces}</span>
        <span className="text-xs text-white/50">spaces available</span>
      </div>
      <p className="text-xs text-white/40">
        {p.totalSpaces - p.availableSpaces} / {p.totalSpaces} occupied
      </p>

      <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-xs">
        <span className="flex items-center gap-1 text-spf-yellow">
          <Zap className="h-3 w-3" /> {p.evChargersAvailable}/{p.evChargersTotal} chargers
        </span>
        <span className="flex items-center gap-1 text-spf-blue-bright">
          <Accessibility className="h-3 w-3" /> {p.pwdSpacesAvailable}/{p.pwdSpacesTotal}
        </span>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/50">
        {p.securityCamera && (
          <span className="flex items-center gap-1">
            <Camera className="h-3 w-3" /> CCTV
          </span>
        )}
        {p.open24Hours && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> 24/7
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-spf-edge pt-2.5">
        <div>
          <span className="text-sm font-bold text-white">₹{p.pricePerHour}</span>
          <span className="text-xs text-white/40">/hr</span>
        </div>
        <span className="text-xs text-white/50">{p.distance > 0 ? formatDistance(p.distance) : ''}</span>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setDirectionsParking(p);
          }}
          className="flex-1 rounded-lg border border-spf-edge bg-spf-graphite py-2 text-xs font-semibold text-white/80 transition hover:bg-spf-slate"
        >
          Directions
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate('details', p.id);
          }}
          className="flex-1 rounded-lg bg-spf-yellow py-2 text-xs font-bold text-spf-ink transition hover:bg-spf-yellow-bright"
        >
          Reserve
        </button>
      </div>
    </div>
  );

  const mapParkings = filteredParkings;

  return (
    <div className="flex h-[calc(100dvh-64px)] min-h-0 flex-col overflow-hidden sm:h-[calc(100dvh-68px)]">
      {/* Desktop layout */}
      <div
        className="hidden min-h-0 flex-1 grid md:grid"
        style={{ gridTemplateColumns: 'minmax(0, 2.1fr) minmax(330px, 0.95fr)' }}
      >
        {/* Map area */}
        <div className="relative min-h-0 overflow-hidden">
          {/* Search overlay */}
          <div className="absolute left-3 top-3 z-[1100] w-[calc(100%-1.5rem)] max-w-md">
            <div className="flex items-center gap-2 rounded-xl border border-spf-edge bg-spf-charcoal/95 px-3.5 py-2.5 shadow-spf-float backdrop-blur-xl">
              <Search className="h-4 w-4 shrink-0 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search parking or area in Indore..."
                className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-white/40 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Search suggestions */}
            {searchQuery.trim() && (
              <div className="mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-spf-edge bg-spf-charcoal/95 shadow-spf-float backdrop-blur-xl scrollbar-thin">
                {parkingsWithDist
                  .filter(
                    (p) =>
                      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      p.area.toLowerCase().includes(searchQuery.toLowerCase()),
                  )
                  .slice(0, 6)
                  .map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        handleSearchSelect(p);
                        setSearchQuery('');
                      }}
                      className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left transition hover:bg-spf-graphite"
                    >
                      <MapPin className="h-4 w-4 shrink-0 text-spf-yellow" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">{p.name}</p>
                        <p className="truncate text-xs text-white/50">{p.area}</p>
                      </div>
                      <span className="text-xs text-spf-green">{p.availableSpaces} free</span>
                    </button>
                  ))}
              </div>
            )}

            {/* Filters */}
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {FILTERS.map((f) => {
                const Icon = f.icon;
                const active = activeFilters.has(f.key);
                return (
                  <button
                    key={f.key}
                    onClick={() => toggleFilter(f.key)}
                    className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                      active
                        ? 'border-spf-yellow bg-spf-yellow/15 text-spf-yellow'
                        : 'border-spf-edge bg-spf-charcoal/90 text-white/60 backdrop-blur hover:text-white'
                    }`}
                  >
                    {Icon && <Icon className="h-3 w-3" />}
                    {f.label}
                  </button>
                );
              })}
              {activeFilters.size > 0 && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 rounded-lg border border-spf-edge bg-spf-charcoal/90 px-2.5 py-1.5 text-xs font-semibold text-white/40 backdrop-blur hover:text-white"
                >
                  <X className="h-3 w-3" /> Clear
                </button>
              )}
            </div>
          </div>

          {/* Map controls (left bottom) */}
          <div className="absolute bottom-3 left-3 z-[1000] flex flex-col gap-1.5">
            <button
              onClick={handleLocate}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border shadow-spf-soft backdrop-blur transition ${
                locating
                  ? 'border-spf-blue/40 bg-spf-blue/10 text-spf-blue-bright'
                  : userLocation
                    ? 'border-spf-blue/40 bg-spf-charcoal/90 text-spf-blue-bright'
                    : 'border-spf-edge bg-spf-charcoal/90 text-white/70 hover:text-white'
              }`}
              title="Locate Me"
            >
              <LocateFixed className={`h-4 w-4 ${locating ? 'animate-pulse' : ''}`} />
            </button>
            <button
              onClick={handleViewAll}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-spf-edge bg-spf-charcoal/90 text-white/70 shadow-spf-soft backdrop-blur transition hover:text-spf-yellow"
              title="View All"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            <button
              onClick={handleIndore}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-spf-edge bg-spf-charcoal/90 text-white/70 shadow-spf-soft backdrop-blur transition hover:text-spf-yellow"
              title="Indore"
            >
              <HomeIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Demo indicator */}
          <div className="absolute bottom-3 right-3 z-[1000] hidden items-center gap-1.5 rounded-lg border border-spf-edge bg-spf-charcoal/90 px-2.5 py-1.5 text-[10px] font-medium text-white/40 backdrop-blur lg:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-spf-green" />
            Prototype · Simulated live occupancy
          </div>

          <ParkingMap
            parkings={mapParkings}
            selectedId={selectedId}
            onSelect={handleSelect}
            userLocation={userLocation}
            flyTo={flyTo}
            fitBounds={fitBounds}
            invalidateKey={invalidateKey}
            popupContent={popupContent}
            routeLine={null}
          />
        </div>

        {/* Results panel */}
        <div className="flex min-h-0 flex-col border-l border-spf-edge bg-spf-ink">
          <div className="shrink-0 border-b border-spf-edge px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Parking Near You</h2>
                <p className="text-xs text-white/50">Live availability · Indore</p>
              </div>
              <span className="rounded-md bg-spf-graphite px-2.5 py-1 text-xs font-semibold text-white/60">
                {filteredParkings.length} locations
              </span>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 scrollbar-thin">
            <div className="space-y-2.5">
              {filteredParkings.map((p) => (
                <ParkingCard
                  key={p.id}
                  parking={p}
                  selected={p.id === selectedId}
                  onClick={() => handleCardClick(p.id)}
                  onReserve={() => navigate('details', p.id)}
                  onDetails={() => navigate('details', p.id)}
                  cardRef={(el) => cardRefs.current.set(p.id, el)}
                />
              ))}
              {filteredParkings.length === 0 && (
                <div className="py-12 text-center">
                  <Search className="mx-auto h-8 w-8 text-white/20" />
                  <p className="mt-2 text-sm text-white/40">No parking matches your filters</p>
                  <button
                    onClick={clearFilters}
                    className="mt-3 text-xs font-semibold text-spf-yellow hover:underline"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile layout */}
      <div className="flex min-h-0 flex-1 flex-col md:hidden">
        <div className="relative min-h-0 flex-1 overflow-hidden">
          {/* Mobile search */}
          <div className="absolute left-2.5 top-2.5 z-[1100] w-[calc(100%-1.25rem)]">
            <div className="flex items-center gap-2 rounded-xl border border-spf-edge bg-spf-charcoal/95 px-3 py-2 shadow-spf-float backdrop-blur-xl">
              <Search className="h-4 w-4 shrink-0 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search parking in Indore..."
                className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-white/40">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Mobile filters */}
            <div className="mt-1.5 flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {FILTERS.map((f) => {
                const Icon = f.icon;
                const active = activeFilters.has(f.key);
                return (
                  <button
                    key={f.key}
                    onClick={() => toggleFilter(f.key)}
                    className={`flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                      active
                        ? 'border-spf-yellow bg-spf-yellow/15 text-spf-yellow'
                        : 'border-spf-edge bg-spf-charcoal/90 text-white/60 backdrop-blur'
                    }`}
                  >
                    {Icon && <Icon className="h-3 w-3" />}
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile controls */}
          <div className="absolute bottom-2.5 left-2.5 z-[1000] flex flex-col gap-1.5">
            <button
              onClick={handleLocate}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border shadow-spf-soft backdrop-blur transition ${
                userLocation
                  ? 'border-spf-blue/40 bg-spf-charcoal/90 text-spf-blue-bright'
                  : 'border-spf-edge bg-spf-charcoal/90 text-white/70'
              }`}
            >
              <LocateFixed className={`h-4 w-4 ${locating ? 'animate-pulse' : ''}`} />
            </button>
            <button
              onClick={handleViewAll}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-spf-edge bg-spf-charcoal/90 text-white/70 shadow-spf-soft backdrop-blur"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>

          <ParkingMap
            parkings={mapParkings}
            selectedId={selectedId}
            onSelect={handleSelect}
            userLocation={userLocation}
            flyTo={flyTo}
            fitBounds={fitBounds}
            invalidateKey={invalidateKey}
            popupContent={popupContent}
            routeLine={null}
          />
        </div>

        {/* Mobile bottom sheet results */}
        <div className="flex max-h-[42%] min-h-0 flex-col border-t border-spf-edge bg-spf-ink">
          <div className="flex shrink-0 items-center justify-between px-4 py-2.5">
            <h2 className="text-sm font-bold text-white">Parking Near You</h2>
            <span className="rounded-md bg-spf-graphite px-2 py-0.5 text-xs font-semibold text-white/60">
              {filteredParkings.length}
            </span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 scrollbar-thin">
            <div className="space-y-2">
              {filteredParkings.slice(0, 6).map((p) => (
                <ParkingCard
                  key={p.id}
                  parking={p}
                  selected={p.id === selectedId}
                  onClick={() => handleCardClick(p.id)}
                  onReserve={() => navigate('details', p.id)}
                  onDetails={() => navigate('details', p.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {directionsParking && (
        <DirectionsModal parking={directionsParking} onClose={() => setDirectionsParking(null)} />
      )}
    </div>
  );
}

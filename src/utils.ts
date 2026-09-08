export function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

export function formatTimeShort(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDuration(min: number): string {
  if (min < 60) return `${Math.round(min)}m`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function formatDurationFromMs(ms: number): string {
  return formatDuration(ms / 60000);
}

export function formatCurrency(n: number): string {
  return `₹${n.toLocaleString('en-IN')}`;
}

export function getOccupancyStatus(available: number, total: number): 'available' | 'filling' | 'full' {
  const pct = total === 0 ? 0 : (total - available) / total;
  if (pct > 0.9) return 'full';
  if (pct >= 0.65) return 'filling';
  return 'available';
}

export function statusLabel(status: 'available' | 'filling' | 'full'): string {
  if (status === 'available') return 'Available';
  if (status === 'filling') return 'Filling Fast';
  return 'Almost Full';
}

export function statusColor(status: 'available' | 'filling' | 'full'): string {
  if (status === 'available') return 'text-spf-green';
  if (status === 'filling') return 'text-spf-amber';
  return 'text-spf-red';
}

export function statusBg(status: 'available' | 'filling' | 'full'): string {
  if (status === 'available') return 'bg-spf-green';
  if (status === 'filling') return 'bg-spf-amber';
  return 'bg-spf-red';
}

export function generateBookingId(): string {
  return `SPF-IND-${Math.floor(80000 + Math.random() * 19999)}`;
}

export function generateSlot(category: 'Standard' | 'PWD', ev: boolean): string {
  if (ev) return `EV-${String(Math.floor(Math.random() * 8) + 1).padStart(2, '0')}`;
  if (category === 'PWD') return `PWD-${String(Math.floor(Math.random() * 5) + 1).padStart(2, '0')}`;
  const row = String.fromCharCode(65 + Math.floor(Math.random() * 3));
  const num = String(Math.floor(Math.random() * 40) + 1).padStart(2, '0');
  return `${row}-${num}`;
}

export function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

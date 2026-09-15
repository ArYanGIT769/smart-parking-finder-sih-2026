import type { ParkingFacility, ChargerSlot, PwdSpace, ActiveVehicle, MovementRecord, Transaction } from '../types';

function makeChargers(total: number, available: number): ChargerSlot[] {
  const arr: ChargerSlot[] = Array.from({ length: total }, (_, i) => ({
    id: `C${i + 1}`,
    status: 'Available',
  }));
  const occupied = total - available;
  for (let i = 0; i < occupied; i++) {
    arr[i].status = i % 2 === 0 ? 'Charging' : 'Reserved';
    if (arr[i].status === 'Charging') arr[i].vehicle = `MP09 EV ${4000 + i * 7}`;
  }
  return arr;
}

function makePwdSpaces(total: number, available: number): PwdSpace[] {
  const arr: PwdSpace[] = Array.from({ length: total }, (_, i) => ({
    id: `PWD-${String(i + 1).padStart(2, '0')}`,
    status: 'Available',
  }));
  const used = total - available;
  for (let i = 0; i < used; i++) {
    arr[i].status = i === 0 ? 'Occupied' : 'Reserved';
  }
  return arr;
}

// Stable mock occupancy trends (8am -> 8pm)
const TREND_TODAY = [12, 28, 48, 62, 71, 65, 58, 44, 34, 26, 22, 20];
const REVENUE_TODAY = [420, 980, 1850, 2600, 3120, 2980, 2520, 1960, 1480, 1120, 920, 8520];

interface Seed {
  id: string;
  name: string;
  area: string;
  lat: number;
  lng: number;
  total: number;
  available: number;
  evTotal: number;
  evAvail: number;
  chargersTotal: number;
  chargersAvail: number;
  pwdTotal: number;
  pwdAvail: number;
  reserved: number;
  activeRes: number;
  price: number;
  rating: number;
  cctv: boolean;
  open24: boolean;
  covered: boolean;
  entered: number;
  exited: number;
  revenue: number;
  activeCount: number;
}

const seeds: Seed[] = [
  { id: 'vijay-nagar', name: 'Vijay Nagar Smart Parking', area: 'Vijay Nagar', lat: 22.7272, lng: 75.8865, total: 120, available: 38, evTotal: 8, evAvail: 4, chargersTotal: 6, chargersAvail: 3, pwdTotal: 5, pwdAvail: 3, reserved: 8, activeRes: 2, price: 30, rating: 4.6, cctv: true, open24: true, covered: true, entered: 284, exited: 202, revenue: 8520, activeCount: 4 },
  { id: 'palasia', name: 'Palasia Parking Plaza', area: 'Palasia', lat: 22.7254, lng: 75.8643, total: 80, available: 12, evTotal: 6, evAvail: 2, chargersTotal: 4, chargersAvail: 1, pwdTotal: 4, pwdAvail: 1, reserved: 6, activeRes: 1, price: 25, rating: 4.3, cctv: true, open24: true, covered: false, entered: 198, exited: 150, revenue: 5240, activeCount: 2 },
  { id: 'sgsits', name: 'SGSITS Vallabh Nagar Parking', area: 'Vallabh Nagar', lat: 22.7012, lng: 75.8668, total: 60, available: 22, evTotal: 4, evAvail: 3, chargersTotal: 3, chargersAvail: 2, pwdTotal: 3, pwdAvail: 2, reserved: 4, activeRes: 0, price: 20, rating: 4.1, cctv: true, open24: false, covered: false, entered: 142, exited: 110, revenue: 2840, activeCount: 2 },
  { id: 'rajwada', name: 'Rajwada Heritage Parking', area: 'Rajwada', lat: 22.7192, lng: 75.8335, total: 45, available: 7, evTotal: 2, evAvail: 0, chargersTotal: 2, chargersAvail: 0, pwdTotal: 3, pwdAvail: 1, reserved: 3, activeRes: 1, price: 35, rating: 4.4, cctv: true, open24: false, covered: false, entered: 96, exited: 78, revenue: 3360, activeCount: 1 },
  { id: 'treasure-island', name: 'Treasure Island Mall Parking', area: 'MG Road', lat: 22.7245, lng: 75.8472, total: 150, available: 54, evTotal: 10, evAvail: 5, chargersTotal: 8, chargersAvail: 4, pwdTotal: 6, pwdAvail: 4, reserved: 10, activeRes: 3, price: 40, rating: 4.7, cctv: true, open24: true, covered: true, entered: 342, exited: 270, revenue: 13680, activeCount: 5 },
  { id: 'geeta-bhawan', name: 'Geeta Bhawan Parking', area: 'Geeta Bhawan', lat: 22.7142, lng: 75.8532, total: 50, available: 18, evTotal: 3, evAvail: 2, chargersTotal: 2, chargersAvail: 1, pwdTotal: 3, pwdAvail: 2, reserved: 3, activeRes: 0, price: 20, rating: 4.0, cctv: false, open24: false, covered: false, entered: 88, exited: 64, revenue: 1760, activeCount: 2 },
  { id: 'bhawarkua', name: 'Bhawarkua Main Road Parking', area: 'Bhawarkua', lat: 22.7088, lng: 75.8589, total: 70, available: 25, evTotal: 4, evAvail: 3, chargersTotal: 3, chargersAvail: 2, pwdTotal: 4, pwdAvail: 3, reserved: 5, activeRes: 1, price: 25, rating: 4.2, cctv: true, open24: true, covered: false, entered: 156, exited: 120, revenue: 3800, activeCount: 3 },
  { id: 'scheme-54', name: 'Scheme 54 Community Parking', area: 'Scheme 54', lat: 22.7308, lng: 75.8912, total: 65, available: 31, evTotal: 5, evAvail: 4, chargersTotal: 4, chargersAvail: 3, pwdTotal: 4, pwdAvail: 3, reserved: 4, activeRes: 0, price: 20, rating: 4.3, cctv: true, open24: false, covered: false, entered: 112, exited: 88, revenue: 2240, activeCount: 3 },
  { id: 'ab-road', name: 'AB Road Commercial Parking', area: 'AB Road', lat: 22.7175, lng: 75.8756, total: 90, available: 15, evTotal: 6, evAvail: 2, chargersTotal: 4, chargersAvail: 2, pwdTotal: 4, pwdAvail: 2, reserved: 6, activeRes: 2, price: 30, rating: 4.4, cctv: true, open24: true, covered: true, entered: 210, exited: 168, revenue: 6720, activeCount: 3 },
  { id: 'meghdoot', name: 'Meghdoot Garden Parking', area: 'Meghdoot Garden', lat: 22.7335, lng: 75.8782, total: 40, available: 16, evTotal: 2, evAvail: 2, chargersTotal: 2, chargersAvail: 2, pwdTotal: 2, pwdAvail: 2, reserved: 2, activeRes: 0, price: 15, rating: 4.1, cctv: false, open24: false, covered: false, entered: 64, exited: 48, revenue: 960, activeCount: 2 },
  { id: 'railway', name: 'Railway Station Parking', area: 'Station Road', lat: 22.7182, lng: 75.8722, total: 100, available: 8, evTotal: 4, evAvail: 1, chargersTotal: 3, chargersAvail: 1, pwdTotal: 5, pwdAvail: 2, reserved: 7, activeRes: 3, price: 25, rating: 3.9, cctv: true, open24: true, covered: true, entered: 320, exited: 260, revenue: 8000, activeCount: 2 },
  { id: 'c21', name: 'C21 Mall Parking', area: 'Vijay Nagar', lat: 22.7298, lng: 75.8828, total: 110, available: 42, evTotal: 8, evAvail: 4, chargersTotal: 6, chargersAvail: 3, pwdTotal: 5, pwdAvail: 4, reserved: 8, activeRes: 1, price: 35, rating: 4.5, cctv: true, open24: true, covered: true, entered: 260, exited: 208, revenue: 9100, activeCount: 4 },
];

const PLATE_LETTERS = ['AB', 'CD', 'EF', 'GH', 'JK', 'KL', 'MN', 'PQ', 'RS', 'TU', 'VW', 'XY', 'ZF', 'EV'];
const VEHICLE_TYPES: ('Sedan' | 'SUV' | 'Hatchback' | 'EV')[] = ['Sedan', 'SUV', 'Hatchback', 'EV'];

function randPlate(type?: 'Sedan' | 'SUV' | 'Hatchback' | 'EV'): string {
  const letters = type === 'EV' ? 'EV' : PLATE_LETTERS[Math.floor(Math.random() * (PLATE_LETTERS.length - 1))];
  const num = String(1000 + Math.floor(Math.random() * 8999));
  return `MP09 ${letters} ${num}`;
}

function makeActiveVehicles(seed: Seed): ActiveVehicle[] {
  const vehicles: ActiveVehicle[] = [];
  const occupied = seed.total - seed.available;
  for (let i = 0; i < Math.min(seed.activeCount, occupied); i++) {
    const isEv = i < seed.evTotal - seed.evAvail;
    const isPwd = !isEv && i >= seed.activeCount - (seed.pwdTotal - seed.pwdAvail);
    const type = isEv ? 'EV' : VEHICLE_TYPES[Math.floor(Math.random() * 3)];
    const slot = isEv
      ? `EV-${String(i + 1).padStart(2, '0')}`
      : isPwd
        ? `PWD-${String(i + 1).padStart(2, '0')}`
        : `${String.fromCharCode(65 + (i % 3))}-${String(10 + i).padStart(2, '0')}`;
    const entryTime = Date.now() - Math.floor(Math.random() * 7200000);
    vehicles.push({
      id: `veh-${seed.id}-${i}`,
      registration: randPlate(type),
      type,
      slot,
      category: isPwd ? 'PWD' : 'Standard',
      entryTime,
      gate: 'Entry Gate 1',
      charging: isEv && i % 2 === 0,
      charger: isEv && i % 2 === 0 ? `C${(i % seed.chargersTotal) + 1}` : undefined,
    });
  }
  return vehicles;
}

function makeMovementHistory(seed: Seed): MovementRecord[] {
  const recs: MovementRecord[] = [];
  const now = Date.now();
  const types: ('Sedan' | 'SUV' | 'Hatchback' | 'EV')[] = ['Sedan', 'SUV', 'Hatchback', 'EV'];
  for (let i = 0; i < 8; i++) {
    const isEntry = i % 2 === 0;
    const type = types[Math.floor(Math.random() * 4)];
    const t = now - i * 3600000 - Math.floor(Math.random() * 1800000);
    recs.push({
      id: `mv-${seed.id}-${i}`,
      parkingId: seed.id,
      registration: randPlate(type),
      type,
      movement: isEntry ? 'ENTRY' : 'EXIT',
      time: t,
      gate: isEntry ? 'Entry Gate 1' : 'Exit Gate 1',
      slot: `${String.fromCharCode(65 + (i % 3))}-${String(10 + i).padStart(2, '0')}`,
      durationMin: isEntry ? undefined : Math.floor(Math.random() * 120) + 15,
      category: 'Standard',
    });
  }
  return recs;
}

function makeTransactions(seed: Seed): Transaction[] {
  const txns: Transaction[] = [];
  const now = Date.now();
  for (let i = 0; i < 6; i++) {
    const amount = seed.price * (Math.floor(Math.random() * 4) + 1);
    txns.push({
      id: `txn-${seed.id}-${i}`,
      parkingId: seed.id,
      bookingId: `SPF-IND-${80000 + Math.floor(Math.random() * 9999)}`,
      registration: randPlate(),
      slot: `${String.fromCharCode(65 + (i % 3))}-${String(10 + i).padStart(2, '0')}`,
      amount,
      status: i === 5 ? 'Refunded' : 'Paid',
      time: now - i * 5400000,
    });
  }
  return txns;
}

export function createInitialParkingData(): ParkingFacility[] {
  return seeds.map((s) => {
    
    return {
      id: s.id,
      name: s.name,
      area: s.area,
      latitude: s.lat,
      longitude: s.lng,
      totalSpaces: s.total,
      availableSpaces: s.available,
      standardSpacesTotal: s.total - s.evTotal - s.pwdTotal,
      standardSpacesAvailable: s.available - s.evAvail - s.pwdAvail,
      evSpacesTotal: s.evTotal,
      evSpacesAvailable: s.evAvail,
      evChargersTotal: s.chargersTotal,
      evChargersAvailable: s.chargersAvail,
      pwdSpacesTotal: s.pwdTotal,
      pwdSpacesAvailable: s.pwdAvail,
      reservedSpaces: s.reserved,
      activeReservations: s.activeRes,
      pricePerHour: s.price,
      rating: s.rating,
      securityCamera: s.cctv,
      open24Hours: s.open24,
      coveredParking: s.covered,
      distance: 0,
      lastUpdated: Date.now(),
      enteredToday: s.entered,
      exitedToday: s.exited,
      revenueToday: s.revenue,
      activeVehicles: makeActiveVehicles(s),
      movementHistory: makeMovementHistory(s),
      transactions: makeTransactions(s),
      chargers: makeChargers(s.chargersTotal, s.chargersAvail),
      pwdSpaces: makePwdSpaces(s.pwdTotal, s.pwdAvail),
      occupancyTrend: TREND_TODAY.slice(),
      revenueTrend: REVENUE_TODAY.slice(),
    };
  });
}

export const SEED_REVENUE_YESTERDAY = 7940;
export const SEED_REVENUE_WEEK = 49280;
export const SEED_REVENUE_MONTH = 182600;

export function generatePlate(type?: 'Sedan' | 'SUV' | 'Hatchback' | 'EV'): string {
  return randPlate(type);
}

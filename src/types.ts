export type VehicleType = 'Sedan' | 'SUV' | 'Hatchback' | 'EV';
export type ParkingCategory = 'Standard' | 'PWD';
export type MovementType = 'ENTRY' | 'EXIT';
export type BookingStatus = 'Active' | 'Completed' | 'Cancelled' | 'Refunded';
export type ViewName = 'home' | 'explore' | 'bookings' | 'owner' | 'details';

export interface ActiveVehicle {
  id: string;
  registration: string;
  type: VehicleType;
  slot: string;
  category: ParkingCategory;
  entryTime: number;
  gate: string;
  charging?: boolean;
  charger?: string;
  reserved?: boolean;
}

export interface MovementRecord {
  id: string;
  parkingId: string;
  registration: string;
  type: VehicleType;
  movement: MovementType;
  time: number;
  gate: string;
  slot: string;
  durationMin?: number;
  category: ParkingCategory;
  charging?: boolean;
  charger?: string;
}

export interface Transaction {
  id: string;
  parkingId: string;
  bookingId: string;
  registration: string;
  slot: string;
  amount: number;
  status: 'Paid' | 'Refunded';
  time: number;
}

export interface ChargerSlot {
  id: string;
  status: 'Available' | 'Charging' | 'Reserved';
  vehicle?: string;
}

export interface PwdSpace {
  id: string;
  status: 'Available' | 'Occupied' | 'Reserved';
}

export interface ParkingFacility {
  id: string;
  name: string;
  area: string;
  latitude: number;
  longitude: number;
  totalSpaces: number;
  availableSpaces: number;
  standardSpacesTotal: number;
  standardSpacesAvailable: number;
  evSpacesTotal: number;
  evSpacesAvailable: number;
  evChargersTotal: number;
  evChargersAvailable: number;
  pwdSpacesTotal: number;
  pwdSpacesAvailable: number;
  reservedSpaces: number;
  activeReservations: number;
  pricePerHour: number;
  rating: number;
  securityCamera: boolean;
  open24Hours: boolean;
  coveredParking: boolean;
  distance: number;
  lastUpdated: number;
  enteredToday: number;
  exitedToday: number;
  revenueToday: number;
  activeVehicles: ActiveVehicle[];
  movementHistory: MovementRecord[];
  transactions: Transaction[];
  chargers: ChargerSlot[];
  pwdSpaces: PwdSpace[];
  occupancyTrend: number[];
  revenueTrend: number[];
}

export interface Booking {
  id: string;
  parkingId: string;
  parkingName: string;
  area: string;
  registration: string;
  vehicleType: VehicleType;
  category: ParkingCategory;
  slot: string;
  durationHours: number;
  amount: number;
  status: BookingStatus;
  createdAt: number;
  entryTime: number;
  expiryTime: number;
  charging: boolean;
  charger?: string;
  latitude: number;
  longitude: number;
  pricePerHour: number;
  arrivalTime?: string;
}

export type FilterKey =
  | 'nearest'
  | 'available'
  | 'ev'
  | 'pwd'
  | '247'
  | 'cctv'
  | 'lowest'
  | 'toprated';

export type OccupancyStatus = 'available' | 'filling' | 'full';

export const INDORE_CENTER: [number, number] = [22.7196, 75.8577];

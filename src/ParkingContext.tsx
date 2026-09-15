import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type {
  ParkingFacility,
  Booking,
  ActiveVehicle,
  MovementRecord,
  Transaction,
  VehicleType,
  ParkingCategory,
} from './types';
import type { ToastMsg } from './toastTypes';
import { createInitialParkingData, generatePlate, SEED_REVENUE_WEEK, SEED_REVENUE_MONTH, SEED_REVENUE_YESTERDAY } from './data/parkingData';
import { uid, generateBookingId, generateSlot } from './utils';

const STORAGE_KEY = 'spf-state-v1';

interface PersistShape {
  parkings: ParkingFacility[];
  bookings: Booking[];
  demoMode: boolean;
  lastSimTime: number;
}

interface ParkingContextValue {
  parkings: ParkingFacility[];
  bookings: Booking[];
  demoMode: boolean;
  toasts: ToastMsg[];
  userLocation: { lat: number; lng: number } | null;
  setDemoMode: (v: boolean) => void;
  toggleDemoMode: () => void;
  setDemoParkingId: (id: string) => void;
  demoParkingId: string;
  setUserLocation: (loc: { lat: number; lng: number } | null) => void;
  addToast: (text: string, kind?: ToastMsg['kind']) => void;
  dismissToast: (id: string) => void;
  createBooking: (input: {
    parkingId: string;
    registration: string;
    vehicleType: VehicleType;
    category: ParkingCategory;
    durationHours: number;
    charging: boolean;
    arrivalTime?: string;
  }) => Booking;
  cancelBooking: (id: string) => void;
  getBooking: (id: string) => Booking | undefined;
  getParking: (id: string) => ParkingFacility | undefined;
  triggerManualEntry: (parkingId: string) => void;
  triggerManualExit: (parkingId: string) => void;
  revenueYesterday: number;
  revenueWeek: number;
  revenueMonth: number;
}

const ParkingContext = createContext<ParkingContextValue | null>(null);

export function useParking() {
  const ctx = useContext(ParkingContext);
  if (!ctx) throw new Error('useParking must be used within ParkingProvider');
  return ctx;
}

function loadState(): PersistShape | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistShape;
    if (!parsed.parkings || !Array.isArray(parsed.parkings)) return null;
    if (!parsed.bookings) parsed.bookings = [];
    // Migration: merge any missing fields from defaults
    const defaults = createInitialParkingData();
    parsed.parkings = parsed.parkings.map((p) => {
      const def = defaults.find((d) => d.id === p.id);
      if (!def) return p;
      return { ...def, ...p };
    });
    // Ensure all default facilities exist (handles new locations added later)
    for (const def of defaults) {
      if (!parsed.parkings.find((p) => p.id === def.id)) {
        parsed.parkings.push(def);
      }
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveState(state: PersistShape) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}



function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function ParkingProvider({ children }: { children: ReactNode }) {
  const [parkings, setParkings] = useState<ParkingFacility[]>(() => {
    const saved = loadState();
    return saved?.parkings ?? createInitialParkingData();
  });
  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = loadState();
    return saved?.bookings ?? [];
  });
  const [demoMode, setDemoModeState] = useState<boolean>(() => {
    const saved = loadState();
    return saved?.demoMode ?? false;
  });
  const [demoParkingId, setDemoParkingId] = useState<string>(() => parkings[0]?.id ?? 'vijay-nagar');
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const demoRef = useRef(demoMode);
  demoRef.current = demoMode;
  const demoParkingRef = useRef(demoParkingId);
  demoParkingRef.current = demoParkingId;

  // Persist
  useEffect(() => {
    saveState({ parkings, bookings, demoMode, lastSimTime: Date.now() });
  }, [parkings, bookings, demoMode]);

  const dismissToast = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const addToast = useCallback(
    (text: string, kind: ToastMsg['kind'] = 'info') => {
      const id = uid();
      setToasts((t) => [...t.slice(-4), { id, text, kind }]);
      setTimeout(() => dismissToast(id), 4200);
    },
    [dismissToast],
  );

  const setDemoMode = useCallback((v: boolean) => setDemoModeState(v), []);
  const toggleDemoMode = useCallback(() => setDemoModeState((v) => !v), []);

  // ---- Simulation: vehicle entry ----
  const simulateEntry = useCallback(
    (parkingId: string, opts?: { type?: VehicleType; isPwd?: boolean }) => {
      setParkings((prev) =>
        prev.map((p) => {
          if (p.id !== parkingId) return p;
          if (p.availableSpaces <= 0) return p;

          const type = opts?.type ?? (Math.random() < 0.18 ? 'EV' : pickRandom(['Sedan', 'SUV', 'Hatchback']));
          const isPwd = opts?.isPwd ?? (Math.random() < 0.12 && p.pwdSpacesAvailable > 0);
          const isEv = type === 'EV';

          // Determine slot
          let slot: string;
          let category: ParkingCategory = 'Standard';
          let charger: string | undefined;
          let charging = false;

          if (isPwd && p.pwdSpacesAvailable > 0) {
            category = 'PWD';
            const pwdSpace = p.pwdSpaces.find((s) => s.status === 'Available');
            slot = pwdSpace?.id ?? generateSlot('PWD', false);
          } else if (isEv && p.evSpacesAvailable > 0) {
            slot = `EV-${String(Math.floor(Math.random() * p.evSpacesTotal) + 1).padStart(2, '0')}`;
            const availCharger = p.chargers.find((c) => c.status === 'Available');
            if (availCharger && Math.random() < 0.7) {
              charger = availCharger.id;
              charging = true;
            }
          } else {
            slot = generateSlot('Standard', false);
          }

          const reg = generatePlate(type);
          const now = Date.now();
          const vehicle: ActiveVehicle = {
            id: uid(),
            registration: reg,
            type,
            slot,
            category,
            entryTime: now,
            gate: 'Entry Gate 1',
            charging,
            charger,
          };

          const movement: MovementRecord = {
            id: uid(),
            parkingId,
            registration: reg,
            type,
            movement: 'ENTRY',
            time: now,
            gate: 'Entry Gate 1',
            slot,
            category,
            charging,
            charger,
          };

          // Update counts
          let newPwdAvail = p.pwdSpacesAvailable;
          let newPwdSpaces = p.pwdSpaces;
          if (category === 'PWD') {
            newPwdAvail = p.pwdSpacesAvailable - 1;
            newPwdSpaces = p.pwdSpaces.map((s) =>
              s.id === slot ? { ...s, status: 'Occupied' } : s,
            );
          }

          let newEvAvail = p.evSpacesAvailable;
          if (isEv) newEvAvail = p.evSpacesAvailable - 1;

          let newChargers = p.chargers;
          let newChargersAvail = p.evChargersAvailable;
          if (charger) {
            newChargersAvail = p.evChargersAvailable - 1;
            newChargers = p.chargers.map((c) =>
              c.id === charger ? { ...c, status: 'Charging', vehicle: reg } : c,
            );
          }

          const newStdAvail = category === 'Standard' && !isEv ? p.standardSpacesAvailable - 1 : p.standardSpacesAvailable;

          addToast(`${reg} entered ${p.name} • ${slot} assigned`, isEv ? 'ev' : 'entry');

          return {
            ...p,
            availableSpaces: p.availableSpaces - 1,
            standardSpacesAvailable: newStdAvail,
            evSpacesAvailable: newEvAvail,
            pwdSpacesAvailable: newPwdAvail,
            evChargersAvailable: newChargersAvail,
            enteredToday: p.enteredToday + 1,
            lastUpdated: now,
            activeVehicles: [vehicle, ...p.activeVehicles],
            movementHistory: [movement, ...p.movementHistory].slice(0, 100),
            chargers: newChargers,
            pwdSpaces: newPwdSpaces,
            occupancyTrend: p.occupancyTrend.map((v, i) =>
              i === p.occupancyTrend.length - 1
                ? Math.round(((p.totalSpaces - (p.availableSpaces - 1)) / p.totalSpaces) * 100)
                : v,
            ),
          };
        }),
      );
    },
    [addToast],
  );

  // ---- Simulation: vehicle exit (MUST pick an actually parked vehicle) ----
  const simulateExit = useCallback(
    (parkingId: string) => {
      setParkings((prev) =>
        prev.map((p) => {
          if (p.id !== parkingId) return p;
          if (p.activeVehicles.length === 0) return p;

          // Pick the vehicle that's been parked longest (or random)
          const exiting = p.activeVehicles[p.activeVehicles.length - 1];
          const now = Date.now();
          const durationMin = Math.round((now - exiting.entryTime) / 60000);

          const movement: MovementRecord = {
            id: uid(),
            parkingId,
            registration: exiting.registration,
            type: exiting.type,
            movement: 'EXIT',
            time: now,
            gate: 'Exit Gate 1',
            slot: exiting.slot,
            durationMin,
            category: exiting.category,
            charging: exiting.charging,
            charger: exiting.charger,
          };

          // Release resources
          let newPwdSpaces = p.pwdSpaces;
          let newPwdAvail = p.pwdSpacesAvailable;
          if (exiting.category === 'PWD') {
            newPwdAvail = p.pwdSpacesAvailable + 1;
            newPwdSpaces = p.pwdSpaces.map((s) =>
              s.id === exiting.slot ? { ...s, status: 'Available' } : s,
            );
          }

          let newEvAvail = p.evSpacesAvailable;
          if (exiting.type === 'EV') newEvAvail = p.evSpacesAvailable + 1;

          let newChargers = p.chargers;
          let newChargersAvail = p.evChargersAvailable;
          if (exiting.charger) {
            newChargersAvail = p.evChargersAvailable + 1;
            newChargers = p.chargers.map((c) =>
              c.id === exiting.charger ? { ...c, status: 'Available', vehicle: undefined } : c,
            );
          }

          const newStdAvail =
            exiting.category === 'Standard' && exiting.type !== 'EV'
              ? p.standardSpacesAvailable + 1
              : p.standardSpacesAvailable;

          const isEv = exiting.type === 'EV';
          addToast(
            isEv
              ? `${exiting.registration} exited ${p.name} • ${exiting.slot} released${exiting.charger ? ` • ${exiting.charger} available` : ''}`
              : `${exiting.registration} exited ${p.name} • ${exiting.slot} released`,
            'exit',
          );

          return {
            ...p,
            availableSpaces: p.availableSpaces + 1,
            standardSpacesAvailable: newStdAvail,
            evSpacesAvailable: newEvAvail,
            pwdSpacesAvailable: newPwdAvail,
            evChargersAvailable: newChargersAvail,
            exitedToday: p.exitedToday + 1,
            lastUpdated: now,
            activeVehicles: p.activeVehicles.filter((v) => v.id !== exiting.id),
            movementHistory: [movement, ...p.movementHistory].slice(0, 100),
            chargers: newChargers,
            pwdSpaces: newPwdSpaces,
            occupancyTrend: p.occupancyTrend.map((v, i) =>
              i === p.occupancyTrend.length - 1
                ? Math.round(((p.totalSpaces - (p.availableSpaces + 1)) / p.totalSpaces) * 100)
                : v,
            ),
          };
        }),
      );
    },
    [addToast],
  );

  const triggerManualEntry = useCallback(
    (pid: string) => simulateEntry(pid),
    [simulateEntry],
  );
  const triggerManualExit = useCallback(
    (pid: string) => simulateExit(pid),
    [simulateExit],
  );

  // ---- Demo mode interval (randomly selects a facility) ----
  useEffect(() => {
    if (!demoMode) return;
    const interval = setInterval(() => {
      setParkings((prev) => {
        // Find all facilities that can receive an event
        const canEnter = prev.filter((p) => p.availableSpaces > 0);
        const canExit = prev.filter((p) => p.activeVehicles.length > 0);

        // Decide entry vs exit
        const wantExit = canExit.length > 0 && Math.random() < 0.45;
        if (wantExit) {
          const target = pickRandom(canExit);
          simulateExit(target.id);
        } else if (canEnter.length > 0) {
          const target = pickRandom(canEnter);
          simulateEntry(target.id);
        }
        return prev;
      });
    }, 9000);
    return () => clearInterval(interval);
  }, [demoMode, simulateEntry, simulateExit]);

  // ---- Booking creation ----
  const createBooking = useCallback<ParkingContextValue['createBooking']>(
    (input) => {
      const parking = parkings.find((p) => p.id === input.parkingId);
      if (!parking) throw new Error('Parking not found');

      const isEv = input.vehicleType === 'EV';
      const slot = generateSlot(input.category, isEv && input.charging);
      const amount = parking.pricePerHour * input.durationHours;
      const bookingId = generateBookingId();
      const now = Date.now();

      let charger: string | undefined;
      if (isEv && input.charging) {
        const avail = parking.chargers.find((c) => c.status === 'Available');
        charger = avail?.id;
      }

      const booking: Booking = {
        id: bookingId,
        parkingId: input.parkingId,
        parkingName: parking.name,
        area: parking.area,
        registration: input.registration.toUpperCase(),
        vehicleType: input.vehicleType,
        category: input.category,
        slot,
        durationHours: input.durationHours,
        amount,
        status: 'Active',
        createdAt: now,
        entryTime: now,
        expiryTime: now + input.durationHours * 3600000,
        charging: isEv && input.charging,
        charger,
        latitude: parking.latitude,
        longitude: parking.longitude,
        pricePerHour: parking.pricePerHour,
        arrivalTime: input.arrivalTime,
      };

      // Update parking: decrease availability
      setParkings((prev) =>
        prev.map((p) => {
          if (p.id !== input.parkingId) return p;
          const isEvBooking = input.vehicleType === 'EV';
          const isPwdBooking = input.category === 'PWD';

          let newStdAvail = p.standardSpacesAvailable;
          let newEvAvail = p.evSpacesAvailable;
          let newPwdAvail = p.pwdSpacesAvailable;
          let newChargersAvail = p.evChargersAvailable;
          let newPwdSpaces = p.pwdSpaces;
          let newChargers = p.chargers;

          if (isPwdBooking) {
            newPwdAvail = Math.max(0, p.pwdSpacesAvailable - 1);
            newPwdSpaces = p.pwdSpaces.map((s) =>
              s.id === slot ? { ...s, status: 'Reserved' } : s,
            );
          } else if (isEvBooking) {
            newEvAvail = Math.max(0, p.evSpacesAvailable - 1);
            if (charger) {
              newChargersAvail = Math.max(0, p.evChargersAvailable - 1);
              newChargers = p.chargers.map((c) =>
                c.id === charger ? { ...c, status: 'Reserved' } : c,
              );
            }
          } else {
            newStdAvail = Math.max(0, p.standardSpacesAvailable - 1);
          }

          const txn: Transaction = {
            id: uid(),
            parkingId: p.id,
            bookingId,
            registration: booking.registration,
            slot,
            amount,
            status: 'Paid',
            time: now,
          };

          return {
            ...p,
            availableSpaces: Math.max(0, p.availableSpaces - 1),
            standardSpacesAvailable: newStdAvail,
            evSpacesAvailable: newEvAvail,
            pwdSpacesAvailable: newPwdAvail,
            evChargersAvailable: newChargersAvail,
            reservedSpaces: p.reservedSpaces + 1,
            activeReservations: p.activeReservations + 1,
            revenueToday: p.revenueToday + amount,
            pwdSpaces: newPwdSpaces,
            chargers: newChargers,
            transactions: [txn, ...p.transactions].slice(0, 50),
          };
        }),
      );

      setBookings((b) => [booking, ...b]);
      addToast('Parking reserved successfully', 'booking');
      return booking;
    },
    [parkings, addToast],
  );

  // ---- Booking cancellation ----
  const cancelBooking = useCallback<ParkingContextValue['cancelBooking']>(
    (id) => {
      const booking = bookings.find((b) => b.id === id);
      if (!booking || booking.status === 'Cancelled' || booking.status === 'Refunded') return;

      setBookings((prev) =>
        prev.map((b) =>
          b.id === id ? { ...b, status: 'Refunded' } : b,
        ),
      );

      // Restore parking resources
      setParkings((prev) =>
        prev.map((p) => {
          if (p.id !== booking.parkingId) return p;
          const isEv = booking.vehicleType === 'EV';
          const isPwd = booking.category === 'PWD';

          let newStdAvail = p.standardSpacesAvailable;
          let newEvAvail = p.evSpacesAvailable;
          let newPwdAvail = p.pwdSpacesAvailable;
          let newChargersAvail = p.evChargersAvailable;
          let newPwdSpaces = p.pwdSpaces;
          let newChargers = p.chargers;

          if (isPwd) {
            newPwdAvail = p.pwdSpacesAvailable + 1;
            newPwdSpaces = p.pwdSpaces.map((s) =>
              s.id === booking.slot ? { ...s, status: 'Available' } : s,
            );
          } else if (isEv) {
            newEvAvail = p.evSpacesAvailable + 1;
            if (booking.charger) {
              newChargersAvail = p.evChargersAvailable + 1;
              newChargers = p.chargers.map((c) =>
                c.id === booking.charger ? { ...c, status: 'Available', vehicle: undefined } : c,
              );
            }
          } else {
            newStdAvail = p.standardSpacesAvailable + 1;
          }

          const txn: Transaction = {
            id: uid(),
            parkingId: p.id,
            bookingId: booking.id,
            registration: booking.registration,
            slot: booking.slot,
            amount: booking.amount,
            status: 'Refunded',
            time: Date.now(),
          };

          return {
            ...p,
            availableSpaces: p.availableSpaces + 1,
            standardSpacesAvailable: newStdAvail,
            evSpacesAvailable: newEvAvail,
            pwdSpacesAvailable: newPwdAvail,
            evChargersAvailable: newChargersAvail,
            reservedSpaces: Math.max(0, p.reservedSpaces - 1),
            activeReservations: Math.max(0, p.activeReservations - 1),
            revenueToday: Math.max(0, p.revenueToday - booking.amount),
            pwdSpaces: newPwdSpaces,
            chargers: newChargers,
            transactions: [txn, ...p.transactions].slice(0, 50),
          };
        }),
      );

      addToast(`Booking cancelled • ${booking.slot} released`, 'cancel');
    },
    [bookings, addToast],
  );

  const getBooking = useCallback((id: string) => bookings.find((b) => b.id === id), [bookings]);
  const getParking = useCallback((id: string) => parkings.find((p) => p.id === id), [parkings]);

  const value: ParkingContextValue = {
    parkings,
    bookings,
    demoMode,
    toasts,
    userLocation,
    setDemoMode,
    toggleDemoMode,
    setDemoParkingId,
    demoParkingId,
    setUserLocation,
    addToast,
    dismissToast,
    createBooking,
    cancelBooking,
    getBooking,
    getParking,
    triggerManualEntry,
    triggerManualExit,
    revenueYesterday: SEED_REVENUE_YESTERDAY,
    revenueWeek: SEED_REVENUE_WEEK,
    revenueMonth: SEED_REVENUE_MONTH,
  };

  return <ParkingContext.Provider value={value}>{children}</ParkingContext.Provider>;
}

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { ViewName } from './types';

interface NavState {
  view: ViewName;
  selectedParkingId: string | null;
  navigate: (view: ViewName, parkingId?: string | null) => void;
}

const NavContext = createContext<NavState | null>(null);

export function useNav() {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error('useNav must be used within NavProvider');
  return ctx;
}

export function NavProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<ViewName>('home');
  const [selectedParkingId, setSelectedParkingId] = useState<string | null>(null);

  const navigate = useCallback((v: ViewName, pid: string | null = null) => {
    setView(v);
    if (pid !== null) setSelectedParkingId(pid);
    window.scrollTo(0, 0);
  }, []);

  return (
    <NavContext.Provider value={{ view, selectedParkingId, navigate }}>
      {children}
    </NavContext.Provider>
  );
}

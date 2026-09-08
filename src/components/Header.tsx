import { useNav } from '../NavContext';
import { useParking } from '../ParkingContext';
import type { ViewName } from '../types';
import { ParkingCircle, Map, CalendarClock, LayoutDashboard, Radio } from 'lucide-react';

interface HeaderProps {
  compact?: boolean;
}

export function Header({ compact = false }: HeaderProps) {
  const { view, navigate } = useNav();
  const { demoMode, toggleDemoMode } = useParking();

  const navItems: { key: ViewName; label: string; icon: typeof Map }[] = [
    { key: 'home', label: 'Home', icon: ParkingCircle },
    { key: 'explore', label: 'Explore Indore', icon: Map },
    { key: 'bookings', label: 'Bookings', icon: CalendarClock },
    { key: 'owner', label: 'Owner Dashboard', icon: LayoutDashboard },
  ];

  return (
    <header
      className={`sticky top-0 z-[2000] flex items-center justify-between border-b border-spf-edge/60 bg-spf-ink/90 px-4 backdrop-blur-xl sm:px-6 ${
        compact ? 'h-[60px]' : 'h-[64px] sm:h-[68px]'
      }`}
    >
      {/* Logo */}
      <button
        onClick={() => navigate('home')}
        className="flex items-center gap-2.5 transition hover:opacity-90"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-spf-yellow">
          <span className="text-lg font-black text-spf-ink">P</span>
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-base font-extrabold tracking-tight text-white">SPF</span>
          <span className="hidden text-[10px] font-medium text-white/50 sm:block">
            Smart Parking Finder
          </span>
        </div>
      </button>

      {/* Nav */}
      <nav className="hidden items-center gap-1 md:flex">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = view === item.key;
          return (
            <button
              key={item.key}
              onClick={() => navigate(item.key)}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
                active
                  ? 'bg-spf-yellow/10 text-spf-yellow'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Demo toggle */}
      <button
        onClick={toggleDemoMode}
        className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
          demoMode
            ? 'border-spf-green/40 bg-spf-green/10 text-spf-green'
            : 'border-spf-edge bg-spf-graphite text-white/60 hover:text-white'
        }`}
      >
        <Radio className={`h-3.5 w-3.5 ${demoMode ? 'animate-pulse' : ''}`} />
        <span className="hidden sm:inline">DEMO</span>
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${demoMode ? 'bg-spf-green' : 'bg-white/30'}`} />
        <span className="hidden sm:inline">{demoMode ? 'LIVE' : 'OFF'}</span>
      </button>
    </header>
  );
}

export function MobileNav() {
  const { view, navigate } = useNav();
  const items: { key: ViewName; label: string; icon: typeof Map }[] = [
    { key: 'home', label: 'Home', icon: ParkingCircle },
    { key: 'explore', label: 'Explore', icon: Map },
    { key: 'bookings', label: 'Bookings', icon: CalendarClock },
    { key: 'owner', label: 'Owner', icon: LayoutDashboard },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[2000] flex items-center justify-around border-t border-spf-edge bg-spf-ink/95 px-2 py-2 backdrop-blur-xl md:hidden">
      {items.map((item) => {
        const Icon = item.icon;
        const active = view === item.key;
        return (
          <button
            key={item.key}
            onClick={() => navigate(item.key)}
            className={`flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-[10px] font-semibold transition ${
              active ? 'text-spf-yellow' : 'text-white/50'
            }`}
          >
            <Icon className="h-5 w-5" />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

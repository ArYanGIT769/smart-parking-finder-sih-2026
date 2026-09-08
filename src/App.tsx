import { ParkingProvider } from './ParkingContext';
import { NavProvider, useNav } from './NavContext';
import { Header, MobileNav } from './components/Header';
import { Toasts } from './components/Toasts';
import { Home } from './pages/Home';
import { Explore } from './pages/Explore';
import { Details } from './pages/Details';
import { Bookings } from './pages/Bookings';
import { Owner } from './pages/Owner';

function AppContent() {
  const { view, selectedParkingId, navigate } = useNav();

  const isExplore = view === 'explore';

  return (
    <div className="min-h-screen bg-spf-ink text-white">
      <Header compact={isExplore} />
      <main className={isExplore ? 'overflow-hidden' : ''}>
        {view === 'home' && <Home />}
        {view === 'explore' && <Explore />}
        {view === 'details' && <Details parkingId={selectedParkingId ?? ''} />}
        {view === 'bookings' && <Bookings />}
        {view === 'owner' && <Owner />}
      </main>
      {!isExplore && <MobileNav />}
      <Toasts />
    </div>
  );
}

export default function App() {
  return (
    <ParkingProvider>
      <NavProvider>
        <AppContent />
      </NavProvider>
    </ParkingProvider>
  );
}

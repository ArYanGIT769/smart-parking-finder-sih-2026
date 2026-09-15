import { useParking } from '../ParkingContext';
import { useNav } from '../NavContext';
import {
  MapPin,
  Zap,
  Accessibility,
  Clock,
  Shield,
  Navigation,
  ArrowRight,
  Cpu,
  Car,
  Radio,
  Cloud,
  Smartphone,
  Video,
  ScanLine,
} from 'lucide-react';
import { formatDistance, haversine } from '../utils';
import { INDORE_CENTER } from '../types';

export function Home() {
  const { parkings, userLocation } = useParking();
  const { navigate } = useNav();

  const totalSpaces = parkings.reduce((s, p) => s + p.totalSpaces, 0);
  const totalAvailable = parkings.reduce((s, p) => s + p.availableSpaces, 0);
  const totalEvChargers = parkings.reduce((s, p) => s + p.evChargersTotal, 0);
  const totalEvAvail = parkings.reduce((s, p) => s + p.evChargersAvailable, 0);
  const totalPwd = parkings.reduce((s, p) => s + p.pwdSpacesTotal, 0);
  const totalPwdAvail = parkings.reduce((s, p) => s + p.pwdSpacesAvailable, 0);

  const stats = [
    { label: 'Locations', value: parkings.length },
    { label: 'Total Spaces', value: totalSpaces },
    { label: 'Available Now', value: totalAvailable },
    { label: 'EV Chargers', value: `${totalEvAvail}/${totalEvChargers}` },
    { label: 'Accessible Spaces', value: `${totalPwdAvail}/${totalPwd}` },
  ];

  const features = [
    { icon: Radio, title: 'Live Availability', desc: 'Know before you arrive.' },
    { icon: Navigation, title: 'Smart Location', desc: 'Parking closest to you.' },
    { icon: Zap, title: 'EV Ready', desc: 'Parking + charging information.' },
    { icon: Accessibility, title: 'Accessible', desc: 'Dedicated reserved spaces.' },
    { icon: Clock, title: 'Reserve Ahead', desc: 'Book before reaching destination.' },
    { icon: Shield, title: 'Safer Parking', desc: 'Camera-monitored organized facilities.' },
  ];

  const pipeline = [
    { icon: Video, label: 'Camera' },
    { icon: ScanLine, label: 'YOLO' },
    { icon: Cpu, label: 'ANPR' },
    { icon: Cpu, label: 'Edge Processor' },
    { icon: Radio, label: 'Node.js' },
    { icon: Cloud, label: 'Cloud Data' },
    { icon: Smartphone, label: 'SPF Apps' },
  ];

  // Nearest parking for hero preview
  const userLat = userLocation?.lat ?? INDORE_CENTER[0];
  const userLng = userLocation?.lng ?? INDORE_CENTER[1];
  const nearest = [...parkings]
    .map((p) => ({
      ...p,
      dist: haversine(userLat, userLng, p.latitude, p.longitude),
    }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 3);

  return (
    <div className="min-h-[calc(100vh-68px)] bg-spf-ink pb-20 md:pb-0">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-spf-edge/40">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(245,197,24,0.12), transparent 60%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative mx-auto max-w-6xl px-5 py-14 sm:py-20 lg:py-24">
          <div className="flex flex-col items-center text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-spf-yellow/20 bg-spf-yellow/5 px-3.5 py-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-spf-green" />
              <span className="text-xs font-semibold text-white/70">
                Prototype parking network · Simulated live occupancy
              </span>
            </div>

            <h1 className="max-w-3xl text-4xl font-black leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Find parking <span className="text-spf-yellow">before you arrive.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base text-white/60 sm:text-lg">
              Discover nearby parking across Indore with live availability, EV charging and
              accessible reserved parking.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
              <button
                onClick={() => navigate('explore')}
                className="group flex items-center gap-2 rounded-xl bg-spf-yellow px-6 py-3.5 text-sm font-bold text-spf-ink shadow-spf-glow transition hover:bg-spf-yellow-bright"
              >
                <Navigation className="h-4 w-4" />
                Find Parking Near Me
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </button>
              <button
                onClick={() => navigate('explore')}
                className="flex items-center gap-2 rounded-xl border border-spf-edge bg-spf-graphite px-6 py-3.5 text-sm font-bold text-white transition hover:border-white/20 hover:bg-spf-slate"
              >
                <MapPin className="h-4 w-4 text-spf-yellow" />
                Explore Indore
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-spf-edge bg-spf-charcoal/80 px-4 py-4 text-center backdrop-blur"
              >
                <p className="text-2xl font-black text-white sm:text-3xl">{s.value}</p>
                <p className="mt-1 text-xs font-medium text-white/50">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nearest preview */}
      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white sm:text-2xl">Nearby Parking</h2>
            <p className="text-sm text-white/50">Closest available facilities around you</p>
          </div>
          <button
            onClick={() => navigate('explore')}
            className="flex items-center gap-1.5 text-sm font-semibold text-spf-yellow hover:underline"
          >
            View all <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {nearest.map((p) => (
            <button
              key={p.id}
              onClick={() => navigate('details', p.id)}
              className="group rounded-xl border border-spf-edge bg-spf-charcoal p-4 text-left transition hover:border-spf-yellow/30 hover:bg-spf-graphite"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">{p.name}</h3>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-white/50">
                    <MapPin className="h-3 w-3" /> {p.area}
                  </p>
                </div>
                <span className="rounded-md bg-spf-green/15 px-2 py-0.5 text-xs font-bold text-spf-green">
                  {p.availableSpaces} free
                </span>
              </div>
              <div className="mt-3 flex items-center gap-3 text-xs text-white/40">
                <span>{formatDistance(p.dist)}</span>
                <span>₹{p.pricePerHour}/hr</span>
                {p.evSpacesAvailable > 0 && (
                  <span className="flex items-center gap-0.5 text-spf-yellow">
                    <Zap className="h-3 w-3" /> EV
                  </span>
                )}
                {p.pwdSpacesAvailable > 0 && (
                  <span className="flex items-center gap-0.5 text-spf-blue-bright">
                    <Accessibility className="h-3 w-3" /> PWD
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold text-white sm:text-2xl">Why SPF</h2>
          <p className="mt-1 text-sm text-white/50">Smart parking built for Indore drivers</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group rounded-xl border border-spf-edge bg-spf-charcoal p-5 transition hover:border-spf-yellow/20 hover:bg-spf-graphite"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-spf-yellow/10">
                  <Icon className="h-5 w-5 text-spf-yellow" />
                </div>
                <h3 className="text-sm font-bold text-white">{f.title}</h3>
                <p className="mt-1 text-sm text-white/50">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How SPF Works */}
      <section className="border-t border-spf-edge/40 bg-spf-charcoal/30">
        <div className="mx-auto max-w-6xl px-5 py-12">
          <div className="mb-8 text-center">
            <h2 className="text-xl font-bold text-white sm:text-2xl">How SPF Works</h2>
            <p className="mt-1 text-sm text-white/50">
              Vehicle entry and exit events update occupancy so drivers can check parking
              availability before arrival
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {pipeline.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.label} className="flex items-center gap-2 sm:gap-3">
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-spf-edge bg-spf-graphite">
                      <Icon className="h-5 w-5 text-spf-yellow" />
                    </div>
                    <span className="text-[10px] font-semibold text-white/50">{step.label}</span>
                  </div>
                  {i < pipeline.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-white/20" />
                  )}
                </div>
              );
            })}
          </div>

          <p className="mt-8 text-center text-xs text-white/40">
            Current Bolt prototype simulates the live events
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="overflow-hidden rounded-2xl border border-spf-yellow/20 bg-gradient-to-br from-spf-charcoal to-spf-ink p-8 text-center sm:p-12">
          <Car className="mx-auto h-10 w-10 text-spf-yellow" />
          <h2 className="mt-4 text-2xl font-black text-white sm:text-3xl">Ready to park smarter?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/60">
            Explore live parking availability across Indore right now.
          </p>
          <button
            onClick={() => navigate('explore')}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-spf-yellow px-6 py-3.5 text-sm font-bold text-spf-ink transition hover:bg-spf-yellow-bright"
          >
            <MapPin className="h-4 w-4" />
            Explore Indore
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    </div>
  );
}

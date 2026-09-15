import { useState, useMemo } from 'react';
import { useParking } from '../ParkingContext';
import { useNav } from '../NavContext';
import { OwnerPinGate, isOwnerUnlocked} from '../components/OwnerPinGate';
import type {MovementRecord} from '../types';
import {
  LayoutDashboard,
  Radio,
  LogIn,
  LogOut,
  Zap,
  Accessibility,
  Search,
  Car,
  Cpu,
  Video,
  ScanLine,
  Server,
  TrendingUp,
  IndianRupee,
  ArrowDownToLine,
  ArrowUpFromLine,
  Clock,
  Battery,
  BatteryCharging,
  ArrowLeft,
} from 'lucide-react';
import { formatTime, formatTimeShort, formatCurrency, formatDuration } from '../utils';

const OCCUPANCY_LABELS = ['8 AM', '10 AM', '12 PM', '2 PM', '4 PM', '6 PM', '8 PM'];
const TREND_7D = [55, 62, 71, 58, 49, 66, 68];
const TREND_30D = [52, 58, 64, 70, 61, 55, 63, 69, 72, 58, 50, 56, 62, 68, 71, 59, 52, 47, 55, 61, 67, 70, 64, 58, 53, 60, 65, 69, 66, 68];
const REVENUE_7D = [7200, 8100, 9300, 6800, 5200, 8900, 8520];
const REVENUE_30D = Array.from({ length: 30 }, (_, i) => 6000 + Math.round(Math.sin(i / 3) * 1500) + (i % 7) * 400);

type MovementTab = 'all' | 'entered' | 'exited' | 'ev' | 'reserved';
type MainTab = 'movements' | 'parked';
type ChartTab = 'today' | '7d' | '30d';

export function Owner() {
  const { parkings, demoParkingId, setDemoParkingId, demoMode, triggerManualEntry, triggerManualExit, revenueYesterday, revenueWeek, revenueMonth } = useParking();
  const { navigate } = useNav();

  const [unlocked, setUnlocked] = useState(() => isOwnerUnlocked());
  const [mainTab, setMainTab] = useState<MainTab>('movements');
  const [movementTab, setMovementTab] = useState<MovementTab>('all');
  const [chartTab, setChartTab] = useState<ChartTab>('today');
  const [search, setSearch] = useState('');
  const [parkedSearch, setParkedSearch] = useState('');

  const parking = parkings.find((p) => p.id === demoParkingId) ?? parkings[0];

  const occupied = parking.totalSpaces - parking.availableSpaces;
  const occPct = Math.round((occupied / parking.totalSpaces) * 100);

  const latestMovement = parking.movementHistory[0] ?? null;

  const filteredMovements = useMemo(() => {
    let recs = parking.movementHistory;
    if (movementTab === 'entered') recs = recs.filter((m) => m.movement === 'ENTRY');
    else if (movementTab === 'exited') recs = recs.filter((m) => m.movement === 'EXIT');
    else if (movementTab === 'ev') recs = recs.filter((m) => m.type === 'EV');
    else if (movementTab === 'reserved') recs = recs.filter((m) => m.category === 'PWD' || m.charging);
    if (search.trim()) {
      const q = search.toUpperCase();
      recs = recs.filter((m) => m.registration.includes(q));
    }
    return recs;
  }, [parking.movementHistory, movementTab, search]);

  const filteredParked = useMemo(() => {
    if (parkedSearch.trim()) {
      const q = parkedSearch.toUpperCase();
      return parking.activeVehicles.filter((v) => v.registration.includes(q));
    }
    return parking.activeVehicles;
  }, [parking.activeVehicles, parkedSearch]);

  const kpis = [
    { label: 'Capacity', value: parking.totalSpaces, icon: Car, color: 'text-white' },
    { label: 'Available', value: parking.availableSpaces, icon: LayoutDashboard, color: 'text-spf-green' },
    { label: 'Occupied', value: occupied, icon: Car, color: 'text-spf-amber' },
    { label: 'Entered Today', value: parking.enteredToday, icon: ArrowDownToLine, color: 'text-spf-green' },
    { label: 'Exited Today', value: parking.exitedToday, icon: ArrowUpFromLine, color: 'text-spf-red-coral' },
    { label: 'Revenue', value: formatCurrency(parking.revenueToday), icon: IndianRupee, color: 'text-spf-yellow' },
  ];

  const secondaryMetrics = [
    { label: 'EV Spaces', value: `${parking.evSpacesAvailable} / ${parking.evSpacesTotal}`, icon: Zap, color: 'text-spf-yellow' },
    { label: 'EV Chargers', value: `${parking.evChargersAvailable} / ${parking.evChargersTotal}`, icon: BatteryCharging, color: 'text-spf-yellow' },
    { label: 'PWD Spaces', value: `${parking.pwdSpacesAvailable} / ${parking.pwdSpacesTotal}`, icon: Accessibility, color: 'text-spf-blue-bright' },
    { label: 'Reserved', value: `${parking.activeReservations} active`, icon: Clock, color: 'text-white' },
    { label: 'Occupancy', value: `${occPct}%`, icon: TrendingUp, color: 'text-spf-amber' },
  ];

  const systemStatus = [
    { label: 'Entry Camera', icon: Video },
    { label: 'Exit Camera', icon: Video },
    { label: 'AI Vehicle Detection', icon: ScanLine },
    { label: 'ANPR', icon: Cpu },
    { label: 'Edge Processor', icon: Cpu },
    { label: 'Node.js Backend', icon: Server },
  ];

  const chartData = chartTab === 'today' ? parking.occupancyTrend : chartTab === '7d' ? TREND_7D : TREND_30D;
  const chartLabels = chartTab === 'today' ? OCCUPANCY_LABELS : chartTab === '7d' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : TREND_30D.map((_, i) => `${i + 1}`);
  const revenueData = chartTab === 'today' ? parking.revenueTrend : chartTab === '7d' ? REVENUE_7D : REVENUE_30D;

  const pwdOccupied = parking.pwdSpaces.filter((s) => s.status === 'Occupied').length;
  const pwdReserved = parking.pwdSpaces.filter((s) => s.status === 'Reserved').length;
  const pwdAvailable = parking.pwdSpaces.filter((s) => s.status === 'Available').length;

  if (!unlocked) {
    return (
      <OwnerPinGate
        onUnlock={() => setUnlocked(true)}
        onClose={() => navigate('home')}
      />
    );
  }

  return (
    <div className="min-h-[calc(100vh-68px)] bg-spf-ink px-4 py-4 pb-20 md:px-6 md:pb-4">
      <div className="mx-auto max-w-7xl">
        {/* Back to Driver App */}
        <button
          onClick={() => navigate('home')}
          className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-white/60 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Driver App
        </button>

        {/* Header */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-lg font-black text-white sm:text-xl">
              <LayoutDashboard className="h-5 w-5 text-spf-yellow" />
              Smart Parking Control Center
            </h1>
            <p className="mt-0.5 text-sm text-white/50">{parking.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={demoParkingId}
              onChange={(e) => setDemoParkingId(e.target.value)}
              className="rounded-lg border border-spf-edge bg-spf-charcoal px-3 py-2 text-sm font-semibold text-white focus:border-spf-yellow/50 focus:outline-none"
            >
              {parkings.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <div className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold ${demoMode ? 'border-spf-green/40 bg-spf-green/10 text-spf-green' : 'border-spf-edge bg-spf-graphite text-white/50'}`}>
              <Radio className={`h-3.5 w-3.5 ${demoMode ? 'animate-pulse' : ''}`} />
              {demoMode ? 'LIVE' : 'OFFLINE'}
            </div>
          </div>
        </div>

        {/* Demo controls */}
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-spf-edge bg-spf-charcoal px-4 py-2.5">
          <span className="text-xs font-semibold text-white/50">Manual simulation:</span>
          <button
            onClick={() => triggerManualEntry(parking.id)}
            className="flex items-center gap-1.5 rounded-lg bg-spf-green/15 px-3 py-1.5 text-xs font-bold text-spf-green transition hover:bg-spf-green/25"
          >
            <LogIn className="h-3.5 w-3.5" /> Trigger Entry
          </button>
          <button
            onClick={() => triggerManualExit(parking.id)}
            disabled={parking.activeVehicles.length === 0}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              parking.activeVehicles.length > 0
                ? 'bg-spf-red/15 text-spf-red-coral hover:bg-spf-red/25'
                : 'cursor-not-allowed bg-spf-edge text-white/30'
            }`}
          >
            <LogOut className="h-3.5 w-3.5" /> Trigger Exit
          </button>
          <span className="ml-auto text-[10px] text-white/30">Prototype system simulation</span>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          {kpis.map((k) => {
            const Icon = k.icon;
            return (
              <div key={k.label} className="rounded-xl border border-spf-edge bg-spf-charcoal px-3 py-3">
                <Icon className={`h-4 w-4 ${k.color}`} />
                <p className="mt-2 text-lg font-black leading-none text-white sm:text-xl">{k.value}</p>
                <p className="mt-1 text-[10px] font-medium text-white/40">{k.label}</p>
              </div>
            );
          })}
        </div>

        {/* Secondary metrics */}
        <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
          {secondaryMetrics.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="flex items-center gap-2.5 rounded-xl border border-spf-edge bg-spf-charcoal px-3 py-2.5">
                <Icon className={`h-4 w-4 ${m.color}`} />
                <div>
                  <p className="text-[10px] font-medium text-white/40">{m.label}</p>
                  <p className="text-sm font-bold text-white">{m.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Latest Detection + Occupancy Chart */}
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {/* Latest Detection */}
          <div className="rounded-xl border border-spf-edge bg-spf-charcoal p-4">
            <h2 className="flex items-center gap-2 text-sm font-bold text-white">
              <Radio className="h-4 w-4 text-spf-yellow" />
              Latest Vehicle Detection
            </h2>
            {latestMovement ? (
              <LatestDetection movement={latestMovement} now={Date.now()} />
            ) : (
              <p className="mt-4 text-sm text-white/40">No detections yet</p>
            )}
          </div>

          {/* Occupancy Chart */}
          <div className="rounded-xl border border-spf-edge bg-spf-charcoal p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">Occupancy Trend</h2>
              <div className="flex gap-1 rounded-lg bg-spf-graphite p-0.5">
                {(['today', '7d', '30d'] as ChartTab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setChartTab(t)}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                      chartTab === t ? 'bg-spf-yellow text-spf-ink' : 'text-white/50 hover:text-white'
                    }`}
                  >
                    {t === 'today' ? 'Today' : t === '7d' ? '7 Days' : '30 Days'}
                  </button>
                ))}
              </div>
            </div>
            <AreaChart data={chartData} labels={chartLabels} color="#F5C518" height={140} suffix="%" />
          </div>
        </div>

        {/* Main tabs: Movements / Currently Parked */}
        <div className="mt-4 flex gap-1 rounded-xl border border-spf-edge bg-spf-charcoal p-1">
          <button
            onClick={() => setMainTab('movements')}
            className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition ${
              mainTab === 'movements' ? 'bg-spf-yellow text-spf-ink' : 'text-white/60 hover:text-white'
            }`}
          >
            Vehicle Movements
          </button>
          <button
            onClick={() => setMainTab('parked')}
            className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition ${
              mainTab === 'parked' ? 'bg-spf-yellow text-spf-ink' : 'text-white/60 hover:text-white'
            }`}
          >
            Currently Parked ({parking.activeVehicles.length})
          </button>
        </div>

        {/* Movements tab */}
        {mainTab === 'movements' && (
          <div className="mt-3 rounded-xl border border-spf-edge bg-spf-charcoal p-4">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-1.5">
                {([
                  { key: 'all', label: 'All' },
                  { key: 'entered', label: '↓ Entered' },
                  { key: 'exited', label: '↑ Exited' },
                  { key: 'ev', label: '⚡ EV' },
                  { key: 'reserved', label: 'Reserved' },
                ] as { key: MovementTab; label: string }[]).map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setMovementTab(t.key)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      movementTab === t.key ? 'bg-spf-yellow/15 text-spf-yellow' : 'bg-spf-graphite text-white/50 hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-spf-edge bg-spf-graphite px-3 py-2">
                <Search className="h-3.5 w-3.5 text-white/30" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search registration..."
                  className="w-32 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none sm:w-40"
                />
              </div>
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-spf-edge text-left text-xs text-white/40">
                    <th className="pb-2 pr-3 font-semibold">Vehicle</th>
                    <th className="pb-2 pr-3 font-semibold">Type</th>
                    <th className="pb-2 pr-3 font-semibold">Movement</th>
                    <th className="pb-2 pr-3 font-semibold">Time</th>
                    <th className="pb-2 pr-3 font-semibold">Gate</th>
                    <th className="pb-2 pr-3 font-semibold">Slot</th>
                    <th className="pb-2 font-semibold">Duration/Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMovements.slice(0, 30).map((m) => (
                    <tr key={m.id} className="border-b border-spf-edge/40">
                      <td className="py-2.5 pr-3 font-mono font-bold text-white">{m.registration}</td>
                      <td className="py-2.5 pr-3">
                        <span className={`text-xs font-semibold ${m.type === 'EV' ? 'text-spf-yellow' : 'text-white/60'}`}>
                          {m.type === 'EV' && <Zap className="mr-0.5 inline h-3 w-3" />}
                          {m.type}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3">
                        {m.movement === 'ENTRY' ? (
                          <span className="flex items-center gap-1 rounded-md bg-spf-green/15 px-2 py-0.5 text-xs font-bold text-spf-green">
                            <ArrowDownToLine className="h-3 w-3" /> ENTERED
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 rounded-md bg-spf-red/15 px-2 py-0.5 text-xs font-bold text-spf-red-coral">
                            <ArrowUpFromLine className="h-3 w-3" /> EXITED
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3 text-xs text-white/50">{formatTimeShort(m.time)}</td>
                      <td className="py-2.5 pr-3 text-xs text-white/50">{m.gate}</td>
                      <td className="py-2.5 pr-3 font-mono text-xs font-semibold text-spf-yellow">{m.slot}</td>
                      <td className="py-2.5 text-xs text-white/50">
                        {m.movement === 'EXIT' && m.durationMin != null
                          ? formatDuration(m.durationMin)
                          : m.charging
                            ? '⚡ Charging'
                            : 'Inside'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredMovements.length === 0 && (
                <p className="py-8 text-center text-sm text-white/40">No movements found</p>
              )}
            </div>

            {/* Mobile cards */}
            <div className="space-y-2 md:hidden">
              {filteredMovements.slice(0, 15).map((m) => (
                <div key={m.id} className="rounded-lg border border-spf-edge bg-spf-graphite p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-white">{m.registration}</span>
                    {m.movement === 'ENTRY' ? (
                      <span className="flex items-center gap-1 rounded-md bg-spf-green/15 px-2 py-0.5 text-xs font-bold text-spf-green">
                        <ArrowDownToLine className="h-3 w-3" /> IN
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-md bg-spf-red/15 px-2 py-0.5 text-xs font-bold text-spf-red-coral">
                        <ArrowUpFromLine className="h-3 w-3" /> OUT
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 text-xs text-white/50">
                    <span>{m.type === 'EV' ? '⚡ EV' : m.type}</span>
                    <span>·</span>
                    <span>{m.slot}</span>
                    <span>·</span>
                    <span>{formatTimeShort(m.time)}</span>
                  </div>
                </div>
              ))}
              {filteredMovements.length === 0 && (
                <p className="py-8 text-center text-sm text-white/40">No movements found</p>
              )}
            </div>
          </div>
        )}

        {/* Currently Parked tab */}
        {mainTab === 'parked' && (
          <div className="mt-3 rounded-xl border border-spf-edge bg-spf-charcoal p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">
                {parking.activeVehicles.length} VEHICLES INSIDE
              </h3>
              <div className="flex items-center gap-2 rounded-lg border border-spf-edge bg-spf-graphite px-3 py-2">
                <Search className="h-3.5 w-3.5 text-white/30" />
                <input
                  type="text"
                  value={parkedSearch}
                  onChange={(e) => setParkedSearch(e.target.value)}
                  placeholder="Search registration..."
                  className="w-32 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none sm:w-40"
                />
              </div>
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-spf-edge text-left text-xs text-white/40">
                    <th className="pb-2 pr-3 font-semibold">Registration</th>
                    <th className="pb-2 pr-3 font-semibold">Vehicle</th>
                    <th className="pb-2 pr-3 font-semibold">Type</th>
                    <th className="pb-2 pr-3 font-semibold">Slot</th>
                    <th className="pb-2 pr-3 font-semibold">Entry</th>
                    <th className="pb-2 pr-3 font-semibold">Duration</th>
                    <th className="pb-2 font-semibold">Charging</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParked.map((v) => {
                    const dur = Math.round((Date.now() - v.entryTime) / 60000);
                    return (
                      <tr key={v.id} className="border-b border-spf-edge/40">
                        <td className="py-2.5 pr-3 font-mono font-bold text-white">{v.registration}</td>
                        <td className="py-2.5 pr-3 text-xs text-white/60">{v.type}</td>
                        <td className="py-2.5 pr-3">
                          <span className={`text-xs font-semibold ${v.category === 'PWD' ? 'text-spf-blue-bright' : 'text-white/60'}`}>
                            {v.category === 'PWD' && <Accessibility className="mr-0.5 inline h-3 w-3" />}
                            {v.category}
                          </span>
                        </td>
                        <td className="py-2.5 pr-3 font-mono text-xs font-semibold text-spf-yellow">{v.slot}</td>
                        <td className="py-2.5 pr-3 text-xs text-white/50">{formatTimeShort(v.entryTime)}</td>
                        <td className="py-2.5 pr-3 text-xs text-white/50">{formatDuration(dur)}</td>
                        <td className="py-2.5">
                          {v.charging ? (
                            <span className="flex items-center gap-1 text-xs font-semibold text-spf-yellow">
                              <BatteryCharging className="h-3.5 w-3.5" /> {v.charger}
                            </span>
                          ) : (
                            <span className="text-xs text-white/30">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredParked.length === 0 && (
                <p className="py-8 text-center text-sm text-white/40">No vehicles found</p>
              )}
            </div>

            {/* Mobile cards */}
            <div className="space-y-2 md:hidden">
              {filteredParked.slice(0, 20).map((v) => {
                const dur = Math.round((Date.now() - v.entryTime) / 60000);
                return (
                  <div key={v.id} className="rounded-lg border border-spf-edge bg-spf-graphite p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-bold text-white">{v.registration}</span>
                      <span className="font-mono text-xs font-semibold text-spf-yellow">{v.slot}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2 text-xs text-white/50">
                      <span>{v.type === 'EV' ? '⚡ EV' : v.type}</span>
                      <span>·</span>
                      <span>{v.category}</span>
                      <span>·</span>
                      <span>{formatDuration(dur)}</span>
                      {v.charging && <span className="text-spf-yellow">· ⚡ {v.charger}</span>}
                    </div>
                  </div>
                );
              })}
              {filteredParked.length === 0 && (
                <p className="py-8 text-center text-sm text-white/40">No vehicles found</p>
              )}
            </div>
          </div>
        )}

        {/* EV Chargers + PWD Spaces */}
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {/* EV Chargers */}
          <div className="rounded-xl border border-spf-edge bg-spf-charcoal p-4">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-bold text-white">
                <Zap className="h-4 w-4 text-spf-yellow" />
                EV Charging
              </h2>
              <span className="text-xs font-semibold text-white/50">
                {parking.evChargersAvailable} / {parking.evChargersTotal} available
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {parking.chargers.map((c) => {
                const isCharging = c.status === 'Charging';
                const isReserved = c.status === 'Reserved';
                return (
                  <div
                    key={c.id}
                    className={`rounded-lg border p-3 ${
                      isCharging
                        ? 'border-spf-yellow/30 bg-spf-yellow/5'
                        : isReserved
                          ? 'border-spf-blue/30 bg-spf-blue/5'
                          : 'border-spf-green/20 bg-spf-green/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">{c.id}</span>
                      {isCharging ? (
                        <BatteryCharging className="h-4 w-4 text-spf-yellow" />
                      ) : isReserved ? (
                        <Clock className="h-4 w-4 text-spf-blue-bright" />
                      ) : (
                        <Battery className="h-4 w-4 text-spf-green" />
                      )}
                    </div>
                    <p className={`mt-1.5 text-xs font-semibold ${
                      isCharging ? 'text-spf-yellow' : isReserved ? 'text-spf-blue-bright' : 'text-spf-green'
                    }`}>
                      {c.status === 'Available' ? 'Available' : c.status === 'Charging' ? '⚡ Charging' : 'Reserved'}
                    </p>
                    {c.vehicle && (
                      <p className="mt-0.5 font-mono text-[10px] text-white/50">{c.vehicle}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* PWD Spaces */}
          <div className="rounded-xl border border-spf-edge bg-spf-charcoal p-4">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-bold text-white">
                <Accessibility className="h-4 w-4 text-spf-blue-bright" />
                PWD Reserved Spaces
              </h2>
              <div className="flex gap-3 text-xs">
                <span className="text-spf-green">{pwdAvailable} Avail</span>
                <span className="text-spf-amber">{pwdOccupied} Occ</span>
                <span className="text-spf-blue-bright">{pwdReserved} Res</span>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
              {parking.pwdSpaces.map((s) => {
                const isOccupied = s.status === 'Occupied';
                const isReserved = s.status === 'Reserved';
                return (
                  <div
                    key={s.id}
                    className={`flex flex-col items-center rounded-lg border p-2.5 ${
                      isOccupied
                        ? 'border-spf-amber/30 bg-spf-amber/5'
                        : isReserved
                          ? 'border-spf-blue/30 bg-spf-blue/5'
                          : 'border-spf-green/20 bg-spf-green/5'
                    }`}
                  >
                    <Accessibility className={`h-4 w-4 ${
                      isOccupied ? 'text-spf-amber' : isReserved ? 'text-spf-blue-bright' : 'text-spf-green'
                    }`} />
                    <span className="mt-1 text-xs font-bold text-white">{s.id}</span>
                    <span className={`mt-0.5 text-[9px] font-semibold ${
                      isOccupied ? 'text-spf-amber' : isReserved ? 'text-spf-blue-bright' : 'text-spf-green'
                    }`}>{s.status}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Space Utilization + Revenue */}
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {/* Space Utilization */}
          <div className="rounded-xl border border-spf-edge bg-spf-charcoal p-4">
            <h2 className="text-sm font-bold text-white">Space Utilization</h2>
            <div className="mt-4 space-y-3">
              <UtilBar label="STANDARD" available={parking.standardSpacesAvailable} total={parking.standardSpacesTotal} color="bg-white" />
              <UtilBar label="EV" available={parking.evSpacesAvailable} total={parking.evSpacesTotal} color="bg-spf-yellow" icon />
              <UtilBar label="PWD" available={parking.pwdSpacesAvailable} total={parking.pwdSpacesTotal} color="bg-spf-blue" pwdIcon />
            </div>
          </div>

          {/* Revenue Overview */}
          <div className="rounded-xl border border-spf-edge bg-spf-charcoal p-4">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-bold text-white">
                <IndianRupee className="h-4 w-4 text-spf-yellow" />
                Revenue Overview
              </h2>
              <div className="flex gap-1 rounded-lg bg-spf-graphite p-0.5">
                {(['today', '7d', '30d'] as ChartTab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setChartTab(t)}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                      chartTab === t ? 'bg-spf-yellow text-spf-ink' : 'text-white/50 hover:text-white'
                    }`}
                  >
                    {t === 'today' ? 'Today' : t === '7d' ? '7 Days' : '30 Days'}
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-3 text-3xl font-black text-spf-yellow">{formatCurrency(parking.revenueToday)}</p>
            <p className="text-xs text-white/40">Today</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
              <div className="rounded-lg bg-spf-graphite px-3 py-2">
                <p className="text-[10px] text-white/40">Yesterday</p>
                <p className="font-bold text-white">{formatCurrency(revenueYesterday)}</p>
              </div>
              <div className="rounded-lg bg-spf-graphite px-3 py-2">
                <p className="text-[10px] text-white/40">This Week</p>
                <p className="font-bold text-white">{formatCurrency(revenueWeek)}</p>
              </div>
              <div className="rounded-lg bg-spf-graphite px-3 py-2">
                <p className="text-[10px] text-white/40">This Month</p>
                <p className="font-bold text-white">{formatCurrency(revenueMonth)}</p>
              </div>
            </div>
            <div className="mt-3">
              <AreaChart data={revenueData} labels={chartTab === 'today' ? OCCUPANCY_LABELS : chartTab === '7d' ? ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] : TREND_30D.map((_, i) => `${i+1}`)} color="#22C55E" height={90} prefix="₹" />
            </div>
          </div>
        </div>

        {/* Recent Transactions + System Status */}
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {/* Transactions */}
          <div className="rounded-xl border border-spf-edge bg-spf-charcoal p-4 lg:col-span-2">
            <h2 className="text-sm font-bold text-white">Recent Transactions</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-spf-edge text-left text-xs text-white/40">
                    <th className="pb-2 pr-3 font-semibold">Booking</th>
                    <th className="pb-2 pr-3 font-semibold">Vehicle</th>
                    <th className="pb-2 pr-3 font-semibold">Slot</th>
                    <th className="pb-2 pr-3 font-semibold">Amount</th>
                    <th className="pb-2 pr-3 font-semibold">Status</th>
                    <th className="pb-2 font-semibold">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {parking.transactions.slice(0, 10).map((t) => (
                    <tr key={t.id} className="border-b border-spf-edge/40">
                      <td className="py-2 pr-3 font-mono text-xs text-white/60">{t.bookingId}</td>
                      <td className="py-2 pr-3 font-mono text-xs font-semibold text-white">{t.registration}</td>
                      <td className="py-2 pr-3 font-mono text-xs text-spf-yellow">{t.slot}</td>
                      <td className="py-2 pr-3 text-xs font-bold text-white">{formatCurrency(t.amount)}</td>
                      <td className="py-2 pr-3">
                        <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                          t.status === 'Paid' ? 'bg-spf-green/15 text-spf-green' : 'bg-spf-amber/15 text-spf-amber'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-2 text-xs text-white/50">{formatTimeShort(t.time)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* System Status */}
          <div className="rounded-xl border border-spf-edge bg-spf-charcoal p-4">
            <h2 className="text-sm font-bold text-white">System Status</h2>
            <div className="mt-3 space-y-2">
              {systemStatus.map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="flex items-center gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-spf-green shadow-[0_0_6px_rgba(34,197,94,0.7)]" />
                    <Icon className="h-3.5 w-3.5 text-white/40" />
                    <span className="text-xs font-medium text-white/70">{s.label}</span>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-[10px] text-white/30">Prototype system-status simulation</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Latest Detection Component ----
function LatestDetection({ movement, now }: { movement: MovementRecord; now: number }) {
  const isEntry = movement.movement === 'ENTRY';
  const isEv = movement.type === 'EV';
  const dur = movement.durationMin ?? Math.round((now - movement.time) / 60000);

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2">
        <span className={`flex h-2 w-2 rounded-full ${isEntry ? 'bg-spf-green' : 'bg-spf-red'} animate-pulse`} />
        <span className="text-xs font-semibold text-white/50">LIVE VEHICLE DETECTION</span>
      </div>

      {/* Number plate */}
      <div className="mt-3 inline-block rounded-lg border-2 border-white/80 bg-spf-yellow px-4 py-2">
        <span className="font-mono text-lg font-black tracking-wider text-spf-ink">{movement.registration}</span>
      </div>

      {/* Movement badge */}
      <div className="mt-3">
        {isEntry ? (
          <div className="flex items-center gap-2 rounded-lg bg-spf-green/15 px-3 py-2">
            <ArrowDownToLine className="h-5 w-5 text-spf-green" />
            <span className="text-lg font-black text-spf-green">ENTERED</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg bg-spf-red/15 px-3 py-2">
            <ArrowUpFromLine className="h-5 w-5 text-spf-red-coral" />
            <span className="text-lg font-black text-spf-red-coral">VEHICLE EXITED</span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <p className="text-xs text-white/40">Vehicle Type</p>
          <p className="font-semibold text-white">
            {isEv && <Zap className="mr-1 inline h-3.5 w-3.5 text-spf-yellow" />}
            {movement.type}
          </p>
        </div>
        <div>
          <p className="text-xs text-white/40">Time</p>
          <p className="font-semibold text-white">{formatTime(movement.time)}</p>
        </div>
        <div>
          <p className="text-xs text-white/40">Gate</p>
          <p className="font-semibold text-white">{movement.gate}</p>
        </div>
        <div>
          <p className="text-xs text-white/40">Slot</p>
          <p className="font-bold text-spf-yellow">{movement.slot}{!isEntry && ' RELEASED'}</p>
        </div>
        {isEntry ? (
          <div>
            <p className="text-xs text-white/40">AI Confidence</p>
            <p className="font-semibold text-spf-green">97%</p>
          </div>
        ) : (
          <div>
            <p className="text-xs text-white/40">Parking Duration</p>
            <p className="font-semibold text-white">{formatDuration(dur)}</p>
          </div>
        )}
        {movement.charger && (
          <div className="col-span-2">
            <p className="text-xs text-white/40">Charger</p>
            <p className="font-semibold text-spf-yellow">
              {isEntry ? `⚡ ${movement.charger} Charging` : `${movement.charger} AVAILABLE`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Area Chart (SVG) ----
function AreaChart({
  data,
  labels,
  color,
  height = 120,
  suffix = '',
  prefix = '',
}: {
  data: number[];
  labels: string[];
  color: string;
  height?: number;
  suffix?: string;
  prefix?: string;
}) {
  const w = 100;
  const h = 100;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const step = w / (data.length - 1 || 1);

  const points = data.map((v, i) => {
    const x = i * step;
    const y = h - ((v - min) / range) * h * 0.85 - h * 0.075;
    return [x, y] as [number, number];
  });

  const linePath = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');
  const areaPath = `${linePath} L ${w} ${h} L 0 ${h} Z`;
  const id = `grad-${color.replace('#', '')}`;

  return (
    <div className="mt-3 w-full">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: `${height}px` }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${id})`} />
        <path d={linePath} fill="none" stroke={color} strokeWidth="0.8" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
        {points.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="0.8" fill={color} vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <div className="mt-1.5 flex justify-between text-[9px] text-white/30">
        {labels.map((l, i) => (
          <span key={i}>{l}</span>
        ))}
      </div>
      {suffix && (
        <p className="mt-1 text-right text-[10px] text-white/30">
          {prefix}{Math.round(max)}{suffix} peak
        </p>
      )}
    </div>
  );
}

// ---- Utilization Bar ----
function UtilBar({ label, available, total, color, icon, pwdIcon }: { label: string; available: number; total: number; color: string; icon?: boolean; pwdIcon?: boolean }) {
  const pct = total > 0 ? Math.round((available / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-white/60">
          {icon && <Zap className="h-3 w-3 text-spf-yellow" />}
          {pwdIcon && <Accessibility className="h-3 w-3 text-spf-blue-bright" />}
          {label}
        </span>
        <span className="text-xs font-bold text-white">{available} <span className="font-normal text-white/40">/ {total}</span></span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-spf-edge">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

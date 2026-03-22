import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  MapPin, Bell, Shield, Clock, CheckCircle, AlertCircle,
  Users, ChevronRight, Phone, Navigation, Flag, LayoutGrid
} from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuthStore } from '@/store/authStore';
import { useGeolocation } from '@/hooks/useGeolocation';
import { getSosHistory } from '@/api/sos.api';
import { reverseGeocode, getNearbyPlaces } from '@/api/map.api';
import { listGuardians, listInvites } from '@/api/guardian.api';
import SOSButton from '@/components/sos/SOSButton';
import ReportForm from '@/components/incident/ReportForm';
import { Badge, Card, Skeleton, Modal } from '@/components/ui';
import { Navbar, BottomNav } from '@/components/layout/Navbar';

const QUICK_ACTIONS = [
  { label: 'Hospital',  icon: '🏥', color: '#EF4444', path: '/map?type=hospital' },
  { label: 'Police',    icon: '🚔', color: '#3B82F6', path: '/map?type=police' },
  { label: 'Report',    icon: '🚩', color: '#F97316', action: 'report' },
  { label: 'Guardians', icon: '👥', color: '#8B5CF6', path: '/guardians' },
  { label: 'Pharmacy',  icon: '💊', color: '#10B981', path: '/map?type=pharmacy' },
  { label: 'Incidents', icon: '⚠️', color: '#D97706', path: '/incidents' },
];

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { lat, lng, error: geoError } = useGeolocation();
  const [showReportForm, setShowReportForm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const { data: geocode } = useQuery({
    queryKey: ['geocode', lat?.toFixed(3), lng?.toFixed(3)],
    queryFn: () => reverseGeocode({ lat, lng }),
    enabled: !!lat && !!lng,
    staleTime: 1000 * 60 * 5,
  });

  // Helper: pick closest from nearby results
  const pickNearest = (d) => {
    const places = d?.places || [];
    return places.length > 0
      ? { place: places.sort((a, b) => (a.distanceMetres ?? 0) - (b.distanceMetres ?? 0))[0] }
      : { place: null };
  };

  // Hospital — search up to 20km using /nearby (supports radius, always works)
  const { data: nearestHospital, isLoading: loadingH } = useQuery({
    queryKey: ['map', 'nearby-nearest', lat?.toFixed(3), lng?.toFixed(3), 'hospital'],
    queryFn: () => getNearbyPlaces({ lat, lng, type: 'hospital', radius: 20000 }),
    enabled: !!lat && !!lng,
    staleTime: 1000 * 60 * 10,
    select: pickNearest,
  });

  // Police — search up to 50km so it always finds something
  const { data: nearestPolice, isLoading: loadingP } = useQuery({
    queryKey: ['map', 'nearby-nearest', lat?.toFixed(3), lng?.toFixed(3), 'police'],
    queryFn: () => getNearbyPlaces({ lat, lng, type: 'police', radius: 50000 }),
    enabled: !!lat && !!lng,
    staleTime: 1000 * 60 * 10,
    select: pickNearest,
  });

  const { data: guardians = [] } = useQuery({
    queryKey: ['guardians', user?.id],
    queryFn: listGuardians,
    staleTime: 1000 * 60 * 5,
  });

  const { data: historyData } = useQuery({
    queryKey: ['sos', 'history'],
    queryFn: () => getSosHistory({ limit: 5 }),
    staleTime: 1000 * 60 * 2,
  });

  const { data: invites = [] } = useQuery({
    queryKey: ['invites', user?.id],
    queryFn: listInvites,
    staleTime: 1000 * 60 * 2,
  });

  const recentSOS = historyData?.data || [];
  const pendingInvites = invites.filter(i => i.status === 'pending');
  const notifCount = Math.min(recentSOS.length + pendingInvites.length, 9);

  const handleQuickAction = (action) => {
    if (action.action === 'report') { setShowReportForm(true); return; }
    if (action.path) navigate(action.path);
  };

  const locationLabel = geocode?.address?.road
    || geocode?.address?.suburb
    || geocode?.address?.neighbourhood
    || (lat ? `${lat.toFixed(4)}, ${lng.toFixed(4)}` : null);
  const cityLabel = geocode?.address?.city || geocode?.address?.town || geocode?.address?.state || '';

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />

      {/* ════════════════════════════════════════════════════
          DESKTOP LAYOUT  (≥ lg breakpoint — two-column grid)
          MOBILE LAYOUT   (single column, bottom-nav)
      ═══════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-24 sm:pb-8 lg:pb-10">

        {/* ── Header row ─────────────────────────────────── */}
        <div className="flex items-center justify-between mb-5 animate-slide-up">
          <div>
            <p className="text-xs text-slate-500 font-medium">Welcome back</p>
            <h1 className="text-xl lg:text-2xl font-bold text-slate-900">Hi, {user?.name?.split(' ')[0]} 👋</h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Desktop: extra action buttons */}
            <button
              onClick={() => navigate('/map')}
              className="hidden lg:flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:shadow-sm transition-all"
            >
              <MapPin className="w-4 h-4 text-[#E53E6D]" /> Open Map
            </button>
            <button
              onClick={() => navigate('/incidents')}
              className="hidden lg:flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:shadow-sm transition-all"
            >
              <Flag className="w-4 h-4 text-[#F97316]" /> Incidents
            </button>
            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(true)}
                className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:shadow-sm transition-all relative"
              >
                <Bell className="w-5 h-5" />
                {notifCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#E53E6D] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {notifCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Alerts ─────────────────────────────────────── */}
        {guardians.length === 0 && (
          <button
            onClick={() => navigate('/guardians')}
            className="w-full flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-left hover:bg-amber-100 transition-colors mb-5 animate-slide-up stagger-1"
          >
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">No guardians added</p>
              <p className="text-xs text-amber-600">SOS alerts won't be sent to anyone. Tap to add →</p>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-400 shrink-0" />
          </button>
        )}
        {geoError && (
          <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl mb-5 animate-slide-up stagger-1">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-800">Location access denied</p>
              <p className="text-xs text-red-600">Enable location in browser settings for SOS to work properly</p>
            </div>
          </div>
        )}

        {/* ── Two-column desktop grid ─────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 xl:gap-8">

          {/* ════ LEFT COLUMN ═══════════════════════════════ */}
          <div className="flex flex-col gap-5">

            {/* Location card */}
            <Card className="overflow-hidden animate-slide-up stagger-2 card-lift">
              {lat && lng ? (
                <div className="h-48 lg:h-56 relative">
                  <MapContainer
                    center={[lat, lng]} zoom={15}
                    zoomControl={false} dragging={false}
                    scrollWheelZoom={false} doubleClickZoom={false}
                    touchZoom={false} keyboard={false}
                    attributionControl={false}
                    className="w-full h-full"
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <CircleMarker center={[lat, lng]} radius={14}
                      pathOptions={{ color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.15, weight: 0 }}
                    />
                    <CircleMarker center={[lat, lng]} radius={5}
                      pathOptions={{ color: 'white', fillColor: '#3B82F6', fillOpacity: 1, weight: 2 }}
                    />
                  </MapContainer>
                  <div className="absolute top-3 right-3 z-[9999] flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow text-xs font-semibold text-slate-700">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> Live
                  </div>
                  <button
                    onClick={() => navigate('/map')}
                    className="absolute bottom-3 right-3 z-[9999] bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow text-xs font-semibold text-[#E53E6D] hover:bg-white transition-colors flex items-center gap-1"
                  >
                    Full map <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="h-48 lg:h-56 bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <MapPin className="w-10 h-10 animate-bounce" />
                    <p className="text-sm font-medium">{geoError ? 'Location blocked' : 'Getting your location…'}</p>
                  </div>
                </div>
              )}
              <div className="p-3 flex items-center gap-2 border-t border-slate-100">
                <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{locationLabel || 'Fetching address…'}</p>
                  {cityLabel && <p className="text-xs text-slate-400">{cityLabel}</p>}
                </div>
              </div>
            </Card>

            {/* Quick Actions — 3 columns on md+, 3 on mobile wrapping */}
            <div className="animate-slide-up stagger-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Quick Access</p>
              <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-3 gap-3">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => handleQuickAction(action)}
                    className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md active:scale-95 transition-all card-lift"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                      style={{ background: action.color + '18' }}
                    >
                      {action.icon}
                    </div>
                    <span className="text-[11px] font-semibold text-slate-700">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

            </div>

          {/* ════ RIGHT COLUMN ══════════════════════════════ */}
          <div className="flex flex-col gap-5">

            {/* SOS Button hero */}
            <div className="relative flex flex-col items-center justify-center py-8 lg:py-10 bg-white rounded-2xl border border-slate-200 shadow-sm animate-slide-up stagger-3 overflow-hidden">
              {/* Background gradient rings */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-72 h-72 rounded-full bg-gradient-radial from-[#E53E6D]/5 to-transparent" />
              </div>
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#E53E6D]" />
                  <span className="text-xs font-bold text-slate-700">Emergency SOS</span>
                </div>
                {guardians.length > 0 && (
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                    {guardians.length} guardian{guardians.length !== 1 ? 's' : ''} active
                  </span>
                )}
              </div>
              <SOSButton lat={lat} lng={lng} />
              <p className="text-xs text-slate-400 mt-4 font-medium">
                {guardians.length > 0
                  ? `${guardians.length} contact${guardians.length !== 1 ? 's' : ''} will be alerted instantly`
                  : '⚠ No guardians — add some for SOS alerts'}
              </p>
            </div>

            {/* Recent SOS Events (Moved here for better mobile flow) */}
            {recentSOS.length > 0 && (
              <div className="animate-slide-up stagger-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-slate-900">Recent SOS Events</p>
                  <button onClick={() => navigate('/sos/history')} className="text-xs text-[#E53E6D] font-semibold flex items-center gap-0.5">
                    View all <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  {recentSOS.slice(0, 3).map((event) => (
                    <Card key={event.id} className="p-3 flex items-center gap-3 card-lift">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${event.status === 'resolved' ? 'bg-green-100' : 'bg-red-100'}`}>
                        {event.status === 'resolved'
                          ? <CheckCircle className="w-4 h-4 text-green-600" />
                          : <Clock className="w-4 h-4 text-[#E53E6D]" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-slate-900">{new Date(event.triggered_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                        <p className="text-xs text-slate-500">{new Date(event.triggered_at).toLocaleTimeString()}</p>
                      </div>
                      <Badge variant={event.status === 'resolved' ? 'success' : 'danger'}>{event.status}</Badge>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Nearest Help */}
            <div className="animate-slide-up stagger-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-slate-900">Nearest Help</p>
                <button onClick={() => navigate('/map')} className="text-xs text-[#E53E6D] font-semibold flex items-center gap-0.5">
                  More on map <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {loadingH ? <Skeleton className="h-28" /> :
                  nearestHospital?.place
                    ? <NearbyCard place={nearestHospital.place} icon="🏥" color="#EF4444" onRoute={() => navigate('/map?type=hospital')} />
                    : <NearbyCard placeholder="Hospital" icon="🏥" color="#EF4444" />}
                {loadingP ? <Skeleton className="h-28" /> :
                  nearestPolice?.place
                    ? <NearbyCard place={nearestPolice.place} icon="🚔" color="#3B82F6" onRoute={() => navigate('/map?type=police')} />
                    : <NearbyCard placeholder="Police Station" icon="🚔" color="#3B82F6" />}
              </div>
            </div>

            {/* Guardian status panel (desktop only) */}
            <div className="hidden lg:block animate-slide-up stagger-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-slate-900">Your Guardians</p>
                <button onClick={() => navigate('/guardians')} className="text-xs text-[#E53E6D] font-semibold flex items-center gap-0.5">
                  Manage <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              {guardians.length === 0 ? (
                <button
                  onClick={() => navigate('/guardians')}
                  className="w-full flex items-center gap-3 p-4 bg-white rounded-xl border border-dashed border-slate-300 hover:border-[#E53E6D] hover:bg-[#FCE4ED]/30 transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-[#FCE4ED] flex items-center justify-center">
                    <Users className="w-5 h-5 text-[#E53E6D]" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-slate-700">Add your first guardian</p>
                    <p className="text-xs text-slate-400">They'll be alerted when you trigger SOS</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
                </button>
              ) : (
                <Card className="p-4">
                  <div className="flex flex-wrap gap-3">
                    {guardians.slice(0, 6).map((g) => (
                      <div key={g.id} className="flex flex-col items-center gap-1">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E53E6D] to-[#C0304F] text-white text-sm font-bold flex items-center justify-center shadow-sm">
                          {(g.name || g.guardian_name || '?').slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-[10px] text-slate-500 truncate w-12 text-center">
                          {(g.name || g.guardian_name || '?').split(' ')[0]}
                        </span>
                      </div>
                    ))}
                    {guardians.length > 6 && (
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center">
                          +{guardians.length - 6}
                        </div>
                        <span className="text-[10px] text-slate-400">more</span>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
      <ReportForm isOpen={showReportForm} onClose={() => setShowReportForm(false)} lat={lat} lng={lng} />

      {/* Notifications panel */}
      <Modal isOpen={showNotifications} onClose={() => setShowNotifications(false)} title="Activity">
        <div className="flex flex-col gap-1">
          {recentSOS.length === 0 && pendingInvites.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No recent activity</p>
            </div>
          ) : (
            <>
              {pendingInvites.map((inv) => (
                <div key={inv.circle_id} className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-blue-100">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">Guardian Request</p>
                    <p className="text-xs text-slate-500">{inv.name} invited you.</p>
                    <button onClick={() => { setShowNotifications(false); navigate('/guardians'); }}
                      className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                      View Invite →
                    </button>
                  </div>
                </div>
              ))}
              {recentSOS.map((event) => (
                <div key={event.id} className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${event.status === 'resolved' ? 'bg-green-100' : 'bg-red-100'}`}>
                    {event.status === 'resolved'
                      ? <CheckCircle className="w-4 h-4 text-green-600" />
                      : <Shield className="w-4 h-4 text-[#E53E6D]" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">SOS Event</p>
                    <p className="text-xs text-slate-500">{new Date(event.triggered_at).toLocaleString()}</p>
                    <Badge className="mt-1.5" variant={event.status === 'resolved' ? 'success' : 'danger'}>{event.status}</Badge>
                  </div>
                </div>
              ))}
            </>
          )}
          <button
            onClick={() => { setShowNotifications(false); navigate('/sos/history'); }}
            className="text-sm text-[#E53E6D] font-semibold text-center pt-3"
          >
            View full SOS history →
          </button>
        </div>
      </Modal>
    </div>
  );
};

const NearbyCard = ({ place, icon, color, onRoute, placeholder }) => {
  if (!place) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-1.5">
        <span className="text-2xl">{icon}</span>
        <p className="text-xs font-bold text-slate-500 mt-1">{placeholder}</p>
        <p className="text-xs text-slate-300">Not found nearby</p>
      </div>
    );
  }
  return (
    <button
      onClick={onRoute}
      className="bg-white rounded-xl border border-slate-200 p-4 text-left hover:border-slate-300 transition-all card-lift w-full"
    >
      <span className="text-2xl">{icon}</span>
      <p className="text-xs font-bold text-slate-900 mt-2 truncate leading-tight">{place.name}</p>
      <p className="text-xs font-bold mt-1" style={{ color }}>{place.distanceText}</p>
      <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-400 mt-2">
        Tap for route <ChevronRight className="w-2.5 h-2.5" />
      </span>
    </button>
  );
};

export default DashboardPage;

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, MapPin, Clock, CheckCircle, AlertCircle, Flag } from 'lucide-react';
import { getNearbyIncidents } from '@/api/incident.api';
import { getSosHistory } from '@/api/sos.api';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useAuthStore } from '@/store/authStore';
import BaseMap from '@/components/map/BaseMap';
import LiveTracker from '@/components/map/LiveTracker';
import ReportForm from '@/components/incident/ReportForm';
import { Marker, Popup } from 'react-leaflet';
import { createDivIcon } from '@/components/map/BaseMap';
import { Badge, Skeleton, Card } from '@/components/ui';
import { Navbar, BottomNav } from '@/components/layout/Navbar';

const CATEGORY_CONFIG = {
  harassment:  { color: '#F97316', emoji: '😤', label: 'Harassment' },
  stalking:    { color: '#EF4444', emoji: '👁️', label: 'Stalking' },
  assault:     { color: '#991B1B', emoji: '🚨', label: 'Assault' },
  unsafe_area: { color: '#D97706', emoji: '⚠️', label: 'Unsafe Area' },
  other:       { color: '#64748B', emoji: '📌', label: 'Other' },
};

const INCIDENT_FILTERS = ['All', 'harassment', 'stalking', 'assault', 'unsafe_area', 'other'];
const TABS = ['Incidents', 'SOS History'];

const IncidentsPage = () => {
  const { lat, lng } = useGeolocation();
  const { user } = useAuthStore();
  const [tab, setTab] = useState('Incidents');
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState(null);
  const [showReport, setShowReport] = useState(false);

  const { data: incidentData, isLoading: loadingInc } = useQuery({
    queryKey: ['incidents', 'nearby', lat?.toFixed(3), lng?.toFixed(3), 3000],
    queryFn: () => getNearbyIncidents({ lat, lng, radius: 3000 }),
    enabled: !!lat && !!lng,
    staleTime: 1000 * 60 * 2,
    select: (d) => d?.incidents || [],
  });

  const { data: sosHistoryData, isLoading: loadingSOS } = useQuery({
    queryKey: ['sos', 'history'],
    queryFn: () => getSosHistory({ limit: 20 }),
    staleTime: 1000 * 60 * 2,
  });

  const incidents = (incidentData || []).filter(i => filter === 'All' || i.category === filter);
  const sosEvents = sosHistoryData?.data || [];

  const timeAgo = (iso) => {
    const diff = (Date.now() - new Date(iso)) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
    return `${Math.round(diff / 86400)}d ago`;
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F8FAFC]">
      <Navbar />

      {/* ── Tab header ─────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100 px-4 pt-3 flex flex-col gap-3 shadow-sm">
        <div className="flex gap-0 rounded-xl overflow-hidden border border-slate-200 self-start">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 text-sm font-semibold transition-all ${
                tab === t
                  ? 'bg-[#E53E6D] text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'Incidents' && (
          <div className="flex items-center gap-2 pb-2">
            <div className="flex gap-1.5 overflow-x-auto flex-1 scrollbar-none">
              {INCIDENT_FILTERS.map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    filter === f
                      ? 'bg-[#E53E6D] text-white border-[#E53E6D] shadow-sm'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {f === 'All' ? '🗺 All' : `${CATEGORY_CONFIG[f]?.emoji} ${CATEGORY_CONFIG[f]?.label}`}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowReport(true)}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[#E53E6D] text-white rounded-lg text-xs font-semibold hover:bg-[#C0304F] transition-colors shadow-sm whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" /> Report
            </button>
          </div>
        )}
      </div>

      {/* ── Content ──────────────────────────────────────── */}
      {tab === 'Incidents' ? (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Map — 40% height */}
          <div className="h-[40%] relative">
            <BaseMap center={lat ? [lat, lng] : undefined} style={{ height: '100%' }}>
              {lat && <LiveTracker lat={lat} lng={lng} follow={!selected} />}
              {incidents.map(inc => {
                const cfg = CATEGORY_CONFIG[inc.category] || CATEGORY_CONFIG.other;
                const icon = createDivIcon(cfg.color, cfg.emoji, 32);
                return (
                  <Marker
                    key={inc.id}
                    position={[inc.latitude, inc.longitude]}
                    icon={icon}
                    eventHandlers={{ click: () => setSelected(inc) }}
                  >
                    <Popup>
                      <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 140 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{cfg.label}</div>
                        {inc.description && (
                          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, lineHeight: 1.4 }}>{inc.description}</div>
                        )}
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{timeAgo(inc.occurred_at)}</div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </BaseMap>

            {/* Incident count badge on map */}
            {incidents.length > 0 && (
              <div className="absolute top-3 right-3 z-[9999] bg-white/95 backdrop-blur-sm border border-slate-200 rounded-full px-3 py-1.5 shadow text-xs font-semibold text-slate-700">
                {incidents.length} incident{incidents.length !== 1 ? 's' : ''} nearby
              </div>
            )}
          </div>

          {/* Incident list */}
          <div className="flex-1 overflow-y-auto bg-[#F8FAFC] px-4 py-3 flex flex-col gap-2">
            {loadingInc ? (
              [1,2,3].map(i => <Skeleton key={i} className="h-16" />)
            ) : incidents.length === 0 ? (
              <div className="text-center py-12 flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
                  <MapPin className="w-7 h-7 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-500">No incidents in this area</p>
                <button
                  onClick={() => setShowReport(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#E53E6D] text-white rounded-xl text-sm font-semibold shadow-sm hover:bg-[#C0304F] transition-colors"
                >
                  <Flag className="w-4 h-4" /> Report one now
                </button>
              </div>
            ) : (
              incidents.map(inc => {
                const cfg = CATEGORY_CONFIG[inc.category] || CATEGORY_CONFIG.other;
                const isSelected = selected?.id === inc.id;
                return (
                  <div
                    key={inc.id}
                    onClick={() => setSelected(inc)}
                    className={`bg-white rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden card-lift ${
                      isSelected ? 'border-[#E53E6D] shadow-md' : 'border-slate-200 hover:border-slate-300'
                    }`}
                    style={{ borderLeft: `3px solid ${cfg.color}` }}
                  >
                    <div className="flex items-start gap-3 p-3">
                      <span className="text-xl shrink-0 mt-0.5">{cfg.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ background: cfg.color + '18', color: cfg.color }}
                          >
                            {cfg.label}
                          </span>
                          {inc.anonymous && <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Anonymous</span>}
                        </div>
                        {inc.description && (
                          <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">{inc.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(inc.occurred_at)}</span>
                          {inc.distance_metres && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{Math.round(inc.distance_metres)}m away</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* ── SOS History Tab ─────────────────────────────── */
        <div className="flex-1 overflow-y-auto bg-[#F8FAFC] px-4 py-4 flex flex-col gap-3">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Your emergency SOS activity</p>

          {loadingSOS ? (
            [1,2,3].map(i => <Skeleton key={i} className="h-20" />)
          ) : sosEvents.length === 0 ? (
            <div className="text-center py-16 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">No SOS events</h3>
                <p className="text-sm text-slate-500 mt-1">Stay safe — your history will appear here</p>
              </div>
            </div>
          ) : (
            sosEvents.map((evt) => {
              const duration = evt.resolved_at
                ? Math.round((new Date(evt.resolved_at) - new Date(evt.triggered_at)) / 60000)
                : null;
              const isActive = evt.status !== 'resolved';
              return (
                <Card key={evt.id} className="p-4 card-lift" style={{ borderLeft: `3px solid ${isActive ? '#E53E6D' : '#10B981'}` }}>
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isActive ? 'bg-red-100' : 'bg-green-100'}`}>
                      {isActive
                        ? <AlertCircle className="w-5 h-5 text-[#E53E6D]" />
                        : <CheckCircle className="w-5 h-5 text-green-600" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-slate-900 text-sm">
                          SOS · {new Date(evt.triggered_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                        <Badge variant={isActive ? 'danger' : 'success'}>{evt.status}</Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{new Date(evt.triggered_at).toLocaleTimeString()}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-400">
                        {duration !== null && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {duration}m duration
                          </span>
                        )}
                        {evt.guardians_notified > 0 && (
                          <span>👥 {evt.guardians_notified} guardian{evt.guardians_notified !== 1 ? 's' : ''} alerted</span>
                        )}
                        {evt.guardians_notified === 0 && (
                          <span className="text-amber-500">⚠️ No guardians notified</span>
                        )}
                      </div>
                      {evt.resolution_note && (
                        <p className="text-xs text-slate-600 mt-2 italic bg-slate-50 rounded-lg px-3 py-1.5">
                          "{evt.resolution_note}"
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}

      <BottomNav />
      <ReportForm isOpen={showReport} onClose={() => setShowReport(false)} lat={lat} lng={lng} />

      {/* Floating Report FAB */}
      {tab === 'Incidents' && incidents.length > 0 && (
        <button
          onClick={() => setShowReport(true)}
          className="fixed bottom-20 sm:bottom-8 right-4 sm:right-8 flex items-center gap-2 px-5 py-3 bg-[#E53E6D] text-white rounded-full shadow-xl text-sm font-bold hover:bg-[#C0304F] active:scale-95 transition-all z-40"
          style={{ boxShadow: '0 4px 20px rgba(229,62,109,0.4)' }}
        >
          <Plus className="w-4 h-4" /> Report incident
        </button>
      )}
    </div>
  );
};

export default IncidentsPage;

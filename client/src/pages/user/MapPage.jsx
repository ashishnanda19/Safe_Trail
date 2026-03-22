import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Navigation, Phone, Clock, MapPin, Search,
  ChevronRight, Zap, Shield, Hospital, Flame, Pill, X, SlidersHorizontal, Car, PersonStanding, Bike
} from 'lucide-react';
import { getNearbyPlaces, getRoute } from '@/api/map.api';
import { useGeolocation } from '@/hooks/useGeolocation';
import BaseMap from '@/components/map/BaseMap';
import NearbyPlaces from '@/components/map/NearbyPlaces';
import LiveTracker from '@/components/map/LiveTracker';
import RouteLayer from '@/components/map/RouteLayer';
import { BottomNav } from '@/components/layout/Navbar';

const TYPES = [
  { value: 'hospital',     label: 'Hospital',     icon: '🏥', color: '#E53E6D', bg: '#FCE4ED' },
  { value: 'police',       label: 'Police',       icon: '🚔', color: '#3B82F6', bg: '#DBEAFE' },
  { value: 'pharmacy',     label: 'Pharmacy',     icon: '💊', color: '#10B981', bg: '#D1FAE5' },
  { value: 'fire_station', label: 'Fire',         icon: '🚒', color: '#F97316', bg: '#FFEDD5' },
  { value: 'clinic',       label: 'Clinic',       icon: '🩺', color: '#8B5CF6', bg: '#EDE9FE' },
];

const PROFILES = [
  { value: 'driving', icon: Car,           label: 'Drive' },
  { value: 'walking', icon: PersonStanding, label: 'Walk'  },
  { value: 'cycling', icon: Bike,          label: 'Cycle' },
];

const MapPage = () => {
  const [params] = useSearchParams();
  const [selectedType, setSelectedType] = useState(
    TYPES.find(t => t.value === params.get('type')) || TYPES[0]
  );
  const [radius, setRadius] = useState(3000);
  const [sliderRadius, setSliderRadius] = useState(3000);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [routeProfile, setRouteProfile] = useState('driving');
  const [route, setRoute] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { lat, lng } = useGeolocation();

  const { data: places = [], isLoading } = useQuery({
    queryKey: ['map', 'nearby', lat?.toFixed(3), lng?.toFixed(3), radius, selectedType.value],
    queryFn: () => getNearbyPlaces({ lat, lng, type: selectedType.value, radius }),
    enabled: !!lat && !!lng,
    staleTime: 1000 * 60 * 5,
    select: d => d?.places || [],
  });

  const fetchRoute = async (profile, place) => {
    const target = place || selectedPlace;
    if (!target || !lat) return;
    setLoadingRoute(true);
    try {
      const d = await getRoute({
        originLat: lat, originLng: lng,
        destLat: target.lat, destLng: target.lng,
        profile,
      });
      setRoute(d?.route || null);
    } catch {
      setRoute(null);
    } finally {
      setLoadingRoute(false);
    }
  };

  const handlePlaceSelect = (place) => {
    setSelectedPlace(place);
    setRoute(null);
    fetchRoute(routeProfile, place);
    setSidebarOpen(true);
  };

  const handleProfile = (profile) => {
    setRouteProfile(profile);
    if (selectedPlace) fetchRoute(profile, selectedPlace);
  };

  const handleTypeChange = (type) => {
    setSelectedType(type);
    setSelectedPlace(null);
    setRoute(null);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0F1117]">

      {/* ─── LEFT SIDEBAR ─── */}
      <div
        className={`flex flex-col h-full bg-[#0F1117] border-r border-white/10 transition-all duration-300 ${sidebarOpen ? 'w-[340px] min-w-[340px]' : 'w-0 min-w-0 overflow-hidden'}`}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-[#E53E6D] flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-sm">SafeTraiL</span>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-[11px] text-emerald-400 font-medium">Live</span>
            </div>
          </div>

          {/* Service type pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => handleTypeChange(t)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                  selectedType.value === t.value
                    ? 'text-white border-transparent shadow-lg'
                    : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                }`}
                style={selectedType.value === t.value ? { background: t.color, borderColor: t.color } : {}}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Radius filter + stats */}
        <div className="px-5 py-3 border-b border-white/10 shrink-0">
          <button
            onClick={() => setShowFilters(f => !f)}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors mb-2"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Search radius: <span className="text-white font-semibold">{sliderRadius >= 1000 ? `${sliderRadius/1000}km` : `${sliderRadius}m`}</span>
            <ChevronRight className={`w-3 h-3 ml-auto transition-transform ${showFilters ? 'rotate-90' : ''}`} />
          </button>
          {showFilters && (
            <input
              type="range" min={1000} max={50000} step={1000}
              value={sliderRadius}
              onChange={e => setSliderRadius(Number(e.target.value))}
              onMouseUp={() => setRadius(sliderRadius)}
              onTouchEnd={() => setRadius(sliderRadius)}
              className="w-full accent-[#E53E6D] h-1"
            />
          )}
          <p className="text-[11px] text-slate-500 mt-1">
            {isLoading ? 'Searching…' : `${places.length} ${selectedType.label.toLowerCase()}${places.length !== 1 ? 's' : ''} found`}
          </p>
        </div>

        {/* Place LIST */}
        <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
          {isLoading && Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />
          ))}

          {!isLoading && places.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <span className="text-4xl opacity-30">{selectedType.icon}</span>
              <p className="text-slate-500 text-sm">No {selectedType.label.toLowerCase()} found nearby</p>
              <p className="text-slate-600 text-xs">Try increasing the radius</p>
            </div>
          )}

          {places.map((place, idx) => {
            const isSelected = selectedPlace?.name === place.name;
            return (
              <button
                key={place.name + idx}
                onClick={() => handlePlaceSelect(place)}
                className={`w-full text-left rounded-xl p-3.5 border transition-all duration-200 ${
                  isSelected
                    ? 'bg-white/10 border-white/20 shadow-lg'
                    : 'bg-white/4 border-white/8 hover:bg-white/8'
                }`}
                style={isSelected ? { borderColor: selectedType.color + '60', boxShadow: `0 0 0 1px ${selectedType.color}40` } : {}}
              >
                <div className="flex items-start gap-3">
                  {/* Rank badge */}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                    style={{ background: selectedType.bg + '20', color: selectedType.color }}
                  >
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{place.name}</p>
                    {place.address && <p className="text-[11px] text-slate-500 truncate mt-0.5">{place.address}</p>}
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="flex items-center gap-1 text-[11px]" style={{ color: selectedType.color }}>
                        <MapPin className="w-3 h-3" />
                        {place.distanceText}
                      </span>
                      {place.phone && (
                        <a
                          href={`tel:${place.phone}`}
                          onClick={e => e.stopPropagation()}
                          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-emerald-400"
                        >
                          <Phone className="w-3 h-3" />
                          Call
                        </a>
                      )}
                    </div>
                  </div>
                  {/* ETA badge if route loaded */}
                  {isSelected && route && (
                    <div
                      className="shrink-0 text-right"
                    >
                      <p className="text-xl font-black leading-none" style={{ color: selectedType.color }}>{route.durationText?.replace(' mins','').replace(' min','')}</p>
                      <p className="text-[9px] text-slate-500 mt-0.5">min away</p>
                    </div>
                  )}
                </div>

                {/* Route detail row (only for selected) */}
                {isSelected && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    {/* Profile tabs */}
                    <div className="flex gap-1.5 mb-3">
                      {PROFILES.map(({ value, icon: Icon, label }) => (
                        <button
                          key={value}
                          onClick={e => { e.stopPropagation(); handleProfile(value); }}
                          className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-[11px] font-semibold rounded-lg border transition-all ${
                            routeProfile === value
                              ? 'text-white border-transparent'
                              : 'bg-white/5 text-slate-500 border-white/10 hover:bg-white/10'
                          }`}
                          style={routeProfile === value ? { background: selectedType.color } : {}}
                        >
                          <Icon className="w-3 h-3" /> {label}
                        </button>
                      ))}
                    </div>

                    {loadingRoute && (
                      <div className="flex items-center gap-2 text-slate-500 text-xs">
                        <div className="w-3 h-3 border border-slate-500 border-t-white rounded-full animate-spin" />
                        Calculating route…
                      </div>
                    )}

                    {route && !loadingRoute && (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white text-sm font-semibold">{route.durationText}</p>
                          <p className="text-slate-400 text-xs">{route.distanceText}</p>
                        </div>
                        <a
                          href={`https://www.openstreetmap.org/directions?from=${lat},${lng}&to=${place.lat},${place.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                          style={{ background: selectedType.color }}
                        >
                          <Navigation className="w-3 h-3" />
                          Navigate
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Nav integrated */}
        <div className="shrink-0 border-t border-white/10">
          <BottomNav dark />
        </div>
      </div>

      {/* ─── MAP AREA ─── */}
      <div className="flex-1 relative h-full">

        {/* Toggle sidebar button */}
        <button
          onClick={() => setSidebarOpen(o => !o)}
          className="absolute top-4 left-4 z-[9999] w-9 h-9 bg-[#0F1117]/90 backdrop-blur border border-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white/10 transition-colors shadow-xl"
        >
          {sidebarOpen ? <X className="w-4 h-4" /> : <SlidersHorizontal className="w-4 h-4" />}
        </button>

        {/* ETA top badge (when route active) */}
        {route && selectedPlace && (
          <div
            className="absolute top-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-4 py-2.5 rounded-2xl shadow-2xl border border-white/10 backdrop-blur-md animate-fade-in"
            style={{ background: 'rgba(15,17,23,0.92)' }}
          >
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">Est. Arrival</p>
              <p className="text-2xl font-black text-white leading-none">{route.durationText}</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div>
              <p className="text-[10px] text-slate-400 font-medium">{route.distanceText}</p>
              <p className="text-xs text-white font-semibold truncate max-w-[140px]">{selectedPlace.name}</p>
            </div>
          </div>
        )}

        {/* Quick-call FAB (when selected place has phone) */}
        {selectedPlace?.phone && (
          <a
            href={`tel:${selectedPlace.phone}`}
            className="absolute bottom-8 right-5 z-[9999] flex items-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-xl text-sm font-bold transition-all active:scale-95 animate-slide-up"
            style={{ boxShadow: '0 4px 20px rgba(16,185,129,0.45)' }}
          >
            <Phone className="w-4 h-4" /> Call {selectedPlace.name.split(' ').slice(0,2).join(' ')}
          </a>
        )}

        {/* No location warning */}
        {!lat && (
          <div className="absolute inset-0 z-[9998] flex items-center justify-center">
            <div className="bg-[#0F1117]/90 border border-white/10 rounded-2xl px-8 py-6 text-center backdrop-blur">
              <MapPin className="w-10 h-10 text-[#E53E6D] mx-auto mb-3 animate-bounce" />
              <p className="text-white font-semibold">Getting your location…</p>
              <p className="text-slate-400 text-sm mt-1">Please allow location access</p>
            </div>
          </div>
        )}

        <BaseMap center={lat ? [lat, lng] : undefined} style={{ height: '100%', width: '100%' }}>
          {lat && <LiveTracker lat={lat} lng={lng} follow={!selectedPlace} />}
          {places.length > 0 && (
            <NearbyPlaces places={places} onPlaceSelect={handlePlaceSelect} />
          )}
          {route && <RouteLayer route={route} profile={routeProfile} />}
        </BaseMap>
      </div>
    </div>
  );
};

export default MapPage;

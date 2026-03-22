import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { getAdminStats, getActiveSOS } from '@/api/admin.api';
import { getHeatmap } from '@/api/map.api';
import BaseMap from '@/components/map/BaseMap';
import { AdminLayout } from './AdminDashboardPage';
import { Badge, Card, Skeleton } from '@/components/ui';

// Heatmap layer using leaflet.heat
const HeatLayer = ({ points, opacity }) => {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (!points?.length) return;

    if (layerRef.current) {
      map.removeLayer(layerRef.current);
    }

    layerRef.current = L.heatLayer(
      points.map(p => [p.lat, p.lng, p.weight || 1]),
      { radius: 25, blur: 20, maxZoom: 17, opacity }
    ).addTo(map);

    return () => {
      if (layerRef.current) map.removeLayer(layerRef.current);
    };
  }, [points, opacity, map]);

  return null;
};

const CATEGORIES = ['all', 'harassment', 'stalking', 'assault', 'unsafe_area', 'other'];

const HeatmapPage = () => {
  const [opacity, setOpacity] = useState(0.7);
  const [selectedCats, setSelectedCats] = useState(['all']);
  const [mapBounds, setMapBounds] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'heatmap', mapBounds, selectedCats],
    queryFn: () => getHeatmap({
      ...(mapBounds || {}),
      category: selectedCats.includes('all') ? undefined : selectedCats.join(','),
    }),
    staleTime: 1000 * 60 * 2,
    select: (d) => d?.points || [],
  });

  const toggleCat = (cat) => {
    if (cat === 'all') { setSelectedCats(['all']); return; }
    setSelectedCats(prev => {
      const without = prev.filter(c => c !== 'all');
      return without.includes(cat) ? without.filter(c => c !== cat) || ['all'] : [...without, cat];
    });
  };

  return (
    <AdminLayout>
      <div className="h-full flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Incident Heatmap</h1>
          <p className="text-sm text-slate-500">Geographic density of reported incidents</p>
        </div>

        <div className="flex gap-4 flex-1 overflow-hidden">
          {/* Map */}
          <div className="flex-1 rounded-xl overflow-hidden border border-slate-200">
            <BaseMap style={{ height: '100%' }}>
              {data && <HeatLayer points={data} opacity={opacity} />}
            </BaseMap>
          </div>

          {/* Controls sidebar */}
          <div className="w-56 flex flex-col gap-4 shrink-0">
            <Card className="p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Categories</p>
              <div className="flex flex-col gap-2">
                {CATEGORIES.map(cat => (
                  <label key={cat} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCats.includes(cat)}
                      onChange={() => toggleCat(cat)}
                      className="accent-[#E53E6D]"
                    />
                    <span className="text-sm text-slate-700 capitalize">{cat}</span>
                  </label>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Opacity</p>
              <input
                type="range" min={0.1} max={1} step={0.1}
                value={opacity}
                onChange={e => setOpacity(Number(e.target.value))}
                className="w-full accent-[#E53E6D]"
              />
              <p className="text-xs text-slate-400 text-right mt-1">{Math.round(opacity * 100)}%</p>
            </Card>

            <Card className="p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Legend</p>
              <div className="flex items-center gap-2 mb-1">
                <div className="h-2 flex-1 rounded" style={{ background: 'linear-gradient(to right, yellow, orange, red)' }} />
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Low</span><span>High</span>
              </div>
            </Card>

            <button
              className="px-4 py-2.5 border border-slate-200 bg-white text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              onClick={() => {
                const blob = new Blob([JSON.stringify(data || [], null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = 'heatmap-data.json'; a.click();
              }}
            >
              Export Data ↓
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default HeatmapPage;

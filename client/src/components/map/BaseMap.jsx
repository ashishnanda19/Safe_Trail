import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Vite broken marker icons
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Default center: New Delhi
const DEFAULT_CENTER = [28.6139, 77.2090];

// Auto-panning controller
export const MapPanner = ({ center }) => {
  const map = useMap();
  if (center?.[0] && center?.[1]) {
    map.panTo(center, { animate: true });
  }
  return null;
};

// Custom div icon factory
export const createDivIcon = (bgColor, emoji, size = 36) =>
  L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${bgColor};
      border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:${Math.round(size * 0.5)}px;
      border:2.5px solid white;
      box-shadow:0 2px 6px rgba(0,0,0,0.25);
    ">${emoji}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });

// User location pulsing dot icon
export const userLocationIcon = L.divIcon({
  html: `<div style="position:relative;width:20px;height:20px;">
    <div style="position:absolute;inset:0;background:#3B82F6;border-radius:50%;opacity:0.3;animation:live-ping 1.5s ease-out infinite;"></div>
    <div style="position:absolute;inset:3px;background:#3B82F6;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>
  </div>`,
  className: '',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// SOS active user marker
export const sosUserIcon = L.divIcon({
  html: `<div style="position:relative;width:28px;height:28px;">
    <div style="position:absolute;inset:-8px;background:#E53E6D;border-radius:50%;opacity:0.25;animation:live-ping 1s ease-out infinite;"></div>
    <div style="position:absolute;inset:0;background:#E53E6D;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(229,62,109,0.5);display:flex;align-items:center;justify-content:center;font-size:14px;">🆘</div>
  </div>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

// Place type → color & emoji
export const PLACE_ICONS = {
  hospital:    { color: '#EF4444', emoji: '🏥' },
  police:      { color: '#3B82F6', emoji: '🚔' },
  pharmacy:    { color: '#22C55E', emoji: '💊' },
  fire_station:{ color: '#F97316', emoji: '🚒' },
  clinic:      { color: '#14B8A6', emoji: '🩺' },
};

// Base map wrapper
const BaseMap = ({
  center,
  zoom = 15,
  children,
  className = '',
  style = {},
}) => {
  const mapCenter = center || DEFAULT_CENTER;

  return (
    <MapContainer
      center={mapCenter}
      zoom={zoom}
      className={`w-full h-full ${className}`}
      style={style}
      zoomControl={false}
    >
      <TileLayer
        url={import.meta.env.VITE_OSM_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        maxZoom={19}
      />
      {center && <MapPanner center={center} />}
      {children}
    </MapContainer>
  );
};

export default BaseMap;

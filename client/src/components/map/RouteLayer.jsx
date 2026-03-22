import { Polyline } from 'react-leaflet';

const PROFILE_COLORS = {
  driving: '#E53E6D',
  walking: '#3B82F6',
  cycling: '#22C55E',
};

const RouteLayer = ({ route, profile = 'driving' }) => {
  if (!route?.geometry?.coordinates) return null;

  const positions = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
  const color = PROFILE_COLORS[profile] || '#E53E6D';

  return (
    <Polyline
      positions={positions}
      color={color}
      weight={4}
      opacity={0.8}
      dashArray={profile === 'walking' ? '8, 8' : undefined}
    />
  );
};

export default RouteLayer;

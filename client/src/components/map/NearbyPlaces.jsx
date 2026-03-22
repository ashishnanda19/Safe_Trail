import { Marker, Popup } from 'react-leaflet';
import { PLACE_ICONS, createDivIcon } from './BaseMap';

const NearbyPlaces = ({ places = [], onPlaceSelect }) => {
  return places.map((place, idx) => {
    const config = PLACE_ICONS[place.type] || { color: '#64748B', emoji: '📍' };

    // Numbered icon for first 9 places, emoji for rest
    const icon = idx < 9
      ? createDivIcon(config.color, String(idx + 1), 34)
      : createDivIcon(config.color, config.emoji, 34);

    return (
      <Marker
        key={(place.id || place.name) + idx}
        position={[place.lat, place.lng]}
        icon={icon}
        eventHandlers={{ click: () => onPlaceSelect?.(place) }}
      >
        <Popup>
          <div style={{ minWidth: 160, fontFamily: 'Inter, sans-serif' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a', marginBottom: 2 }}>
              {place.name}
            </div>
            {place.address && (
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, lineHeight: 1.4 }}>
                {place.address}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {place.distanceText && (
                <span style={{ fontSize: 11, color: config.color, fontWeight: 600 }}>
                  📍 {place.distanceText}
                </span>
              )}
              {place.phone && (
                <a
                  href={`tel:${place.phone}`}
                  style={{
                    fontSize: 11, color: '#fff', background: '#10B981',
                    padding: '2px 8px', borderRadius: 20, textDecoration: 'none', fontWeight: 600
                  }}
                >
                  📞 Call
                </a>
              )}
            </div>
          </div>
        </Popup>
      </Marker>
    );
  });
};

export default NearbyPlaces;

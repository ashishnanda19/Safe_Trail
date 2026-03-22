import { useEffect, useRef } from 'react';
import { Marker, useMap } from 'react-leaflet';
import { sosUserIcon, userLocationIcon } from './BaseMap';

const LiveTracker = ({ lat, lng, isSOS = false, follow = true }) => {
  const map = useMap();
  const markerRef = useRef(null);
  const prevPos = useRef([lat, lng]);

  useEffect(() => {
    if (!lat || !lng) return;
    const newPos = [lat, lng];
    if (markerRef.current) {
      markerRef.current.setLatLng(newPos);
    }

    const isFirstPos = !prevPos.current[0] && !prevPos.current[1];
    const isDifferent = prevPos.current[0] !== lat || prevPos.current[1] !== lng;

    if ((follow && isDifferent) || (isFirstPos && isDifferent)) {
      map.panTo(newPos, { animate: true, duration: 0.5 });
    }
    prevPos.current = newPos;
  }, [lat, lng, follow, map]);

  if (!lat || !lng) return null;

  return (
    <Marker
      ref={markerRef}
      position={[lat, lng]}
      icon={isSOS ? sosUserIcon : userLocationIcon}
    />
  );
};

export default LiveTracker;

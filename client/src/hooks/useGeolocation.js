import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { updateLocation } from '@/api/user.api';
import { useAuthStore } from '@/store/authStore';

const LOCATION_UPDATE_INTERVAL = 60000; // 60 seconds

export const useGeolocation = ({ watch = true } = {}) => {
  const [location, setLocation] = useState({ lat: null, lng: null, accuracy: null });
  const [error, setError] = useState(null);
  const watchIdRef = useRef(null);
  const intervalRef = useRef(null);
  const { isAuthenticated } = useAuthStore();

  const onSuccess = useCallback((pos) => {
    const { latitude: lat, longitude: lng, accuracy } = pos.coords;
    setLocation({ lat, lng, accuracy });
    setError(null);
  }, []);

  const onError = useCallback((err) => {
    setError(err.message);
    if (err.code === 1) {
      toast.error('Location access required for SafeTraiL to work.');
    }
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    const options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 };

    if (watch) {
      watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, options);
    } else {
      navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [watch, onSuccess, onError]);

  // Background location sync to backend every 60s
  useEffect(() => {
    if (!isAuthenticated() || !location.lat) return;

    intervalRef.current = setInterval(() => {
      updateLocation({ latitude: location.lat, longitude: location.lng }).catch(() => {});
    }, LOCATION_UPDATE_INTERVAL);

    return () => clearInterval(intervalRef.current);
  }, [location.lat, location.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  return { ...location, error };
};

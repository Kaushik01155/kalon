import { useState, useCallback } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { isNative } from '../lib/config';

const DEFAULT = { lat: 28.6139, lng: 77.2090 };

export function useGeolocation() {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isNative) {
        const perm = await Geolocation.requestPermissions();
        if (perm.location === 'denied') throw new Error('Location permission denied');
        const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      } else if (navigator.geolocation) {
        await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
              resolve();
            },
            () => reject(new Error('Could not get location')),
            { enableHighAccuracy: true }
          );
        });
      } else {
        setLocation(DEFAULT);
      }
    } catch (err) {
      setError(err.message);
      setLocation(DEFAULT);
    } finally {
      setLoading(false);
    }
  }, []);

  return { location, error, loading, refresh };
}

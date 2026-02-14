/// <reference types="google.maps" />
import { useEffect, useState } from 'react';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export function useGoogleMaps() {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(
    !API_KEY ? 'Google Maps API key not configured' : null
  );

  useEffect(() => {
    if (!API_KEY) return;
    if (typeof window === 'undefined') return;
    if (window.google?.maps) {
      queueMicrotask(() => setLoaded(true));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setLoaded(true);
    script.onerror = () => setError('Failed to load Google Maps');
    document.head.appendChild(script);
  }, []);

  return { loaded: !!loaded, error };
}

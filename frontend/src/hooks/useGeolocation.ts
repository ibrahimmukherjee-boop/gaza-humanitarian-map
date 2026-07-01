import { useCallback, useEffect, useState } from "react";
import type { UserLocation } from "../types/resource";

interface GeolocationState {
  location: UserLocation | null;
  loading: boolean;
  error: string | null;
  requestLocation: () => void;
}

export function useGeolocation(): GeolocationState {
  const [location, setLocation] = useState<UserLocation | null>(() => {
    try {
      const saved = localStorage.getItem("hssm-location");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("unsupported");
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: UserLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        };
        setLocation(loc);
        localStorage.setItem("hssm-location", JSON.stringify(loc));
        setLoading(false);
      },
      (err) => {
        setError(err.code === 1 ? "denied" : "failed");
        setLoading(false);
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 }
    );
  }, []);

  useEffect(() => {
    if (!location) return;
    const age = Date.now() - location.timestamp;
    if (age > 600000) return;
  }, [location]);

  return { location, loading, error, requestLocation };
}

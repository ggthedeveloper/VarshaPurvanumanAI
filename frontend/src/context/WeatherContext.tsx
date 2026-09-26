import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { SynopticRegime } from '../types/api';

export type WeatherMode = 'AUTO' | SynopticRegime | 'CLEAR';
export type WeatherIntensity = 'subtle' | 'normal' | 'dramatic';
export type TimeOfDay = 'auto' | 'dawn' | 'day' | 'afternoon' | 'evening' | 'night';
export type EffectiveTimeOfDay = 'dawn' | 'day' | 'afternoon' | 'evening' | 'night';

export const getDiurnalPeriod = (d: Date = new Date()): EffectiveTimeOfDay => {
  const hours = d.getHours() + d.getMinutes() / 60;
  if (hours >= 5 && hours < 8) return 'dawn';
  if (hours >= 8 && hours < 15) return 'day';
  if (hours >= 15 && hours < 17.5) return 'afternoon';
  if (hours >= 17.5 && hours < 20.25) return 'evening';
  return 'night';
};

export interface WeatherTelemetry {
  rainRateMmH: number;
  windSpeedMs: number;
  windDirectionDeg: number;
  windDirectionCompass: string;
  temperatureC: number;
  relativeHumidityPct: number;
  surfacePressureHpa: number;
  capeJkg: number;
  cloudCoverPct: number;
  lightningFrequencyPerMin: number;
  stationName: string;
  stationCoordinates: { lat: number; lon: number };
  conditionLabel: string;
  sourceProvenance: string;
  lastUpdatedIso: string;
}

export interface UserLocationState {
  lat: number;
  lon: number;
  accuracy?: number;
  name?: string;
  isCustomLocation?: boolean;
}

interface WeatherContextType {
  enabled: boolean;
  mode: WeatherMode;
  effectiveRegime: SynopticRegime;
  timeOfDay: TimeOfDay;
  effectiveTimeOfDay: EffectiveTimeOfDay;
  intensity: WeatherIntensity;
  lightningEnabled: boolean;
  telemetry: WeatherTelemetry;
  instantLightningSignal: number;
  userLocation: UserLocationState | null;
  isLocating: boolean;
  locationError: string | null;
  setEnabled: (enabled: boolean) => void;
  toggleEnabled: () => void;
  setMode: (mode: WeatherMode) => void;
  setTimeOfDay: (tod: TimeOfDay) => void;
  setIntensity: (intensity: WeatherIntensity) => void;
  setLightningEnabled: (enabled: boolean) => void;
  setDistrictRegime: (regime: SynopticRegime | string | null | undefined) => void;
  setStationTelemetry: (stationData: Partial<WeatherTelemetry>) => void;
  triggerInstantLightning: () => void;
  detectUserLocation: (onFound?: (coords: { lat: number; lon: number }) => void) => Promise<{ lat: number; lon: number } | null>;
  fetchLocationWeather: (lat: number, lon: number, customLocationName?: string) => Promise<boolean>;
  clearUserLocation: () => void;
  setUserLocation: (loc: UserLocationState | null) => void;
}

export const getCompassDirection = (deg: number): string => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(((deg % 360) + 360) % 360 / 22.5) % 16;
  return directions[index];
};

const REGIME_TELEMETRY: Record<SynopticRegime, WeatherTelemetry> = {
  ACTIVE_MONSOON: {
    rainRateMmH: 18.5,
    windSpeedMs: 14.2,
    windDirectionDeg: 245,
    windDirectionCompass: 'WSW',
    temperatureC: 26.8,
    relativeHumidityPct: 92,
    surfacePressureHpa: 984.2,
    capeJkg: 1450,
    cloudCoverPct: 95,
    lightningFrequencyPerMin: 3,
    stationName: 'Pune AWS 43063 (Official Benchmark Station)',
    stationCoordinates: { lat: 18.5204, lon: 73.8567 },
    conditionLabel: 'Active Monsoon Surge (Heavy Downpour)',
    sourceProvenance: 'NOAA GFS 0.25° NWP + IMD AWS Gauge',
    lastUpdatedIso: new Date().toISOString(),
  },
  BREAK_MONSOON: {
    rainRateMmH: 0.8,
    windSpeedMs: 4.5,
    windDirectionDeg: 310,
    windDirectionCompass: 'NW',
    temperatureC: 32.4,
    relativeHumidityPct: 62,
    surfacePressureHpa: 1008.5,
    capeJkg: 320,
    cloudCoverPct: 35,
    lightningFrequencyPerMin: 0,
    stationName: 'Pune AWS 43063 (Official Benchmark Station)',
    stationCoordinates: { lat: 18.5204, lon: 73.8567 },
    conditionLabel: 'Monsoon Break (Subdued Rainfall / Light Mist)',
    sourceProvenance: 'NOAA GFS 0.25° NWP + IMD AWS Gauge',
    lastUpdatedIso: new Date().toISOString(),
  },
  COASTAL_OROGRAPHIC: {
    rainRateMmH: 28.4,
    windSpeedMs: 21.0,
    windDirectionDeg: 260,
    windDirectionCompass: 'W',
    temperatureC: 27.2,
    relativeHumidityPct: 96,
    surfacePressureHpa: 992.0,
    capeJkg: 1850,
    cloudCoverPct: 98,
    lightningFrequencyPerMin: 1,
    stationName: 'Western Ghats Ridge / Raigad Offshore',
    stationCoordinates: { lat: 18.5158, lon: 73.1822 },
    conditionLabel: 'Low-Level Jet Orographic Inflow (Torrential)',
    sourceProvenance: 'NOAA GFS 0.25° NWP + IMD Coastal AWS',
    lastUpdatedIso: new Date().toISOString(),
  },
  DEPRESSION: {
    rainRateMmH: 48.0,
    windSpeedMs: 26.5,
    windDirectionDeg: 215,
    windDirectionCompass: 'SSW',
    temperatureC: 25.4,
    relativeHumidityPct: 98,
    surfacePressureHpa: 976.0,
    capeJkg: 2600,
    cloudCoverPct: 100,
    lightningFrequencyPerMin: 6,
    stationName: 'Bay of Bengal / Central India Convergence Trough',
    stationCoordinates: { lat: 21.1458, lon: 79.0882 },
    conditionLabel: 'Cyclonic Monsoon Depression Squall',
    sourceProvenance: 'NOAA GFS 0.25° NWP + IMD Doppler Radar',
    lastUpdatedIso: new Date().toISOString(),
  },
  WESTERN_DISTURBANCE: {
    rainRateMmH: 9.2,
    windSpeedMs: 16.5,
    windDirectionDeg: 295,
    windDirectionCompass: 'WNW',
    temperatureC: 22.1,
    relativeHumidityPct: 78,
    surfacePressureHpa: 1002.3,
    capeJkg: 650,
    cloudCoverPct: 80,
    lightningFrequencyPerMin: 0,
    stationName: 'North-West Upper Air Trough (Himalayan Foothills)',
    stationCoordinates: { lat: 28.6139, lon: 77.2090 },
    conditionLabel: 'Mid-Latitude Westerly Disturbance Inflow',
    sourceProvenance: 'NOAA GFS 0.25° NWP + IMD Radiosonde',
    lastUpdatedIso: new Date().toISOString(),
  },
  OTHER: {
    rainRateMmH: 4.2,
    windSpeedMs: 7.0,
    windDirectionDeg: 270,
    windDirectionCompass: 'W',
    temperatureC: 28.5,
    relativeHumidityPct: 74,
    surfacePressureHpa: 1001.0,
    capeJkg: 580,
    cloudCoverPct: 60,
    lightningFrequencyPerMin: 0,
    stationName: 'Peninsular India General Circulation',
    stationCoordinates: { lat: 17.3850, lon: 78.4867 },
    conditionLabel: 'General Monsoon Circulation',
    sourceProvenance: 'NOAA GFS 0.25° NWP + IMD Benchmark',
    lastUpdatedIso: new Date().toISOString(),
  },
};

const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

const safeGetItem = (key: string): string | null => {
  try {
    if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.getItem === 'function') {
      return window.localStorage.getItem(key);
    }
  } catch {
    // Ignore environments where localStorage is not available
  }
  return null;
};

const safeSetItem = (key: string, val: string): void => {
  try {
    if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.setItem === 'function') {
      window.localStorage.setItem(key, val);
    }
  } catch {
    // Ignore environments where localStorage is not available
  }
};

const OPENWEATHER_API_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_OPENWEATHER_API_KEY) ||
  'a3faa380c7a1c0e0f601950834096699';

export const WeatherProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [enabled, setEnabledState] = useState<boolean>(() => {
    const saved = safeGetItem('weather_fx_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  const [mode, setModeState] = useState<WeatherMode>(() => {
    const saved = safeGetItem('weather_fx_mode') as WeatherMode;
    return saved || 'AUTO';
  });

  const [intensity, setIntensityState] = useState<WeatherIntensity>(() => {
    const saved = safeGetItem('weather_fx_intensity') as WeatherIntensity;
    return saved || 'normal';
  });

  const [lightningEnabled, setLightningEnabledState] = useState<boolean>(() => {
    const saved = safeGetItem('weather_fx_lightning');
    return saved !== null ? saved === 'true' : true;
  });

  const [districtRegime, setDistrictRegimeState] = useState<SynopticRegime>('ACTIVE_MONSOON');
  const [stationOverride, setStationOverride] = useState<Partial<WeatherTelemetry>>({});
  const [instantLightningSignal, setInstantLightningSignal] = useState<number>(0);

  // Diurnal Cycle State (Auto synchronized with local clock / station time or manual preview)
  const [timeOfDay, setTimeOfDayState] = useState<TimeOfDay>(() => {
    const saved = safeGetItem('weather_fx_tod') as TimeOfDay;
    return saved || 'auto';
  });

  const setTimeOfDay = useCallback((tod: TimeOfDay) => {
    setTimeOfDayState(tod);
    safeSetItem('weather_fx_tod', tod);
  }, []);

  const [clockDate, setClockDate] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setClockDate(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const effectiveTimeOfDay: EffectiveTimeOfDay =
    timeOfDay === 'auto' ? getDiurnalPeriod(clockDate) : timeOfDay;

  // User Current Location State
  const [userLocation, setUserLocationState] = useState<UserLocationState | null>(() => {
    const saved = safeGetItem('user_geo_location');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const setUserLocation = useCallback((loc: UserLocationState | null) => {
    setUserLocationState(loc);
    if (loc) {
      safeSetItem('user_geo_location', JSON.stringify(loc));
    } else {
      safeSetItem('user_geo_location', '');
    }
  }, []);

  const clearUserLocation = useCallback(() => {
    setUserLocation(null);
    setLocationError(null);
    setStationOverride({});
    setDistrictRegimeState('ACTIVE_MONSOON');
  }, [setUserLocation]);

  const fetchLocationWeather = useCallback(async (
    lat: number,
    lon: number,
    customLocationName?: string
  ): Promise<boolean> => {
    // 1. Try OpenWeatherMap Real-Time API First
    try {
      const owmUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}&appid=${OPENWEATHER_API_KEY}&units=metric`;
      const resp = await fetch(owmUrl);
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.main) {
          const temp = data.main.temp ?? 25;
          const rh = data.main.humidity ?? 60;
          const p = data.main.pressure ?? 1012;
          const wSpeed = data.wind?.speed ?? 4;
          const windDeg = data.wind?.deg ?? 240;
          const clouds = data.clouds?.all ?? 30;
          const rain = data.rain?.['1h'] ?? data.rain?.['3h'] ?? 0;
          const wId = data.weather?.[0]?.id ?? 800;
          const wDesc = data.weather?.[0]?.description ?? 'Current conditions';
          const locName = customLocationName || data.name || `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`;

          // Determine synoptic regime dynamically based on real-time meteorological observation
          let dynamicRegime: SynopticRegime = 'OTHER';
          if (wId >= 200 && wId < 300) {
            dynamicRegime = 'DEPRESSION';
          } else if (wId >= 600 && wId < 700) {
            dynamicRegime = 'WESTERN_DISTURBANCE';
          } else if ((rain > 12 && wSpeed > 10) || (wId >= 502 && wId <= 504)) {
            dynamicRegime = 'COASTAL_OROGRAPHIC';
          } else if ((wId >= 500 && wId < 600) || (wId >= 300 && wId < 400) || rain > 0.8) {
            dynamicRegime = 'ACTIVE_MONSOON';
          } else if (wId === 800 || (rain <= 0.1 && clouds < 30)) {
            dynamicRegime = 'BREAK_MONSOON';
          } else {
            dynamicRegime = 'OTHER';
          }

          setStationOverride({
            rainRateMmH: parseFloat(rain.toFixed(1)),
            windSpeedMs: parseFloat(wSpeed.toFixed(1)),
            windDirectionDeg: windDeg,
            windDirectionCompass: getCompassDirection(windDeg),
            temperatureC: parseFloat(temp.toFixed(1)),
            relativeHumidityPct: Math.round(rh),
            surfacePressureHpa: parseFloat(p.toFixed(1)),
            capeJkg: rain > 15 ? 1800 : rain > 5 ? 1200 : 450,
            cloudCoverPct: Math.round(clouds),
            stationName: `${locName} (Real Weather)`,
            stationCoordinates: { lat, lon },
            conditionLabel: `${wDesc.charAt(0).toUpperCase() + wDesc.slice(1)}`,
            sourceProvenance: 'OpenWeatherMap Real-Time Telemetry',
            lastUpdatedIso: new Date().toISOString(),
          });
          setDistrictRegimeState(dynamicRegime);
          return true;
        }
      }
    } catch (owmErr) {
      console.warn('OpenWeatherMap live fetch attempt fallback:', owmErr);
    }

    // 2. Open-Meteo GFS API Fallback
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,cloud_cover&wind_speed_unit=ms`;
      const resp = await fetch(url);
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.current) {
          const cur = data.current;
          const windDeg = cur.wind_direction_10m ?? 240;
          const rain = cur.precipitation ?? 0;
          const temp = cur.temperature_2m ?? 25;
          const rh = cur.relative_humidity_2m ?? 75;
          const p = cur.surface_pressure ?? 1010;
          const wSpeed = cur.wind_speed_10m ?? 4;
          const clouds = cur.cloud_cover ?? 40;
          const wCode = cur.weather_code ?? 0;

          // Dynamically determine regime label & synoptic match based on physical meteorology & WMO codes
          let dynamicRegime: SynopticRegime = 'ACTIVE_MONSOON';
          let conditionLabel = 'Fair Weather';

          if (wCode >= 95 || rain > 25 || wSpeed > 20) {
            dynamicRegime = 'DEPRESSION';
            conditionLabel = 'Thunderstorm & Squall (Monsoon Depression)';
          } else if ([71, 73, 75, 77, 85, 86].includes(wCode) || (temp < 18 && (windDeg > 260 || windDeg < 40) && wSpeed > 10)) {
            dynamicRegime = 'WESTERN_DISTURBANCE';
            conditionLabel = 'Western Disturbance Flow';
          } else if (rain > 15 && wSpeed > 10 && rh > 85) {
            dynamicRegime = 'COASTAL_OROGRAPHIC';
            conditionLabel = 'Coastal / Orographic Surge';
          } else if (rain > 1.5 || [61, 63, 65, 80, 81, 82].includes(wCode)) {
            dynamicRegime = 'ACTIVE_MONSOON';
            conditionLabel = rain > 10 ? 'Heavy Monsoon Rain' : 'Active Monsoon Showers';
          } else if (rain <= 0.1 && (wCode === 0 || wCode === 1 || clouds < 45)) {
            dynamicRegime = 'BREAK_MONSOON';
            conditionLabel = wCode === 0 ? 'Sunny & Clear Skies' : 'Mostly Clear (Monsoon Break)';
          } else if (rain > 0.1 && rain <= 1.5) {
            dynamicRegime = 'BREAK_MONSOON';
            conditionLabel = 'Subdued Monsoon (Light Drizzle)';
          } else {
            dynamicRegime = 'OTHER';
            conditionLabel = clouds > 70 ? 'Cloudy Circulation' : 'Partly Cloudy';
          }

          setStationOverride({
            rainRateMmH: parseFloat(rain.toFixed(1)),
            windSpeedMs: parseFloat(wSpeed.toFixed(1)),
            windDirectionDeg: windDeg,
            windDirectionCompass: getCompassDirection(windDeg),
            temperatureC: parseFloat(temp.toFixed(1)),
            relativeHumidityPct: Math.round(rh),
            surfacePressureHpa: parseFloat(p.toFixed(1)),
            capeJkg: rain > 15 ? 1800 : rain > 5 ? 1200 : 400,
            cloudCoverPct: Math.round(clouds),
            stationName: `${customLocationName || 'Location'} (${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E)`,
            stationCoordinates: { lat, lon },
            conditionLabel: `Live GPS: ${conditionLabel}`,
            sourceProvenance: 'Live Device GPS + Open-Meteo GFS NWP Feed',
            lastUpdatedIso: new Date().toISOString(),
          });
          setDistrictRegimeState(dynamicRegime);
          return true;
        }
      }
    } catch (fetchErr) {
      console.warn('Real-time coordinates weather fetch fallback:', fetchErr);
    }
    return false;
  }, []);

  const detectUserLocation = useCallback(async (
    onFound?: (coords: { lat: number; lon: number }) => void
  ): Promise<{ lat: number; lon: number } | null> => {
    setIsLocating(true);
    setLocationError(null);

    if (typeof window === 'undefined' || !navigator || !navigator.geolocation) {
      const err = 'Geolocation is not supported by your browser or environment';
      setLocationError(err);
      setIsLocating(false);
      return null;
    }

    return new Promise<{ lat: number; lon: number } | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const accuracy = position.coords.accuracy;

          const locState: UserLocationState = {
            lat,
            lon,
            accuracy,
            name: `My Location (${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E)`,
            isCustomLocation: true,
          };
          setUserLocation(locState);

          // Fetch real-time weather from Open-Meteo GFS API for these exact coordinates
          await fetchLocationWeather(lat, lon);

          if (onFound) {
            onFound({ lat, lon });
          }
          setIsLocating(false);
          resolve({ lat, lon });
        },
        (error) => {
          let msg = 'Could not retrieve your current location';
          if (error.code === 1) {
            msg = 'Location permission denied. Please allow location access.';
          } else if (error.code === 2) {
            msg = 'Location information is currently unavailable.';
          } else if (error.code === 3) {
            msg = 'Location request timed out. Please try again.';
          }
          setLocationError(msg);
          setIsLocating(false);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  }, [fetchLocationWeather, setUserLocation]);

  // Load real-time weather on mount for saved location or check for granted permission
  useEffect(() => {
    let mounted = true;

    const initLocationWeather = async () => {
      if (userLocation && typeof userLocation.lat === 'number' && typeof userLocation.lon === 'number') {
        await fetchLocationWeather(userLocation.lat, userLocation.lon);
        return;
      }

      if (typeof window !== 'undefined' && navigator && navigator.permissions && typeof navigator.permissions.query === 'function') {
        try {
          const perm = await navigator.permissions.query({ name: 'geolocation' });
          if (perm.state === 'granted' && mounted) {
            await detectUserLocation();
          }
        } catch {
          // Permissions API query not supported in some browsers
        }
      }
    };

    initLocationWeather();

    return () => {
      mounted = false;
    };
  }, [detectUserLocation, fetchLocationWeather, userLocation]);

  const setEnabled = useCallback((val: boolean) => {
    setEnabledState(val);
    safeSetItem('weather_fx_enabled', String(val));
  }, []);

  const toggleEnabled = useCallback(() => {
    setEnabledState((prev) => {
      const next = !prev;
      safeSetItem('weather_fx_enabled', String(next));
      return next;
    });
  }, []);

  const setMode = useCallback((newMode: WeatherMode) => {
    setModeState(newMode);
    safeSetItem('weather_fx_mode', newMode);
  }, []);

  const setIntensity = useCallback((newIntensity: WeatherIntensity) => {
    setIntensityState(newIntensity);
    safeSetItem('weather_fx_intensity', newIntensity);
  }, []);

  const setLightningEnabled = useCallback((val: boolean) => {
    setLightningEnabledState(val);
    safeSetItem('weather_fx_lightning', String(val));
  }, []);

  const setDistrictRegime = useCallback((regime: SynopticRegime | string | null | undefined) => {
    if (!regime) return;
    const validRegimes: SynopticRegime[] = [
      'ACTIVE_MONSOON',
      'BREAK_MONSOON',
      'COASTAL_OROGRAPHIC',
      'DEPRESSION',
      'WESTERN_DISTURBANCE',
      'OTHER',
    ];
    if (validRegimes.includes(regime as SynopticRegime)) {
      setDistrictRegimeState(regime as SynopticRegime);
    }
  }, []);

  const setStationTelemetry = useCallback((stationData: Partial<WeatherTelemetry>) => {
    setStationOverride(stationData);
  }, []);

  const triggerInstantLightning = useCallback(() => {
    setInstantLightningSignal(Date.now());
  }, []);

  // Determine effective regime currently rendered
  const effectiveRegime: SynopticRegime =
    mode === 'AUTO' || mode === 'CLEAR'
      ? districtRegime
      : (mode as SynopticRegime);

  const baseTelemetry = REGIME_TELEMETRY[effectiveRegime] || REGIME_TELEMETRY.ACTIVE_MONSOON;
  const intensityMultiplier = intensity === 'subtle' ? 0.5 : intensity === 'dramatic' ? 1.6 : 1.0;

  const telemetry: WeatherTelemetry = useMemo(() => ({
    rainRateMmH: stationOverride.rainRateMmH ?? parseFloat((baseTelemetry.rainRateMmH * intensityMultiplier).toFixed(1)),
    windSpeedMs: stationOverride.windSpeedMs ?? parseFloat((baseTelemetry.windSpeedMs * (0.8 + 0.3 * intensityMultiplier)).toFixed(1)),
    windDirectionDeg: stationOverride.windDirectionDeg ?? baseTelemetry.windDirectionDeg,
    windDirectionCompass: stationOverride.windDirectionCompass ?? getCompassDirection(stationOverride.windDirectionDeg ?? baseTelemetry.windDirectionDeg),
    temperatureC: stationOverride.temperatureC ?? baseTelemetry.temperatureC,
    relativeHumidityPct: stationOverride.relativeHumidityPct ?? baseTelemetry.relativeHumidityPct,
    surfacePressureHpa: stationOverride.surfacePressureHpa ?? baseTelemetry.surfacePressureHpa,
    capeJkg: stationOverride.capeJkg ?? Math.round(baseTelemetry.capeJkg * intensityMultiplier),
    cloudCoverPct: Math.min(100, Math.round(baseTelemetry.cloudCoverPct * (intensity === 'subtle' ? 0.8 : 1))),
    lightningFrequencyPerMin: lightningEnabled ? Math.round(baseTelemetry.lightningFrequencyPerMin * intensityMultiplier) : 0,
    stationName: stationOverride.stationName ?? baseTelemetry.stationName,
    stationCoordinates: stationOverride.stationCoordinates ?? baseTelemetry.stationCoordinates,
    conditionLabel: stationOverride.conditionLabel ?? baseTelemetry.conditionLabel,
    sourceProvenance: stationOverride.sourceProvenance ?? baseTelemetry.sourceProvenance,
    lastUpdatedIso: stationOverride.lastUpdatedIso ?? baseTelemetry.lastUpdatedIso,
  }), [stationOverride, baseTelemetry, intensityMultiplier, lightningEnabled]);

  const contextValue = useMemo(() => ({
    enabled,
    mode,
    effectiveRegime,
    timeOfDay,
    effectiveTimeOfDay,
    intensity,
    lightningEnabled,
    telemetry,
    instantLightningSignal,
    userLocation,
    isLocating,
    locationError,
    setEnabled,
    toggleEnabled,
    setMode,
    setTimeOfDay,
    setIntensity,
    setLightningEnabled,
    setDistrictRegime,
    setStationTelemetry,
    triggerInstantLightning,
    detectUserLocation,
    fetchLocationWeather,
    clearUserLocation,
    setUserLocation,
  }), [
    enabled,
    mode,
    effectiveRegime,
    timeOfDay,
    effectiveTimeOfDay,
    intensity,
    lightningEnabled,
    telemetry,
    instantLightningSignal,
    userLocation,
    isLocating,
    locationError,
    setEnabled,
    toggleEnabled,
    setMode,
    setTimeOfDay,
    setIntensity,
    setLightningEnabled,
    setDistrictRegime,
    setStationTelemetry,
    triggerInstantLightning,
    detectUserLocation,
    fetchLocationWeather,
    clearUserLocation,
    setUserLocation,
  ]);

  return (
    <WeatherContext.Provider value={contextValue}>
      {children}
    </WeatherContext.Provider>
  );
};

const DEFAULT_WEATHER_CONTEXT: WeatherContextType = {
  enabled: true,
  mode: 'AUTO',
  effectiveRegime: 'ACTIVE_MONSOON',
  timeOfDay: 'auto',
  effectiveTimeOfDay: 'evening',
  intensity: 'normal',
  lightningEnabled: true,
  telemetry: REGIME_TELEMETRY.ACTIVE_MONSOON,
  instantLightningSignal: 0,
  userLocation: null,
  isLocating: false,
  locationError: null,
  setEnabled: () => {},
  toggleEnabled: () => {},
  setMode: () => {},
  setTimeOfDay: () => {},
  setIntensity: () => {},
  setLightningEnabled: () => {},
  setDistrictRegime: () => {},
  setStationTelemetry: () => {},
  triggerInstantLightning: () => {},
  detectUserLocation: async () => null,
  fetchLocationWeather: async () => false,
  clearUserLocation: () => {},
  setUserLocation: () => {},
};

export const useWeather = (): WeatherContextType => {
  const context = useContext(WeatherContext);
  if (!context) {
    return DEFAULT_WEATHER_CONTEXT;
  }
  return context;
};

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SynopticRegime } from '../types/api';

export type WeatherMode = 'AUTO' | SynopticRegime | 'CLEAR';
export type WeatherIntensity = 'subtle' | 'normal' | 'dramatic';

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

interface WeatherContextType {
  enabled: boolean;
  mode: WeatherMode;
  effectiveRegime: SynopticRegime;
  intensity: WeatherIntensity;
  lightningEnabled: boolean;
  telemetry: WeatherTelemetry;
  instantLightningSignal: number;
  setEnabled: (enabled: boolean) => void;
  toggleEnabled: () => void;
  setMode: (mode: WeatherMode) => void;
  setIntensity: (intensity: WeatherIntensity) => void;
  setLightningEnabled: (enabled: boolean) => void;
  setDistrictRegime: (regime: SynopticRegime | string | null | undefined) => void;
  setStationTelemetry: (stationData: Partial<WeatherTelemetry>) => void;
  triggerInstantLightning: () => void;
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

  const setEnabled = (val: boolean) => {
    setEnabledState(val);
    safeSetItem('weather_fx_enabled', String(val));
  };

  const toggleEnabled = () => {
    setEnabled(!enabled);
  };

  const setMode = (newMode: WeatherMode) => {
    setModeState(newMode);
    safeSetItem('weather_fx_mode', newMode);
  };

  const setIntensity = (newIntensity: WeatherIntensity) => {
    setIntensityState(newIntensity);
    safeSetItem('weather_fx_intensity', newIntensity);
  };

  const setLightningEnabled = (val: boolean) => {
    setLightningEnabledState(val);
    safeSetItem('weather_fx_lightning', String(val));
  };

  const setDistrictRegime = (regime: SynopticRegime | string | null | undefined) => {
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
  };

  const setStationTelemetry = (stationData: Partial<WeatherTelemetry>) => {
    setStationOverride(stationData);
  };

  const triggerInstantLightning = () => {
    setInstantLightningSignal(Date.now());
  };

  // Determine effective regime currently rendered
  const effectiveRegime: SynopticRegime =
    mode === 'AUTO' || mode === 'CLEAR'
      ? districtRegime
      : (mode as SynopticRegime);

  const baseTelemetry = REGIME_TELEMETRY[effectiveRegime] || REGIME_TELEMETRY.ACTIVE_MONSOON;
  const intensityMultiplier = intensity === 'subtle' ? 0.5 : intensity === 'dramatic' ? 1.6 : 1.0;

  const telemetry: WeatherTelemetry = {
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
  };

  return (
    <WeatherContext.Provider
      value={{
        enabled,
        mode,
        effectiveRegime,
        intensity,
        lightningEnabled,
        telemetry,
        instantLightningSignal,
        setEnabled,
        toggleEnabled,
        setMode,
        setIntensity,
        setLightningEnabled,
        setDistrictRegime,
        setStationTelemetry,
        triggerInstantLightning,
      }}
    >
      {children}
    </WeatherContext.Provider>
  );
};

const DEFAULT_WEATHER_CONTEXT: WeatherContextType = {
  enabled: true,
  mode: 'AUTO',
  effectiveRegime: 'ACTIVE_MONSOON',
  intensity: 'normal',
  lightningEnabled: true,
  telemetry: REGIME_TELEMETRY.ACTIVE_MONSOON,
  instantLightningSignal: 0,
  setEnabled: () => {},
  toggleEnabled: () => {},
  setMode: () => {},
  setIntensity: () => {},
  setLightningEnabled: () => {},
  setDistrictRegime: () => {},
  setStationTelemetry: () => {},
  triggerInstantLightning: () => {},
};

export const useWeather = (): WeatherContextType => {
  const context = useContext(WeatherContext);
  if (!context) {
    return DEFAULT_WEATHER_CONTEXT;
  }
  return context;
};

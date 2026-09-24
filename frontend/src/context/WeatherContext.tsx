import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SynopticRegime } from '../types/api';

export type WeatherMode = 'AUTO' | SynopticRegime | 'CLEAR';
export type WeatherIntensity = 'subtle' | 'normal' | 'dramatic';

export interface WeatherTelemetry {
  rainRateMmH: number;
  windSpeedMs: number;
  cloudCoverPct: number;
  lightningFrequencyPerMin: number;
}

interface WeatherContextType {
  enabled: boolean;
  mode: WeatherMode;
  effectiveRegime: SynopticRegime;
  intensity: WeatherIntensity;
  lightningEnabled: boolean;
  telemetry: WeatherTelemetry;
  setEnabled: (enabled: boolean) => void;
  toggleEnabled: () => void;
  setMode: (mode: WeatherMode) => void;
  setIntensity: (intensity: WeatherIntensity) => void;
  setLightningEnabled: (enabled: boolean) => void;
  setDistrictRegime: (regime: SynopticRegime | string | null | undefined) => void;
}

const REGIME_TELEMETRY: Record<SynopticRegime, WeatherTelemetry> = {
  ACTIVE_MONSOON: {
    rainRateMmH: 18.5,
    windSpeedMs: 14.2,
    cloudCoverPct: 95,
    lightningFrequencyPerMin: 2,
  },
  BREAK_MONSOON: {
    rainRateMmH: 1.2,
    windSpeedMs: 4.8,
    cloudCoverPct: 40,
    lightningFrequencyPerMin: 0,
  },
  COASTAL_OROGRAPHIC: {
    rainRateMmH: 26.4,
    windSpeedMs: 19.5,
    cloudCoverPct: 88,
    lightningFrequencyPerMin: 1,
  },
  DEPRESSION: {
    rainRateMmH: 42.0,
    windSpeedMs: 24.8,
    cloudCoverPct: 100,
    lightningFrequencyPerMin: 5,
  },
  WESTERN_DISTURBANCE: {
    rainRateMmH: 8.5,
    windSpeedMs: 16.0,
    cloudCoverPct: 75,
    lightningFrequencyPerMin: 0,
  },
  OTHER: {
    rainRateMmH: 4.0,
    windSpeedMs: 6.5,
    cloudCoverPct: 55,
    lightningFrequencyPerMin: 0,
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

  // Determine effective regime currently rendered
  const effectiveRegime: SynopticRegime =
    mode === 'AUTO' || mode === 'CLEAR'
      ? districtRegime
      : (mode as SynopticRegime);

  const baseTelemetry = REGIME_TELEMETRY[effectiveRegime] || REGIME_TELEMETRY.ACTIVE_MONSOON;
  const intensityMultiplier = intensity === 'subtle' ? 0.5 : intensity === 'dramatic' ? 1.6 : 1.0;

  const telemetry: WeatherTelemetry = {
    rainRateMmH: parseFloat((baseTelemetry.rainRateMmH * intensityMultiplier).toFixed(1)),
    windSpeedMs: parseFloat((baseTelemetry.windSpeedMs * (0.8 + 0.3 * intensityMultiplier)).toFixed(1)),
    cloudCoverPct: Math.min(100, Math.round(baseTelemetry.cloudCoverPct * (intensity === 'subtle' ? 0.8 : 1))),
    lightningFrequencyPerMin: lightningEnabled ? Math.round(baseTelemetry.lightningFrequencyPerMin * intensityMultiplier) : 0,
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
        setEnabled,
        toggleEnabled,
        setMode,
        setIntensity,
        setLightningEnabled,
        setDistrictRegime,
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
  setEnabled: () => {},
  toggleEnabled: () => {},
  setMode: () => {},
  setIntensity: () => {},
  setLightningEnabled: () => {},
  setDistrictRegime: () => {},
};

export const useWeather = (): WeatherContextType => {
  const context = useContext(WeatherContext);
  if (!context) {
    return DEFAULT_WEATHER_CONTEXT;
  }
  return context;
};


import React, { useState, useEffect } from 'react';
import {
  CloudRain,
  Wind,
  Sun,
  Zap,
  Waves,
  Snowflake,
  Compass,
  Thermometer,
  Droplets,
  Gauge,
  Activity,
  ChevronDown,
  ChevronUp,
  Radio,
  Sliders,
} from 'lucide-react';
import { useWeather, WeatherIntensity } from '../../context/WeatherContext';
import { SynopticRegime } from '../../types/api';

interface RealtimeWeatherHUDProps {
  isDarkMode?: boolean;
}

export const RealtimeWeatherHUD: React.FC<RealtimeWeatherHUDProps> = ({ isDarkMode = true }) => {
  const {
    enabled,
    effectiveRegime,
    telemetry,
    intensity,
    setIntensity,
    setMode,
    triggerInstantLightning,
  } = useWeather();

  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    // Default collapsed on smaller screens, expanded on desktop
    if (typeof window !== 'undefined') {
      return window.innerWidth > 1024;
    }
    return false;
  });

  const [currentTime, setCurrentTime] = useState<string>('');

  // Live ticking clock (seconds update)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-IN', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'Asia/Kolkata',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!enabled) return null;

  const getRegimeIcon = (regime: SynopticRegime) => {
    switch (regime) {
      case 'ACTIVE_MONSOON':
        return <CloudRain className="h-4 w-4 text-sky-500 animate-bounce" />;
      case 'BREAK_MONSOON':
        return <Sun className="h-4 w-4 text-amber-500" />;
      case 'COASTAL_OROGRAPHIC':
        return <Waves className="h-4 w-4 text-teal-500" />;
      case 'DEPRESSION':
        return <Zap className="h-4 w-4 text-purple-500 animate-pulse" />;
      case 'WESTERN_DISTURBANCE':
        return <Snowflake className="h-4 w-4 text-cyan-400" />;
      case 'OTHER':
      default:
        return <Wind className="h-4 w-4 text-slate-400" />;
    }
  };

  const regimesQuickList: { id: SynopticRegime; label: string; icon: React.ReactNode }[] = [
    { id: 'ACTIVE_MONSOON', label: 'Active', icon: <CloudRain className="h-3 w-3" /> },
    { id: 'BREAK_MONSOON', label: 'Break', icon: <Sun className="h-3 w-3" /> },
    { id: 'COASTAL_OROGRAPHIC', label: 'Coastal', icon: <Waves className="h-3 w-3" /> },
    { id: 'DEPRESSION', label: 'Depression', icon: <Zap className="h-3 w-3" /> },
    { id: 'WESTERN_DISTURBANCE', label: 'WD', icon: <Snowflake className="h-3 w-3" /> },
  ];

  return (
    <aside
      aria-label="Real-time Meteorological Station & Atmosphere Telemetry"
      className="fixed bottom-4 left-4 z-40 max-w-sm sm:max-w-md w-[calc(100vw-2rem)] sm:w-auto font-sans select-none pointer-events-auto transition-all duration-300"
    >
      <div
        className={`rounded-2xl border backdrop-blur-xl shadow-2xl transition-all duration-300 ${
          isDarkMode
            ? 'bg-slate-950/85 border-slate-800 text-white shadow-indigo-950/40'
            : 'bg-white/90 border-slate-200 text-slate-900 shadow-slate-300/60'
        }`}
      >
        {/* Header / Summary Bar (Always Visible) */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between px-3.5 py-2.5 cursor-pointer hover:opacity-95 transition"
        >
          <div className="flex items-center space-x-2.5 min-w-0">
            <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 shrink-0">
              {getRegimeIcon(effectiveRegime)}
            </span>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                <span className="text-[11px] font-bold tracking-tight uppercase text-emerald-600 dark:text-emerald-400 truncate">
                  Real-Time Weather
                </span>
                <span className="text-[10px] font-mono text-slate-400 hidden xs:inline">
                  [{currentTime || 'IST'}]
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate">
                {telemetry.stationName.split('(')[0]}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0 ml-2">
            {/* Quick Metrics in Pill */}
            <div className="hidden sm:flex items-center space-x-2 text-[11px] font-mono font-bold">
              <span className="text-sky-600 dark:text-sky-400">{telemetry.temperatureC}°C</span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-indigo-600 dark:text-indigo-400">{telemetry.rainRateMmH} mm/h</span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-teal-600 dark:text-teal-400">
                {telemetry.windSpeedMs} m/s {telemetry.windDirectionCompass}
              </span>
            </div>

            <button
              type="button"
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label={isExpanded ? 'Collapse weather HUD' : 'Expand weather HUD'}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Expanded Detailed Real-Time Telemetry Panels */}
        {isExpanded && (
          <div className="px-4 pb-3.5 pt-1 space-y-3 border-t border-slate-100 dark:border-slate-800/80 animate-in fade-in zoom-in-95 duration-150">
            {/* Regime Condition Banner */}
            <div className="flex items-center justify-between text-xs pt-1">
              <div className="flex items-center space-x-1.5">
                <Radio className="h-3.5 w-3.5 text-indigo-500" />
                <span className="font-bold text-slate-800 dark:text-slate-100">
                  {telemetry.conditionLabel}
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {telemetry.stationCoordinates.lat.toFixed(2)}°N, {telemetry.stationCoordinates.lon.toFixed(2)}°E
              </span>
            </div>

            {/* 6 Real-Time Atmospheric Gauges Grid */}
            <div className="grid grid-cols-3 gap-2">
              {/* Gauge 1: Precipitation Rate */}
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-center">
                <div className="flex items-center justify-center space-x-1 text-[10px] text-slate-400 font-semibold mb-0.5">
                  <Droplets className="h-3 w-3 text-sky-500" />
                  <span>Rain Rate</span>
                </div>
                <div className="text-sm font-bold font-mono text-sky-600 dark:text-sky-400">
                  {telemetry.rainRateMmH} <span className="text-[9px] font-normal text-slate-400">mm/h</span>
                </div>
              </div>

              {/* Gauge 2: Air Temperature */}
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-center">
                <div className="flex items-center justify-center space-x-1 text-[10px] text-slate-400 font-semibold mb-0.5">
                  <Thermometer className="h-3 w-3 text-amber-500" />
                  <span>Temperature</span>
                </div>
                <div className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400">
                  {telemetry.temperatureC} <span className="text-[9px] font-normal text-slate-400">°C</span>
                </div>
              </div>

              {/* Gauge 3: Relative Humidity */}
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-center">
                <div className="flex items-center justify-center space-x-1 text-[10px] text-slate-400 font-semibold mb-0.5">
                  <Activity className="h-3 w-3 text-teal-500" />
                  <span>Humidity</span>
                </div>
                <div className="text-sm font-bold font-mono text-teal-600 dark:text-teal-400">
                  {telemetry.relativeHumidityPct} <span className="text-[9px] font-normal text-slate-400">%</span>
                </div>
              </div>

              {/* Gauge 4: Wind Vector & Compass */}
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-center">
                <div className="flex items-center justify-center space-x-1 text-[10px] text-slate-400 font-semibold mb-0.5">
                  <Compass
                    className="h-3 w-3 text-indigo-500 transition-transform duration-500"
                    style={{ transform: `rotate(${telemetry.windDirectionDeg}deg)` }}
                  />
                  <span>Wind</span>
                </div>
                <div className="text-sm font-bold font-mono text-indigo-600 dark:text-indigo-400">
                  {telemetry.windSpeedMs}{' '}
                  <span className="text-[9px] font-normal text-slate-400">
                    m/s {telemetry.windDirectionCompass}
                  </span>
                </div>
              </div>

              {/* Gauge 5: Surface Pressure */}
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-center">
                <div className="flex items-center justify-center space-x-1 text-[10px] text-slate-400 font-semibold mb-0.5">
                  <Gauge className="h-3 w-3 text-purple-500" />
                  <span>Pressure</span>
                </div>
                <div className="text-sm font-bold font-mono text-purple-600 dark:text-purple-400">
                  {telemetry.surfacePressureHpa}{' '}
                  <span className="text-[9px] font-normal text-slate-400">hPa</span>
                </div>
              </div>

              {/* Gauge 6: CAPE (Convective Energy) */}
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-center">
                <div className="flex items-center justify-center space-x-1 text-[10px] text-slate-400 font-semibold mb-0.5">
                  <Zap className="h-3 w-3 text-rose-500" />
                  <span>CAPE</span>
                </div>
                <div className="text-sm font-bold font-mono text-rose-600 dark:text-rose-400">
                  {telemetry.capeJkg}{' '}
                  <span className="text-[9px] font-normal text-slate-400">J/kg</span>
                </div>
              </div>
            </div>

            {/* Quick Interactive Actions & Live Triggers */}
            <div className="flex items-center justify-between pt-1 gap-2">
              {/* Regime Quick Switching Chips */}
              <div className="flex items-center space-x-1 overflow-x-auto py-0.5">
                {regimesQuickList.map((r) => {
                  const isSel = effectiveRegime === r.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setMode(r.id)}
                      title={`Simulate ${r.label}`}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center space-x-1 border transition cursor-pointer shrink-0 ${
                        isSel
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                      }`}
                    >
                      <span>{r.icon}</span>
                      <span>{r.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Electric Lightning Trigger Button */}
              <button
                onClick={triggerInstantLightning}
                title="Strike lightning immediately across the sky"
                className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center space-x-1 shadow-sm transition cursor-pointer shrink-0"
              >
                <Zap className="h-3 w-3 fill-slate-950" />
                <span>Strike</span>
              </button>
            </div>

            {/* Data Source Provenance Tag */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5 font-mono border-t border-slate-100 dark:border-slate-800/80">
              <span className="truncate">Feed: {telemetry.sourceProvenance}</span>
              <span className="text-emerald-500 shrink-0 font-bold">● ACTIVE</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

import React, { useMemo } from 'react';
import {
  CloudRain,
  Compass,
  Activity,
  MapPin,
  AlertTriangle,
  TrendingDown,
  ChevronRight,
  Droplets,
  Wind,
  Gauge,
  Thermometer,
  Sparkles,
  Waves,
  Zap,
} from 'lucide-react';
import {
  DistrictItem,
  CombinedForecastResponse,
  DistrictForecastResponse,
  AppRoute,
  SynopticRegime,
} from '../types/api';
import { RainfallMap } from '../components/Map/RainfallMap';
import { ErrorBoundary } from '../components/Common/ErrorBoundary';
import { useWeather } from '../context/WeatherContext';

interface DashboardViewProps {
  districts: DistrictItem[];
  selectedDistrictId: string;
  onSelectDistrict: (districtId: string) => void;
  districtForecast: DistrictForecastResponse | null;
  activeForecast: CombinedForecastResponse | null;
  isLoading: boolean;
  geoJsonData: any | null;
  isDarkMode: boolean;
  onNavigate: (route: AppRoute) => void;
}

const getRainfallCategory = (mm: number) => {
  if (mm <= 0.1) return { label: 'Dry / Trace', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' };
  if (mm < 2.5) return { label: 'Very Light Rain', color: 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300' };
  if (mm < 7.5) return { label: 'Light Rain', color: 'bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200' };
  if (mm < 35.5) return { label: 'Moderate Rain', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200' };
  if (mm < 64.5) return { label: 'Rather Heavy Rain', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200' };
  if (mm < 115.6) return { label: 'Heavy Rain', color: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200' };
  return { label: 'Very Heavy Rain', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200' };
};

const getFriendlyRegimeName = (regimeKey: string) => {
  switch (regimeKey) {
    case 'ACTIVE_MONSOON':
      return 'Active Monsoon';
    case 'BREAK_MONSOON':
      return 'Break Monsoon';
    case 'COASTAL_OROGRAPHIC':
      return 'Coastal / Offshore Trough';
    case 'DEPRESSION':
      return 'Monsoon Depression';
    case 'WESTERN_DISTURBANCE':
      return 'Western Disturbance';
    case 'OTHER':
      return 'General Circulation';
    default:
      return regimeKey.replace(/_/g, ' ');
  }
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  districts,
  selectedDistrictId,
  onSelectDistrict,
  districtForecast,
  activeForecast,
  isLoading,
  geoJsonData,
  isDarkMode,
  onNavigate,
}) => {
  const { telemetry } = useWeather();

  const isPuneBenchmark = districtForecast?.coverage_status === 'BENCHMARK_ACTIVE';
  const isProcessedBenchmark =
    districtForecast?.coverage_status === 'PROCESSED_BENCHMARK' ||
    districtForecast?.forecast_mode === 'PROCESSED_DATA_REPLAY';
  const isAvailable = Boolean(activeForecast);

  // Selected district metadata
  const currentDistrict = districts.find((d) => d.district_id === selectedDistrictId);
  const districtName = districtForecast?.name || currentDistrict?.name || 'Selected Station';

  const quickStations = [
    { id: 'pune', label: 'Pune', badge: 'Benchmark' },
    { id: 'mumbai', label: 'Mumbai' },
    { id: 'nagpur', label: 'Nagpur' },
    { id: 'kolkata', label: 'Kolkata' },
    { id: 'new_delhi', label: 'New Delhi' },
    { id: 'bengaluru_urban', label: 'Bengaluru' },
  ];

  const rainCat = activeForecast ? getRainfallCategory(activeForecast.corrected_rainfall_mm) : null;
  const rawRain = activeForecast?.raw_nwp_rainfall_mm ?? 0;
  const correctedRain = activeForecast?.corrected_rainfall_mm ?? 0;
  const delta = correctedRain - rawRain;
  const regime = activeForecast?.predicted_regime ?? '';
  const regimeConfidence = activeForecast?.regime_probabilities[regime]
    ? Math.round(activeForecast.regime_probabilities[regime] * 100)
    : 0;

  // Find elevated risk
  const elevatedProb = activeForecast?.heavy_rainfall_probabilities
    ?.slice()
    .reverse()
    .find((p) => p.advisory_status === 'ELEVATED_RISK');



  return (
    <div className="space-y-6">
      {/* 1. Realistic Hero Station Weather Overview Card */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5 transition-all">
        {/* Top Meta Bar & Fast Station Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {districtName}
                </h1>
                {isPuneBenchmark ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                    Benchmark Station
                  </span>
                ) : isProcessedBenchmark ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-300/60">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-500 mr-1.5" />
                    Real Data (NOAA GFS)
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-300/60">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mr-1.5" />
                    Unmonitored
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {currentDistrict?.state || 'India'} • {currentDistrict?.latitude ? `${currentDistrict.latitude.toFixed(2)}°N, ${currentDistrict.longitude.toFixed(2)}°E` : '18.52°N, 73.86°E'}
              </p>
            </div>
          </div>

          {/* Quick Station Switcher Pills & Dropdown */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {quickStations.map((st) => (
                <button
                  key={st.id}
                  onClick={() => onSelectDistrict(st.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                    selectedDistrictId === st.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{st.label}</span>
                  {st.badge && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </button>
              ))}
            </div>

            <select
              value={selectedDistrictId}
              onChange={(e) => onSelectDistrict(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {districts.map((d) => (
                <option key={d.district_id} value={d.district_id}>
                  {d.name} ({d.state})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Realistic Physical Conditions Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
          {/* 1. Air Temp */}
          <div className="rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 p-3.5 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-between mb-1">
              <span>Temperature</span>
              <Thermometer className="h-3.5 w-3.5 text-amber-500" />
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {telemetry.temperatureC.toFixed(1)}°C
            </div>
            <span className="text-[10px] text-slate-400">
              Feels like {(telemetry.temperatureC + 1.8).toFixed(1)}°C
            </span>
          </div>

          {/* 2. AI Rain Forecast */}
          <div className="rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 p-3.5 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-between mb-1">
              <span>AI Rainfall</span>
              <Droplets className="h-3.5 w-3.5 text-sky-500" />
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-sky-600 dark:text-sky-400">
              {isAvailable && activeForecast ? `${activeForecast.corrected_rainfall_mm.toFixed(1)} mm` : '—'}
            </div>
            <span className="text-[10px] text-slate-400 truncate block">
              {rainCat?.label || 'General Forecast'}
            </span>
          </div>

          {/* 3. Model Bias Delta */}
          <div className="rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 p-3.5 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-between mb-1">
              <span>Model Bias</span>
              <TrendingDown className="h-3.5 w-3.5 text-indigo-500" />
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {isAvailable && activeForecast ? `${delta >= 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)}` : '—'}{' '}
              <span className="text-xs font-normal text-slate-400">mm</span>
            </div>
            <span className="text-[10px] text-slate-400 truncate block">
              Raw GFS: {rawRain.toFixed(1)} mm
            </span>
          </div>

          {/* 4. Wind Vector */}
          <div className="rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 p-3.5 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-between mb-1">
              <span>Wind</span>
              <Wind className="h-3.5 w-3.5 text-teal-500" />
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {telemetry.windSpeedMs.toFixed(1)}{' '}
              <span className="text-xs font-normal text-slate-400">m/s</span>
            </div>
            <span className="text-[10px] text-slate-400">
              {telemetry.windDirectionCompass} ({telemetry.windDirectionDeg}°)
            </span>
          </div>

          {/* 5. Humidity */}
          <div className="rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 p-3.5 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-between mb-1">
              <span>Humidity</span>
              <Activity className="h-3.5 w-3.5 text-blue-500" />
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {telemetry.relativeHumidityPct}%
            </div>
            <span className="text-[10px] text-slate-400">
              {telemetry.relativeHumidityPct > 85 ? 'High Moisture' : 'Moderate'}
            </span>
          </div>

          {/* 6. Pressure */}
          <div className="rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 p-3.5 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-between mb-1">
              <span>Pressure</span>
              <Gauge className="h-3.5 w-3.5 text-emerald-500" />
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {telemetry.surfacePressureHpa.toFixed(0)}{' '}
              <span className="text-xs font-normal text-slate-400">hPa</span>
            </div>
            <span className="text-[10px] text-slate-400">Barometric Normal</span>
          </div>
        </div>
      </div>

      {/* 2. Four Clean, Impactful Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: AI Rainfall Forecast */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              AI Rainfall Forecast
            </span>
            <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <CloudRain className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black font-mono text-slate-900 dark:text-white">
              {isAvailable && activeForecast ? `${activeForecast.corrected_rainfall_mm.toFixed(1)}` : 'N/A'}
            </span>
            <span className="text-sm font-semibold text-slate-500">mm</span>
            {rainCat && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto ${rainCat.color}`}>
                {rainCat.label}
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 pt-1 flex items-center justify-between">
            <span>Raw NWP: {isAvailable && activeForecast ? `${rawRain.toFixed(1)} mm` : 'N/A'}</span>
            {isAvailable && activeForecast && (
              <span className={`font-semibold ${delta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                {delta >= 0 ? `+${delta.toFixed(1)} mm bias` : `${delta.toFixed(1)} mm bias`}
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Weather Regime */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Circulation Regime
            </span>
            <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Compass className="h-4 w-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white truncate">
            {isAvailable && activeForecast ? getFriendlyRegimeName(activeForecast.predicted_regime) : 'N/A'}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 pt-1 flex items-center justify-between">
            <span>Model Confidence</span>
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
              {isAvailable && activeForecast ? `${regimeConfidence}%` : 'N/A'}
            </span>
          </div>
          {isAvailable && activeForecast && (
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(regimeConfidence, 100)}%` }}
              />
            </div>
          )}
        </div>

        {/* Card 3: Heavy Rain Advisory Risk */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Heavy Rain Risk
            </span>
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            {elevatedProb ? (
              <span className="text-lg font-extrabold text-amber-600 dark:text-amber-400 truncate">
                Elevated Risk (≥{elevatedProb.threshold_mm} mm)
              </span>
            ) : (
              <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                Normal Advisory
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 pt-1 flex items-center justify-between">
            <span>Risk of &gt;15.6mm</span>
            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
              {isAvailable && activeForecast && activeForecast.heavy_rainfall_probabilities?.length
                ? `${((activeForecast.heavy_rainfall_probabilities.find((p) => p.threshold_mm === 15.6)?.exceedance_probability ?? 0) * 100).toFixed(1)}%`
                : 'N/A'}
            </span>
          </div>
        </div>

        {/* Card 4: Location & Benchmark Status */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Monitoring Station
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <MapPin className="h-4 w-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white truncate">
            {currentDistrict?.name || 'Pune'}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 pt-1 flex items-center justify-between">
            <span>Status</span>
            {isPuneBenchmark ? (
              <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                Benchmark Active
              </span>
            ) : isProcessedBenchmark ? (
              <span className="inline-flex items-center text-[10px] font-bold text-sky-600 dark:text-sky-400">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500 mr-1" />
                Real Data (NOAA GFS)
              </span>
            ) : (
              <span className="inline-flex items-center text-[10px] font-bold text-amber-600 dark:text-amber-400">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mr-1" />
                Unmonitored
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Main Hero Grid: Interactive Map (8 cols) + Meteorological Risk & Bias Panel (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Interactive GIS Cartography Map */}
        <div className="lg:col-span-8 space-y-4">
          <ErrorBoundary fallbackTitle="Map Display Error">
            <RainfallMap
              districts={districts}
              selectedDistrictId={selectedDistrictId}
              onSelectDistrict={onSelectDistrict}
              activeForecast={activeForecast}
              geoJsonData={geoJsonData}
              isDarkMode={isDarkMode}
            />
          </ErrorBoundary>
        </div>

        {/* Right Column (4 cols): Detailed Forecast Intelligence & Risk Ladder */}
        <div className="lg:col-span-4 space-y-4">
          {/* Station Forecast Details Card */}
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Target Station
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                  {districtName}
                </h3>
              </div>
              {isPuneBenchmark ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Ground Truth Active
                </span>
              ) : isProcessedBenchmark ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  Real Data (NOAA GFS)
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  Unmonitored
                </span>
              )}
            </div>

            {activeForecast ? (
              <div className="space-y-4">
                {/* Bias Correction Delta Bar */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3.5 space-y-2 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    NWP vs AI Bias Correction
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Raw NOAA GFS</span>
                      <span className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200">
                        {rawRain.toFixed(1)} mm
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block">
                        AI Corrected
                      </span>
                      <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {correctedRain.toFixed(1)} mm
                      </span>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                    <span>Correction Adjustment</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {delta >= 0 ? `+${delta.toFixed(2)} mm` : `${delta.toFixed(2)} mm`}
                    </span>
                  </div>
                </div>

                {/* Exceedance Risk Ladder */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Heavy Rain Risk Outlook (Exceedance Probability)
                  </span>
                  <div className="space-y-1.5">
                    {activeForecast.heavy_rainfall_probabilities?.map((p) => {
                      const pct = Math.round(p.exceedance_probability * 100);
                      const isHigh = p.advisory_status === 'ELEVATED_RISK';
                      return (
                        <div
                          key={p.threshold_mm}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-xs"
                        >
                          <span className="text-slate-600 dark:text-slate-400 font-medium">
                            ≥{p.threshold_mm} mm ({p.threshold_name})
                          </span>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  isHigh ? 'bg-amber-500' : 'bg-indigo-500'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span
                              className={`font-mono text-xs font-semibold ${
                                isHigh
                                  ? 'text-amber-600 dark:text-amber-400 font-bold'
                                  : 'text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {pct}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Submodel Attribution */}
                <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                  <span>Routing Submodel</span>
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {activeForecast.selected_model}
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center space-y-3">
                <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto" />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Data unavailable for {districtName}. Select Pune for live benchmark.
                </p>
                <button
                  onClick={() => onSelectDistrict('pune')}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white cursor-pointer hover:bg-indigo-700 transition"
                >
                  View Pune Benchmark
                </button>
              </div>
            )}
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onNavigate('forecast')}
              className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition text-left cursor-pointer group shadow-xs"
            >
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                <span>Forecast Explorer</span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Cartography & station details
              </span>
            </button>

            <button
              onClick={() => onNavigate('verification')}
              className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 transition text-left cursor-pointer group shadow-xs"
            >
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                <span>Model Verification</span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Held-out test cohort skill
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

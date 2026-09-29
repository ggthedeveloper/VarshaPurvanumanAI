import React from 'react';
import {
  CloudRain,
  Compass,
  Activity,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  ArrowRight,
  ShieldCheck,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  DistrictItem,
  CombinedForecastResponse,
  DistrictForecastResponse,
} from '../types/api';
import { useWeather } from '../context/WeatherContext';
import { RainfallMap } from '../components/Map/RainfallMap';
import { ForecastSummaryCards } from '../components/Cards/ForecastSummaryCards';
import { DistrictDetailPanel } from '../components/Panels/DistrictDetailPanel';
import { WeatherRegimePanel } from '../components/Panels/WeatherRegimePanel';
import { ProbabilityPanel } from '../components/Panels/ProbabilityPanel';
import { ErrorBoundary } from '../components/Common/ErrorBoundary';
import { getNearestDistrict } from '../data/defaultCatalog';

interface ForecastViewProps {
  districts: DistrictItem[];
  selectedDistrictId: string;
  onSelectDistrict: (districtId: string) => void;
  districtForecast: DistrictForecastResponse | null;
  activeForecast: CombinedForecastResponse | null;
  isLoading: boolean;
  geoJsonData: any | null;
  isDarkMode: boolean;
}

export const ForecastView: React.FC<ForecastViewProps> = ({
  districts,
  selectedDistrictId,
  onSelectDistrict,
  districtForecast,
  activeForecast,
  isLoading,
  geoJsonData,
  isDarkMode,
}) => {
  const { userLocation } = useWeather();
  const isPuneBenchmark = districtForecast?.coverage_status === 'BENCHMARK_ACTIVE';
  const isOperational =
    !isPuneBenchmark &&
    (districtForecast?.coverage_status === 'OPERATIONAL_NWP' ||
      districtForecast?.coverage_status === 'OPERATIONAL_ACTIVE' ||
      districtForecast?.coverage_status === 'PROCESSED_BENCHMARK' ||
      districtForecast?.forecast_mode === 'OPERATIONAL_LIVE_WEATHER' ||
      districtForecast?.forecast_mode === 'PROCESSED_DATA_REPLAY' ||
      districtForecast?.forecast_mode === 'OPERATIONAL_NWP' ||
      Boolean(districtForecast?.forecast));
  const isProcessedBenchmark = isOperational;
  const currentDistrict = districts.find((d) => d.district_id === selectedDistrictId);
  const districtName = districtForecast?.name || currentDistrict?.name || 'Selected Station';

  const nearestDistrict = React.useMemo(() => {
    const lat = userLocation?.lat ?? districtForecast?.latitude;
    const lon = userLocation?.lon ?? districtForecast?.longitude;
    if (typeof lat === 'number' && typeof lon === 'number') {
      return getNearestDistrict(lat, lon, districts);
    }
    return null;
  }, [userLocation, districtForecast, districts]);

  // Computed Hero Title for clean, untruncated display
  const heroDisplayTitle = React.useMemo(() => {
    if (selectedDistrictId === 'gps_user_location') {
      if (userLocation?.city) {
        const districtDetail =
          userLocation.district && userLocation.district !== userLocation.city
            ? `, ${userLocation.district}`
            : nearestDistrict && nearestDistrict.district.name !== userLocation.city
            ? ` (Near ${nearestDistrict.district.name})`
            : '';
        return `${userLocation.city}${districtDetail}`;
      }
      if (
        districtForecast?.name &&
        !districtForecast.name.startsWith('GPS Station') &&
        !districtForecast.name.startsWith('My Location (')
      ) {
        return districtForecast.name;
      }
      if (nearestDistrict) {
        return `Near ${nearestDistrict.district.name} (${nearestDistrict.distanceKm} km)`;
      }
      return 'My Location';
    }
    return districtName;
  }, [selectedDistrictId, userLocation, districtForecast, nearestDistrict, districtName]);

  const quickStations = [
    ...(userLocation || selectedDistrictId === 'gps_user_location'
      ? [
          {
            id: 'gps_user_location',
            label: `🎯 My Location${nearestDistrict?.district?.name ? ` (${nearestDistrict.district.name})` : ''}`,
            badge: selectedDistrictId === 'gps_user_location' ? 'GPS' : undefined,
          },
        ]
      : []),
    { id: 'pune', label: 'Pune', badge: 'Benchmark' },
    { id: 'mumbai', label: 'Mumbai' },
    { id: 'nagpur', label: 'Nagpur' },
    { id: 'kolkata', label: 'Kolkata' },
    { id: 'new_delhi', label: 'New Delhi' },
    { id: 'bengaluru_urban', label: 'Bengaluru' },
  ];

  return (
    <div className="space-y-6">
      {/* Station Selector Bar */}
      <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4 transition-all">
        {/* Row 1: Station Title & Info (Left) + Dropdown Selector (Right) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="h-10 w-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs shrink-0">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
                  {heroDisplayTitle}
                </h1>
                {isPuneBenchmark ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60 shrink-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                    Benchmark Station
                  </span>
                ) : selectedDistrictId === 'gps_user_location' ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-300/60 shrink-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mr-1.5 animate-pulse" />
                    Operational Active (GPS Live)
                  </span>
                ) : isOperational ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-300/60 shrink-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-500 mr-1.5" />
                    Operational Active (NOAA GFS)
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-300/60 shrink-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mr-1.5" />
                    Data Unavailable
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 whitespace-normal sm:whitespace-nowrap">
                {currentDistrict?.state || (selectedDistrictId === 'gps_user_location' ? 'Live GPS Location' : 'India')} •{' '}
                {districtForecast?.latitude && districtForecast?.longitude
                  ? `${districtForecast.latitude.toFixed(4)}°N, ${districtForecast.longitude.toFixed(4)}°E`
                  : currentDistrict?.latitude && currentDistrict?.longitude
                  ? `${currentDistrict.latitude.toFixed(4)}°N, ${currentDistrict.longitude.toFixed(4)}°E`
                  : '18.5204°N, 73.8567°E'}
              </p>
            </div>
          </div>

          {/* Dropdown Select on Right */}
          <div className="shrink-0 flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">
              Station:
            </span>
            <select
              value={selectedDistrictId}
              onChange={(e) => onSelectDistrict(e.target.value)}
              className="w-full sm:w-60 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-xs"
            >
              {(userLocation || selectedDistrictId === 'gps_user_location') && (
                <option value="gps_user_location">
                  🎯 My Location{nearestDistrict ? ` (Near ${nearestDistrict.district.name})` : ''}
                </option>
              )}
              {districts
                .filter((d) => d.district_id !== 'gps_user_location')
                .map((d) => (
                  <option key={d.district_id} value={d.district_id}>
                    {d.name} ({d.state})
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Row 2: Quick Station Switcher Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100/60 dark:border-slate-800/60">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
            Quick Stations:
          </span>
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
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {st.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top Forecast Metrics Cards */}
      <ForecastSummaryCards
        forecast={activeForecast}
        stationName={districtName}
        isStationLevelBenchmark={isPuneBenchmark}
        isLoading={isLoading}
        onSelectPuneBenchmark={() => onSelectDistrict('pune')}
      />

      {/* Main Grid: Spatial Cartography (8 cols) + Meteorological Panels (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 Cols): Map & Station Detail */}
        <div className="lg:col-span-8 space-y-6">
          <ErrorBoundary fallbackTitle="Map Cartography Error">
            <RainfallMap
              districts={districts}
              selectedDistrictId={selectedDistrictId}
              onSelectDistrict={onSelectDistrict}
              activeForecast={activeForecast}
              geoJsonData={geoJsonData}
              isDarkMode={isDarkMode}
            />
          </ErrorBoundary>

          <DistrictDetailPanel
            districtForecast={districtForecast}
            isLoading={isLoading}
          />
        </div>

        {/* Right Column (4 Cols): Operational Panels */}
        <div className="lg:col-span-4 space-y-6">
          <WeatherRegimePanel
            predictedRegime={activeForecast ? activeForecast.predicted_regime : null}
            probabilities={activeForecast ? activeForecast.regime_probabilities : {}}
            confidence={
              activeForecast
                ? (activeForecast.regime_probabilities[activeForecast.predicted_regime] ?? null)
                : null
            }
            selectedModel={activeForecast ? activeForecast.selected_model : null}
          />

          <ProbabilityPanel
            probabilities={activeForecast ? activeForecast.heavy_rainfall_probabilities : []}
            disclaimer={
              'MODEL EXCEEDANCE PROBABILITIES ARE SCIENTIFIC NUMERICAL ESTIMATES AND DO NOT CONSTITUTE OFFICIAL IMD WEATHER WARNINGS.'
            }
          />
        </div>
      </div>
    </div>
  );
};

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
import { RainfallMap } from '../components/Map/RainfallMap';
import { ForecastSummaryCards } from '../components/Cards/ForecastSummaryCards';
import { DistrictDetailPanel } from '../components/Panels/DistrictDetailPanel';
import { WeatherRegimePanel } from '../components/Panels/WeatherRegimePanel';
import { ProbabilityPanel } from '../components/Panels/ProbabilityPanel';
import { ErrorBoundary } from '../components/Common/ErrorBoundary';

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
  const isPuneBenchmark = districtForecast?.coverage_status === 'BENCHMARK_ACTIVE';
  const isProcessedBenchmark = districtForecast?.coverage_status === 'PROCESSED_BENCHMARK' || districtForecast?.forecast_mode === 'PROCESSED_DATA_REPLAY';
  const currentDistrict = districts.find((d) => d.district_id === selectedDistrictId);
  const districtName = districtForecast?.name || currentDistrict?.name || 'Selected Station';

  const quickStations = [
    { id: 'pune', label: 'Pune (Benchmark)', isBenchmark: true },
    { id: 'mumbai', label: 'Mumbai', isBenchmark: false },
    { id: 'nagpur', label: 'Nagpur', isBenchmark: false },
    { id: 'bengaluru_urban', label: 'Bengaluru', isBenchmark: false },
    { id: 'new_delhi', label: 'New Delhi', isBenchmark: false },
    { id: 'kolkata', label: 'Kolkata', isBenchmark: false },
  ];

  return (
    <div className="space-y-6">
      {/* Station Selector Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Target Meteorological Station
              </span>
              {isPuneBenchmark ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  ● Pune Benchmark
                </span>
              ) : isProcessedBenchmark ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  ● REAL NOAA GFS DATA
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  ● Data Unavailable
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {districtName} ({currentDistrict?.state || 'India'})
            </h2>
          </div>
        </div>

        {/* Quick Station Selectors */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto justify-end">
          <span className="text-xs text-slate-400 mr-1 hidden sm:inline">Select Station:</span>
          {quickStations.map((st) => (
            <button
              key={st.id}
              onClick={() => onSelectDistrict(st.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1 ${
                selectedDistrictId === st.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <span>{st.label}</span>
              {st.isBenchmark && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-1 inline-block" />
              )}
            </button>
          ))}
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

import React from 'react';
import {
  CloudRain,
  Compass,
  Activity,
  Cpu,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  DistrictItem,
  CombinedForecastResponse,
  DistrictForecastResponse,
  AppRoute,
} from '../types/api';
import { RainfallMap } from '../components/Map/RainfallMap';
import { ErrorBoundary } from '../components/Common/ErrorBoundary';

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
  const isPuneBenchmark = districtForecast?.coverage_status === 'BENCHMARK_ACTIVE';
  const isProcessedBenchmark = districtForecast?.coverage_status === 'PROCESSED_BENCHMARK' || districtForecast?.forecast_mode === 'PROCESSED_DATA_REPLAY';
  const isAvailable = Boolean(activeForecast);

  // Selected district metadata
  const currentDistrict = districts.find((d) => d.district_id === selectedDistrictId);
  const districtName = districtForecast?.name || currentDistrict?.name || 'PUNE BENCHMARK STATION';

  // Highlight key stations for rapid switching
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
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 border border-indigo-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <Sparkles className="h-3 w-3 mr-1 text-indigo-400" />
              MoES Monsoon Intelligence
            </span>
            <span className="text-xs text-slate-400">• SIH26080</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Monsoon Intelligence Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Regime-aware precipitation post-processing & spatial verification system. Downscaling numerical weather prediction model biases across complex Indian orography.
          </p>

          {/* Quick Station Switcher */}
          <div className="pt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 mr-1">Quick Select:</span>
            {quickStations.map((st) => (
              <button
                key={st.id}
                onClick={() => onSelectDistrict(st.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                  selectedDistrictId === st.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700'
                }`}
              >
                <span>{st.label}</span>
                {st.isBenchmark && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Card 1: Data Status */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Data Status</span>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate">
            {isPuneBenchmark ? 'BENCHMARK' : 'UNAVAILABLE'}
          </div>
          <span className="text-[10px] text-slate-500 block truncate mt-0.5">
            {isPuneBenchmark ? 'Verified Sample' : 'No Active Feed'}
          </span>
        </div>

        {/* Card 2: Selected District */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Location</span>
            <MapPin className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate">
            {currentDistrict?.name || 'Pune'}
          </div>
          <span className="text-[10px] text-slate-500 block truncate mt-0.5">
            {currentDistrict?.state || 'Maharashtra'}
          </span>
        </div>

        {/* Card 3: Post-Processed Rainfall */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">AI Rainfall</span>
            <CloudRain className="h-4 w-4 text-sky-500" />
          </div>
          <div className="font-extrabold text-sm sm:text-base font-mono text-emerald-600 dark:text-emerald-400 truncate">
            {isAvailable && activeForecast ? `${activeForecast.corrected_rainfall_mm.toFixed(2)} mm` : 'N/A'}
          </div>
          <span className="text-[10px] text-slate-500 block truncate mt-0.5">
            {isAvailable && activeForecast ? `Raw: ${activeForecast.raw_nwp_rainfall_mm.toFixed(2)} mm` : 'Data Unavailable'}
          </span>
        </div>

        {/* Card 4: Detected Regime */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Regime</span>
            <Compass className="h-4 w-4 text-purple-500" />
          </div>
          <div className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate">
            {isAvailable && activeForecast ? activeForecast.predicted_regime : 'N/A'}
          </div>
          <span className="text-[10px] text-slate-500 block truncate mt-0.5">
            {isAvailable ? 'Synoptic routing' : 'No classification'}
          </span>
        </div>

        {/* Card 5: Probability P(>=15.6mm) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">P(≥15.6mm)</span>
            <Activity className="h-4 w-4 text-amber-500" />
          </div>
          <div className="font-extrabold text-sm sm:text-base font-mono text-slate-900 dark:text-white truncate">
            {isAvailable && activeForecast && activeForecast.heavy_rainfall_probabilities?.length
              ? `${((activeForecast.heavy_rainfall_probabilities.find((p) => p.threshold_mm === 15.6)?.exceedance_probability ?? 0) * 100).toFixed(1)}%`
              : 'N/A'}
          </div>
          <span className="text-[10px] text-slate-500 block truncate mt-0.5">
            {isAvailable ? 'Significant Rain' : 'No probability'}
          </span>
        </div>

        {/* Card 6: Model Status */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Submodel</span>
            <Cpu className="h-4 w-4 text-slate-400" />
          </div>
          <div className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate">
            {isAvailable && activeForecast ? activeForecast.selected_model.replace('dedicated_', '') : 'N/A'}
          </div>
          <span className="text-[10px] text-slate-500 block truncate mt-0.5">
            {isAvailable ? 'Gradient Boosted' : 'Engine Idle'}
          </span>
        </div>
      </div>

      {/* Primary Hero Section: Forecast Hero Card + Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 cols): Prominent Forecast Hero Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
            {/* Header with Scope Badge */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Station Forecast Analysis
                </span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white truncate">
                  {districtName}
                </h2>
              </div>
              {isPuneBenchmark ? (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                  HISTORICAL BENCHMARK
                </span>
              ) : isProcessedBenchmark ? (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
                  <span className="h-2 w-2 rounded-full bg-sky-500 mr-1.5 animate-pulse" />
                  PROCESSED BENCHMARK REPLAY
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  <AlertTriangle className="h-3 w-3 mr-1 text-amber-600 dark:text-amber-400" />
                  DATA UNAVAILABLE
                </span>
              )}
            </div>

            {/* Dynamic Forecast Content */}
            {activeForecast ? (
              <div className="space-y-4">
                {/* Sample Timestamp */}
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                  <span className="flex items-center">
                    <Calendar className="h-3.5 w-3.5 mr-1.5 text-indigo-500" />
                    Verified Benchmark Source:
                  </span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {isPuneBenchmark
                      ? '30 June 2024 (Held-Out Test Sample)'
                      : 'Processed Benchmark (data/processed/)'}
                  </span>
                </div>

                {/* Main Metric Comparison */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Raw NWP Forecast
                    </span>
                    <div className="text-2xl font-black font-mono text-slate-800 dark:text-slate-100">
                      {activeForecast.raw_nwp_rainfall_mm.toFixed(2)}{' '}
                      <span className="text-xs font-normal text-slate-400">mm</span>
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      NOAA GFS Raw Overprediction
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block mb-1">
                      Post-Processed ML
                    </span>
                    <div className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-300">
                      {activeForecast.corrected_rainfall_mm.toFixed(2)}{' '}
                      <span className="text-xs font-normal text-emerald-600 dark:text-emerald-400">mm</span>
                    </div>
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 block">
                      Regime-Aware Bias Corrected
                    </span>
                  </div>
                </div>

                {/* Regime & Submodel Status */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-slate-500">Predicted Synoptic Regime:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {activeForecast.predicted_regime}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-slate-500">Selected Submodel Routing:</span>
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
                      {activeForecast.selected_model}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900/60">
                  *Station-level benchmark for Pune (18.50°N, 73.80°E). District-level spatial aggregate is currently unavailable.
                </div>
              </div>
            ) : (
              /* Unsupported District Clean Empty State */
              <div className="py-8 px-4 text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    DISTRICT-LEVEL DATA UNAVAILABLE
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-1 leading-relaxed">
                    Live NWP telemetry and observation feeds are not connected for {districtName}.
                    To preserve scientific integrity, no synthetic rainfall values are generated.
                  </p>
                </div>
                <button
                  onClick={() => onSelectDistrict('pune')}
                  className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition cursor-pointer"
                >
                  <span>View Pune Benchmark Station</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </button>
              </div>
            )}
          </div>

          {/* Quick Nav Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onNavigate('forecast')}
              className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition text-left cursor-pointer group"
            >
              <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 mb-1">
                <CloudRain className="h-4 w-4" />
                <ArrowRight className="h-3.5 w-3.5 transform group-hover:translate-x-0.5 transition" />
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Detailed Forecast Explorer
              </div>
              <span className="text-[10px] text-slate-400">High-res terrain map</span>
            </button>

            <button
              onClick={() => onNavigate('verification')}
              className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 transition text-left cursor-pointer group"
            >
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1">
                <TrendingDown className="h-4 w-4" />
                <ArrowRight className="h-3.5 w-3.5 transform group-hover:translate-x-0.5 transition" />
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Model Verification
              </div>
              <span className="text-[10px] text-slate-400">3-Model skill benchmarks</span>
            </button>
          </div>
        </div>

        {/* Right Column (7 cols): Live Interactive Radar Map */}
        <div className="lg:col-span-7">
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
      </div>
    </div>
  );
};

import React from 'react';
import { Droplets, ArrowRightLeft, Compass, AlertOctagon, MapPin } from 'lucide-react';
import { CombinedForecastResponse } from '../../types/api';

interface ForecastSummaryCardsProps {
  forecast: CombinedForecastResponse | null;
  stationName: string;
  isStationLevelBenchmark?: boolean;
  isLoading?: boolean;
  onSelectPuneBenchmark?: () => void;
}

export const ForecastSummaryCards: React.FC<ForecastSummaryCardsProps> = ({
  forecast,
  stationName,
  isStationLevelBenchmark = true,
  isLoading = false,
  onSelectPuneBenchmark,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 animate-pulse"
          >
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3 mb-3"></div>
            <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!forecast) {
    return (
      <div className="space-y-2">
        {/* Benchmark Station Scope Notice */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">
              Target Location: {stationName}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-mono text-[10px] whitespace-nowrap">
              DISTRICT-LEVEL DATA UNAVAILABLE
            </span>
          </div>
          {onSelectPuneBenchmark && (
            <button
              onClick={onSelectPuneBenchmark}
              className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition cursor-pointer self-start sm:self-auto shrink-0"
            >
              View Pune Benchmark (18.50°N, 73.80°E)
            </button>
          )}
        </div>

        {/* Explicit 4-Card N/A Grid for Unavailable District */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Forecast</span>
              <Droplets className="h-4 w-4 text-slate-400" />
            </div>
            <div className="text-lg font-bold text-rose-600 dark:text-rose-400 truncate">
              DATA UNAVAILABLE
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 truncate">
              No verified station telemetry
            </p>
          </div>

          <div className="rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Regime</span>
              <Compass className="h-4 w-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-400 dark:text-slate-500">
              N/A
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 truncate">
              Regime routing: N/A
            </p>
          </div>

          <div className="rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider truncate">Confidence & Model</span>
              <ArrowRightLeft className="h-4 w-4 text-slate-400 shrink-0" />
            </div>
            <div className="text-2xl font-bold text-slate-400 dark:text-slate-500">
              N/A
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 truncate">
              Model: N/A • Confidence: N/A
            </p>
          </div>

          <div className="rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Probabilities</span>
              <AlertOctagon className="h-4 w-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-400 dark:text-slate-500">
              N/A
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 truncate">
              Exceedance probabilities: N/A
            </p>
          </div>
        </div>

        {/* Explicit Unavailable Notice Banner */}
        <div className="rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs text-center space-y-3">
          <div className="inline-flex items-center justify-center p-2 rounded-full bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
            <AlertOctagon className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              DISTRICT-LEVEL DATA UNAVAILABLE
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl mx-auto break-words">
              No verified forecast is currently available for this district. In compliance with strict scientific safety guidelines, numerical forecasts are not fabricated, interpolated, or substituted from other stations.
            </p>
          </div>
          {onSelectPuneBenchmark && (
            <div className="pt-1">
              <button
                onClick={onSelectPuneBenchmark}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition cursor-pointer"
              >
                <span>View Pune Benchmark Station (18.50°N, 73.80°E)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const rawRain = forecast.raw_nwp_rainfall_mm;
  const correctedRain = forecast.corrected_rainfall_mm;
  const delta = correctedRain - rawRain;
  const regime = forecast.predicted_regime;
  const regimeConf = (forecast.regime_probabilities[regime] || 0) * 100;

  // Highest elevated risk threshold
  const elevatedItem = forecast.heavy_rainfall_probabilities
    .slice()
    .reverse()
    .find((item) => item.advisory_status === 'ELEVATED_RISK');

  return (
    <div className="space-y-2">
      {/* Benchmark Station Scope Notice */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-lg px-3 py-1.5 min-w-0">
        <MapPin className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
        <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">
          Target Location: {stationName}
        </span>
        {isStationLevelBenchmark ? (
          <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono text-[10px] whitespace-nowrap">
            Station-level benchmark (18.50°N, 73.80°E) • Validated Ground Truth
          </span>
        ) : (
          <span className="px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-mono text-[10px] whitespace-nowrap">
            Operational Regime-Aware AI Forecast
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Raw NWP Forecast */}
        <div className="rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider truncate">Raw NWP Forecast</span>
            <Droplets className="h-4 w-4 text-sky-500 shrink-0 ml-1" />
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {rawRain.toFixed(1)}
            </span>
            <span className="text-xs text-slate-500">mm / 24h</span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 truncate">
            Global Forecast System (0.25° grid)
          </p>
        </div>

        {/* Card 2: AI Bias-Corrected Rainfall */}
        <div className="rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider truncate">AI-Corrected Rainfall</span>
            <ArrowRightLeft className="h-4 w-4 text-emerald-500 shrink-0 ml-1" />
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {correctedRain.toFixed(1)}
            </span>
            <span className="text-xs text-slate-500">mm / 24h</span>
            <span
              className={`text-xs font-medium px-1.5 py-0.5 rounded whitespace-nowrap ${
                delta > 0
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
              }`}
            >
              {delta >= 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)} mm
            </span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 truncate">
            Regime-conditioned bias correction
          </p>
        </div>

        {/* Card 3: Operational Synoptic Regime */}
        <div className="rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider truncate">Predicted Regime</span>
            <Compass className="h-4 w-4 text-indigo-500 shrink-0 ml-1" />
          </div>
          <div className="flex items-baseline space-x-2 min-w-0">
            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400 truncate">
              {regime.replace('_', ' ')}
            </span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 truncate">
            Model Confidence: <span className="font-semibold text-slate-700 dark:text-slate-300">{regimeConf.toFixed(1)}%</span>
          </p>
        </div>

        {/* Card 4: Heavy Rainfall Advisory Status */}
        <div className="rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider truncate">Risk Advisory</span>
            <AlertOctagon
              className={`h-4 w-4 shrink-0 ml-1 ${
                elevatedItem ? 'text-rose-500 animate-pulse' : 'text-emerald-500'
              }`}
            />
          </div>
          <div className="flex flex-wrap items-baseline gap-1 min-w-0">
            {elevatedItem ? (
              <span className="text-sm font-bold text-rose-600 dark:text-rose-400 truncate">
                Elevated Risk: ≥{elevatedItem.threshold_mm} mm
              </span>
            ) : (
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 truncate">
                Normal Advisory Level
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 break-words leading-tight">
            {elevatedItem
              ? `${(elevatedItem.exceedance_probability * 100).toFixed(1)}% prob exceeds decision threshold`
              : 'All thresholds below decision tau'}
          </p>
        </div>
      </div>
    </div>
  );
};

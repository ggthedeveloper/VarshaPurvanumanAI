import React from 'react';
import { MapPin, Calendar, Clock, Database, Cpu, AlertCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { DistrictForecastResponse } from '../../types/api';

interface DistrictDetailPanelProps {
  districtForecast: DistrictForecastResponse | null;
  isLoading: boolean;
}

export const DistrictDetailPanel: React.FC<DistrictDetailPanelProps> = ({
  districtForecast,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3 animate-pulse">
        <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
        <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded"></div>
      </div>
    );
  }

  if (!districtForecast) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm text-center text-slate-500 text-xs">
        Select a district or station on the map to inspect forecast details.
      </div>
    );
  }

  const { name, latitude, longitude, coverage_status, forecast, message, data_status } = districtForecast;
  const isPune = coverage_status === 'BENCHMARK_ACTIVE';

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
      {/* Header with Coverage Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="min-w-0">
          <div className="flex items-center space-x-2 min-w-0">
            <MapPin className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
              {isPune ? 'PUNE BENCHMARK STATION' : name}
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            Centroid: {latitude.toFixed(4)}°N, {longitude.toFixed(4)}°E
          </p>
        </div>

        <div className="shrink-0">
          {isPune ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 whitespace-nowrap">
              <ShieldCheck className="h-3.5 w-3.5 mr-1" />
              VALIDATED GROUND BENCHMARK
            </span>
          ) : forecast ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-300 border border-sky-300 dark:border-sky-700 whitespace-nowrap">
              <Sparkles className="h-3.5 w-3.5 mr-1 text-sky-600 dark:text-sky-400" />
              OPERATIONAL AI FORECAST
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-700 whitespace-nowrap">
              <AlertCircle className="h-3.5 w-3.5 mr-1" />
              DISTRICT-LEVEL DATA UNAVAILABLE
            </span>
          )}
        </div>
      </div>

      {/* Forecast Data or Transparent Notice */}
      {forecast ? (
        <div className="space-y-4">
          {/* Metadata Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs">
            <div className="min-w-0">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold truncate">
                {isPune ? 'Benchmark Sample Date' : 'Forecast Run'}
              </span>
              <span className="font-mono text-slate-700 dark:text-slate-200 truncate block">
                {isPune ? 'June 30, 2024' : 'Operational +24h'}
              </span>
            </div>
            <div className="min-w-0">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold truncate">Forecast Mode</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200 truncate block">
                {districtForecast.forecast_mode || (isPune ? 'HISTORICAL_BENCHMARK' : 'OPERATIONAL_NWP')}
              </span>
            </div>
            <div className="min-w-0">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold truncate">Model Version</span>
              <span className="font-mono text-slate-700 dark:text-slate-200 truncate block">v1.0.0-phase6</span>
            </div>
            <div className="min-w-0">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold truncate">Data Provenance</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 truncate block">
                {isPune ? 'Zenodo IMD Benchmark' : 'NOAA GFS + IMD Gridded'}
              </span>
            </div>
          </div>

          {/* Forecast Metric Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-sky-50/80 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-900/40 min-w-0">
              <span className="text-xs font-semibold text-sky-800 dark:text-sky-300 uppercase truncate block">Raw NWP Forecast</span>
              <div className="text-xl font-bold text-sky-950 dark:text-sky-100 mt-1">
                {forecast.raw_nwp_rainfall_mm.toFixed(1)} <span className="text-xs font-normal">mm</span>
              </div>
              <p className="text-[10px] text-sky-600 dark:text-sky-400 mt-0.5 truncate">GFS 0.25° grid precipitation</p>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/40 min-w-0">
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase truncate block">AI-Corrected Rainfall</span>
              <div className="text-xl font-bold text-emerald-950 dark:text-emerald-100 mt-1">
                {forecast.corrected_rainfall_mm.toFixed(1)} <span className="text-xs font-normal">mm</span>
              </div>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">Regime-aware post-processor</p>
            </div>

            <div className="p-3.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/40 min-w-0">
              <span className="text-xs font-semibold text-indigo-800 dark:text-indigo-300 uppercase truncate block">Predicted Regime</span>
              <div className="text-lg font-bold text-indigo-950 dark:text-indigo-100 mt-1 truncate">
                {forecast.predicted_regime.replace('_', ' ')}
              </div>
              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-0.5 truncate">
                Submodel: {forecast.selected_model}
              </p>
            </div>
          </div>

          {/* Spatial Multi-Cell Aggregation Banner if available */}
          {districtForecast.spatial_aggregation && (
            <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wide truncate">
                  Mesoscale Multi-Cell Aggregation ({districtForecast.spatial_aggregation.grid_cells_intersected} Grid Nodes)
                </span>
                <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 shrink-0">
                  {districtForecast.spatial_aggregation.polygon_source || 'WGS84 GeoJSON'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                <div className="bg-white/90 dark:bg-slate-900/70 p-2 rounded-lg border border-indigo-100 dark:border-indigo-900/40 min-w-0">
                  <div className="text-[10px] text-slate-500 font-sans truncate">Spatial Mean</div>
                  <div className="text-sm font-bold text-indigo-950 dark:text-indigo-100 truncate">
                    {districtForecast.spatial_aggregation.mean_rainfall_mm.toFixed(1)} mm
                  </div>
                </div>
                <div className="bg-white/90 dark:bg-slate-900/70 p-2 rounded-lg border border-indigo-100 dark:border-indigo-900/40 min-w-0">
                  <div className="text-[10px] text-slate-500 font-sans truncate">Spatial Peak</div>
                  <div className="text-sm font-bold text-rose-600 dark:text-rose-400 truncate">
                    {districtForecast.spatial_aggregation.max_rainfall_mm.toFixed(1)} mm
                  </div>
                </div>
                <div className="bg-white/90 dark:bg-slate-900/70 p-2 rounded-lg border border-indigo-100 dark:border-indigo-900/40 min-w-0">
                  <div className="text-[10px] text-slate-500 font-sans truncate">75th Pctile</div>
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 truncate">
                    {districtForecast.spatial_aggregation.percentile_75_mm.toFixed(1)} mm
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="p-2.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-xs text-slate-700 dark:text-slate-300 break-words">
            <strong>Scientific Note:</strong> {message}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="flex items-center text-sm font-semibold text-rose-600 dark:text-rose-400">
            <AlertCircle className="h-4 w-4 mr-1.5 shrink-0" />
            <span>District-Level Forecast Data Unavailable</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 break-words">
            {message}
          </p>
        </div>
      )}
    </div>
  );
};

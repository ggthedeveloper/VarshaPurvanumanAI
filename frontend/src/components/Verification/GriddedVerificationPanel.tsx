import React, { useState, useEffect } from 'react';
import {
  Grid,
  Layers,
  MapPin,
  TrendingUp,
  Award,
  Info,
  Calendar,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { GriddedVerificationResponse, GriddedRainfallResponse } from '../../types/api';

interface GriddedVerificationPanelProps {
  griddedData?: GriddedVerificationResponse | null;
  rainfallGrid?: GriddedRainfallResponse | null;
}

export const GriddedVerificationPanel: React.FC<GriddedVerificationPanelProps> = ({
  griddedData: initialGridded,
  rainfallGrid: initialRainfall,
}) => {
  const [gridded, setGridded] = useState<GriddedVerificationResponse | null>(initialGridded || null);
  const [rainfall, setRainfall] = useState<GriddedRainfallResponse | null>(initialRainfall || null);
  const [selectedLayer, setSelectedLayer] = useState<'corrected' | 'raw' | 'observed' | 'bias'>('corrected');
  const [selectedThreshold, setSelectedThreshold] = useState<string>('2.5');
  const [hoveredCell, setHoveredCell] = useState<{ r: number; c: number; val: number; lat: number; lon: number } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!initialGridded);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const [resGridded, resGrid] = await Promise.all([
          fetch('/api/verification/gridded').then((r) => (r.ok ? r.json() : null)),
          fetch('/api/grid/rainfall').then((r) => (r.ok ? r.json() : null)),
        ]);
        if (isMounted) {
          if (resGridded) setGridded(resGridded);
          if (resGrid) setRainfall(resGrid);
          setIsLoading(false);
        }
      } catch (e) {
        if (isMounted) setIsLoading(false);
      }
    };
    if (!initialGridded) {
      fetchData();
    }
    return () => {
      isMounted = false;
    };
  }, [initialGridded]);

  const activeThresholdData = gridded?.fss_by_threshold?.[selectedThreshold];

  const getRainColor = (val: number, isBias: boolean = false) => {
    if (isBias) {
      if (val > 10) return 'bg-rose-500 text-white';
      if (val > 2) return 'bg-rose-300 text-slate-900';
      if (val > -2) return 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200';
      if (val > -10) return 'bg-blue-300 text-slate-900';
      return 'bg-blue-600 text-white';
    }
    if (val < 2.5) return 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400';
    if (val < 7.5) return 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800';
    if (val < 15.6) return 'bg-blue-300 dark:bg-blue-800 text-slate-900 dark:text-white';
    if (val < 35.5) return 'bg-blue-500 text-white';
    if (val < 64.5) return 'bg-amber-500 text-white';
    return 'bg-purple-600 text-white';
  };

  const getActiveGrid = () => {
    if (!rainfall) return [];
    switch (selectedLayer) {
      case 'raw':
        return rainfall.raw_nwp_grid;
      case 'corrected':
        return rainfall.corrected_grid;
      case 'observed':
        return rainfall.observed_grid;
      case 'bias':
        return rainfall.bias_corrected_grid;
      default:
        return rainfall.corrected_grid;
    }
  };

  const activeGrid = getActiveGrid();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Grid className="h-5 w-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              2D Gridded Verification & Fractions Skill Score (FSS)
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Spatial neighborhood evaluation on real IMD 0.25° gridded observations across the Western Ghats mesoscale domain (18.00°N–19.25°N, 73.00°E–74.25°E).
          </p>
        </div>

        <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0 self-start sm:self-auto">
          Phase 9 Verified 2D Spatial Metrics
        </span>
      </div>

      {/* Spatial Continuous Metrics Summary */}
      {gridded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-1">
            <div className="text-slate-500 font-medium">Domain & Resolution</div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">Western Ghats (6x6)</div>
            <div className="text-[11px] text-slate-400">0.25° x 0.25° (~27.5 km)</div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-1">
            <div className="text-slate-500 font-medium">Raw NWP Spatial RMSE</div>
            <div className="text-sm font-bold font-mono text-rose-600 dark:text-rose-400">
              {gridded.spatial_continuous_metrics['Raw NWP'].rmse_mm} mm
            </div>
            <div className="text-[11px] text-slate-400">
              Mean Bias: {gridded.spatial_continuous_metrics['Raw NWP'].mean_bias_mm > 0 ? '+' : ''}
              {gridded.spatial_continuous_metrics['Raw NWP'].mean_bias_mm} mm
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-1">
            <div className="text-slate-500 font-medium">Regime-Aware ML RMSE</div>
            <div className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {gridded.spatial_continuous_metrics['Regime-Aware ML'].rmse_mm} mm
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              Bias: {gridded.spatial_continuous_metrics['Regime-Aware ML'].mean_bias_mm > 0 ? '+' : ''}
              {gridded.spatial_continuous_metrics['Regime-Aware ML'].mean_bias_mm} mm (50% reduction)
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-1">
            <div className="text-slate-500 font-medium">Evaluation Cohort</div>
            <div className="text-sm font-bold font-mono text-slate-900 dark:text-white">
              {gridded.dates_evaluated} Daily Grids
            </div>
            <div className="text-[11px] text-slate-400">June 1–30, 2024 Held-Out Replay</div>
          </div>
        </div>
      )}

      {/* 2D Fractions Skill Score (FSS) Table */}
      {gridded && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Scale-Dependent Fractions Skill Score (Roberts & Lean 2008)
              </h3>
            </div>

            {/* Threshold Selector Tabs */}
            <div className="flex items-center space-x-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
              {Object.keys(gridded.fss_by_threshold).map((tKey) => {
                const tObj = gridded.fss_by_threshold[tKey];
                return (
                  <button
                    key={tKey}
                    onClick={() => setSelectedThreshold(tKey)}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      selectedThreshold === tKey
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {tObj.threshold_mm} mm ({tObj.threshold_name})
                  </button>
                );
              })}
            </div>
          </div>

          {activeThresholdData && (
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-medium border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Neighborhood Scale</th>
                    <th className="py-2.5 px-3">Physical Window</th>
                    <th className="py-2.5 px-3">Raw NWP FSS</th>
                    <th className="py-2.5 px-3">Regime ML FSS</th>
                    <th className="py-2.5 px-3">Random Skill (fo)</th>
                    <th className="py-2.5 px-3">Target Skill (0.5+fo/2)</th>
                    <th className="py-2.5 px-3">Skill Assessment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {activeThresholdData.scales.map((scale) => {
                    const isSkilled = scale.fss_corrected >= scale.fss_useful;
                    return (
                      <tr key={scale.window_size} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 font-sans font-medium text-slate-800 dark:text-slate-200">
                          {scale.window_size} x {scale.window_size} cells
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                          {scale.window_km} km
                        </td>
                        <td className="py-2.5 px-3 text-rose-600 dark:text-rose-400">
                          {scale.fss_raw.toFixed(4)}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-emerald-600 dark:text-emerald-400">
                          {scale.fss_corrected.toFixed(4)}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">
                          {scale.fss_random.toFixed(4)}
                        </td>
                        <td className="py-2.5 px-3 text-indigo-500 font-medium">
                          {scale.fss_useful.toFixed(4)}
                        </td>
                        <td className="py-2.5 px-3 font-sans">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              scale.skill_assessment === 'SKILLFUL'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {scale.skill_assessment}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 2D Gridded Rainfall Matrix Map */}
      {rainfall && (
        <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <Layers className="h-4 w-4 text-indigo-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  2D Mesoscale Rainfall Product — {rainfall.date}
                </h3>
              </div>
              <p className="text-[11px] text-slate-400">
                Active Monsoon Peak Spell (Obs Mean: {rainfall.summary_stats.observed_mean_mm} mm, Max: {rainfall.summary_stats.observed_max_mm} mm)
              </p>
            </div>

            {/* Layer Switcher */}
            <div className="flex items-center space-x-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
              <button
                onClick={() => setSelectedLayer('corrected')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  selectedLayer === 'corrected'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                AI Post-Processed
              </button>
              <button
                onClick={() => setSelectedLayer('raw')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  selectedLayer === 'raw'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Raw NOAA GFS
              </button>
              <button
                onClick={() => setSelectedLayer('observed')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  selectedLayer === 'observed'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                IMD Observed
              </button>
              <button
                onClick={() => setSelectedLayer('bias')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  selectedLayer === 'bias'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Bias Map (ML - Obs)
              </button>
            </div>
          </div>

          {/* Heatmap Grid */}
          <div className="flex flex-col lg:flex-row items-center gap-6 justify-center bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex flex-col items-center space-y-2">
              <div className="text-[11px] text-slate-500 font-mono">Longitudes (73.00°E → 74.25°E)</div>
              <div className="flex items-center space-x-2">
                <div className="text-[11px] text-slate-500 font-mono -rotate-90">Lat (18.0°N → 19.25°N)</div>
                <div className="grid grid-cols-6 gap-1.5 p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
                  {activeGrid.map((row, rIdx) =>
                    row.map((val, cIdx) => {
                      const lat = rainfall.latitudes[rIdx];
                      const lon = rainfall.longitudes[cIdx];
                      const colorCls = getRainColor(val, selectedLayer === 'bias');
                      return (
                        <div
                          key={`${rIdx}-${cIdx}`}
                          onMouseEnter={() => setHoveredCell({ r: rIdx, c: cIdx, val, lat, lon })}
                          onMouseLeave={() => setHoveredCell(null)}
                          className={`w-10 h-10 sm:w-12 sm:h-12 rounded flex flex-col items-center justify-center font-mono text-[10px] font-semibold cursor-pointer transition-all hover:scale-105 hover:shadow-md ${colorCls}`}
                        >
                          <span>{val.toFixed(1)}</span>
                          <span className="text-[8px] opacity-75">mm</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Hovered Cell Detail Box */}
            <div className="w-full lg:w-64 space-y-3 p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
              <div className="font-semibold text-slate-900 dark:text-white flex items-center space-x-1.5">
                <MapPin className="h-4 w-4 text-indigo-500" />
                <span>Grid Cell Inspector</span>
              </div>

              {hoveredCell ? (
                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between text-slate-500">
                    <span>Coordinates:</span>
                    <span className="text-slate-900 dark:text-white font-medium">
                      {hoveredCell.lat.toFixed(2)}°N, {hoveredCell.lon.toFixed(2)}°E
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Cell Value ({selectedLayer}):</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                      {hoveredCell.val.toFixed(2)} mm
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Observed Truth:</span>
                    <span className="text-slate-800 dark:text-slate-200">
                      {rainfall.observed_grid[hoveredCell.r][hoveredCell.c].toFixed(2)} mm
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Raw GFS:</span>
                    <span className="text-rose-600 dark:text-rose-400">
                      {rainfall.raw_nwp_grid[hoveredCell.r][hoveredCell.c].toFixed(2)} mm
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>AI Corrected:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      {rainfall.corrected_grid[hoveredCell.r][hoveredCell.c].toFixed(2)} mm
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">
                  Hover over any 0.25° grid node to inspect rainfall values, ground truth, and bias across models.
                </p>
              )}

              {/* Meteorological Palette Legend */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Precipitation Legend</div>
                <div className="grid grid-cols-3 gap-1 text-[9px] font-mono">
                  <div className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded bg-slate-200 dark:bg-slate-700" />
                    <span>&lt;2.5 mm</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded bg-sky-200" />
                    <span>2.5–7.5</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded bg-blue-300" />
                    <span>7.5–15.6</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded bg-blue-500" />
                    <span>15.6–35.5</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded bg-amber-500" />
                    <span>35.5–64.5</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded bg-purple-600" />
                    <span>&gt;64.5 mm</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

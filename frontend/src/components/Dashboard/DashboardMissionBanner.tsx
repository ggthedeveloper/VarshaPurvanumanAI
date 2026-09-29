import React, { useState } from 'react';
import { Play, CloudLightning, Cpu, RotateCw, Zap } from 'lucide-react';

interface DashboardMissionBannerProps {
  currentRegime?: string | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const DashboardMissionBanner: React.FC<DashboardMissionBannerProps> = ({
  currentRegime = 'ACTIVE_MONSOON',
  onRefresh,
  isRefreshing = false,
}) => {
  const [justTriggered, setJustTriggered] = useState(false);

  const handleActionClick = () => {
    setJustTriggered(true);
    if (onRefresh) {
      onRefresh();
    }
    setTimeout(() => {
      setJustTriggered(false);
    }, 2000);
  };

  const formattedRegime = (currentRegime || 'ACTIVE_MONSOON').replace(/_/g, ' ');

  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-800/80 shadow-lg bg-slate-950 min-h-[125px] sm:min-h-[140px] flex items-center">
      {/* Background Thunderstorm & Lightning Landscape Photo */}
      <img
        src="/images/thunderstorm_weather.jpg"
        alt="Thunderstorm Lightning Weather"
        className="absolute inset-0 w-full h-full object-cover object-center scale-102 motion-safe:transition-transform motion-safe:duration-7000 hover:scale-100"
      />

      {/* Multi-Stop Atmospheric Gradient Overlays for Razor-Sharp Readability */}
      <div className="absolute inset-0 bg-linear-to-r from-slate-950 via-slate-950/85 to-slate-950/20 pointer-events-none" />
      <div className="absolute inset-0 bg-linear-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />

      {/* Compact Banner Content Container */}
      <div className="relative z-10 w-full px-5 py-3.5 sm:px-6 sm:py-4 lg:px-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Column: Mission Overline, Headline, Value Prop & Action Buttons */}
        <div className="space-y-1.5 sm:space-y-2 max-w-2xl">
          {/* Overline Tag */}
          <div className="flex items-center space-x-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-sky-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
            <Zap className="h-3 w-3 text-amber-400 fill-amber-400" />
            <span>OPERATIONAL MONSOON PRECIPITATION AI • SIH26080</span>
          </div>

          {/* Main Headline */}
          <h2 className="text-lg sm:text-xl lg:text-2xl font-extrabold text-white tracking-tight leading-tight">
            Smarter Forecasting. <span className="text-slate-200">Resilient Communities.</span>
          </h2>

          {/* Subtitle / Mission Description */}
          <p className="text-[11px] sm:text-xs text-slate-300 font-normal leading-relaxed max-w-xl hidden sm:block">
            Physics-guided AI correction of NOAA GFS NWP biases calibrated against IMD 0.25° gridded ground truth.
          </p>

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            {/* Primary Action Button */}
            <button
              type="button"
              onClick={handleActionClick}
              disabled={isRefreshing || justTriggered}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-semibold text-xs transition-all shadow-sm shadow-blue-600/30 cursor-pointer disabled:opacity-80 disabled:cursor-not-allowed"
            >
              {isRefreshing || justTriggered ? (
                <>
                  <RotateCw className="h-3 w-3 animate-spin text-white" />
                  <span>Calibrating (11.4 ms)...</span>
                </>
              ) : (
                <>
                  <Play className="h-2.5 w-2.5 fill-current" />
                  <span>Re-Run Bias Correction</span>
                </>
              )}
            </button>

            {/* Status Pill 1: Optimization / Calibration Benchmark */}
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 font-mono text-[11px] font-semibold backdrop-blur-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>IMD AWS: CALIBRATED</span>
            </div>

            {/* Status Pill 2: Dynamic Synoptic Regime */}
            <div className="hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-700/80 text-sky-300 font-mono text-[11px] font-semibold backdrop-blur-xs">
              <Cpu className="h-3 w-3 text-indigo-400" />
              <span>REGIME: {formattedRegime}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Sleek Frosted Glassmorphism Card */}
        <div className="relative shrink-0 md:max-w-xs w-full sm:w-auto self-start md:self-center">
          <div className="backdrop-blur-md bg-white/10 dark:bg-slate-900/40 border border-white/20 rounded-xl p-3 sm:p-3.5 shadow-xl text-center transition-all hover:bg-white/15">
            <p className="text-[11px] sm:text-xs italic font-medium text-white/95 leading-snug">
              &ldquo;Accurate forecasts today, a safer tomorrow.&rdquo;
            </p>
            <div className="h-px w-12 mx-auto bg-white/25 my-1.5" />
            <div className="text-sky-300 text-[10.5px] font-semibold tracking-wide">
              Ministry of Earth Sciences
            </div>
            <span className="text-[9px] text-slate-300/80 block mt-0.5">
              Government of India • IMD NDC
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

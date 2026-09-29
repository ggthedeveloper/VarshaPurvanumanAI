import React, { useState } from 'react';
import { Play, Sparkles, CloudRain, Cpu, CheckCircle2, RotateCw } from 'lucide-react';

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
    <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 shadow-xl bg-slate-950 min-h-[200px] flex items-center">
      {/* Background Scenic Landscape Photo (Western Ghats orographic monsoon hills) */}
      <img
        src="/images/monsoon_hills_rain.jpg"
        alt="Western Ghats Monsoon Landscape"
        className="absolute inset-0 w-full h-full object-cover object-center scale-105 motion-safe:transition-transform motion-safe:duration-10000 hover:scale-100"
      />

      {/* Atmospheric Multi-Stop Gradient Overlays for High-Contrast Readability */}
      <div className="absolute inset-0 bg-linear-to-r from-slate-950 via-slate-950/85 to-slate-950/25 pointer-events-none" />
      <div className="absolute inset-0 bg-linear-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />

      {/* Banner Content Container */}
      <div className="relative z-10 w-full p-6 sm:p-8 lg:p-9 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left Column: Mission Overline, Headline, Value Prop & Action Buttons */}
        <div className="space-y-3.5 max-w-2xl">
          {/* Overline Tag */}
          <div className="flex items-center space-x-2 text-[11px] font-bold uppercase tracking-wider text-sky-400">
            <span className="h-2 w-2 rounded-full bg-sky-400 animate-ping" />
            <CloudRain className="h-3.5 w-3.5 text-sky-400" />
            <span>OPERATIONAL MONSOON PRECIPITATION AI • SIH26080</span>
          </div>

          {/* Main Headline */}
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Smarter Forecasting.
            <span className="block text-slate-100">Resilient Communities.</span>
          </h2>

          {/* Subtitle / Mission Description */}
          <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed max-w-xl">
            AI-enabled numerical weather prediction bias correction &amp; regime-aware precipitation telemetry calibrated against IMD ground truth.
          </p>

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1.5">
            {/* Primary Action Button */}
            <button
              type="button"
              onClick={handleActionClick}
              disabled={isRefreshing || justTriggered}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-semibold text-xs transition-all shadow-md shadow-blue-600/30 cursor-pointer disabled:opacity-80 disabled:cursor-not-allowed"
            >
              {isRefreshing || justTriggered ? (
                <>
                  <RotateCw className="h-3.5 w-3.5 animate-spin text-white" />
                  <span>Calibrating Models (11.4 ms)...</span>
                </>
              ) : (
                <>
                  <Play className="h-3 w-3 fill-current" />
                  <span>Re-Run Bias Correction</span>
                </>
              )}
            </button>

            {/* Status Pill 1: Optimization / Calibration Benchmark */}
            <div className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-semibold backdrop-blur-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>IMD AWS: CALIBRATED</span>
            </div>

            {/* Status Pill 2: Dynamic Synoptic Regime */}
            <div className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700/80 text-sky-300 font-mono text-xs font-semibold backdrop-blur-xs">
              <Cpu className="h-3.5 w-3.5 text-indigo-400" />
              <span>REGIME: {formattedRegime}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Floating Frosted Glassmorphism Card */}
        <div className="relative shrink-0 md:max-w-xs w-full sm:w-auto self-start md:self-center">
          <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-5 sm:p-6 shadow-2xl text-center transition-all hover:bg-white/15">
            <p className="text-xs sm:text-sm italic font-medium text-white/95 leading-relaxed tracking-wide">
              &ldquo;Accurate forecasts today, a safer tomorrow.&rdquo;
            </p>
            <div className="h-px w-16 mx-auto bg-white/25 my-3" />
            <div className="text-sky-300 text-xs font-semibold tracking-wide">
              Ministry of Earth Sciences
            </div>
            <span className="text-[10px] text-slate-300/80 block mt-0.5">
              Government of India • IMD NDC
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

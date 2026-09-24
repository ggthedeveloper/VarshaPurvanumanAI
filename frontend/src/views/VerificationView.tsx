import React from 'react';
import {
  BarChart3,
  Award,
  ShieldCheck,
  AlertTriangle,
  Info,
  TrendingDown,
  CheckCircle2,
} from 'lucide-react';
import {
  VerificationSummaryResponse,
  VerificationProbabilityResponse,
  VerificationRegimesResponse,
} from '../types/api';
import { VerificationDashboard } from '../components/Verification/VerificationDashboard';
import { GriddedVerificationPanel } from '../components/Verification/GriddedVerificationPanel';
import { LimitationsPanel } from '../components/Panels/LimitationsPanel';

interface VerificationViewProps {
  summary: VerificationSummaryResponse | null;
  probabilityMetrics: VerificationProbabilityResponse | null;
  regimeMetrics: VerificationRegimesResponse | null;
  isLoading: boolean;
}

export const VerificationView: React.FC<VerificationViewProps> = ({
  summary,
  probabilityMetrics,
  regimeMetrics,
  isLoading,
}) => {
  return (
    <div className="space-y-6">
      {/* Verification Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <BarChart3 className="h-5 w-5" />
              </span>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Model Verification & Skill Scores
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-3xl">
              Rigorous scientific benchmarking on the frozen held-out test cohort (June 1–30, 2024). All metrics evaluate raw NOAA GFS 0.25° NWP forecasts against IMD high-resolution gridded ground observations.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <span className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-mono font-semibold border border-indigo-200 dark:border-indigo-800 flex items-center">
              <ShieldCheck className="h-4 w-4 mr-1.5 text-indigo-500" />
              Phase 8 Immutable Verification
            </span>
          </div>
        </div>
      </div>

      {/* KPI Highlights Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs text-slate-500 font-medium uppercase">Raw NWP Baseline RMSE</div>
          <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
            11.62 <span className="text-xs font-normal text-slate-400">mm</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Uncorrected NOAA GFS</div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs text-slate-500 font-medium uppercase">Global ML Model RMSE</div>
          <div className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1">
            9.03 <span className="text-xs font-normal text-slate-400">mm</span>
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center">
            <TrendingDown className="h-3 w-3 mr-1" /> 22.3% error reduction
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs text-slate-500 font-medium uppercase">Regime-Aware ML RMSE</div>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            9.61 <span className="text-xs font-normal text-slate-400">mm</span>
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center">
            <TrendingDown className="h-3 w-3 mr-1" /> 17.3% error reduction
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs text-slate-500 font-medium uppercase">Held-Out Test Sample Size</div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {summary?.test_sample_count || 30} <span className="text-xs font-normal text-slate-400">days</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">June 1–30, 2024 Daily Replay</div>
        </div>
      </div>

      {/* Primary Verification Dashboard Component */}
      <VerificationDashboard
        summary={summary}
        probabilityMetrics={probabilityMetrics}
        regimeMetrics={regimeMetrics}
        isLoading={isLoading}
      />

      {/* Spatial Verification (FSS) Scientific Disclosure */}
      <div className="bg-slate-900 text-white rounded-xl p-6 border border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center space-x-2 text-indigo-400">
          <Info className="h-5 w-5" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            Spatial Verification & Fractions Skill Score (FSS) Disclosure
          </h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          The Fractions Skill Score (FSS) is a neighborhood-based spatial verification metric designed exclusively for continuous, two-dimensional gridded radar reflectivities or satellite precipitation fields. Because this operational benchmark evaluates point-based meteorological stations against co-located 0.25° grid points, <strong>FSS is mathematically non-computable</strong> for 1D single-point time series.
        </p>
        <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-300 flex items-center space-x-2 font-mono">
          <span className="text-amber-400 font-bold">STATUS:</span>
          <span>FSS NOT COMPUTABLE FOR POINT-BASED DATA. Categorical CSI, ETS, POD, and FAR are used instead.</span>
        </div>
      </div>

      {/* 2D Gridded Verification & Real Fractions Skill Score (Phase 9 & 10) */}
      <GriddedVerificationPanel />

      {/* Mandatory Limitations Panel */}
      <LimitationsPanel />
    </div>
  );
};

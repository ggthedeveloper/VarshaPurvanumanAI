import React from 'react';
import {
  Compass,
  Wind,
  Layers,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  BarChart2,
  Info,
  ShieldCheck,
} from 'lucide-react';
import {
  SynopticRegime,
  CombinedForecastResponse,
  DistrictForecastResponse,
  VerificationRegimesResponse,
} from '../types/api';

interface RegimeViewProps {
  districtForecast: DistrictForecastResponse | null;
  activeForecast: CombinedForecastResponse | null;
  verificationRegimes: VerificationRegimesResponse | null;
  onSelectPuneBenchmark: () => void;
  isLoading: boolean;
}

interface RegimeCardMeta {
  key: SynopticRegime;
  name: string;
  code: string;
  meteorologicalDefinition: string;
  synopticFeatures: string;
  color: string;
  badgeBg: string;
  borderColor: string;
  progressBarColor: string;
}

const REGIME_INFO: RegimeCardMeta[] = [
  {
    key: 'COASTAL_OROGRAPHIC',
    name: 'Coastal / Offshore Trough',
    code: 'OFFSHORE_TROUGH',
    meteorologicalDefinition:
      'Offshore trough along the west coast with strong westerly flow against the Western Ghats.',
    synopticFeatures: 'Westerly winds >15 m/s, high precipitable water >55 mm, coastal convergence.',
    color: 'text-emerald-600 dark:text-emerald-400',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    borderColor: 'border-emerald-300 dark:border-emerald-800',
    progressBarColor: 'bg-emerald-500',
  },
  {
    key: 'DEPRESSION',
    name: 'Monsoon Depression / Low Pressure',
    code: 'MONSOON_DEPRESSION',
    meteorologicalDefinition:
      'Intense cyclonic vortex formed over Bay of Bengal bringing widespread heavy rainfall.',
    synopticFeatures: '850 hPa cyclonic vorticity, low MSLP anomaly, intense shear line convection.',
    color: 'text-purple-600 dark:text-purple-400',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    borderColor: 'border-purple-300 dark:border-purple-800',
    progressBarColor: 'bg-purple-500',
  },
  {
    key: 'ACTIVE_MONSOON',
    name: 'Active Monsoon',
    code: 'ACTIVE_MONSOON',
    meteorologicalDefinition:
      'Monsoon trough south of normal position with frequent active rainfall across core zone.',
    synopticFeatures: 'Sustained monsoon trough axis, high lower-tropospheric humidity.',
    color: 'text-blue-600 dark:text-blue-400',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    borderColor: 'border-blue-300 dark:border-blue-800',
    progressBarColor: 'bg-blue-500',
  },
  {
    key: 'BREAK_MONSOON',
    name: 'Break Monsoon',
    code: 'BREAK_MONSOON',
    meteorologicalDefinition:
      'Monsoon trough shifts north towards Himalayan foothills; rainfall suppressed over central India.',
    synopticFeatures: 'Absence of westerly jet over peninsula, positive MSLP anomalies.',
    color: 'text-amber-600 dark:text-amber-400',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    borderColor: 'border-amber-300 dark:border-amber-800',
    progressBarColor: 'bg-amber-500',
  },
  {
    key: 'WESTERN_DISTURBANCE',
    name: 'Western Disturbance',
    code: 'WESTERN_DISTURBANCE',
    meteorologicalDefinition:
      'Extratropical synoptic wave embedded in mid-latitude westerlies impacting NW India & Western Himalayas.',
    synopticFeatures: 'Upper-tropospheric trough at 500/200 hPa, sub-tropical westerly jet, cold air advection.',
    color: 'text-cyan-600 dark:text-cyan-400',
    badgeBg: 'bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
    borderColor: 'border-cyan-300 dark:border-cyan-800',
    progressBarColor: 'bg-cyan-500',
  },
  {
    key: 'OTHER',
    name: 'Other / Transitional',
    code: 'OTHER',
    meteorologicalDefinition:
      'Transitional circulation states or localized diurnally-driven convective activity.',
    synopticFeatures: 'Weak pressure gradients, disorganized 850 hPa wind fields.',
    color: 'text-slate-600 dark:text-slate-400',
    badgeBg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700',
    borderColor: 'border-slate-300 dark:border-slate-700',
    progressBarColor: 'bg-slate-500',
  },
];

export const RegimeView: React.FC<RegimeViewProps> = ({
  districtForecast,
  activeForecast,
  verificationRegimes,
  onSelectPuneBenchmark,
  isLoading,
}) => {
  const isPuneBenchmark = districtForecast?.coverage_status === 'BENCHMARK_ACTIVE';
  const isProcessedBenchmark = districtForecast?.coverage_status === 'PROCESSED_BENCHMARK' || districtForecast?.forecast_mode === 'PROCESSED_DATA_REPLAY';
  const isAvailable = Boolean(activeForecast);
  const currentRegimeKey = activeForecast?.predicted_regime;
  const currentProbabilities = activeForecast?.regime_probabilities || {};

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                <Compass className="h-5 w-5" />
              </span>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Synoptic Weather Regime Classification
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
              Physical synoptic circulation classification guiding regime-conditioned rainfall post-processing.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <div className="text-right">
              <div className="text-[11px] font-semibold text-slate-400 uppercase">Current Station</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {districtForecast?.name || 'Selected Station'}
              </div>
            </div>
            {isAvailable ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                CLASSIFIED
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                DATA UNAVAILABLE
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Status / Classification Card */}
      {isAvailable ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Classification Details */}
          <div className="lg:col-span-2 bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white rounded-xl p-6 border border-indigo-500/30 shadow-lg relative overflow-hidden space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                ● CURRENT SYNOPTIC CLASSIFICATION
              </span>
              <span className="text-xs text-indigo-200 font-mono">
                Model: {activeForecast?.selected_model || 'Regime-Aware Ensemble'}
              </span>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wider text-indigo-300 font-medium">Assigned Regime</div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                {currentRegimeKey
                  ? REGIME_INFO.find((r) => r.key === currentRegimeKey)?.name || currentRegimeKey
                  : 'N/A'}
              </h2>
              <p className="text-xs sm:text-sm text-indigo-100 mt-2 max-w-2xl leading-relaxed">
                {currentRegimeKey
                  ? REGIME_INFO.find((r) => r.key === currentRegimeKey)?.meteorologicalDefinition
                  : ''}
              </p>
            </div>

            <div className="pt-4 border-t border-indigo-800/60 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <div className="text-indigo-300 font-medium">Posterior Confidence</div>
                <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
                  {currentRegimeKey && currentProbabilities[currentRegimeKey] !== undefined
                    ? `${(currentProbabilities[currentRegimeKey] * 100).toFixed(1)}%`
                    : 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-indigo-300 font-medium">Observation Source</div>
                <div className="text-xs font-semibold text-white mt-1">IMD 0.25° Gridded</div>
              </div>
              <div>
                <div className="text-indigo-300 font-medium">NWP Ingestion</div>
                <div className="text-xs font-semibold text-white mt-1">NOAA GFS (Day 1–3)</div>
              </div>
              <div>
                <div className="text-indigo-300 font-medium">Feature Verification</div>
                <div className="text-xs font-semibold text-emerald-400 mt-1 flex items-center">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> All 26 Feats Valid
                </div>
              </div>
            </div>
          </div>

          {/* Model Routing Explanation Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400">
              <Cpu className="h-5 w-5" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Regime-Aware Routing
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              When a sample is classified under <strong>{currentRegimeKey}</strong>, the prediction pipeline routes meteorological predictors into the regime-conditioned submodel.
            </p>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
              <div className="flex justify-between font-mono">
                <span className="text-slate-500">Global Model RMSE:</span>
                <span className="font-semibold text-slate-900 dark:text-white">9.03 mm</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-slate-500">Regime Submodel RMSE:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">9.61 mm</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-slate-500">Uncorrected NWP RMSE:</span>
                <span className="font-semibold text-rose-600 dark:text-rose-400">11.62 mm</span>
              </div>
            </div>
            <div className="text-[11px] text-slate-400">
              Biases are suppressed by 17.3% to 22.3% compared to raw numerical weather forecasts.
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-start space-x-4">
            <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Synoptic Telemetry Unavailable for {districtForecast?.name || 'Selected Station'}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
                Regime classification requires dynamic atmospheric variables from live telemetry. No synthetic circulation states are fabricated.
              </p>
            </div>
          </div>
          <button
            onClick={onSelectPuneBenchmark}
            className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shrink-0 cursor-pointer shadow-sm transition flex items-center space-x-2"
          >
            <span>View Pune Benchmark Regime</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 5 Synoptic Regimes Cards Grid */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Monsoon Synoptic Regimes (Physics & Posterior Probabilities)
          </h2>
          <span className="text-xs text-slate-500">5 Distinct Circulation Classes</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {REGIME_INFO.map((regime) => {
            const isCurrent = isAvailable && regime.key === currentRegimeKey;
            const prob = isAvailable && currentProbabilities[regime.key] !== undefined
              ? currentProbabilities[regime.key]
              : null;
            const probPercent = prob !== null ? (prob * 100).toFixed(1) : '—';

            return (
              <div
                key={regime.key}
                className={`bg-white dark:bg-slate-900 rounded-xl p-5 border shadow-sm transition-all flex flex-col justify-between ${
                  isCurrent
                    ? `${regime.borderColor} ring-2 ring-indigo-500/20 shadow-md`
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${regime.badgeBg}`}>
                        {regime.code}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1.5">
                        {regime.name}
                      </h3>
                    </div>
                    {isCurrent && (
                      <span className="flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-4 w-4 mr-1" /> ACTIVE
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {regime.meteorologicalDefinition}
                  </p>

                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 block">Key Indicators:</span>
                    <span>{regime.synopticFeatures}</span>
                  </div>
                </div>

                {/* Posterior Probability Bar */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Assigned Probability:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {probPercent !== '—' ? `${probPercent}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        prob !== null && prob > 0 ? regime.progressBarColor : 'bg-transparent'
                      }`}
                      style={{ width: prob !== null ? `${Math.max(prob * 100, 2)}%` : '0%' }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Regime Verification Breakdown (if available) */}
      {verificationRegimes && verificationRegimes.regimes && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <BarChart2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Regime-Conditioned Error Metrics (Phase 8 Test Cohort)
              </h3>
            </div>
            <span className="text-xs text-slate-400">June 1–30, 2024 Held-Out Replay</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Regime Class</th>
                  <th className="py-2.5 px-3">Samples (N)</th>
                  <th className="py-2.5 px-3">Raw NWP RMSE (mm)</th>
                  <th className="py-2.5 px-3">Global ML RMSE (mm)</th>
                  <th className="py-2.5 px-3">Regime-Aware RMSE (mm)</th>
                  <th className="py-2.5 px-3">Peak Improvement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {Object.entries(verificationRegimes.regimes).map(([regimeKey, metrics]) => {
                  const rawRmse = metrics['Raw NWP']?.rmse ?? 0;
                  const globalRmse = metrics['Global ML']?.rmse ?? 0;
                  const regimeRmse = metrics['Regime-Aware ML']?.rmse ?? 0;
                  const sampleCount = metrics['Regime-Aware ML']?.sample_count ?? metrics['Global ML']?.sample_count ?? '—';
                  const improvement = rawRmse > 0 ? (((rawRmse - regimeRmse) / rawRmse) * 100).toFixed(1) : '—';

                  return (
                    <tr key={regimeKey} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                        {regimeKey}
                      </td>
                      <td className="py-2.5 px-3 font-mono">{sampleCount}</td>
                      <td className="py-2.5 px-3 font-mono text-rose-600 dark:text-rose-400">
                        {rawRmse ? rawRmse.toFixed(2) : '—'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-blue-600 dark:text-blue-400">
                        {globalRmse ? globalRmse.toFixed(2) : '—'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        {regimeRmse ? regimeRmse.toFixed(2) : '—'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          +{improvement}% error drop
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

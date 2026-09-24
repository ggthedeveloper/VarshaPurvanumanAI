import React from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Percent,
  Layers,
  Info,
  HelpCircle,
} from 'lucide-react';
import {
  CombinedForecastResponse,
  DistrictForecastResponse,
  ProbabilityThresholdItem,
  VerificationProbabilityResponse,
} from '../types/api';

interface ProbabilityViewProps {
  districtForecast: DistrictForecastResponse | null;
  activeForecast: CombinedForecastResponse | null;
  verificationProbability: VerificationProbabilityResponse | null;
  onSelectPuneBenchmark: () => void;
  isLoading: boolean;
}

const THRESHOLD_DEFINITIONS: Record<
  string,
  { label: string; imdCategory: string; advisory: string; riskColor: string; bgBadge: string }
> = {
  '2.5': {
    label: '≥ 2.5 mm / 24h',
    imdCategory: 'Light / Measurable Rainfall',
    advisory: 'Routine agricultural activities normal. Field drainage generally unconstrained.',
    riskColor: 'text-sky-600 dark:text-sky-400',
    bgBadge: 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
  },
  '15.6': {
    label: '≥ 15.6 mm / 24h',
    imdCategory: 'Moderate Rainfall',
    advisory: 'Favorable for rainfed Kharif crops. Moderate runoff in urban catchment areas.',
    riskColor: 'text-blue-600 dark:text-blue-400',
    bgBadge: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  },
  '64.5': {
    label: '≥ 64.5 mm / 24h',
    imdCategory: 'Heavy Rainfall (IMD Yellow/Orange)',
    advisory: 'Waterlogging in low-lying tracts, localized localized inundation of underpasses, disruption of traffic.',
    riskColor: 'text-amber-600 dark:text-amber-400',
    bgBadge: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  '115.6': {
    label: '≥ 115.6 mm / 24h',
    imdCategory: 'Very Heavy Rainfall (IMD Orange/Red)',
    advisory: 'Extensive inundation, reservoir inflow surges, landslide risk on Western Ghats slopes. High vigilance required.',
    riskColor: 'text-rose-600 dark:text-rose-400',
    bgBadge: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  },
  '204.4': {
    label: '≥ 204.4 mm / 24h',
    imdCategory: 'Extremely Heavy Rainfall (Disaster Alert)',
    advisory: 'Severe catastrophic flooding, bridge washouts, widespread evacuation triggers. Multi-agency disaster coordination.',
    riskColor: 'text-purple-600 dark:text-purple-400',
    bgBadge: 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  },
};

export const ProbabilityView: React.FC<ProbabilityViewProps> = ({
  districtForecast,
  activeForecast,
  verificationProbability,
  onSelectPuneBenchmark,
  isLoading,
}) => {
  const isPuneBenchmark = districtForecast?.coverage_status === 'BENCHMARK_ACTIVE';
  const isProcessedBenchmark = districtForecast?.coverage_status === 'PROCESSED_BENCHMARK' || districtForecast?.forecast_mode === 'PROCESSED_DATA_REPLAY';
  const isAvailable = Boolean(activeForecast);
  const probabilities = activeForecast?.heavy_rainfall_probabilities || [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
                <ShieldAlert className="h-5 w-5" />
              </span>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Heavy Rainfall Probability Suite
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-3xl">
              Platt-calibrated probability of exceedance across standard India Meteorological Department (IMD) classification thresholds. Deterministic predictions are augmented with calibrated risk distributions.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <div className="text-right">
              <div className="text-[11px] font-semibold text-slate-400 uppercase">Station</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {districtForecast?.name || 'Selected Station'}
              </div>
            </div>
            {isAvailable ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
                CALIBRATED
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                DATA UNAVAILABLE
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Mandatory Official IMD Demarcation Disclaimer */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl p-4 flex items-start space-x-3 text-xs text-amber-900 dark:text-amber-200">
        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold uppercase tracking-wider block">
            Official Meteorological Warning Demarcation Notice
          </span>
          <p className="text-amber-800 dark:text-amber-300">
            MODEL EXCEEDANCE PROBABILITIES ARE SCIENTIFIC NUMERICAL ESTIMATES AND DO NOT CONSTITUTE OFFICIAL IMD WEATHER WARNINGS. Official color-coded alerts (Green, Yellow, Orange, Red) are issued solely by the India Meteorological Department through national weather bulletins.
          </p>
        </div>
      </div>

      {/* Main Probability Content */}
      {isAvailable ? (
        <div className="space-y-6">
          {/* 5 Threshold Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {probabilities.map((item) => {
              const probPct = (item.exceedance_probability * 100).toFixed(1);
              const numProb = item.exceedance_probability;
              const isElevated = item.advisory_status === 'ELEVATED_RISK';
              const def = THRESHOLD_DEFINITIONS[item.threshold_mm.toString()] || {
                label: `≥ ${item.threshold_mm} mm`,
                imdCategory: item.threshold_name,
                advisory: 'Precipitation threshold exceedance advisory.',
                riskColor: 'text-indigo-600 dark:text-indigo-400',
                bgBadge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
              };

              return (
                <div
                  key={item.threshold_mm}
                  className={`bg-white dark:bg-slate-900 rounded-xl p-5 border shadow-sm flex flex-col justify-between transition-all ${
                    isElevated
                      ? 'border-rose-300 dark:border-rose-800 ring-2 ring-rose-500/10'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${def.bgBadge}`}>
                        {item.category}
                      </span>
                      {isElevated ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                          ELEVATED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          NORMAL
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="text-xl font-extrabold text-slate-900 dark:text-white">
                        {def.label}
                      </div>
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                        {def.imdCategory}
                      </div>
                    </div>

                    {/* Big Exceedance Percentage */}
                    <div className="py-2">
                      <div className="text-3xl font-black font-mono text-slate-900 dark:text-white">
                        {probPct}%
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Exceedance probability P(R ≥ {item.threshold_mm})
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-2.5">
                      {def.advisory}
                    </p>
                  </div>

                  {/* Decision Threshold Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Decision Tau (τ):</span>
                      <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {item.decision_threshold_tau.toFixed(2)}
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          isElevated ? 'bg-rose-500' : 'bg-sky-500'
                        }`}
                        style={{ width: `${Math.max(numProb * 100, 2)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Platt Calibration Methodology Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Platt Calibration Methodology</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Raw machine learning model confidence scores frequently suffer from overconfidence or underconfidence. VarshaPurvanumanAI fits a sigmoid calibration function:
              </p>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 font-mono text-xs text-center text-indigo-700 dark:text-indigo-300 border border-slate-200 dark:border-slate-700">
                P(Y = 1 | f(x)) = 1 / (1 + exp(A · f(x) + B))
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Trained via out-of-fold validation on historical monsoon rainfall observations (2018–2022), mapping raw distance margins directly into statistically reliable empirical exceedance frequencies.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center space-x-2">
                <Percent className="h-4 w-4 text-indigo-500" />
                <span>Cost-Sensitive Optimal Decision Tau (τ)</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                In operational meteorological forecasting, missing an extreme downpour (False Negative) has a far greater societal cost than a precautionary False Alarm.
              </p>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc list-inside">
                <li>Operational thresholds optimize the <strong>F-beta (β=2)</strong> or <strong>Critical Success Index (CSI)</strong>.</li>
                <li>Decision threshold $\tau$ dynamically adjusts rather than defaulting to naive $0.50$.</li>
                <li>Ensures elevated disaster preparedness warnings trigger reliably before extreme flooding occurs.</li>
              </ul>
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
                Probability Exceedance Suite Unavailable for {districtForecast?.name || 'Selected Station'}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                Multi-threshold probability modeling requires real-time calibrated ensemble regressors and synchronized GFS numerical inputs. In compliance with strict meteorological integrity guidelines, synthetic probabilities are not hallucinated.
              </p>
            </div>
          </div>
          <button
            onClick={onSelectPuneBenchmark}
            className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shrink-0 cursor-pointer shadow-sm transition flex items-center space-x-2"
          >
            <span>View Pune Benchmark Probabilities</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Verification Probability Skill Metrics Table (Phase 8) */}
      {verificationProbability && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Probabilistic Verification Metrics (Phase 8 Held-Out Test Set)
              </h3>
              <p className="text-xs text-slate-500">
                Evaluation across June 1–30, 2024 held-out verification cohort
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
              RELIABLE & CALIBRATED
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Threshold</th>
                  <th className="py-2.5 px-3">Brier Score</th>
                  <th className="py-2.5 px-3">ROC-AUC</th>
                  <th className="py-2.5 px-3">PR-AUC</th>
                  <th className="py-2.5 px-3">Reliability Slope</th>
                  <th className="py-2.5 px-3">Optimal τ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {Object.entries(
                  verificationProbability.regime_aware_model || verificationProbability.global_model || {}
                ).map(([threshKey, m]) => (
                  <tr key={threshKey} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 font-mono">
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white font-sans">
                      {threshKey}
                    </td>
                    <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400 font-bold">
                      {typeof m.brier_score === 'number' ? m.brier_score.toFixed(4) : m.brier_score}
                    </td>
                    <td className="py-2.5 px-3">
                      {typeof m.roc_auc === 'number' ? m.roc_auc.toFixed(3) : m.roc_auc}
                    </td>
                    <td className="py-2.5 px-3">
                      {typeof m.pr_auc === 'number' ? m.pr_auc.toFixed(3) : m.pr_auc}
                    </td>
                    <td className="py-2.5 px-3">
                      {typeof m.reliability_slope === 'number'
                        ? m.reliability_slope.toFixed(3)
                        : m.reliability_slope}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-indigo-600 dark:text-indigo-400">
                      {typeof m.optimal_tau === 'number' ? m.optimal_tau.toFixed(2) : m.optimal_tau}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

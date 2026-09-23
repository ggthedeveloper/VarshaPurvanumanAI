import React from 'react';
import { ShieldAlert, AlertTriangle, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { ProbabilityThresholdItem } from '../../types/api';

interface ProbabilityPanelProps {
  probabilities: ProbabilityThresholdItem[];
  disclaimer: string;
}

export const ProbabilityPanel: React.FC<ProbabilityPanelProps> = ({
  probabilities,
  disclaimer,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Heavy Rainfall Probability Suite
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Platt-calibrated probability of exceedance P(Rainfall ≥ T)
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
          MODEL EXCEEDANCE PROBABILITY
        </span>
      </div>

      {/* Official Warning Demarcation Banner */}
      <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-xs">
        <span className="flex items-center text-amber-800 dark:text-amber-300 font-medium">
          <AlertCircle className="h-4 w-4 mr-1.5 text-amber-600 dark:text-amber-400 shrink-0" />
          Official Government Alert Status:
        </span>
        <span className="font-semibold text-amber-900 dark:text-amber-200">
          Official warning data unavailable
        </span>
      </div>

      {/* Exceedance Probabilities List */}
      {probabilities.length === 0 ? (
        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 space-y-1">
          <div className="font-semibold text-slate-700 dark:text-slate-300">
            Exceedance Probabilities: <span className="font-bold text-slate-900 dark:text-white">N/A</span>
          </div>
          <p>Probability exceedance estimates unavailable for unmonitored locations.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {probabilities.map((item) => {
          const probPct = (item.exceedance_probability * 100).toFixed(1);
          const isElevated = item.advisory_status === 'ELEVATED_RISK';
          const isRareThreshold = item.threshold_mm >= 64.5;

          return (
            <div
              key={item.threshold_mm}
              className={`p-3 rounded-lg border transition-all ${
                isElevated
                  ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
                  : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    ≥ {item.threshold_mm} mm
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    ({item.threshold_name})
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                      item.category === 'OPERATIONAL'
                        ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                        : 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                    }`}
                  >
                    {item.category}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                    {probPct}%
                  </span>
                  {isElevated ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white shadow-xs animate-pulse">
                      ELEVATED RISK
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      Normal
                    </span>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    isElevated ? 'bg-rose-500' : 'bg-sky-500'
                  }`}
                  style={{ width: `${probPct}%` }}
                />
              </div>

              {/* Threshold Footer & Validation Alert */}
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>Decision Threshold $\tau^* = {item.decision_threshold_tau}$</span>
                {isRareThreshold && (
                  <span className="inline-flex items-center text-amber-600 dark:text-amber-400 font-medium">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Limited validation data (0 test events)
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Disclaimers & Validation Footnote */}
      <div className="p-2.5 rounded bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
        <p className="font-semibold text-slate-800 dark:text-slate-300 uppercase tracking-wider text-[10px]">
          Official Disclaimer
        </p>
        <p>{disclaimer}</p>
        <p className="text-[10px] text-slate-500">
          *Note: The June 2024 test period experienced below-average extremes with zero events ≥64.5 mm and ≥115.6 mm. High-threshold probabilities represent model extrapolations under extreme convective features.
        </p>
      </div>
    </div>
  );
};

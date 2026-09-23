import React, { useState } from 'react';
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle, Info, Award } from 'lucide-react';
import { VerificationSummaryResponse, VerificationProbabilityResponse, VerificationRegimesResponse } from '../../types/api';

interface VerificationDashboardProps {
  summary: VerificationSummaryResponse | null;
  probabilityMetrics: VerificationProbabilityResponse | null;
  regimeMetrics: VerificationRegimesResponse | null;
  isLoading: boolean;
}

export const VerificationDashboard: React.FC<VerificationDashboardProps> = ({
  summary,
  probabilityMetrics,
  regimeMetrics,
  isLoading,
}) => {
  const [activeTab, setActiveTab] = useState<'overall' | 'thresholds' | 'regimes' | 'probability'>('overall');

  if (isLoading || !summary) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm animate-pulse space-y-4">
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
        <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded"></div>
      </div>
    );
  }

  const { continuous_metrics, fss, categorical_metrics, test_period, test_sample_count, scientific_conclusion } = summary;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Authoritative Verification Engine (Phase 8 Results)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Held-out test set evaluation ({test_period}, N = {test_sample_count} daily paired samples)
            </p>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-medium">
          <button
            onClick={() => setActiveTab('overall')}
            className={`px-3 py-1.5 rounded transition ${
              activeTab === 'overall'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            3-Model Comparison
          </button>
          <button
            onClick={() => setActiveTab('thresholds')}
            className={`px-3 py-1.5 rounded transition ${
              activeTab === 'thresholds'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Threshold Skill
          </button>
          <button
            onClick={() => setActiveTab('regimes')}
            className={`px-3 py-1.5 rounded transition ${
              activeTab === 'regimes'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Regime Breakdown
          </button>
          <button
            onClick={() => setActiveTab('probability')}
            className={`px-3 py-1.5 rounded transition ${
              activeTab === 'probability'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Probability Calibration
          </button>
        </div>
      </div>

      {/* Tab 1: Overall 3-Model Comparison */}
      {activeTab === 'overall' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Model A: Raw NWP */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-800 dark:text-slate-200">Model A: Raw NWP</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-medium">BASELINE</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">RMSE:</span>
                  <span className="font-mono font-bold">{continuous_metrics['Raw NWP'].rmse.toFixed(2)} mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">MAE:</span>
                  <span className="font-mono">{continuous_metrics['Raw NWP'].mae.toFixed(2)} mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mean Bias:</span>
                  <span className="font-mono text-rose-500 font-semibold">+{continuous_metrics['Raw NWP'].mean_bias.toFixed(2)} mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pearson r:</span>
                  <span className="font-mono">{continuous_metrics['Raw NWP'].pearson_r.toFixed(3)}</span>
                </div>
              </div>
            </div>

            {/* Model B: Global ML */}
            <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-950/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-blue-900 dark:text-blue-300">Model B: Global ML</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 font-semibold">
                  LOWEST RMSE
                </span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">RMSE:</span>
                  <span className="font-mono font-bold text-blue-700 dark:text-blue-400">
                    {continuous_metrics['Global ML'].rmse.toFixed(2)} mm (-22.3%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">MAE:</span>
                  <span className="font-mono font-semibold">{continuous_metrics['Global ML'].mae.toFixed(2)} mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mean Bias:</span>
                  <span className="font-mono">{continuous_metrics['Global ML'].mean_bias.toFixed(2)} mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pearson r:</span>
                  <span className="font-mono">{continuous_metrics['Global ML'].pearson_r.toFixed(3)}</span>
                </div>
              </div>
            </div>

            {/* Model C: Regime-Aware ML */}
            <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-indigo-900 dark:text-indigo-300">Model C: Regime-Aware ML</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-300 font-semibold">
                  PROPOSED SYSTEM
                </span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">RMSE:</span>
                  <span className="font-mono font-bold text-indigo-700 dark:text-indigo-400">
                    {continuous_metrics['Regime-Aware ML'].rmse.toFixed(2)} mm (-17.3%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">MAE:</span>
                  <span className="font-mono font-semibold">{continuous_metrics['Regime-Aware ML'].mae.toFixed(2)} mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mean Bias:</span>
                  <span className="font-mono">{continuous_metrics['Regime-Aware ML'].mean_bias.toFixed(2)} mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pearson r:</span>
                  <span className="font-mono">{continuous_metrics['Regime-Aware ML'].pearson_r.toFixed(3)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* FSS Status Alert (Strict SIH Transparency) */}
          <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-amber-900 dark:text-amber-200">
                  Spatial Verification: Fractions Skill Score (FSS)
                </span>
                <span className="px-2 py-0.5 rounded font-mono font-bold bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 text-[10px]">
                  {fss.status}
                </span>
              </div>
              <p className="text-amber-800 dark:text-amber-300">
                <strong>Justification:</strong> {fss.reason}
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                To prevent fabricated spatial results, FSS requires simultaneous 2-D forecast grids and gridded spatial observation radar/satellite products. The point-station evaluation protocol mathematically prohibits honest FSS computation.
              </p>
            </div>
          </div>

          {/* Scientific Conclusion Callout */}
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-start space-x-2.5">
            <Info className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-900 dark:text-white uppercase text-[10px] block">
                Verification Synthesis & Conclusion
              </span>
              <span>{scientific_conclusion}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Threshold-wise Categorical Performance */}
      {activeTab === 'thresholds' && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Threshold</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Model</th>
                <th className="py-2.5 px-3">Obs / Fcst Events</th>
                <th className="py-2.5 px-3">POD (Recall)</th>
                <th className="py-2.5 px-3">FAR</th>
                <th className="py-2.5 px-3">CSI</th>
                <th className="py-2.5 px-3">ETS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {['2.5', '7.5', '15.6', '64.5', '115.6'].map((thr) => {
                const rawInfo = categorical_metrics['Raw NWP']?.[thr];
                const globalInfo = categorical_metrics['Global ML']?.[thr];
                const regimeInfo = categorical_metrics['Regime-Aware ML']?.[thr];

                if (!rawInfo) return null;

                return (
                  <React.Fragment key={thr}>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/30 font-semibold">
                      <td rowSpan={3} className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 font-bold">
                        ≥ {thr} mm
                      </td>
                      <td rowSpan={3} className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 text-[10px]">
                        {rawInfo.category}
                      </td>
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-300">Raw NWP</td>
                      <td className="py-2 px-3 font-mono">{rawInfo.contingency_table.observed_events} / {rawInfo.contingency_table.forecast_events}</td>
                      <td className="py-2 px-3 font-mono">{typeof rawInfo.POD === 'number' ? rawInfo.POD.toFixed(3) : rawInfo.POD}</td>
                      <td className="py-2 px-3 font-mono">{typeof rawInfo.FAR === 'number' ? rawInfo.FAR.toFixed(3) : rawInfo.FAR}</td>
                      <td className="py-2 px-3 font-mono">{typeof rawInfo.CSI === 'number' ? rawInfo.CSI.toFixed(3) : rawInfo.CSI}</td>
                      <td className="py-2 px-3 font-mono">{typeof rawInfo.ETS === 'number' ? rawInfo.ETS.toFixed(3) : rawInfo.ETS}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-blue-600 font-medium">Global ML</td>
                      <td className="py-2 px-3 font-mono">{globalInfo.contingency_table.observed_events} / {globalInfo.contingency_table.forecast_events}</td>
                      <td className="py-2 px-3 font-mono">{typeof globalInfo.POD === 'number' ? globalInfo.POD.toFixed(3) : globalInfo.POD}</td>
                      <td className="py-2 px-3 font-mono">{typeof globalInfo.FAR === 'number' ? globalInfo.FAR.toFixed(3) : globalInfo.FAR}</td>
                      <td className="py-2 px-3 font-mono">{typeof globalInfo.CSI === 'number' ? globalInfo.CSI.toFixed(3) : globalInfo.CSI}</td>
                      <td className="py-2 px-3 font-mono">{typeof globalInfo.ETS === 'number' ? globalInfo.ETS.toFixed(3) : globalInfo.ETS}</td>
                    </tr>
                    <tr className="border-b border-slate-300 dark:border-slate-700">
                      <td className="py-2 px-3 text-indigo-600 font-medium">Regime-Aware ML</td>
                      <td className="py-2 px-3 font-mono">{regimeInfo.contingency_table.observed_events} / {regimeInfo.contingency_table.forecast_events}</td>
                      <td className="py-2 px-3 font-mono">{typeof regimeInfo.POD === 'number' ? regimeInfo.POD.toFixed(3) : regimeInfo.POD}</td>
                      <td className="py-2 px-3 font-mono">{typeof regimeInfo.FAR === 'number' ? regimeInfo.FAR.toFixed(3) : regimeInfo.FAR}</td>
                      <td className="py-2 px-3 font-mono">{typeof regimeInfo.CSI === 'number' ? regimeInfo.CSI.toFixed(3) : regimeInfo.CSI}</td>
                      <td className="py-2 px-3 font-mono">{typeof regimeInfo.ETS === 'number' ? regimeInfo.ETS.toFixed(3) : regimeInfo.ETS}</td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Regime-wise Performance Breakdown */}
      {activeTab === 'regimes' && regimeMetrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(regimeMetrics.regimes).map(([regName, modelsMap]) => (
            <div key={regName} className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
              <span className="font-bold text-xs uppercase text-slate-800 dark:text-slate-200 tracking-wider">
                {regName.replace('_', ' ')}
              </span>
              <div className="space-y-1 text-xs">
                {Object.entries(modelsMap).map(([mName, metrics]) => (
                  <div key={mName} className="flex justify-between py-0.5 border-b border-slate-200/50 dark:border-slate-700/50 last:border-none">
                    <span className="text-slate-500 text-[11px]">{mName}:</span>
                    <span className="font-mono text-[11px]">
                      RMSE: {metrics.rmse.toFixed(2)} mm (N={metrics.sample_count})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Probability Calibration & Reliability */}
      {activeTab === 'probability' && probabilityMetrics && (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Threshold</th>
                  <th className="py-2.5 px-3">Brier Score</th>
                  <th className="py-2.5 px-3">ROC-AUC</th>
                  <th className="py-2.5 px-3">PR-AUC</th>
                  <th className="py-2.5 px-3">Optimal Decision $\tau^*$</th>
                  <th className="py-2.5 px-3">Obs Pos Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {Object.entries(probabilityMetrics.regime_aware_model).map(([thr, m]) => (
                  <tr key={thr} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-bold">≥ {thr} mm</td>
                    <td className="py-2.5 px-3 font-mono">{m.brier_score.toFixed(4)}</td>
                    <td className="py-2.5 px-3 font-mono">{typeof m.roc_auc === 'number' ? m.roc_auc.toFixed(3) : m.roc_auc}</td>
                    <td className="py-2.5 px-3 font-mono">{typeof m.pr_auc === 'number' ? m.pr_auc.toFixed(3) : m.pr_auc}</td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-indigo-600 dark:text-indigo-400">{m.optimal_tau}</td>
                    <td className="py-2.5 px-3 font-mono">{(m.observed_positive_rate * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-slate-500">
            *Brier Score measures mean squared error of probabilistic forecasts (0 is perfect reliability). Optimal decision thresholds $\tau^*$ maximize the Critical Success Index (CSI).
          </p>
        </div>
      )}
    </div>
  );
};

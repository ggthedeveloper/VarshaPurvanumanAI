import React from 'react';
import { Compass, Cpu, Info, CheckCircle2 } from 'lucide-react';
import { SynopticRegime } from '../../types/api';

interface WeatherRegimePanelProps {
  predictedRegime: SynopticRegime | null;
  probabilities: Record<string, number>;
  confidence: number | null;
  selectedModel: string | null;
}

const REGIME_METADATA: Record<
  SynopticRegime,
  { name: string; description: string; color: string; barColor: string }
> = {
  ACTIVE_MONSOON: {
    name: 'Active Monsoon',
    description: 'Vigorous monsoon trough with widespread convective precipitation across core zone.',
    color: 'text-blue-600 dark:text-blue-400',
    barColor: 'bg-blue-600',
  },
  BREAK_MONSOON: {
    name: 'Break Monsoon',
    description: 'Trough shifts towards Himalayan foothills; suppressed rainfall over central India.',
    color: 'text-amber-600 dark:text-amber-400',
    barColor: 'bg-amber-600',
  },
  COASTAL_OROGRAPHIC: {
    name: 'Coastal / Orographic',
    description: 'Strong westerly offshore moisture flux with Western Ghats terrain uplift.',
    color: 'text-emerald-600 dark:text-emerald-400',
    barColor: 'bg-emerald-600',
  },
  DEPRESSION: {
    name: 'Depression / Low Pressure',
    description: 'Synoptic cyclonic vortex originating over Bay of Bengal moving west-northwest.',
    color: 'text-purple-600 dark:text-purple-400',
    barColor: 'bg-purple-600',
  },
  WESTERN_DISTURBANCE: {
    name: 'Western Disturbance',
    description: 'Extratropical synoptic wave embedded in mid-latitude westerlies impacting NW India & Western Himalayas.',
    color: 'text-cyan-600 dark:text-cyan-400',
    barColor: 'bg-cyan-600',
  },
  OTHER: {
    name: 'Other / Transitional',
    description: 'Quiescent synoptic state or regional localized convection.',
    color: 'text-slate-600 dark:text-slate-400',
    barColor: 'bg-slate-600',
  },
};

export const WeatherRegimePanel: React.FC<WeatherRegimePanelProps> = ({
  predictedRegime,
  probabilities,
  confidence,
  selectedModel,
}) => {
  const isAvailable = Boolean(predictedRegime);
  const activeMeta = predictedRegime ? REGIME_METADATA[predictedRegime] : null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Weather Regime Classification
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Synoptic circulation state conditioned inference
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
          PREDICTED REGIME
        </span>
      </div>

      {/* Active Predicted Regime Highlight */}
      <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-medium text-slate-500 uppercase">Assigned Category</span>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Confidence: {isAvailable && confidence !== null ? `${(confidence * 100).toFixed(1)}%` : 'N/A'}
          </span>
        </div>
        <div className="mt-1 flex items-center space-x-2">
          {isAvailable && activeMeta ? (
            <>
              <CheckCircle2 className={`h-5 w-5 ${activeMeta.color}`} />
              <span className={`text-lg font-bold tracking-tight ${activeMeta.color}`}>
                {activeMeta.name}
              </span>
            </>
          ) : (
            <span className="text-lg font-bold tracking-tight text-slate-400 dark:text-slate-500">
              N/A
            </span>
          )}
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
          {isAvailable && activeMeta
            ? activeMeta.description
            : 'Regime classification unavailable for unmonitored location.'}
        </p>

        {/* Model Routing Indicator */}
        <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center">
            <Cpu className="h-3.5 w-3.5 mr-1 text-slate-400" />
            Operational Submodel:
          </span>
          <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
            {isAvailable && selectedModel ? selectedModel : 'N/A'}
          </span>
        </div>
      </div>

      {/* Class Posterior Probabilities */}
      {isAvailable && Object.keys(probabilities).length > 0 ? (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Posterior Class Distribution</span>
            <span>Pr(Regime | X)</span>
          </div>
          {((probabilities.WESTERN_DISTURBANCE !== undefined
            ? ['ACTIVE_MONSOON', 'BREAK_MONSOON', 'COASTAL_OROGRAPHIC', 'DEPRESSION', 'WESTERN_DISTURBANCE', 'OTHER']
            : ['ACTIVE_MONSOON', 'BREAK_MONSOON', 'COASTAL_OROGRAPHIC', 'DEPRESSION', 'OTHER']
          ) as SynopticRegime[]).map(
            (regKey) => {
              const prob = probabilities[regKey] || 0;
              const pct = (prob * 100).toFixed(1);
              const isSelected = regKey === predictedRegime;
              const meta = REGIME_METADATA[regKey];

              return (
                <div key={regKey} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span
                      className={`font-medium ${
                        isSelected
                          ? 'text-slate-900 dark:text-white font-semibold'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {meta.name}
                    </span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">{pct}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${meta.barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            }
          )}
        </div>
      ) : (
        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
          Regime classification probabilities: <strong>N/A</strong> (data unavailable)
        </div>
      )}

      {/* Scientific Transparency Notice */}
      <div className="flex items-start space-x-2 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded border border-slate-200/60 dark:border-slate-800">
        <Info className="h-3.5 w-3.5 mt-0.5 text-slate-400 shrink-0" />
        <span>
          Regime probabilities are determined from 850 hPa wind fields, cyclonic vorticity, and thermodynamic sounding proxies. Ground truth regime data is reserved strictly for historical verification.
        </span>
      </div>
    </div>
  );
};

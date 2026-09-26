import React from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const LimitationsPanel: React.FC = () => {
  return (
    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl border border-amber-200/80 dark:border-amber-900/60 p-5 shadow-xs space-y-4">
      <div className="flex items-center space-x-2 pb-3 border-b border-amber-100 dark:border-amber-900/40 min-w-0">
        <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 shrink-0">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-amber-950 dark:text-amber-200 uppercase tracking-wider truncate">
            Scientific & Data Limitations Disclosure
          </h3>
          <p className="text-xs text-amber-800/80 dark:text-amber-400 truncate">
            Mandatory MoES Scientific Integrity Standards
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs text-slate-700 dark:text-slate-300">
        <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 space-y-1 min-w-0">
          <span className="font-semibold text-amber-900 dark:text-amber-200 flex items-center">
            <AlertTriangle className="h-3.5 w-3.5 mr-1 text-amber-600 shrink-0" />
            1. Held-Out Test Window (June 2024)
          </span>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 break-words leading-relaxed">
            The quantitative evaluation is conducted strictly on the independent chronologically held-out June 1–30, 2024 test period ($N = 31$ consecutive daily cycles) following JJAS 2021–2022 training ($N = 244$) and JJAS 2023 validation ($N = 122$).
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 space-y-1 min-w-0">
          <span className="font-semibold text-amber-900 dark:text-amber-200 flex items-center">
            <AlertTriangle className="h-3.5 w-3.5 mr-1 text-amber-600 shrink-0" />
            2. Limited Extreme Events (Zero ≥64.5 mm Events)
          </span>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 break-words leading-relaxed">
            The June 2024 test cohort experienced zero observed daily events exceeding 64.5 mm (Heavy Rain) or 115.6 mm (Very Heavy Rain). Consequently, high-threshold exceedance models are calibrated on training data but cannot be definitively evaluated on June 2024 test extremes.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 space-y-1 min-w-0">
          <span className="font-semibold text-amber-900 dark:text-amber-200 flex items-center">
            <AlertTriangle className="h-3.5 w-3.5 mr-1 text-amber-600 shrink-0" />
            3. Spatial Verification: FSS Not Computable
          </span>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 break-words leading-relaxed">
            Fractions Skill Score (FSS) is explicitly declared <code>NOT_COMPUTABLE</code>. The benchmark paired dataset is point-based (18.50°N, 73.80°E); mathematical FSS calculation strictly requires spatial 2-D radar/satellite observation fields.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 space-y-1 min-w-0">
          <span className="font-semibold text-amber-900 dark:text-amber-200 flex items-center">
            <AlertTriangle className="h-3.5 w-3.5 mr-1 text-amber-600 shrink-0" />
            4. Station-Level Benchmark vs Regional Aggregates
          </span>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 break-words leading-relaxed">
            The active model predictions apply exclusively to the <strong>Pune Benchmark Station (18.50°N, 73.80°E)</strong>. To uphold scientific fidelity, we do not interpolate station point values across the entire district polygon without verified regional observations.
          </p>
        </div>
      </div>

      <div className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-800/80 border border-amber-200/80 dark:border-amber-900/40 text-[11px] text-slate-600 dark:text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
        <span className="flex items-center text-emerald-600 dark:text-emerald-400 font-semibold shrink-0">
          <CheckCircle2 className="h-4 w-4 mr-1.5 shrink-0" />
          Strict Zero-Fabrication Guarantee
        </span>
        <span className="text-slate-500 break-words">
          Unmonitored districts transparently display "DATA UNAVAILABLE". No synthetic data is generated.
        </span>
      </div>
    </div>
  );
};

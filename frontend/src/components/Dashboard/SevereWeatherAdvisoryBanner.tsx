import React from 'react';
import {
  AlertTriangle,
  ShieldCheck,
  AlertOctagon,
  AlertCircle,
  Truck,
  Droplets,
  Building,
  ArrowRight,
  Info,
} from 'lucide-react';
import { CombinedForecastResponse, ProbabilityThresholdItem } from '../../types/api';

interface SevereWeatherAdvisoryBannerProps {
  districtName: string;
  activeForecast: CombinedForecastResponse | null;
  isDarkMode: boolean;
  onExploreProbability?: () => void;
}

export type IMDWarningCategory = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';

interface WarningDetails {
  level: IMDWarningCategory;
  title: string;
  subtitle: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  icon: React.ReactNode;
  actionItems: string[];
}

export const SevereWeatherAdvisoryBanner: React.FC<SevereWeatherAdvisoryBannerProps> = ({
  districtName,
  activeForecast,
  isDarkMode,
  onExploreProbability,
}) => {
  const rainMm = activeForecast?.corrected_rainfall_mm ?? 0;
  const probs = activeForecast?.heavy_rainfall_probabilities ?? [];

  // Find probability of exceeding 64.5 mm (Heavy) and 115.6 mm (Very Heavy)
  const prob64 = probs.find((p) => Math.abs(p.threshold_mm - 64.5) < 1.0)?.exceedance_probability ?? 0;
  const prob115 = probs.find((p) => Math.abs(p.threshold_mm - 115.6) < 1.0)?.exceedance_probability ?? 0;
  const prob15 = probs.find((p) => Math.abs(p.threshold_mm - 15.6) < 1.0 || Math.abs(p.threshold_mm - 15.0) < 1.0)?.exceedance_probability ?? 0;

  const warning: WarningDetails = React.useMemo(() => {
    if (rainMm >= 115.6 || prob115 >= 0.35) {
      return {
        level: 'RED',
        title: '🔴 RED WARNING: Extremely Heavy Rainfall Alert',
        subtitle: `Disruptive precipitation exceeding 115.6 mm projected for ${districtName}. Severe inundation risk.`,
        colorClass: 'text-rose-700 dark:text-rose-300',
        bgClass: 'bg-rose-50/90 dark:bg-rose-950/40',
        borderClass: 'border-rose-300 dark:border-rose-800',
        icon: <AlertOctagon className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 animate-bounce" />,
        actionItems: [
          'High risk of localized urban flooding and waterlogging in low-lying corridors.',
          'Substantial delays expected on road and suburban rail infrastructure.',
          'Reservoir inflow spike anticipated; municipal disaster response on high alert.',
        ],
      };
    }

    if (rainMm >= 64.5 || prob64 >= 0.4) {
      return {
        level: 'ORANGE',
        title: '🟠 ORANGE ALERT: Heavy Rainfall Advisory (Be Prepared)',
        subtitle: `Persistent heavy rain bands (64.5 – 115.5 mm) modeled across ${districtName}. Significant runoff forecast.`,
        colorClass: 'text-amber-800 dark:text-amber-300',
        bgClass: 'bg-amber-50/90 dark:bg-amber-950/40',
        borderClass: 'border-amber-300 dark:border-amber-800',
        icon: <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />,
        actionItems: [
          'Moderate waterlogging expected at vulnerable arterial road junctions.',
          'Sustained stormwater drainage loads; agricultural field runoffs likely.',
          'Commuters advised to check real-time traffic corridor advisories before travel.',
        ],
      };
    }

    if (rainMm >= 15.6 || prob15 >= 0.45) {
      return {
        level: 'YELLOW',
        title: '🟡 YELLOW WATCH: Moderate to Rather Heavy Rainfall (Be Updated)',
        subtitle: `Light to moderate convective spells (15.6 – 64.4 mm) expected across ${districtName}.`,
        colorClass: 'text-yellow-800 dark:text-yellow-300',
        bgClass: 'bg-yellow-50/80 dark:bg-yellow-950/30',
        borderClass: 'border-yellow-200 dark:border-yellow-800/60',
        icon: <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0" />,
        actionItems: [
          'Intermittent monsoon showers with brief reduction in horizontal visibility.',
          'Normal municipal stormwater operation; localized surface ponding possible.',
          'Standard agricultural irrigation precautions recommended.',
        ],
      };
    }

    return {
      level: 'GREEN',
      title: '🟢 GREEN ADVISORY: Normal Monsoon Weather Operations',
      subtitle: `Dry or light trace precipitation (≤15.5 mm) forecast for ${districtName}. No meteorological alerts active.`,
      colorClass: 'text-emerald-800 dark:text-emerald-300',
      bgClass: 'bg-emerald-50/70 dark:bg-emerald-950/30',
      borderClass: 'border-emerald-200 dark:border-emerald-800/60',
      icon: <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
      actionItems: [
        'Safe operating conditions across transit, power, and civil infrastructures.',
        'Routine atmospheric monitoring active via calibrated AI ensemble post-processors.',
      ],
    };
  }, [rainMm, prob115, prob64, prob15, districtName]);

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 border ${warning.borderClass} ${warning.bgClass} backdrop-blur-md transition-all shadow-xs space-y-3`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center space-x-3 min-w-0">
          <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 shadow-xs shrink-0">
            {warning.icon}
          </div>
          <div className="min-w-0">
            <h3 className={`text-sm sm:text-base font-bold ${warning.colorClass} tracking-tight truncate`}>
              {warning.title}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              {warning.subtitle}
            </p>
          </div>
        </div>

        {onExploreProbability && (
          <button
            onClick={onExploreProbability}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs transition cursor-pointer shrink-0"
          >
            <span>Exceedance Probabilities</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Tangible Impact Action Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
        {warning.actionItems.map((item, idx) => (
          <div
            key={idx}
            className="flex items-start space-x-2 text-[11px] text-slate-700 dark:text-slate-300 bg-white/60 dark:bg-slate-900/40 p-2 rounded-lg border border-slate-200/40 dark:border-slate-800/40"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-500 mt-1.5 shrink-0" />
            <span className="leading-snug">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

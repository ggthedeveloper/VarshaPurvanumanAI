import React from 'react';
import {
  Car,
  Sprout,
  Zap,
  Waves,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ArrowUpRight,
} from 'lucide-react';
import { CombinedForecastResponse } from '../../types/api';

interface SectoralImpactGridProps {
  districtName: string;
  activeForecast: CombinedForecastResponse | null;
  isDarkMode: boolean;
}

export const SectoralImpactGrid: React.FC<SectoralImpactGridProps> = ({
  districtName,
  activeForecast,
  isDarkMode,
}) => {
  const rain = activeForecast?.corrected_rainfall_mm ?? 18.5;

  const isSevere = rain >= 64.5;
  const isModerate = rain >= 15.6 && rain < 64.5;

  return (
    <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Multi-Sector Decision Intelligence
          </span>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
            Operational Vulnerability Index: {districtName}
          </h3>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/60">
          IMD SOP Aligned
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Sector 1: Transportation */}
        <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400">
              <Car className="h-4 w-4" />
            </div>
            {isSevere ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300">
                Major Delay
              </span>
            ) : isModerate ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300">
                Slow Traffic
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">
                Smooth Flow
              </span>
            )}
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Urban Mobility & Transit
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
              {isSevere
                ? 'Underpass waterlogging and subway slowdown likely; avoid low-lying arterial bypasses.'
                : isModerate
                ? 'Surface runoff on flyovers; reduced braking friction; caution advised during peak hours.'
                : 'All arterial roads and public transport lines operating under normal schedule.'}
            </p>
          </div>
        </div>

        {/* Sector 2: Agriculture */}
        <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400">
              <Sprout className="h-4 w-4" />
            </div>
            {isSevere ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300">
                Field Drainage Req.
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">
                Favorable Moisture
              </span>
            )}
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Agriculture & Kharif Crops
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
              {isSevere
                ? 'Provide immediate outlet drainage for paddy and pulse nurseries to prevent root hypoxia.'
                : isModerate
                ? 'Optimum soil moisture for active tillering; postpone immediate foliar fertilizer spraying.'
                : 'Adequate soil recharge; normal farming and sowing operations can proceed smoothly.'}
            </p>
          </div>
        </div>

        {/* Sector 3: Infrastructure & Energy */}
        <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400">
              <Zap className="h-4 w-4" />
            </div>
            {isSevere ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300">
                Grid Vulnerability
              </span>
            ) : isModerate ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300">
                Watch Active
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">
                Nominal Risk
              </span>
            )}
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Power Grid & Sub-Stations
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
              {isSevere
                ? 'Elevated lightning activity; inspect feeder breakers and basement pump emergency relays.'
                : isModerate
                ? 'Moderate wind gusts near transmission corridors; maintain standard readiness patrols.'
                : 'Nominal wind load and lightning index; utility transmission operating within safe margins.'}
            </p>
          </div>
        </div>

        {/* Sector 4: Water Resources & Dams */}
        <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400">
              <Waves className="h-4 w-4" />
            </div>
            {isSevere ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300">
                High Inflow Alert
              </span>
            ) : isModerate ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-700 dark:bg-teal-950/80 dark:text-teal-300">
                Steady Inflow
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">
                Controlled Flow
              </span>
            )}
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Catchment Basin Influx
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
              {isSevere
                ? 'Anticipate rapid riverine surge in catchment tributaries within 6–12 hours. Alert flood cell.'
                : isModerate
                ? 'Gradual reservoir storage accretion; manage canal outflow gates according to seasonal rule curve.'
                : 'Baseline baseflow in major drainage channels; no dam spillway discharge required.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

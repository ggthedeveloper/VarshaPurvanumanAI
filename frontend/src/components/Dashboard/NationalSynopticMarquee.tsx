import React from 'react';
import {
  Activity,
  Radio,
  Cpu,
  ShieldCheck,
  AlertTriangle,
  Waves,
  Zap,
  Clock,
  Compass,
} from 'lucide-react';
import { SynopticRegime } from '../../types/api';

interface NationalSynopticMarqueeProps {
  currentRegime?: SynopticRegime | string;
  isDarkMode: boolean;
  activeDistrictsCount?: number;
  elevatedAlertsCount?: number;
}

export const NationalSynopticMarquee: React.FC<NationalSynopticMarqueeProps> = ({
  currentRegime = 'ACTIVE_MONSOON',
  isDarkMode,
  activeDistrictsCount = 742,
  elevatedAlertsCount = 18,
}) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 text-white shadow-lg shadow-indigo-950/20">
      {/* Background Ambient Glow */}
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="px-4 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        {/* Left: System Status & Pulse */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="flex items-center space-x-2 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] tracking-wide uppercase font-mono">LIVE NWP STREAM</span>
          </div>

          <div className="hidden sm:flex items-center space-x-1.5 text-slate-300 text-[11px]">
            <Radio className="h-3.5 w-3.5 text-sky-400 animate-pulse" />
            <span className="font-mono text-slate-400">NOAA GFS 0.12°</span>
            <span className="text-slate-600">•</span>
            <span className="font-mono text-slate-400">NCMRWF Ingest Active</span>
          </div>
        </div>

        {/* Center: Live Telemetry Chips */}
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          {/* Active Synoptic Regime */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-slate-800/80 border border-slate-700/80 text-slate-200">
            <Compass className="h-3.5 w-3.5 text-indigo-400" />
            <span className="text-slate-400 font-medium">Synoptic:</span>
            <span className="font-bold text-sky-300">
              {String(currentRegime).replace(/_/g, ' ')}
            </span>
          </div>

          {/* Model AI Status */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-slate-800/80 border border-slate-700/80 text-slate-200">
            <Cpu className="h-3.5 w-3.5 text-purple-400" />
            <span className="text-slate-400 font-medium">Model:</span>
            <span className="font-mono font-semibold text-purple-300">Regime-Aware Post-Processor</span>
          </div>

          {/* National Coverage */}
          <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-slate-800/80 border border-slate-700/80 text-slate-200">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-slate-400 font-medium">Grid:</span>
            <span className="font-mono text-emerald-300 font-semibold">{activeDistrictsCount} Stations</span>
          </div>

          {/* Severe Warning Count */}
          {elevatedAlertsCount > 0 && (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400 animate-bounce" />
              <span className="font-bold">{elevatedAlertsCount} Heavy Rain Alerts</span>
            </div>
          )}
        </div>

        {/* Right: Latency & Timezone */}
        <div className="hidden xl:flex items-center space-x-2 text-[11px] text-slate-400 shrink-0 font-mono">
          <Clock className="h-3.5 w-3.5 text-slate-500" />
          <span>IST (UTC+5:30)</span>
          <span className="text-slate-600">•</span>
          <span className="text-emerald-400">Latency: 38ms</span>
        </div>
      </div>
    </div>
  );
};

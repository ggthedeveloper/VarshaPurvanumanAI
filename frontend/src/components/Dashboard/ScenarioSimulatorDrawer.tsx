import React, { useState } from 'react';
import {
  Sliders,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Activity,
  Droplets,
  Wind,
  ShieldAlert,
  Flame,
} from 'lucide-react';
import { CombinedForecastResponse } from '../../types/api';

interface ScenarioSimulatorDrawerProps {
  activeForecast: CombinedForecastResponse | null;
  districtName: string;
  isDarkMode: boolean;
}

export const ScenarioSimulatorDrawer: React.FC<ScenarioSimulatorDrawerProps> = ({
  activeForecast,
  districtName,
  isDarkMode,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const initialRaw = activeForecast?.raw_nwp_rainfall_mm ?? 16.5;
  const [simRawRain, setSimRawRain] = useState<number>(initialRaw);
  const [simWind, setSimWind] = useState<number>(12);
  const [simHumidity, setSimHumidity] = useState<number>(84);
  const [simCape, setSimCape] = useState<number>(1800);

  // Dynamic physics-informed AI inference approximation
  const simAiRain = React.useMemo(() => {
    // Topographic factor + moisture flux boost
    const moistureBoost = (simHumidity - 70) * 0.12;
    const windOrographicFactor = (simWind / 15) * 1.15;
    const capeInstability = (simCape / 2000) * 1.1;

    let corrected = simRawRain * windOrographicFactor + moistureBoost;
    if (simCape > 2500) {
      corrected += (simCape - 2500) * 0.004;
    }
    return Math.max(0, Number(corrected.toFixed(1)));
  }, [simRawRain, simWind, simHumidity, simCape]);

  const simDelta = Number((simAiRain - simRawRain).toFixed(1));

  // Dynamic exceedance calculation
  const prob15 = Math.min(100, Math.round(100 / (1 + Math.exp(-0.15 * (simAiRain - 15.6)))));
  const prob64 = Math.min(100, Math.round(100 / (1 + Math.exp(-0.08 * (simAiRain - 64.5)))));
  const prob115 = Math.min(100, Math.round(100 / (1 + Math.exp(-0.06 * (simAiRain - 115.6)))));

  const handleReset = () => {
    setSimRawRain(initialRaw);
    setSimWind(12);
    setSimHumidity(84);
    setSimCape(1800);
  };

  return (
    <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs transition-all">
      {/* Drawer Toggle Header */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Sliders className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Interactive NWP Meteorological Sandbox
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60">
                What-If Stress Tester
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Simulate atmospheric shifts in real time to evaluate AI model downscaling sensitivity
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hidden sm:inline">
            {isOpen ? 'Collapse Simulator' : 'Open Simulator'}
          </span>
          <div className="p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500">
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </div>

      {/* Expanded Interactive Simulation Canvas */}
      {isOpen && (
        <div className="pt-5 mt-4 border-t border-slate-100 dark:border-slate-800 space-y-5 animate-in fade-in duration-200">
          {/* Top Live Output Telemetry Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Simulated NWP</span>
              <span className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400">
                {simRawRain.toFixed(1)} mm
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">AI Downscaled Output</span>
              <span className="text-lg font-bold font-mono text-sky-600 dark:text-sky-400">
                {simAiRain} mm
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">AI Residual Bias</span>
              <span className={`text-lg font-bold font-mono ${simDelta >= 0 ? 'text-emerald-500' : 'text-indigo-400'}`}>
                {simDelta >= 0 ? `+${simDelta}` : simDelta} mm
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Heavy Rain Risk (&ge;64.5mm)</span>
              <span className={`text-lg font-bold font-mono ${prob64 >= 40 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
                {prob64}%
              </span>
            </div>
          </div>

          {/* Sliders Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Slider 1: Raw NWP Rain */}
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-50/60 dark:bg-slate-800/30 border border-slate-200/40 dark:border-slate-800">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                  <Droplets className="h-3 w-3 text-amber-500" />
                  <span>Incoming GFS Rain</span>
                </span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{simRawRain} mm</span>
              </div>
              <input
                type="range"
                min="0"
                max="120"
                step="1"
                value={simRawRain}
                onChange={(e) => setSimRawRain(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block">Raw global forecast input</span>
            </div>

            {/* Slider 2: Wind Speed */}
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-50/60 dark:bg-slate-800/30 border border-slate-200/40 dark:border-slate-800">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                  <Wind className="h-3 w-3 text-teal-500" />
                  <span>850hPa Wind Speed</span>
                </span>
                <span className="font-mono font-bold text-teal-600 dark:text-teal-400">{simWind} m/s</span>
              </div>
              <input
                type="range"
                min="2"
                max="35"
                step="1"
                value={simWind}
                onChange={(e) => setSimWind(Number(e.target.value))}
                className="w-full accent-teal-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block">Orographic slope flux scaling</span>
            </div>

            {/* Slider 3: Relative Humidity */}
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-50/60 dark:bg-slate-800/30 border border-slate-200/40 dark:border-slate-800">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                  <Activity className="h-3 w-3 text-sky-500" />
                  <span>Column Humidity</span>
                </span>
                <span className="font-mono font-bold text-sky-600 dark:text-sky-400">{simHumidity}%</span>
              </div>
              <input
                type="range"
                min="40"
                max="99"
                step="1"
                value={simHumidity}
                onChange={(e) => setSimHumidity(Number(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block">Specific moisture saturation</span>
            </div>

            {/* Slider 4: CAPE Instability */}
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-50/60 dark:bg-slate-800/30 border border-slate-200/40 dark:border-slate-800">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                  <Flame className="h-3 w-3 text-purple-500" />
                  <span>CAPE Instability</span>
                </span>
                <span className="font-mono font-bold text-purple-600 dark:text-purple-400">{simCape} J/kg</span>
              </div>
              <input
                type="range"
                min="200"
                max="3800"
                step="50"
                value={simCape}
                onChange={(e) => setSimCape(Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block">Convective available energy</span>
            </div>
          </div>

          {/* Probability Exceedance Chips Under Simulation */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Simulated Probabilities:
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                &ge;15.6mm: <b>{prob15}%</b>
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                &ge;64.5mm: <b>{prob64}%</b>
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                &ge;115.6mm: <b>{prob115}%</b>
              </span>
            </div>

            <button
              onClick={handleReset}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset to Station Default</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import {
  CloudRain,
  Wind,
  Sun,
  Zap,
  Sliders,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  Waves,
  Snowflake,
  ChevronDown,
  Sunrise,
  Sunset,
  SunDim,
  Moon,
  Clock,
} from 'lucide-react';
import { useWeather, WeatherMode, WeatherIntensity, TimeOfDay } from '../../context/WeatherContext';
import { SynopticRegime } from '../../types/api';

interface WeatherControllerPillProps {
  isDarkMode?: boolean;
}

export const WeatherControllerPill: React.FC<WeatherControllerPillProps> = ({ isDarkMode = true }) => {
  const {
    enabled,
    mode,
    effectiveRegime,
    intensity,
    lightningEnabled,
    timeOfDay,
    effectiveTimeOfDay,
    telemetry,
    toggleEnabled,
    setMode,
    setTimeOfDay,
    setIntensity,
    setLightningEnabled,
  } = useWeather();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getRegimeIcon = (regime: SynopticRegime) => {
    switch (regime) {
      case 'ACTIVE_MONSOON':
        return <CloudRain className="h-3.5 w-3.5 text-sky-500 animate-bounce" />;
      case 'BREAK_MONSOON':
        return <Sun className="h-3.5 w-3.5 text-amber-500" />;
      case 'COASTAL_OROGRAPHIC':
        return <Waves className="h-3.5 w-3.5 text-teal-500" />;
      case 'DEPRESSION':
        return <Zap className="h-3.5 w-3.5 text-purple-500 animate-pulse" />;
      case 'WESTERN_DISTURBANCE':
        return <Snowflake className="h-3.5 w-3.5 text-cyan-400" />;
      case 'OTHER':
      default:
        return <Wind className="h-3.5 w-3.5 text-slate-400" />;
    }
  };

  const getRegimeLabel = (regime: SynopticRegime) => {
    switch (regime) {
      case 'ACTIVE_MONSOON':
        return 'Active Monsoon';
      case 'BREAK_MONSOON':
        return 'Break Spell';
      case 'COASTAL_OROGRAPHIC':
        return 'Coastal Orographic';
      case 'DEPRESSION':
        return 'Monsoon Depression';
      case 'WESTERN_DISTURBANCE':
        return 'Western Disturbance';
      case 'OTHER':
      default:
        return 'General Circulation';
    }
  };

  const regimesList: { id: WeatherMode; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'AUTO',
      label: 'Auto (Sync with Station)',
      icon: <Sparkles className="h-3.5 w-3.5 text-indigo-400" />,
      desc: 'Adapts background dynamically to selected district',
    },
    {
      id: 'ACTIVE_MONSOON',
      label: 'Active Monsoon',
      icon: <CloudRain className="h-3.5 w-3.5 text-sky-400" />,
      desc: 'Heavy monsoon downpour with surface splashes',
    },
    {
      id: 'BREAK_MONSOON',
      label: 'Break Monsoon',
      icon: <Sun className="h-3.5 w-3.5 text-amber-400" />,
      desc: 'Scattered clouds, clear sky, light mist',
    },
    {
      id: 'COASTAL_OROGRAPHIC',
      label: 'Coastal / Offshore',
      icon: <Waves className="h-3.5 w-3.5 text-teal-400" />,
      desc: 'Ghats onshore low-level jet & sea spray',
    },
    {
      id: 'DEPRESSION',
      label: 'Monsoon Depression',
      icon: <Zap className="h-3.5 w-3.5 text-purple-400" />,
      desc: 'Cyclonic storm, dense rain, thunder flashes',
    },
    {
      id: 'WESTERN_DISTURBANCE',
      label: 'Western Disturbance',
      icon: <Snowflake className="h-3.5 w-3.5 text-cyan-400" />,
      desc: 'Cool mid-latitude westerly trough winds',
    },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Navbar Weather Status Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Live Weather Atmospheric Controls"
        className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
          enabled
            ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-xs'
            : 'bg-slate-100/50 dark:bg-slate-800/40 text-slate-400 border-dashed border-slate-300 dark:border-slate-700 opacity-60'
        }`}
      >
        <span className="flex items-center">
          {enabled ? getRegimeIcon(effectiveRegime) : <EyeOff className="h-3.5 w-3.5 text-slate-400" />}
        </span>
        <span className="hidden sm:inline-block font-mono text-[11px]">
          {enabled ? getRegimeLabel(effectiveRegime) : 'FX Off'}
        </span>
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            enabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
          }`}
        />
        <ChevronDown className="h-3 w-3 text-slate-400" />
      </button>

      {/* Interactive Popover Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-4 space-y-4 animate-in fade-in zoom-in-95 duration-150">
          {/* Header & Toggle */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                <Sliders className="h-3.5 w-3.5 text-indigo-500" />
                <span>Live Weather Simulation</span>
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Interactive atmospheric canvas engine
              </p>
            </div>
            <button
              onClick={toggleEnabled}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center space-x-1 cursor-pointer ${
                enabled
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}
            >
              {enabled ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
              {enabled ? 'Active' : 'Disabled'}
            </button>
          </div>

          {enabled && (
            <>
              {/* Regime Mode Switcher */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                  Synoptic Weather Regime
                </span>
                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  {regimesList.map((item) => {
                    const isSelected = mode === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setMode(item.id)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          {item.icon}
                          <div>
                            <span className="block text-[11px] leading-tight">{item.label}</span>
                            <span className="block text-[9px] text-slate-400 font-normal leading-tight">
                              {item.desc}
                            </span>
                          </div>
                        </div>
                        {isSelected && <Check className="h-3.5 w-3.5 text-indigo-500 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Diurnal Sky & Lighting (Dawn, Day, Afternoon, Evening, Night) */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                    Diurnal Sky & Sun Cycle
                  </span>
                  <span className="text-[10px] text-amber-500 dark:text-amber-400 font-semibold flex items-center space-x-1">
                    {effectiveTimeOfDay === 'evening' && <Sunset className="h-3 w-3 inline text-rose-500" />}
                    {effectiveTimeOfDay === 'afternoon' && <SunDim className="h-3 w-3 inline text-amber-500" />}
                    {effectiveTimeOfDay === 'dawn' && <Sunrise className="h-3 w-3 inline text-pink-400" />}
                    {effectiveTimeOfDay === 'night' && <Moon className="h-3 w-3 inline text-indigo-400" />}
                    {effectiveTimeOfDay === 'day' && <Sun className="h-3 w-3 inline text-sky-400" />}
                    <span className="capitalize">{effectiveTimeOfDay}</span>
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'auto', label: 'Auto (Clock)', icon: <Clock className="h-3 w-3" /> },
                    { id: 'dawn', label: 'Dawn', icon: <Sunrise className="h-3 w-3" /> },
                    { id: 'day', label: 'Day', icon: <Sun className="h-3 w-3" /> },
                    { id: 'afternoon', label: 'Afternoon', icon: <SunDim className="h-3 w-3" /> },
                    { id: 'evening', label: 'Evening', icon: <Sunset className="h-3 w-3 text-rose-400" /> },
                    { id: 'night', label: 'Night', icon: <Moon className="h-3 w-3" /> },
                  ].map((tod) => {
                    const isSel = timeOfDay === tod.id;
                    return (
                      <button
                        key={tod.id}
                        onClick={() => setTimeOfDay(tod.id as TimeOfDay)}
                        className={`py-1.5 px-2 text-[10px] font-medium rounded-lg flex items-center justify-center space-x-1 border transition cursor-pointer ${
                          isSel
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent shadow-xs font-bold'
                            : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                        }`}
                      >
                        {tod.icon}
                        <span>{tod.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Intensity Controls */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                  Atmospheric Density
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['subtle', 'normal', 'dramatic'] as WeatherIntensity[]).map((level) => {
                    const isSel = intensity === level;
                    return (
                      <button
                        key={level}
                        onClick={() => setIntensity(level)}
                        className={`py-1 text-[11px] font-semibold rounded-lg capitalize border transition cursor-pointer ${
                          isSel
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                        }`}
                      >
                        {level}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Lightning Toggle */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center space-x-1.5">
                  <Zap className="h-3 w-3 text-purple-400" />
                  <span>Thunderstorm Flashes</span>
                </span>
                <button
                  onClick={() => setLightningEnabled(!lightningEnabled)}
                  className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    lightningEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition duration-200 ease-in-out ${
                      lightningEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Live Physical Telemetry Readout */}
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-2.5 border border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center">
                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-semibold block">Rain Rate</span>
                  <span className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400">
                    {telemetry.rainRateMmH} mm/h
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-semibold block">Wind Vector</span>
                  <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400">
                    {telemetry.windSpeedMs} m/s
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-semibold block">Overcast</span>
                  <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {telemetry.cloudCoverPct}%
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

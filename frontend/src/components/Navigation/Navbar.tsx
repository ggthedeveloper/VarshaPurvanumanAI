import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  RefreshCw,
  CloudRain,
  Sun as SunIcon,
  Moon,
  Zap,
  Waves,
  Snowflake,
  Wind,
  Droplets,
  Thermometer,
  Gauge,
  Compass,
  Navigation,
  Loader2,
  ChevronDown,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  MapPin,
  Clock,
  Activity,
  User,
  LogOut,
} from 'lucide-react';
import { AppRoute, DataStatus, UserProfile, SynopticRegime } from '../../types/api';
import { useWeather, WeatherMode, WeatherIntensity } from '../../context/WeatherContext';

interface NavbarProps {
  currentRoute: AppRoute;
  selectedDistrictName: string;
  isBenchmarkActive: boolean;
  isProcessedBenchmark?: boolean;
  isDataUnavailable: boolean;
  apiConnected: boolean;
  dataStatus: DataStatus;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenMobileMenu: () => void;
  onOpenInfoModal?: () => void;
  user: UserProfile | null;
  onLogout?: () => void;
  onDetectLocation?: () => void;
}

const ROUTE_TITLES: Record<AppRoute, { title: string; subtitle: string }> = {
  landing: {
    title: 'Overview & Showcase',
    subtitle: '',
  },
  dashboard: {
    title: '',
    subtitle: '',
  },
  forecast: {
    title: 'Rainfall Forecast',
    subtitle: '',
  },
  regime: {
    title: 'Synoptic Regimes',
    subtitle: '',
  },
  probability: {
    title: 'Rainfall Probabilities',
    subtitle: '',
  },
  verification: {
    title: 'Model Verification',
    subtitle: '',
  },
  districts: {
    title: 'District Registry',
    subtitle: '',
  },
  provenance: {
    title: 'Data Provenance',
    subtitle: '',
  },
  health: {
    title: 'System Health',
    subtitle: '',
  },
};

export const Navbar: React.FC<NavbarProps> = ({
  currentRoute,
  selectedDistrictName,
  isBenchmarkActive,
  isProcessedBenchmark,
  isDataUnavailable,
  apiConnected,
  dataStatus,
  isDarkMode,
  onToggleTheme,
  onRefresh,
  isRefreshing,
  onOpenMobileMenu,
  onOpenInfoModal,
  user,
  onLogout,
  onDetectLocation,
}) => {
  const routeMeta = ROUTE_TITLES[currentRoute] || ROUTE_TITLES.dashboard;

  const {
    telemetry,
    effectiveRegime,
    mode,
    setMode,
    enabled,
    toggleEnabled,
    intensity,
    setIntensity,
    lightningEnabled,
    setLightningEnabled,
    triggerInstantLightning,
    userLocation,
    isLocating,
    locationError,
    detectUserLocation,
    clearUserLocation,
  } = useWeather();

  const [isWeatherDropdownOpen, setIsWeatherDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [time, setTime] = useState<Date>(new Date());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Live ticking clock for IST and UTC
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsWeatherDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };
    if (isWeatherDropdownOpen || isUserDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isWeatherDropdownOpen, isUserDropdownOpen]);

  const handleLocationClick = async () => {
    if (onDetectLocation) {
      onDetectLocation();
    } else {
      await detectUserLocation();
    }
  };

  const getRegimeIcon = (regime: SynopticRegime) => {
    switch (regime) {
      case 'ACTIVE_MONSOON':
        return <CloudRain className="h-4 w-4 text-sky-500 animate-bounce" />;
      case 'BREAK_MONSOON':
        return <SunIcon className="h-4 w-4 text-amber-500" />;
      case 'COASTAL_OROGRAPHIC':
        return <Waves className="h-4 w-4 text-teal-500" />;
      case 'DEPRESSION':
        return <Zap className="h-4 w-4 text-purple-500 animate-pulse" />;
      case 'WESTERN_DISTURBANCE':
        return <Snowflake className="h-4 w-4 text-cyan-400" />;
      case 'OTHER':
      default:
        return <Wind className="h-4 w-4 text-slate-400" />;
    }
  };

  const regimesList: { id: WeatherMode; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'AUTO',
      label: 'Auto (Sync Station)',
      icon: <Sparkles className="h-3.5 w-3.5 text-indigo-400" />,
      desc: 'Synchronizes dynamically with active district',
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
      icon: <SunIcon className="h-3.5 w-3.5 text-amber-400" />,
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

  const istTimeString = time.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const utcTimeString = time.toLocaleTimeString('en-GB', {
    timeZone: 'UTC',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <header className="h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors">
      {/* Left: Mobile Menu Toggle & Route Context */}
      <div className="flex items-center space-x-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 md:hidden cursor-pointer"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center space-x-2">
            {routeMeta.title ? (
              <>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight truncate">
                  {routeMeta.title}
                </h2>
                <span className="hidden lg:inline-flex text-[11px] text-slate-400">•</span>
              </>
            ) : null}
            {/* Station badge */}
            <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-100/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-xs">
              <MapPin className="h-3.5 w-3.5 mr-1.5 text-indigo-500" />
              {selectedDistrictName}
              {isBenchmarkActive && (
                <span className="ml-1.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Benchmark
                </span>
              )}
            </span>
          </div>
          {routeMeta.subtitle ? (
            <p className="hidden sm:block text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {routeMeta.subtitle}
            </p>
          ) : null}
        </div>
      </div>

      {/* Center & Right: Real-time Weather on Navbar & Clean Actions */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* 1. Current Location Button */}
        <button
          onClick={handleLocationClick}
          disabled={isLocating}
          title={
            userLocation
              ? `GPS Active: ${userLocation.lat.toFixed(2)}°N, ${userLocation.lon.toFixed(2)}°E. Click to refresh location.`
              : 'Use my current GPS location for real-time local weather'
          }
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
            userLocation
              ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 shadow-xs'
              : 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
          }`}
        >
          {isLocating ? (
            <Loader2 className="h-3.5 w-3.5 text-indigo-500 animate-spin" />
          ) : (
            <Navigation
              className={`h-3.5 w-3.5 ${
                userLocation ? 'text-emerald-500 fill-emerald-500/20' : 'text-slate-500 dark:text-slate-400'
              }`}
            />
          )}
          <span className="hidden sm:inline font-sans">
            {isLocating ? 'Locating...' : userLocation ? 'My Location' : 'Use Location'}
          </span>
        </button>

        {/* 2. Real-Time Weather Cluster on Navbar with Popover Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsWeatherDropdownOpen(!isWeatherDropdownOpen)}
            title="Real-time Meteorological Telemetry & Controls"
            className="flex items-center space-x-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-200/70 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 transition cursor-pointer shadow-xs"
          >
            {/* Live Green Pulsing Indicator */}
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>

            {/* Condition Icon */}
            <span className="flex items-center">{getRegimeIcon(effectiveRegime)}</span>

            {/* Temperature */}
            <span className="font-bold font-mono text-xs sm:text-sm text-slate-900 dark:text-white">
              {telemetry.temperatureC.toFixed(1)}°C
            </span>

            {/* Rain Rate */}
            <span className="hidden xs:inline-flex items-center text-xs font-mono font-medium text-sky-600 dark:text-sky-400 pl-1 border-l border-slate-300 dark:border-slate-700">
              <Droplets className="h-3 w-3 mr-0.5" />
              {telemetry.rainRateMmH.toFixed(1)} mm/h
            </span>

            {/* Wind Vector */}
            <span className="hidden md:inline-flex items-center text-xs font-mono text-teal-600 dark:text-teal-400 pl-1 border-l border-slate-300 dark:border-slate-700">
              <Wind className="h-3 w-3 mr-0.5" />
              {telemetry.windSpeedMs.toFixed(1)} m/s {telemetry.windDirectionCompass}
            </span>

            <ChevronDown className="h-3.5 w-3.5 text-slate-400 ml-0.5" />
          </button>

          {/* Meteorological Dropdown Popover */}
          {isWeatherDropdownOpen && (
            <div className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] max-w-sm sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-4 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              {/* Header: Station & Live Clocks */}
              <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="min-w-0 pr-2">
                  <div className="flex items-center space-x-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {telemetry.stationName}
                    </h4>
                  </div>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {telemetry.conditionLabel}
                    </p>
                    {userLocation && (
                      <button
                        onClick={() => {
                          clearUserLocation();
                          setIsWeatherDropdownOpen(false);
                        }}
                        className="text-[10px] font-semibold text-rose-500 hover:text-rose-600 underline shrink-0 cursor-pointer"
                        title="Clear GPS override and revert to selected district forecast"
                      >
                        Reset to District
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    {istTimeString} <span className="text-[9px] text-slate-400">IST</span>
                  </span>
                  <span className="font-mono text-[10px] text-slate-400 block">
                    {utcTimeString} UTC
                  </span>
                </div>
              </div>

              {/* 6 Real-Time Physical Gauges */}
              <div className="grid grid-cols-3 gap-2">
                {/* 1. Rain Rate */}
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2.5 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[10px] mb-1">
                    <span className="font-semibold uppercase tracking-wider">Rain Rate</span>
                    <Droplets className="h-3 w-3 text-sky-500" />
                  </div>
                  <div className="font-mono font-bold text-sm text-sky-600 dark:text-sky-400">
                    {telemetry.rainRateMmH.toFixed(1)} <span className="text-[10px] font-normal">mm/h</span>
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5 truncate">
                    {telemetry.rainRateMmH > 15 ? 'Heavy Rain' : telemetry.rainRateMmH > 2 ? 'Moderate' : 'Light / Trace'}
                  </div>
                </div>

                {/* 2. Temperature */}
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2.5 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[10px] mb-1">
                    <span className="font-semibold uppercase tracking-wider">Temperature</span>
                    <Thermometer className="h-3 w-3 text-amber-500" />
                  </div>
                  <div className="font-mono font-bold text-sm text-amber-600 dark:text-amber-400">
                    {telemetry.temperatureC.toFixed(1)}°C
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">
                    {((telemetry.temperatureC * 9) / 5 + 32).toFixed(1)}°F
                  </div>
                </div>

                {/* 3. Humidity */}
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2.5 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[10px] mb-1">
                    <span className="font-semibold uppercase tracking-wider">Humidity</span>
                    <Activity className="h-3 w-3 text-blue-500" />
                  </div>
                  <div className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
                    {telemetry.relativeHumidityPct}%
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">
                    {telemetry.relativeHumidityPct > 85 ? 'Saturated' : 'Moist'}
                  </div>
                </div>

                {/* 4. Wind Vector */}
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2.5 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[10px] mb-1">
                    <span className="font-semibold uppercase tracking-wider">Wind</span>
                    <Compass
                      className="h-3 w-3 text-teal-500 transition-transform duration-500"
                      style={{ transform: `rotate(${telemetry.windDirectionDeg}deg)` }}
                    />
                  </div>
                  <div className="font-mono font-bold text-sm text-teal-600 dark:text-teal-400">
                    {telemetry.windSpeedMs.toFixed(1)} <span className="text-[10px] font-normal">m/s</span>
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5 truncate">
                    {telemetry.windDirectionCompass} ({telemetry.windDirectionDeg}°)
                  </div>
                </div>

                {/* 5. Pressure */}
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2.5 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[10px] mb-1">
                    <span className="font-semibold uppercase tracking-wider">Pressure</span>
                    <Gauge className="h-3 w-3 text-emerald-500" />
                  </div>
                  <div className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                    {telemetry.surfacePressureHpa.toFixed(0)} <span className="text-[10px] font-normal">hPa</span>
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">Barometric</div>
                </div>

                {/* 6. CAPE */}
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2.5 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[10px] mb-1">
                    <span className="font-semibold uppercase tracking-wider">CAPE</span>
                    <Zap className="h-3 w-3 text-purple-500" />
                  </div>
                  <div className="font-mono font-bold text-sm text-purple-600 dark:text-purple-400">
                    {telemetry.capeJkg} <span className="text-[10px] font-normal">J/kg</span>
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">
                    {telemetry.capeJkg > 2000 ? 'High Instability' : telemetry.capeJkg > 1000 ? 'Moderate' : 'Stable'}
                  </div>
                </div>
              </div>

              {/* Instant Lightning Strike Button */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={triggerInstantLightning}
                  title="Strike lightning immediately across the sky"
                  className="w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-purple-500/20 transition cursor-pointer"
                >
                  <Zap className="h-3.5 w-3.5 fill-white" />
                  <span>Strike Lightning ⚡</span>
                </button>
              </div>

              {/* Synoptic Regime Presets */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                  Synoptic Weather Simulation
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {regimesList.map((item) => {
                    const isSelected = mode === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setMode(item.id)}
                        className={`text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center space-x-1.5 truncate">
                          {item.icon}
                          <span className="truncate text-[11px]">{item.label}</span>
                        </div>
                        {isSelected && <Check className="h-3 w-3 text-indigo-500 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Controls Footer: Toggle FX & Density */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <button
                  onClick={toggleEnabled}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center space-x-1 cursor-pointer ${
                    enabled
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {enabled ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
                  <span>{enabled ? 'Effects ON' : 'Effects OFF'}</span>
                </button>

                <div className="flex items-center space-x-1">
                  {(['subtle', 'normal', 'dramatic'] as WeatherIntensity[]).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setIntensity(lvl)}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize transition cursor-pointer ${
                        intensity === lvl
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. Refresh Action */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh forecast telemetry"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-indigo-500' : ''}`} />
        </button>

        {/* Subtle Vertical Divider */}
        <div className="h-5 w-px bg-slate-300/70 dark:bg-slate-700/70 my-auto hidden xs:block" />

        {/* 4. Dark Mode Changer */}
        <button
          onClick={onToggleTheme}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? (
            <SunIcon className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 text-slate-600 dark:text-slate-300" />
          )}
        </button>

        {/* 5. User Profile Thing */}
        {user && (
          <div className="relative" ref={userDropdownRef}>
            <button
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              title={`User Profile: ${user.name || 'Gaurav Gautam'}`}
              className="flex items-center space-x-2 p-1 sm:px-2 sm:py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition cursor-pointer"
              aria-label="User profile menu"
            >
              <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-sky-500 text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
                {user.name ? user.name.charAt(0).toUpperCase() : 'G'}
              </div>
              <div className="hidden md:block text-left min-w-0 max-w-[110px]">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block truncate leading-tight">
                  {user.name || 'Gaurav'}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block truncate leading-tight">
                  {user.role || 'Lead Meteorologist'}
                </span>
              </div>
              <ChevronDown className="h-3 w-3 text-slate-400 hidden sm:block" />
            </button>

            {isUserDropdownOpen && (
              <div className="absolute right-0 mt-2 w-60 max-w-[calc(100vw-2rem)] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-3 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                {/* Header with Avatar & Details */}
                <div className="flex items-center space-x-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'G'}
                  </div>
                  <div className="min-w-0 overflow-hidden">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                      {user.name || 'Gaurav Gautam'}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                      {user.role || 'Lead Meteorologist'}
                    </span>
                    <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                      Active Meteorologist
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-1">
                  {onOpenInfoModal && (
                    <button
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        onOpenInfoModal();
                      }}
                      className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span>System Information</span>
                    </button>
                  )}

                  {onLogout && (
                    <button
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Log Out</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

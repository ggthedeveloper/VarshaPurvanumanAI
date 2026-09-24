import React from 'react';
import {
  Menu,
  ShieldCheck,
  RefreshCw,
  Sun,
  Moon,
  Info,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import { AppRoute, DataStatus, UserProfile } from '../../types/api';

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
  onOpenInfoModal: () => void;
  user: UserProfile | null;
}

const ROUTE_TITLES: Record<AppRoute, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Monsoon Intelligence Dashboard',
    subtitle: 'Regime-aware rainfall post-processing & spatial verification',
  },
  forecast: {
    title: 'Rainfall Forecast Explorer',
    subtitle: 'High-resolution Google cartography & point station benchmarks',
  },
  regime: {
    title: 'Synoptic Weather Regimes',
    subtitle: 'Objective circulation classification across 5 monsoon states',
  },
  probability: {
    title: 'Heavy Rainfall Probability Suite',
    subtitle: 'Platt-calibrated multi-threshold exceedance risk modeling',
  },
  verification: {
    title: 'Model Verification & Skill Scores',
    subtitle: 'Phase 8 held-out test cohort benchmarks (June 1–30, 2024)',
  },
  districts: {
    title: 'Administrative District Registry',
    subtitle: 'Catalog of 78 Indian district stations & coverage status',
  },
  provenance: {
    title: 'Data Provenance & Methodology',
    subtitle: 'IMD 0.25° Gridded Rainfall & NOAA GFS 0.25° NWP specifications',
  },
  health: {
    title: 'System Health & Pipeline Telemetry',
    subtitle: 'Model registry status, API latency, and environment diagnostics',
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
}) => {
  const routeMeta = ROUTE_TITLES[currentRoute] || ROUTE_TITLES.dashboard;

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors">
      {/* Left: Mobile Menu Toggle & Breadcrumbs */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 md:hidden cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
              {routeMeta.title}
            </h2>
            <span className="hidden lg:inline-flex text-[11px] text-slate-400">•</span>
            <span className="hidden lg:inline-flex text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {selectedDistrictName}
            </span>
          </div>
          <p className="hidden sm:block text-[11px] text-slate-500 dark:text-slate-400">
            {routeMeta.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Dynamic Status Badges & Controls */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Coverage Status Badge */}
        {isBenchmarkActive ? (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
            HISTORICAL BENCHMARK
          </span>
        ) : isProcessedBenchmark ? (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-cyan-50 dark:bg-cyan-950/70 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 mr-1.5 animate-pulse" />
            PROCESSED BENCHMARK REPLAY
          </span>
        ) : isDataUnavailable ? (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mr-1.5" />
            DATA UNAVAILABLE
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 mr-1.5" />
            STATION LEVEL
          </span>
        )}

        {/* API Health Pill */}
        <span
          title={apiConnected ? 'API Connected (127.0.0.1:8000)' : 'API Disconnected'}
          className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
        >
          <span
            className={`h-1.5 w-1.5 rounded-full mr-1.5 ${
              apiConnected ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
          />
          {apiConnected ? 'API ONLINE' : 'API OFFLINE'}
        </span>

        {/* Refresh Action */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh forecast telemetry"
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-indigo-500' : ''}`} />
        </button>

        {/* Methodology Info Modal Trigger */}
        <button
          onClick={onOpenInfoModal}
          title="Scientific Methodology & Disclaimers"
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <HelpCircle className="h-4 w-4" />
        </button>

        {/* Theme Switcher */}
        <button
          onClick={onToggleTheme}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* User Badge */}
        <div className="hidden sm:flex items-center pl-2 border-l border-slate-200 dark:border-slate-800 space-x-2">
          <div className="h-7 w-7 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'G'}
          </div>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 hidden md:inline-block">
            {user?.name || 'Gaurav'}
          </span>
        </div>
      </div>
    </header>
  );
};

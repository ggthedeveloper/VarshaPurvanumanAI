import React from 'react';
import { CloudRain, Activity, Moon, Sun, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { DataStatus } from '../types/api';

interface HeaderProps {
  apiConnected: boolean;
  dataStatus: DataStatus;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  apiConnected,
  dataStatus,
  isDarkMode,
  onToggleTheme,
  isDemoMode,
  onToggleDemoMode,
  onRefresh,
  isRefreshing,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Project Identity */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
            <CloudRain className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">
                VarshaPurvanumanAI
              </span>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                SIH26080
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Regime-Aware AI Post-Processing of Monsoon Rainfall Forecasts (MoES / IMD)
            </p>
          </div>
        </div>

        {/* Status Indicators & Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Real Data vs Demo Data Badge */}
          {isDemoMode ? (
            <span
              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700 animate-pulse"
              title="Demo simulation mode active. Not real-time meteorological observations."
            >
              <AlertTriangle className="h-3.5 w-3.5 mr-1" />
              DEMO DATA
            </span>
          ) : (
            <span
              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
              title="Verified Zenodo IMD Benchmark & GFS NWP inputs."
            >
              <ShieldCheck className="h-3.5 w-3.5 mr-1 text-emerald-600 dark:text-emerald-400" />
              REAL DATA
            </span>
          )}

          {/* API Health Monitor */}
          <div
            className={`hidden md:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
              apiConnected
                ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full mr-1.5 ${
                apiConnected ? 'bg-emerald-500' : 'bg-rose-500 animate-ping'
              }`}
            />
            {apiConnected ? 'API Connected' : 'API Offline'}
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Reload Forecast & Verification Metrics"
            aria-label="Refresh data"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Demo Mode Toggle */}
          <button
            onClick={onToggleDemoMode}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition ${
              isDemoMode
                ? 'bg-amber-600 text-white border-amber-700 hover:bg-amber-700'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            title="Toggle SIH Interactive Demo Mode"
          >
            {isDemoMode ? 'Exit Demo' : 'Demo Mode'}
          </button>

          {/* Theme Switcher */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
          </button>
        </div>
      </div>
    </header>
  );
};

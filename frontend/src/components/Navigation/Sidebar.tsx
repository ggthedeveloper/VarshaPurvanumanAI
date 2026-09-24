import React from 'react';
import {
  LayoutDashboard,
  CloudRain,
  Compass,
  Activity,
  BarChart3,
  MapPin,
  BookOpen,
  HeartPulse,
  Sun,
  Moon,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Award,
  Sparkles,
} from 'lucide-react';
import { AppRoute, UserProfile } from '../../types/api';

interface SidebarProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  user: UserProfile | null;
  onLogout: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: AppRoute;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'forecast', label: 'Rainfall Forecast', icon: CloudRain },
  { id: 'regime', label: 'Weather Regime', icon: Compass },
  { id: 'probability', label: 'Probability Analysis', icon: Activity },
  { id: 'verification', label: 'Verification', icon: BarChart3 },
  { id: 'districts', label: 'District Explorer', icon: MapPin },
  { id: 'provenance', label: 'Data & Provenance', icon: BookOpen },
  { id: 'health', label: 'System Health', icon: HeartPulse },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  isDarkMode,
  onToggleTheme,
  user,
  onLogout,
  isMobileOpen,
  onCloseMobile,
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div
            onClick={() => onNavigate('dashboard')}
            className="flex items-center space-x-3 cursor-pointer overflow-hidden"
          >
            <div className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <CloudRain className="h-5 w-5" />
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white block truncate">
                  Varsha AI
                </span>
                <span className="text-[10px] text-slate-400 font-semibold block truncate">
                  SIH26080 • MoES
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
          <div>
            {!isCollapsed && (
              <span className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">
                Overview & Showcase
              </span>
            )}
            <button
              onClick={() => {
                onNavigate('landing');
                onCloseMobile();
              }}
              title={isCollapsed ? 'Interactive Showcase' : undefined}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer mb-3 ${
                currentRoute === 'landing'
                  ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              } ${isCollapsed ? 'justify-center' : ''}`}
            >
              <Sparkles className={`h-4 w-4 shrink-0 ${currentRoute === 'landing' ? 'text-white' : 'text-indigo-500'}`} />
              {!isCollapsed && <span className="truncate flex-1 text-left">Showcase & Live FX</span>}
            </button>

            {!isCollapsed && (
              <span className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">
                Forecast & Intelligence
              </span>
            )}
            <div className="space-y-1">
              {NAV_ITEMS.slice(0, 4).map((item) => {
                const Icon = item.icon;
                const isActive = currentRoute === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      onCloseMobile();
                    }}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    } ${isCollapsed ? 'justify-center' : ''}`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    {!isCollapsed && <span className="truncate flex-1 text-left">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            {!isCollapsed && (
              <span className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">
                Verification & Data
              </span>
            )}
            <div className="space-y-1">
              {NAV_ITEMS.slice(4).map((item) => {
                const Icon = item.icon;
                const isActive = currentRoute === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      onCloseMobile();
                    }}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    } ${isCollapsed ? 'justify-center' : ''}`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    {!isCollapsed && <span className="truncate flex-1 text-left">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Bottom Profile & Actions */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2 shrink-0">
          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition cursor-pointer ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            {isDarkMode ? (
              <Sun className="h-4 w-4 text-amber-400 shrink-0" />
            ) : (
              <Moon className="h-4 w-4 text-slate-500 shrink-0" />
            )}
            {!isCollapsed && <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          {/* User Profile Card */}
          {!isCollapsed ? (
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center space-x-2.5 overflow-hidden">
                <div className="h-8 w-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center shrink-0 text-xs">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'G'}
                </div>
                <div className="overflow-hidden">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                    {user?.name || 'Gaurav Gautam'}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {user?.role || 'SIH Evaluator'}
                  </span>
                </div>
              </div>
              <button
                onClick={onLogout}
                title="Log Out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer shrink-0"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLogout}
              title="Log Out"
              className="w-full flex justify-center p-2 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

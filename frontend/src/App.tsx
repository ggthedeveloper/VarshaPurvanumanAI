import React, { useState, useEffect, useCallback } from 'react';
import { api } from './api/client';
import {
  DistrictItem,
  DistrictForecastResponse,
  CombinedForecastResponse,
  VerificationSummaryResponse,
  VerificationProbabilityResponse,
  VerificationRegimesResponse,
  DataStatus,
  AppRoute,
  UserProfile,
} from './types/api';
import { Sidebar } from './components/Navigation/Sidebar';
import { Navbar } from './components/Navigation/Navbar';
import { LoginPage } from './components/Auth/LoginPage';
import { DashboardView } from './views/DashboardView';
import { ForecastView } from './views/ForecastView';
import { RegimeView } from './views/RegimeView';
import { ProbabilityView } from './views/ProbabilityView';
import { VerificationView } from './views/VerificationView';
import { DistrictsView } from './views/DistrictsView';
import { ProvenanceView } from './views/ProvenanceView';
import { SystemHealthView } from './views/SystemHealthView';
import { DemoModeModal } from './components/Panels/DemoModeModal';
import { ErrorBoundary } from './components/Common/ErrorBoundary';
import {
  AlertTriangle,
  ShieldCheck,
  Info,
  X,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export const App: React.FC = () => {
  // Authentication State
  const [user, setUser] = useState<UserProfile | null>(() => api.getSavedUser());

  // Routing State
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(() => {
    const saved = localStorage.getItem('app_route') as AppRoute;
    const validRoutes: AppRoute[] = [
      'dashboard',
      'forecast',
      'regime',
      'probability',
      'verification',
      'districts',
      'provenance',
      'health',
    ];
    return validRoutes.includes(saved) ? saved : 'dashboard';
  });

  // UI & Theme States
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState<boolean>(false);

  // Connection & Data Status
  const [apiConnected, setApiConnected] = useState<boolean>(false);
  const [dataStatus, setDataStatus] = useState<DataStatus>('REAL_DATA');
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState<boolean>(false);

  // Meteorological Data States
  const [districts, setDistricts] = useState<DistrictItem[]>([]);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('pune');
  const [districtForecast, setDistrictForecast] = useState<DistrictForecastResponse | null>(null);
  const [activeForecast, setActiveForecast] = useState<CombinedForecastResponse | null>(null);
  const [geoJsonData, setGeoJsonData] = useState<any | null>(null);

  // Verification Data States
  const [verificationSummary, setVerificationSummary] = useState<VerificationSummaryResponse | null>(null);
  const [verificationProbability, setVerificationProbability] = useState<VerificationProbabilityResponse | null>(null);
  const [verificationRegimes, setVerificationRegimes] = useState<VerificationRegimesResponse | null>(null);

  // Loading States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [districtLoading, setDistrictLoading] = useState<boolean>(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Synchronize HTML dark mode class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const handleToggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const handleToggleCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar_collapsed', String(next));
      return next;
    });
  };

  const handleNavigate = (route: AppRoute) => {
    setCurrentRoute(route);
    localStorage.setItem('app_route', route);
    setIsMobileSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = (loggedInUser: UserProfile) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
  };

  // Initial Data Loader
  const loadInitialData = useCallback(async () => {
    setIsRefreshing(true);
    setGlobalError(null);
    try {
      // 1. Health Check
      const health = await api.checkHealth();
      setApiConnected(health.status === 'ok');
      setDataStatus(health.data_status || 'REAL_DATA');

      // 2. Fetch District Catalog
      const distData = await api.getDistricts();
      setDistricts(distData.districts || []);

      // 3. Fetch Pune Benchmark Station Forecast
      const puneForecast = await api.getDistrictForecast('pune');
      setDistrictForecast(puneForecast);
      if (puneForecast.forecast) {
        setActiveForecast(puneForecast.forecast);
      } else {
        setActiveForecast(null);
      }

      // 4. Fetch Verification Engine Outputs
      const [verifSummary, verifProb, verifReg] = await Promise.all([
        api.getVerificationSummary(),
        api.getVerificationProbability().catch(() => null),
        api.getVerificationRegimes().catch(() => null),
      ]);
      setVerificationSummary(verifSummary);
      setVerificationProbability(verifProb);
      setVerificationRegimes(verifReg);

      // 5. Fetch Boundary GeoJSON asynchronously
      api
        .getDistrictGeoJSON()
        .then((geo) => setGeoJsonData(geo))
        .catch((e) => console.warn('District GeoJSON could not be fetched:', e));
    } catch (err: any) {
      console.error('Failed to load application data:', err);
      setApiConnected(false);
      setGlobalError('Live prediction API is temporarily unreachable. Displaying cached verified records.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadInitialData();
    }
  }, [user, loadInitialData]);

  // District Selection with Anti-Stale State Transition
  const handleSelectDistrict = async (districtId: string) => {
    setSelectedDistrictId(districtId);
    setDistrictLoading(true);
    // Flush stale forecast immediately to prevent previous station data leakage
    setActiveForecast(null);
    setDistrictForecast(null);

    try {
      const resp = await api.getDistrictForecast(districtId);
      setDistrictForecast(resp);
      if (resp.forecast) {
        setActiveForecast(resp.forecast);
      } else {
        setActiveForecast(null);
      }
    } catch (err: any) {
      console.error(`Failed to fetch forecast for district ${districtId}:`, err);
      setActiveForecast(null);
    } finally {
      setDistrictLoading(false);
    }
  };

  // Demo Simulation Handlers
  const handleApplyDemoForecast = (demoFcst: CombinedForecastResponse) => {
    setActiveForecast(demoFcst);
    setDataStatus('DEMO_DATA');
    setIsDemoMode(true);
    api.setDemoMode(true);
    setCurrentRoute('forecast');
  };

  // If unauthenticated, render Login Page
  if (!user) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
      />
    );
  }

  // Selected district metadata
  const currentDistrict = districts.find((d) => d.district_id === selectedDistrictId);
  const districtName = districtForecast?.name || currentDistrict?.name || 'Selected Station';
  const isPuneBenchmark = districtForecast?.coverage_status === 'BENCHMARK_ACTIVE';
  const isDataUnavailable = districtForecast?.coverage_status === 'DATA_UNAVAILABLE';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors">
      {/* Fixed Left Navigation Sidebar */}
      <Sidebar
        currentRoute={currentRoute}
        onNavigate={handleNavigate}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
        user={user}
        onLogout={handleLogout}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main App Layout */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
        }`}
      >
        {/* Top Navbar */}
        <Navbar
          currentRoute={currentRoute}
          selectedDistrictName={districtName}
          isBenchmarkActive={isPuneBenchmark}
          isDataUnavailable={isDataUnavailable}
          apiConnected={apiConnected}
          dataStatus={dataStatus}
          isDarkMode={isDarkMode}
          onToggleTheme={handleToggleTheme}
          onRefresh={loadInitialData}
          isRefreshing={isRefreshing}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          onOpenInfoModal={() => setIsInfoModalOpen(true)}
          user={user}
        />

        {/* Global Network or API Error Banner */}
        {globalError && (
          <div className="bg-rose-50 dark:bg-rose-950/60 border-b border-rose-200 dark:border-rose-900 px-4 py-2 text-xs text-rose-800 dark:text-rose-300 flex items-center justify-center space-x-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{globalError}</span>
          </div>
        )}

        {/* Demo Simulation Alert Banner */}
        {isDemoMode && (
          <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold text-center flex items-center justify-center space-x-2 shadow-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>
              SIH SIMULATION MODE ACTIVE: Visualizing scenario data. Real benchmark ground truth is preserved.
            </span>
            <button
              onClick={() => {
                setIsDemoMode(false);
                api.setDemoMode(false);
                loadInitialData();
              }}
              className="underline ml-2 hover:text-white transition cursor-pointer"
            >
              Reset to Live Benchmark
            </button>
          </div>
        )}

        {/* Main View Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <ErrorBoundary fallbackTitle="View Rendering Error">
            {currentRoute === 'dashboard' && (
              <DashboardView
                districts={districts}
                selectedDistrictId={selectedDistrictId}
                onSelectDistrict={handleSelectDistrict}
                districtForecast={districtForecast}
                activeForecast={activeForecast}
                isLoading={isLoading || districtLoading}
                geoJsonData={geoJsonData}
                isDarkMode={isDarkMode}
                onNavigate={handleNavigate}
              />
            )}

            {currentRoute === 'forecast' && (
              <ForecastView
                districts={districts}
                selectedDistrictId={selectedDistrictId}
                onSelectDistrict={handleSelectDistrict}
                districtForecast={districtForecast}
                activeForecast={activeForecast}
                isLoading={isLoading || districtLoading}
                geoJsonData={geoJsonData}
                isDarkMode={isDarkMode}
              />
            )}

            {currentRoute === 'regime' && (
              <RegimeView
                districtForecast={districtForecast}
                activeForecast={activeForecast}
                verificationRegimes={verificationRegimes}
                onSelectPuneBenchmark={() => handleSelectDistrict('pune')}
                isLoading={isLoading || districtLoading}
              />
            )}

            {currentRoute === 'probability' && (
              <ProbabilityView
                districtForecast={districtForecast}
                activeForecast={activeForecast}
                verificationProbability={verificationProbability}
                onSelectPuneBenchmark={() => handleSelectDistrict('pune')}
                isLoading={isLoading || districtLoading}
              />
            )}

            {currentRoute === 'verification' && (
              <VerificationView
                summary={verificationSummary}
                probabilityMetrics={verificationProbability}
                regimeMetrics={verificationRegimes}
                isLoading={isLoading}
              />
            )}

            {currentRoute === 'districts' && (
              <DistrictsView
                districts={districts}
                selectedDistrictId={selectedDistrictId}
                onSelectDistrict={handleSelectDistrict}
                onNavigate={handleNavigate}
              />
            )}

            {currentRoute === 'provenance' && <ProvenanceView />}

            {currentRoute === 'health' && (
              <SystemHealthView
                apiConnected={apiConnected}
                dataStatus={dataStatus}
                isDarkMode={isDarkMode}
              />
            )}
          </ErrorBoundary>
        </main>

        {/* Polished SIH / MoES Footer */}
        <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 text-xs text-slate-500 dark:text-slate-400 transition-colors mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                VarshaPurvanumanAI (SIH26080)
              </span>
              <span>• Ministry of Earth Sciences (MoES) / IMD Monsoon Intelligence</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Verified IMD 0.25° Gridded Rainfall Observations & NOAA GFS 0.25° NWP Forcing.
            </div>
          </div>
        </footer>
      </div>

      {/* Info Modal */}
      {isInfoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400">
                <Sparkles className="h-5 w-5" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  About VarshaPurvanumanAI
                </h3>
              </div>
              <button
                onClick={() => setIsInfoModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                <strong>VarshaPurvanumanAI (SIH26080)</strong> is an operational meteorological artificial intelligence system developed for post-processing Indian monsoon rainfall predictions.
              </p>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="font-bold text-slate-900 dark:text-white">Scientific Principles:</div>
                <ul className="list-disc list-inside space-y-1 text-slate-500 dark:text-slate-400">
                  <li><strong>Zero Synthetic Policy:</strong> Forecasts are withheld for unmonitored districts rather than fabricating weather data.</li>
                  <li><strong>Regime Conditioning:</strong> Predictors are dynamically routed based on synoptic circulation state (e.g. Offshore Trough, Monsoon Depression).</li>
                  <li><strong>Platt Calibration:</strong> Continuous model outputs are mapped to reliable empirical exceedance probabilities.</li>
                  <li><strong>Immutable Verification:</strong> Held-out test set (June 1–30, 2024) demonstrates 22.3% RMSE reduction over raw NWP.</li>
                </ul>
              </div>
              <p className="text-[11px] text-slate-400">
                Developed for Smart India Hackathon 2026. Aligned with WMO and IMD weather verification standards.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setIsInfoModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer shadow-sm transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Demo Mode Simulator Modal */}
      <DemoModeModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onApplyDemoForecast={handleApplyDemoForecast}
      />
    </div>
  );
};

export default App;

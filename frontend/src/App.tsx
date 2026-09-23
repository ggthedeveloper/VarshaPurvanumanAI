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
} from './types/api';
import { Header, AppTab } from './components/Header';
import { LandingPage } from './components/Landing/LandingPage';
import { ForecastSummaryCards } from './components/Cards/ForecastSummaryCards';
import { RainfallMap } from './components/Map/RainfallMap';
import { WeatherRegimePanel } from './components/Panels/WeatherRegimePanel';
import { ProbabilityPanel } from './components/Panels/ProbabilityPanel';
import { DistrictDetailPanel } from './components/Panels/DistrictDetailPanel';
import { ForecastTable } from './components/Tables/ForecastTable';
import { VerificationDashboard } from './components/Verification/VerificationDashboard';
import { LimitationsPanel } from './components/Panels/LimitationsPanel';
import { DemoModeModal } from './components/Panels/DemoModeModal';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export const App: React.FC = () => {
  // Navigation View State ('home' | 'forecast' | 'verification')
  const [activeTab, setActiveTab] = useState<AppTab>('home');

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Connection & Data Status
  const [apiConnected, setApiConnected] = useState<boolean>(false);
  const [dataStatus, setDataStatus] = useState<DataStatus>('REAL_DATA');
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState<boolean>(false);

  // Application Data States
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

  // Sync HTML dark class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Initial Data Fetch
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

      // 5. Fetch Verified Boundary GeoJSON (asynchronously)
      api
        .getDistrictGeoJSON()
        .then((geo) => setGeoJsonData(geo))
        .catch((e) => console.warn('District GeoJSON could not be fetched:', e));
    } catch (err: any) {
      console.error('Failed to load application data:', err);
      setApiConnected(false);
      setGlobalError('Live prediction API is currently unavailable. Displaying cached verified records.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Handle District Selection
  const handleSelectDistrict = async (districtId: string) => {
    setSelectedDistrictId(districtId);
    setDistrictLoading(true);
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

  // Demo Simulation Handler
  const handleApplyDemoForecast = (demoFcst: CombinedForecastResponse) => {
    setActiveForecast(demoFcst);
    setDataStatus('DEMO_DATA');
    setIsDemoMode(true);
    api.setDemoMode(true);
    setActiveTab('forecast');
  };

  const handleToggleDemoMode = () => {
    if (isDemoMode) {
      setIsDemoMode(false);
      api.setDemoMode(false);
      loadInitialData();
    } else {
      setIsDemoModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      {/* Top Navbar with Responsive Navigation Tabs */}
      <Header
        apiConnected={apiConnected}
        dataStatus={dataStatus}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode((prev) => !prev)}
        isDemoMode={isDemoMode}
        onToggleDemoMode={handleToggleDemoMode}
        onRefresh={loadInitialData}
        isRefreshing={isRefreshing}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Global Error Banner */}
      {globalError && (
        <div className="bg-rose-50 dark:bg-rose-950/60 border-b border-rose-200 dark:border-rose-900 px-4 py-2 text-xs text-rose-800 dark:text-rose-300 flex items-center justify-center space-x-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{globalError}</span>
        </div>
      )}

      {/* Demo Mode Alert Banner */}
      {isDemoMode && (
        <div className="bg-amber-500 text-slate-950 px-4 py-1.5 text-xs font-bold text-center flex items-center justify-center space-x-2 shadow-sm">
          <AlertTriangle className="h-4 w-4" />
          <span>
            SIH DEMO MODE ACTIVE: Visualizing simulated scenario. Real scientific data is preserved.
          </span>
          <button
            onClick={() => {
              setIsDemoMode(false);
              loadInitialData();
            }}
            className="underline ml-2 hover:text-white transition cursor-pointer"
          >
            Reset to Real Data
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* VIEW 1: Landing Page (Overview / Home) */}
        {activeTab === 'home' && (
          <LandingPage
            onNavigateToForecast={(districtId) => {
              if (districtId) {
                handleSelectDistrict(districtId);
              }
              setActiveTab('forecast');
            }}
            onNavigateToVerification={() => setActiveTab('verification')}
            districts={districts}
          />
        )}

        {/* VIEW 2: Interactive Forecast Explorer */}
        {activeTab === 'forecast' && (
          <div className="space-y-6">
            {/* Top Summary Cards */}
            <ForecastSummaryCards
              forecast={activeForecast}
              stationName={districtForecast ? districtForecast.name : 'PUNE BENCHMARK STATION'}
              isStationLevelBenchmark={districtForecast?.coverage_status === 'BENCHMARK_ACTIVE'}
              isLoading={districtLoading}
              onSelectPuneBenchmark={() => handleSelectDistrict('pune')}
            />

            {/* Primary Spatial & Operational Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column (8 Cols): Map, District Detail & Catalog Table */}
              <div className="lg:col-span-8 space-y-6">
                {/* Interactive Leaflet Map */}
                <RainfallMap
                  districts={districts}
                  selectedDistrictId={selectedDistrictId}
                  onSelectDistrict={handleSelectDistrict}
                  activeForecast={activeForecast}
                  geoJsonData={geoJsonData}
                  isDarkMode={isDarkMode}
                />

                {/* Selected District / Station Detail Panel */}
                <DistrictDetailPanel
                  districtForecast={districtForecast}
                  isLoading={districtLoading}
                />

                {/* District & Station Catalog Table */}
                <ForecastTable
                  districts={districts}
                  selectedDistrictId={selectedDistrictId}
                  onSelectDistrict={handleSelectDistrict}
                  activeForecast={activeForecast}
                />
              </div>

              {/* Right Column (4 Cols): Operational Panels */}
              <div className="lg:col-span-4 space-y-6">
                {/* Weather Regime Classification */}
                <WeatherRegimePanel
                  predictedRegime={activeForecast ? activeForecast.predicted_regime : null}
                  probabilities={activeForecast ? activeForecast.regime_probabilities : {}}
                  confidence={
                    activeForecast
                      ? (activeForecast.regime_probabilities[activeForecast.predicted_regime] ?? null)
                      : null
                  }
                  selectedModel={activeForecast ? activeForecast.selected_model : null}
                />

                {/* Heavy Rainfall Probability Suite */}
                <ProbabilityPanel
                  probabilities={activeForecast ? activeForecast.heavy_rainfall_probabilities : []}
                  disclaimer={
                    'MODEL EXCEEDANCE PROBABILITIES ARE SCIENTIFIC NUMERICAL ESTIMATES AND DO NOT CONSTITUTE OFFICIAL IMD WEATHER WARNINGS.'
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: Model Verification & Scientific Benchmarks */}
        {activeTab === 'verification' && (
          <div className="space-y-6">
            {/* Phase 8 Verification Engine Dashboard */}
            <VerificationDashboard
              summary={verificationSummary}
              probabilityMetrics={verificationProbability}
              regimeMetrics={verificationRegimes}
              isLoading={isLoading}
            />

            {/* Mandatory Scientific Limitations Panel */}
            <LimitationsPanel />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              VarshaPurvanumanAI (SIH26080)
            </span>
            <span>• Ministry of Earth Sciences (MoES) / IMD Monsoon Benchmark System</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Real Data Provenance: Zenodo IMD 0.25° Gridded Rainfall Benchmark & NOAA GFS 0.25° Seamless Forecasts.
          </div>
        </div>
      </footer>

      {/* Interactive SIH Demo Mode Simulator Modal */}
      <DemoModeModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onApplyDemoForecast={handleApplyDemoForecast}
      />
    </div>
  );
};

export default App;

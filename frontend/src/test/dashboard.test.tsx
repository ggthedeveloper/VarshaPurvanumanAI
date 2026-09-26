import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../components/Header';
import { ForecastSummaryCards } from '../components/Cards/ForecastSummaryCards';
import { WeatherRegimePanel } from '../components/Panels/WeatherRegimePanel';
import { ProbabilityPanel } from '../components/Panels/ProbabilityPanel';
import { DistrictDetailPanel } from '../components/Panels/DistrictDetailPanel';
import { ForecastTable } from '../components/Tables/ForecastTable';
import { VerificationDashboard } from '../components/Verification/VerificationDashboard';
import { LimitationsPanel } from '../components/Panels/LimitationsPanel';
import { LoginPage } from '../components/Auth/LoginPage';
import { Sidebar } from '../components/Navigation/Sidebar';
import { RegimeView } from '../views/RegimeView';
import { ProbabilityView } from '../views/ProbabilityView';
import { DistrictsView } from '../views/DistrictsView';
import { ProvenanceView } from '../views/ProvenanceView';
import { SystemHealthView } from '../views/SystemHealthView';
import { LandingPage } from '../components/Landing/LandingPage';
import { WeatherControllerPill } from '../components/Weather/WeatherControllerPill';
import { RealtimeWeatherHUD } from '../components/Weather/RealtimeWeatherHUD';
import { Navbar } from '../components/Navigation/Navbar';
import { WeatherProvider } from '../context/WeatherContext';
import {
  CombinedForecastResponse,
  DistrictItem,
  DistrictForecastResponse,
  VerificationSummaryResponse,
} from '../types/api';

// Sample Fixtures
const mockForecast: CombinedForecastResponse = {
  raw_nwp_rainfall_mm: 5.4,
  predicted_regime: 'OTHER',
  regime_probabilities: {
    ACTIVE_MONSOON: 0.01,
    BREAK_MONSOON: 0.01,
    COASTAL_OROGRAPHIC: 0.01,
    DEPRESSION: 0.02,
    OTHER: 0.95,
  },
  selected_model: 'dedicated_other',
  corrected_rainfall_mm: 3.26,
  heavy_rainfall_probabilities: [
    {
      threshold_mm: 2.5,
      threshold_name: 'Rainy Day',
      category: 'OPERATIONAL',
      exceedance_probability: 0.2885,
      decision_threshold_tau: 0.3,
      advisory_status: 'NORMAL_ADVISORY',
    },
    {
      threshold_mm: 7.5,
      threshold_name: 'Surge Proxy',
      category: 'EXPERIMENTAL',
      exceedance_probability: 0.2313,
      decision_threshold_tau: 0.2,
      advisory_status: 'ELEVATED_RISK',
    },
    {
      threshold_mm: 15.6,
      threshold_name: 'Moderate Rain',
      category: 'OPERATIONAL',
      exceedance_probability: 0.0787,
      decision_threshold_tau: 0.1,
      advisory_status: 'NORMAL_ADVISORY',
    },
    {
      threshold_mm: 64.5,
      threshold_name: 'Heavy Rain',
      category: 'OPERATIONAL',
      exceedance_probability: 0.0002,
      decision_threshold_tau: 0.5,
      advisory_status: 'NORMAL_ADVISORY',
    },
    {
      threshold_mm: 115.6,
      threshold_name: 'Very Heavy Rain',
      category: 'OPERATIONAL',
      exceedance_probability: 0.0,
      decision_threshold_tau: 0.5,
      advisory_status: 'NORMAL_ADVISORY',
    },
  ],
  model_metadata: {
    regime_classifier: 'Phase 4 GradientBoosting',
    deterministic_postprocessor: 'Phase 6 RegimeAware',
    probability_engine: 'Phase 7 Platt-Calibrated',
  },
  data_status: 'REAL_DATA',
  prediction_source: 'verified_model_artifacts',
  timestamp: '2026-09-22T00:00:00Z',
};

const mockDistricts: DistrictItem[] = [
  {
    district_id: 'pune',
    name: 'PUNE BENCHMARK STATION',
    state: 'Maharashtra',
    latitude: 18.5204,
    longitude: 73.8567,
    coverage_status: 'BENCHMARK_ACTIVE',
  },
  {
    district_id: 'nagpur',
    name: 'Nagpur',
    state: 'Maharashtra',
    latitude: 21.1458,
    longitude: 79.0882,
    coverage_status: 'REFERENCE_ONLY',
  },
  {
    district_id: 'bhopal',
    name: 'Bhopal',
    state: 'Madhya Pradesh',
    latitude: 23.2599,
    longitude: 77.4126,
    coverage_status: 'REFERENCE_ONLY',
  },
];

const mockVerificationSummary: VerificationSummaryResponse = {
  test_period: 'June 1 - June 30, 2024',
  test_sample_count: 31,
  continuous_metrics: {
    'Raw NWP': {
      rmse: 11.62,
      mae: 8.35,
      mean_bias: 2.76,
      pearson_r: 0.41,
      mean_forecast: 9.2,
      mean_observed: 6.44,
      sample_count: 31,
    },
    'Global ML': {
      rmse: 9.03,
      mae: 6.63,
      mean_bias: -1.57,
      pearson_r: 0.29,
      mean_forecast: 4.86,
      mean_observed: 6.44,
      sample_count: 31,
    },
    'Regime-Aware ML': {
      rmse: 9.61,
      mae: 6.66,
      mean_bias: -2.35,
      pearson_r: 0.1,
      mean_forecast: 4.09,
      mean_observed: 6.44,
      sample_count: 31,
    },
  },
  categorical_metrics: {
    'Raw NWP': {
      '2.5': {
        threshold_mm: 2.5,
        category: 'OPERATIONAL',
        contingency_table: { H: 10, F: 8, M: 3, C: 10, total: 31, observed_events: 13, forecast_events: 18 },
        POD: 0.769,
        FAR: 0.444,
        CSI: 0.476,
        ETS: 0.182,
      },
    },
    'Global ML': {
      '2.5': {
        threshold_mm: 2.5,
        category: 'OPERATIONAL',
        contingency_table: { H: 10, F: 4, M: 3, C: 14, total: 31, observed_events: 13, forecast_events: 14 },
        POD: 0.769,
        FAR: 0.286,
        CSI: 0.588,
        ETS: 0.386,
      },
    },
    'Regime-Aware ML': {
      '2.5': {
        threshold_mm: 2.5,
        category: 'OPERATIONAL',
        contingency_table: { H: 9, F: 4, M: 4, C: 14, total: 31, observed_events: 13, forecast_events: 13 },
        POD: 0.692,
        FAR: 0.308,
        CSI: 0.529,
        ETS: 0.312,
      },
    },
  },
  uncertainty_intervals_95: {},
  fss: {
    metric: 'FSS',
    status: 'NOT_COMPUTABLE',
    reason: 'Current evaluation data is point-based and lacks the required 2-D spatial forecast/observation grid.',
  },
  scientific_conclusion: 'Global ML achieves lowest overall RMSE (9.03 mm vs Raw NWP 11.62 mm).',
  data_status: 'REAL_DATA',
};

describe('VarshaPurvanumanAI Frontend Component Suite', () => {
  it('1. Header renders SIH branding and REAL DATA badge by default', () => {
    render(
      <Header
        apiConnected={true}
        dataStatus="REAL_DATA"
        isDarkMode={false}
        onToggleTheme={vi.fn()}
        isDemoMode={false}
        onToggleDemoMode={vi.fn()}
        onRefresh={vi.fn()}
        isRefreshing={false}
      />
    );

    expect(screen.getByText('VarshaPurvanuman AI')).toBeInTheDocument();
    expect(screen.getByText('Meteorological AI')).toBeInTheDocument();
    expect(screen.getByText('REAL DATA')).toBeInTheDocument();
    expect(screen.getByText('API Connected')).toBeInTheDocument();
  });

  it('2. Header displays DEMO DATA badge when demo mode is active', () => {
    render(
      <Header
        apiConnected={true}
        dataStatus="DEMO_DATA"
        isDarkMode={false}
        onToggleTheme={vi.fn()}
        isDemoMode={true}
        onToggleDemoMode={vi.fn()}
        onRefresh={vi.fn()}
        isRefreshing={false}
      />
    );

    expect(screen.getByText('DEMO DATA')).toBeInTheDocument();
  });

  it('3. ForecastSummaryCards renders station-level benchmark labeling', () => {
    render(
      <ForecastSummaryCards
        forecast={mockForecast}
        stationName="PUNE BENCHMARK STATION"
        isStationLevelBenchmark={true}
      />
    );

    expect(screen.getByText(/Target Location: PUNE BENCHMARK STATION/i)).toBeInTheDocument();
    expect(screen.getByText(/Station-level benchmark/i)).toBeInTheDocument();
    expect(screen.getByText('5.4')).toBeInTheDocument(); // Raw NWP
    expect(screen.getByText('3.3')).toBeInTheDocument(); // Corrected (toFixed(1))
  });

  it('4. WeatherRegimePanel displays PREDICTED REGIME and class posterior distribution', () => {
    render(
      <WeatherRegimePanel
        predictedRegime="OTHER"
        probabilities={mockForecast.regime_probabilities}
        confidence={0.95}
        selectedModel="dedicated_other"
      />
    );

    expect(screen.getByText('PREDICTED REGIME')).toBeInTheDocument();
    expect(screen.getAllByText('Other / Transitional').length).toBe(2);
    expect(screen.getByText('Confidence: 95.0%')).toBeInTheDocument();
    expect(screen.getByText('dedicated_other')).toBeInTheDocument();
  });

  it('5. ProbabilityPanel renders 5 thresholds, official disclaimer, and limited validation alert', () => {
    render(
      <ProbabilityPanel
        probabilities={mockForecast.heavy_rainfall_probabilities}
        disclaimer="MODEL EXCEEDANCE PROBABILITIES ARE SCIENTIFIC NUMERICAL ESTIMATES AND DO NOT CONSTITUTE OFFICIAL IMD WEATHER WARNINGS."
      />
    );

    expect(screen.getByText('MODEL EXCEEDANCE PROBABILITY')).toBeInTheDocument();
    expect(screen.getByText('Official warning data unavailable')).toBeInTheDocument();
    expect(screen.getByText('≥ 2.5 mm')).toBeInTheDocument();
    expect(screen.getByText('≥ 64.5 mm')).toBeInTheDocument();
    expect(screen.getByText('≥ 115.6 mm')).toBeInTheDocument();

    // Check limited validation notices for 64.5 and 115.6
    const alertNotices = screen.getAllByText(/Limited validation data \(0 test events\)/i);
    expect(alertNotices.length).toBe(2);
  });

  it('6. VerificationDashboard displays 3-model comparison and FSS NOT_COMPUTABLE', () => {
    render(
      <VerificationDashboard
        summary={mockVerificationSummary}
        probabilityMetrics={null}
        regimeMetrics={null}
        isLoading={false}
      />
    );

    expect(screen.getByText('11.62 mm')).toBeInTheDocument(); // Raw NWP
    expect(screen.getAllByText(/9.03 mm/).length).toBeGreaterThanOrEqual(1); // Global ML
    expect(screen.getAllByText(/9.61 mm/).length).toBeGreaterThanOrEqual(1); // Regime-Aware ML

    // Strict FSS NOT_COMPUTABLE check
    expect(screen.getByText('NOT_COMPUTABLE')).toBeInTheDocument();
    expect(screen.getByText(/Current evaluation data is point-based/i)).toBeInTheDocument();
  });

  it('7. ForecastTable renders rows, allows search filtering, and handles unavailable data', () => {
    const onSelectDistrict = vi.fn();
    render(
      <ForecastTable
        districts={mockDistricts}
        selectedDistrictId="pune"
        onSelectDistrict={onSelectDistrict}
        activeForecast={mockForecast}
      />
    );

    expect(screen.getByText('PUNE BENCHMARK STATION')).toBeInTheDocument();
    expect(screen.getByText('Nagpur')).toBeInTheDocument();

    // Search filter test
    const searchInput = screen.getByPlaceholderText('Search district...');
    fireEvent.change(searchInput, { target: { value: 'Bhopal' } });

    expect(screen.getByText('Bhopal')).toBeInTheDocument();
    expect(screen.queryByText('Nagpur')).not.toBeInTheDocument();
  });

  it('8. DistrictDetailPanel handles unmonitored district with DATA UNAVAILABLE notice', () => {
    const unmonitoredResp: DistrictForecastResponse = {
      district_id: 'nagpur',
      name: 'Nagpur',
      latitude: 21.1458,
      longitude: 79.0882,
      coverage_status: 'DATA_UNAVAILABLE',
      forecast: null,
      message: "District-level data unavailable for 'Nagpur'. Real forecast data is currently available only for the PUNE BENCHMARK STATION.",
      data_status: 'REAL_DATA',
    };

    render(
      <DistrictDetailPanel
        districtForecast={unmonitoredResp}
        isLoading={false}
      />
    );

    expect(screen.getByText('DISTRICT-LEVEL DATA UNAVAILABLE')).toBeInTheDocument();
    expect(screen.getByText(/District-level data unavailable for 'Nagpur'/i)).toBeInTheDocument();
  });

  it('9. LimitationsPanel displays mandatory scientific caveats', () => {
    render(<LimitationsPanel />);

    expect(screen.getByText(/Held-Out Test Window \(June 2024\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Zero ≥64.5 mm Events/i)).toBeInTheDocument();
    expect(screen.getByText(/Spatial Verification: FSS Not Computable/i)).toBeInTheDocument();
    expect(screen.getByText(/Station-Level Benchmark vs Regional Aggregates/i)).toBeInTheDocument();
  });

  it('10. Fix 1 Regression: ForecastSummaryCards renders explicit DATA UNAVAILABLE and no Pune values when forecast is null', () => {
    const onSelectPuneBenchmark = vi.fn();
    render(
      <ForecastSummaryCards
        forecast={null}
        stationName="Nagpur"
        isStationLevelBenchmark={false}
        onSelectPuneBenchmark={onSelectPuneBenchmark}
      />
    );

    // Confirm explicit unavailable state & message
    expect(screen.getAllByText('DISTRICT-LEVEL DATA UNAVAILABLE').length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByText(/No verified forecast is currently available for this district/i)
    ).toBeInTheDocument();

    // Confirm Pune rainfall numbers are NOT rendered
    expect(screen.queryByText('5.4')).not.toBeInTheDocument();
    expect(screen.queryByText('3.3')).not.toBeInTheDocument();
    expect(screen.queryByText('0.0 mm')).not.toBeInTheDocument();

    // Confirm navigation button exists and identifies Pune benchmark station
    const returnBtns = screen.getAllByRole('button', { name: /View Pune Benchmark Station/i });
    expect(returnBtns.length).toBeGreaterThanOrEqual(1);
    const returnBtn = returnBtns[0];
    expect(returnBtn).toBeInTheDocument();

    // Click button and confirm callback fires
    fireEvent.click(returnBtn);
    expect(onSelectPuneBenchmark).toHaveBeenCalledTimes(1);
  });

  it('11. Fix 1 Regression Flow: Pune Benchmark -> Unmonitored (Nagpur/Mumbai) -> Return to Pune', () => {
    // 1. Initial State: Pune Benchmark Active
    const { rerender } = render(
      <ForecastSummaryCards
        forecast={mockForecast}
        stationName="PUNE BENCHMARK STATION"
        isStationLevelBenchmark={true}
      />
    );

    expect(screen.getByText('5.4')).toBeInTheDocument();
    expect(screen.getByText('3.3')).toBeInTheDocument();
    expect(screen.getByText(/Station-level benchmark/i)).toBeInTheDocument();

    // 2. Select Unmonitored District (Nagpur): forecast becomes null
    const onReturnToPune = vi.fn();
    rerender(
      <ForecastSummaryCards
        forecast={null}
        stationName="Nagpur"
        isStationLevelBenchmark={false}
        onSelectPuneBenchmark={onReturnToPune}
      />
    );

    expect(screen.queryByText('5.4')).not.toBeInTheDocument();
    expect(screen.queryByText('3.3')).not.toBeInTheDocument();
    expect(screen.getAllByText('DATA UNAVAILABLE').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Target Location: Nagpur/i)).toBeInTheDocument();

    // 3. Test another unmonitored district (Mumbai)
    rerender(
      <ForecastSummaryCards
        forecast={null}
        stationName="Mumbai"
        isStationLevelBenchmark={false}
        onSelectPuneBenchmark={onReturnToPune}
      />
    );

    expect(screen.queryByText('5.4')).not.toBeInTheDocument();
    expect(screen.queryByText('3.3')).not.toBeInTheDocument();
    expect(screen.getByText(/Target Location: Mumbai/i)).toBeInTheDocument();

    // 4. Return to Pune Benchmark
    rerender(
      <ForecastSummaryCards
        forecast={mockForecast}
        stationName="PUNE BENCHMARK STATION"
        isStationLevelBenchmark={true}
      />
    );

    // Confirm Pune forecast values correctly reappear
    expect(screen.getByText('5.4')).toBeInTheDocument();
    expect(screen.getByText('3.3')).toBeInTheDocument();
    expect(screen.getByText(/Target Location: PUNE BENCHMARK STATION/i)).toBeInTheDocument();
  });

  it('12. WeatherRegimePanel renders N/A for category, confidence, and model when predictedRegime is null', () => {
    render(
      <WeatherRegimePanel
        predictedRegime={null}
        probabilities={{}}
        confidence={null}
        selectedModel={null}
      />
    );

    expect(screen.getAllByText('N/A').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/Confidence: N\/A/i)).toBeInTheDocument();
    expect(screen.getByText(/Regime classification unavailable/i)).toBeInTheDocument();
  });

  it('13. ProbabilityPanel renders explicit N/A when probabilities array is empty', () => {
    render(
      <ProbabilityPanel
        probabilities={[]}
        disclaimer="MODEL EXCEEDANCE PROBABILITIES DISCLAIMER"
      />
    );

    expect(screen.getByText(/Exceedance Probabilities:/i)).toBeInTheDocument();
    expect(screen.getByText('N/A')).toBeInTheDocument();
    expect(screen.getByText(/Probability exceedance estimates unavailable for unmonitored locations/i)).toBeInTheDocument();
  });

  it('14. Complete State Sequence: Pune -> Nagpur -> Mumbai -> Bhopal -> Pune maintains zero stale values', () => {
    const { rerender } = render(
      <ForecastSummaryCards
        forecast={mockForecast}
        stationName="PUNE BENCHMARK STATION"
        isStationLevelBenchmark={true}
      />
    );

    // Initial Pune
    expect(screen.getByText('5.4')).toBeInTheDocument();
    expect(screen.getByText('3.3')).toBeInTheDocument();

    // Transition to Nagpur
    rerender(
      <ForecastSummaryCards
        forecast={null}
        stationName="Nagpur"
        isStationLevelBenchmark={false}
      />
    );
    expect(screen.queryByText('5.4')).not.toBeInTheDocument();
    expect(screen.queryByText('3.3')).not.toBeInTheDocument();
    expect(screen.getByText(/Target Location: Nagpur/i)).toBeInTheDocument();

    // Transition to Mumbai
    rerender(
      <ForecastSummaryCards
        forecast={null}
        stationName="Mumbai"
        isStationLevelBenchmark={false}
      />
    );
    expect(screen.queryByText('5.4')).not.toBeInTheDocument();
    expect(screen.queryByText('3.3')).not.toBeInTheDocument();
    expect(screen.getByText(/Target Location: Mumbai/i)).toBeInTheDocument();

    // Transition to Bhopal
    rerender(
      <ForecastSummaryCards
        forecast={null}
        stationName="Bhopal"
        isStationLevelBenchmark={false}
      />
    );
    expect(screen.queryByText('5.4')).not.toBeInTheDocument();
    expect(screen.queryByText('3.3')).not.toBeInTheDocument();
    expect(screen.getByText(/Target Location: Bhopal/i)).toBeInTheDocument();

    // Transition back to Pune
    rerender(
      <ForecastSummaryCards
        forecast={mockForecast}
        stationName="PUNE BENCHMARK STATION"
        isStationLevelBenchmark={true}
      />
    );
    expect(screen.getByText('5.4')).toBeInTheDocument();
    expect(screen.getByText('3.3')).toBeInTheDocument();
    expect(screen.getByText(/Target Location: PUNE BENCHMARK STATION/i)).toBeInTheDocument();
  });

  it('15. LoginPage renders SIH26080 branding and demo quick-fill credentials', () => {
    const handleLoginSuccess = vi.fn();
    const handleToggleTheme = vi.fn();
    render(
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        isDarkMode={false}
        onToggleTheme={handleToggleTheme}
      />
    );

    expect(screen.getByText(/MoES \/ IMD Meteorological Intelligence/i)).toBeInTheDocument();
    expect(screen.getByText(/Platform Access/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Quick Demo Access/i })).toBeInTheDocument();
    expect(screen.getByText(/Pre-configured Access/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Gaurav')).toBeInTheDocument();
  });

  it('16. Sidebar renders all 8 navigation routes and triggers navigation callback', () => {
    const handleNavigate = vi.fn();
    const handleToggleCollapse = vi.fn();
    const handleToggleTheme = vi.fn();
    const handleLogout = vi.fn();

    render(
      <Sidebar
        currentRoute="dashboard"
        onNavigate={handleNavigate}
        isCollapsed={false}
        onToggleCollapse={handleToggleCollapse}
        isDarkMode={false}
        onToggleTheme={handleToggleTheme}
        user={{
          username: 'Gaurav',
          name: 'Gaurav Gautam',
          role: 'Lead Meteorologist',
          is_demo: true,
        }}
        onLogout={handleLogout}
        isMobileOpen={false}
        onCloseMobile={vi.fn()}
      />
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Rainfall Forecast')).toBeInTheDocument();
    expect(screen.getByText('Weather Regime')).toBeInTheDocument();
    expect(screen.getByText('Probability Analysis')).toBeInTheDocument();
    expect(screen.getByText('Verification')).toBeInTheDocument();
    expect(screen.getByText('District Explorer')).toBeInTheDocument();
    expect(screen.getByText('Data & Provenance')).toBeInTheDocument();
    expect(screen.getByText('System Health')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Weather Regime'));
    expect(handleNavigate).toHaveBeenCalledWith('regime');
  });

  it('17. RegimeView renders synoptic regime classes and handles data unavailable state', () => {
    const handleSelectPune = vi.fn();
    render(
      <RegimeView
        districtForecast={{
          district_id: 'nagpur',
          name: 'Nagpur',
          latitude: 21.14,
          longitude: 79.08,
          coverage_status: 'DATA_UNAVAILABLE',
          forecast: null,
          message: 'Data unavailable',
          data_status: 'REAL_DATA',
        }}
        activeForecast={null}
        verificationRegimes={null}
        onSelectPuneBenchmark={handleSelectPune}
        isLoading={false}
      />
    );

    expect(screen.getByText(/Synoptic Weather Regime Classification/i)).toBeInTheDocument();
    expect(screen.getByText(/Synoptic Telemetry Unavailable for Nagpur/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /View Pune Benchmark Regime/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /View Pune Benchmark Regime/i }));
    expect(handleSelectPune).toHaveBeenCalled();
  });

  it('18. ProbabilityView renders mandatory IMD disclaimer and 5 threshold cards', () => {
    render(
      <ProbabilityView
        districtForecast={{
          district_id: 'pune',
          name: 'Pune Benchmark Station',
          latitude: 18.52,
          longitude: 73.85,
          coverage_status: 'BENCHMARK_ACTIVE',
          forecast: mockForecast,
          message: 'Benchmark active',
          data_status: 'REAL_DATA',
        }}
        activeForecast={mockForecast}
        verificationProbability={null}
        onSelectPuneBenchmark={vi.fn()}
        isLoading={false}
      />
    );

    expect(screen.getByText(/Heavy Rainfall Probability Suite/i)).toBeInTheDocument();
    expect(screen.getByText(/Official Meteorological Warning Demarcation Notice/i)).toBeInTheDocument();
    expect(screen.getByText(/MODEL EXCEEDANCE PROBABILITIES ARE SCIENTIFIC NUMERICAL ESTIMATES/i)).toBeInTheDocument();
    expect(screen.getByText('≥ 2.5 mm / 24h')).toBeInTheDocument();
    expect(screen.getByText('≥ 64.5 mm / 24h')).toBeInTheDocument();
  });

  it('19. DistrictsView renders 78-district registry and search filter', () => {
    const handleSelectDistrict = vi.fn();
    const handleNavigate = vi.fn();

    render(
      <DistrictsView
        districts={mockDistricts}
        selectedDistrictId="pune"
        onSelectDistrict={handleSelectDistrict}
        onNavigate={handleNavigate}
      />
    );

    expect(screen.getByText(/Administrative District Registry/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search district name, state, or ID.../i)).toBeInTheDocument();
    expect(screen.getByText('PUNE BENCHMARK STATION')).toBeInTheDocument();
    expect(screen.getByText('Nagpur')).toBeInTheDocument();
  });

  it('20. ProvenanceView and SystemHealthView render complete documentation & telemetry', async () => {
    const { unmount } = render(<ProvenanceView />);
    expect(screen.getByText(/Data Provenance & Scientific Methodology/i)).toBeInTheDocument();
    expect(screen.getByText(/Where to Download \/ Acquire These Datasets/i)).toBeInTheDocument();
    expect(screen.getByText(/IMD Gridded Rainfall \(0.25° & 0.1°\)/i)).toBeInTheDocument();
    expect(screen.getByText(/NOAA GFS Forecasts \(0.25°\)/i)).toBeInTheDocument();
    expect(screen.getByText(/IMD Cyclone & Monsoon Reports \(Regimes\)/i)).toBeInTheDocument();
    expect(screen.getByText(/India District GeoJSON Boundaries/i)).toBeInTheDocument();
    expect(screen.getByText(/IMD Gridded Daily Rainfall Analysis/i)).toBeInTheDocument();
    expect(screen.getByText(/NOAA Global Forecast System/i)).toBeInTheDocument();
    unmount();

    await render(
      <SystemHealthView
        apiConnected={true}
        dataStatus="REAL_DATA"
        isDarkMode={false}
      />
    );
    expect(screen.getByText(/System Health & Pipeline Telemetry/i)).toBeInTheDocument();
    expect(screen.getByText('OPERATIONAL')).toBeInTheDocument();
    expect(screen.getByText('ZERO SYNTHETIC')).toBeInTheDocument();
  });

  it('21. LandingPage renders interactive weather regime switcher, NWP bias-correction sandbox, and station showcase', () => {
    const handleNavigateToForecast = vi.fn();
    const handleNavigateToVerification = vi.fn();
    const handleSelectDistrict = vi.fn();

    render(
      <LandingPage
        onNavigateToForecast={handleNavigateToForecast}
        onNavigateToVerification={handleNavigateToVerification}
        districts={mockDistricts}
        selectedDistrictId="pune"
        onSelectDistrict={handleSelectDistrict}
        activeForecast={mockForecast}
        geoJsonData={null}
        isDarkMode={true}
        isLoggedIn={false}
      />
    );

    expect(screen.getByText(/Ministry of Earth Sciences \(MoES\) \/ IMD/i)).toBeInTheDocument();
    expect(screen.getByText(/Interactive Weather Simulation • Click to Test Regimes/i)).toBeInTheDocument();
    expect(screen.getByText(/Test Regime-Conditioned Bias Correction Live/i)).toBeInTheDocument();
    expect(screen.getByText(/Raw NOAA GFS Forecast Accumulation:/i)).toBeInTheDocument();
    expect(screen.getByText(/National Monsoon Station Hubs/i)).toBeInTheDocument();

    // Test regime switcher interaction
    const breakSpellBtn = screen.getByRole('button', { name: /Break Spell/i });
    fireEvent.click(breakSpellBtn);
    expect(screen.getAllByText(/Break Monsoon Spell/i)[0]).toBeInTheDocument();

    // Test bias correction slider interaction
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '60' } });
    expect(screen.getAllByText(/60\.0/)[0]).toBeInTheDocument();
  });

  it('22. WeatherControllerPill renders and allows interactive regime selection and toggling', () => {
    render(
      <WeatherProvider>
        <WeatherControllerPill isDarkMode={true} />
      </WeatherProvider>
    );

    const triggerBtn = screen.getByTitle(/Live Weather Atmospheric Controls/i);
    expect(triggerBtn).toBeInTheDocument();

    // Open dropdown
    fireEvent.click(triggerBtn);
    expect(screen.getByText(/Live Weather Simulation/i)).toBeInTheDocument();
    expect(screen.getByText(/Atmospheric Density/i)).toBeInTheDocument();
    expect(screen.getByText(/Thunderstorm Flashes/i)).toBeInTheDocument();

    // Toggle active state
    const toggleBtn = screen.getByRole('button', { name: /^Active$/i });
    fireEvent.click(toggleBtn);
    expect(screen.getByText(/Disabled/i)).toBeInTheDocument();
  });

  it('23. RealtimeWeatherHUD renders live meteorological gauges, ticking clock, and lightning trigger', () => {
    render(
      <WeatherProvider>
        <RealtimeWeatherHUD isDarkMode={true} />
      </WeatherProvider>
    );

    const trigger = screen.getByText(/Real-Time Weather/i);
    expect(trigger).toBeInTheDocument();

    // Click to expand full meteorological HUD
    fireEvent.click(trigger);

    expect(screen.getByText(/Rain Rate/i)).toBeInTheDocument();
    expect(screen.getByText(/Temperature/i)).toBeInTheDocument();
    expect(screen.getByText(/Humidity/i)).toBeInTheDocument();
    expect(screen.getByText(/Pressure/i)).toBeInTheDocument();
    expect(screen.getByText(/CAPE/i)).toBeInTheDocument();

    const strikeBtn = screen.getByTitle(/Strike lightning immediately across the sky/i);
    expect(strikeBtn).toBeInTheDocument();
    fireEvent.click(strikeBtn);
  });

  it('24. Navbar displays real-time weather metrics, location trigger, and opens meteorological telemetry popover', () => {
    const handleDetectLocation = vi.fn();
    const handleToggleTheme = vi.fn();
    const handleRefresh = vi.fn();
    const handleOpenMobileMenu = vi.fn();

    render(
      <WeatherProvider>
        <Navbar
          currentRoute="dashboard"
          selectedDistrictName="Pune"
          isBenchmarkActive={true}
          isDataUnavailable={false}
          apiConnected={true}
          dataStatus="HISTORICAL_BENCHMARK"
          isDarkMode={true}
          onToggleTheme={handleToggleTheme}
          onRefresh={handleRefresh}
          isRefreshing={false}
          onOpenMobileMenu={handleOpenMobileMenu}
          user={{
            username: 'Gaurav',
            name: 'Gaurav Gautam',
            role: 'Lead Meteorologist',
            is_demo: false,
          }}
          onDetectLocation={handleDetectLocation}
        />
      </WeatherProvider>
    );

    // Verifies Monsoon Dashboard is not on navbar and station context is present
    expect(screen.queryByText('Monsoon Dashboard')).not.toBeInTheDocument();
    expect(screen.getByText(/Pune/i)).toBeInTheDocument();

    // Verifies unwanted debug pill is removed
    expect(screen.queryByText('API ONLINE')).not.toBeInTheDocument();

    // Verifies location trigger button is rendered and functional
    const locBtn = screen.getByRole('button', { name: /Use Location/i });
    expect(locBtn).toBeInTheDocument();
    fireEvent.click(locBtn);
    expect(handleDetectLocation).toHaveBeenCalledTimes(1);

    // Verifies real-time weather metrics are displayed normally on navbar
    expect(screen.getByText(/°C/i)).toBeInTheDocument();
    expect(screen.getByText(/mm\/h/i)).toBeInTheDocument();

    // Click weather cluster on navbar to open meteorological popover
    const weatherTrigger = screen.getByTitle(/Real-time Meteorological Telemetry & Controls/i);
    expect(weatherTrigger).toBeInTheDocument();
    fireEvent.click(weatherTrigger);

    // Verifies popover gauges and controls are displayed
    expect(screen.getByText(/Rain Rate/i)).toBeInTheDocument();
    expect(screen.getByText(/Temperature/i)).toBeInTheDocument();
    expect(screen.getByText(/Humidity/i)).toBeInTheDocument();
    expect(screen.getByText(/Wind/i)).toBeInTheDocument();
    expect(screen.getByText(/Pressure/i)).toBeInTheDocument();
    expect(screen.getByText(/CAPE/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Strike Lightning ⚡/i })).toBeInTheDocument();

    // Verifies dark mode changer is present on right corner of navbar and toggles theme
    const themeBtn = screen.getByRole('button', { name: /Switch to Light Mode/i });
    expect(themeBtn).toBeInTheDocument();
    fireEvent.click(themeBtn);
    expect(handleToggleTheme).toHaveBeenCalledTimes(1);

    // Verifies user profile is present on right corner of navbar and opens dropdown
    const profileBtn = screen.getByRole('button', { name: /User profile menu/i });
    expect(profileBtn).toBeInTheDocument();
    expect(screen.getByText(/Gaurav/i)).toBeInTheDocument();
    fireEvent.click(profileBtn);
    expect(screen.getByText('Active Meteorologist')).toBeInTheDocument();
  });
});


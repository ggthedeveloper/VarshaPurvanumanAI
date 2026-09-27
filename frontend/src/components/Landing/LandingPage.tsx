import React, { useState } from 'react';
import {
  CloudRain,
  Compass,
  TrendingDown,
  ShieldCheck,
  ArrowRight,
  ArrowDown,
  Activity,
  MapPin,
  Sparkles,
  Award,
  Zap,
  Sun,
  Waves,
  Snowflake,
  Wind,
  Layers,
  CheckCircle2,
  Sliders,
  Play,
  RotateCcw,
  ExternalLink,
  Users,
  Code2,
  Info,
} from 'lucide-react';
import { DistrictItem, CombinedForecastResponse, SynopticRegime } from '../../types/api';
import { NationalCitiesWeatherGrid } from './NationalCitiesWeatherGrid';
import { ErrorBoundary } from '../Common/ErrorBoundary';
import { LiveWeatherBackground } from '../Weather/LiveWeatherBackground';
import { useWeather } from '../../context/WeatherContext';

interface LandingPageProps {
  onNavigateToForecast: (districtId?: string) => void;
  onNavigateToVerification: () => void;
  districts: DistrictItem[];
  selectedDistrictId: string;
  onSelectDistrict: (districtId: string) => void;
  activeForecast: CombinedForecastResponse | null;
  geoJsonData: any | null;
  isDarkMode: boolean;
  onLoginClick?: () => void;
  onQuickDemo?: () => void;
  isLoggedIn?: boolean;
}

interface RegimeCardMeta {
  id: SynopticRegime;
  name: string;
  shortName: string;
  icon: React.ReactNode;
  synopticMechanism: string;
  signature: string;
  biasTendency: string;
  aiRemedy: string;
  color: string;
}

const REGIME_METAS: RegimeCardMeta[] = [
  {
    id: 'ACTIVE_MONSOON',
    name: 'Active Monsoon',
    shortName: 'Active',
    icon: <CloudRain className="h-4 w-4" />,
    synopticMechanism: 'Low-level monsoon trough positioned south of normal over central India with strong south-westerly Arabian Sea surge.',
    signature: 'Core Monsoon Zone z-score ≥ +1.0, high atmospheric precipitable water (PW > 55 mm)',
    biasTendency: 'Raw NWP over-predicts rainfall intensity and false alarm rates at heavy thresholds.',
    aiRemedy: 'Applies positive non-linear compression to curtail excessive peak rainfall spikes.',
    color: 'sky',
  },
  {
    id: 'BREAK_MONSOON',
    name: 'Break Monsoon Spell',
    shortName: 'Break Spell',
    icon: <Sun className="h-4 w-4" />,
    synopticMechanism: 'Monsoon trough shifts northwards to the Himalayan foothills, causing dry spells over central India and peninsula.',
    signature: 'Core Monsoon Zone z-score ≤ -1.0, heavy rain localized to Himalayan foothills and NE India',
    biasTendency: 'Raw NWP routinely produces spurious light-to-moderate rain over peninsular India during dry spells.',
    aiRemedy: 'Zero-inflated suppression dampens phantom rain below 0.5 mm, reducing false alarms by ~40%.',
    color: 'amber',
  },
  {
    id: 'COASTAL_OROGRAPHIC',
    name: 'Coastal & Offshore Trough',
    shortName: 'Coastal / Ghats',
    icon: <Waves className="h-4 w-4" />,
    synopticMechanism: 'Offshore trough along the Konkan-Goa coast and strong onshore windward jet hitting the Western Ghats escarpment.',
    signature: 'Zonal wind u10 ≥ 5.0 m/s, wind speed ≥ 6.5 m/s, relative humidity ≥ 78%, terrain elevation > 400m',
    biasTendency: 'Severe orographic over-forecast: Raw GFS dumps 2× to 3× rain on windward mountain slopes.',
    aiRemedy: 'Ortho-downscaling rectifies terrain blocking errors, cutting RMSE by 22.3% (9.03 vs 11.62 mm).',
    color: 'teal',
  },
  {
    id: 'DEPRESSION',
    name: 'Monsoon Depression',
    shortName: 'Depression',
    icon: <Zap className="h-4 w-4" />,
    synopticMechanism: 'Low-pressure system or depression originating in Bay of Bengal moving west-northwestward across central India.',
    signature: 'Cyclonic vorticity, low central pressure (MSLP dip > 4 hPa), organized squall line bands',
    biasTendency: 'Displacement error: Rain center displaced 50–150 km away from observed torrential core.',
    aiRemedy: 'Spatial neighborhood smoothing preserves peak flood risk while realigning storm center.',
    color: 'purple',
  },
  {
    id: 'WESTERN_DISTURBANCE',
    name: 'Western Disturbance',
    shortName: 'Westerly Trough',
    icon: <Snowflake className="h-4 w-4" />,
    synopticMechanism: 'Mid-latitude upper-tropospheric westerly trough propagating across North/Northwest India (lat ≥ 26.0°N).',
    signature: 'Upper-level 200 hPa jet streak, cold air advection, negative geopotential anomalies',
    biasTendency: 'Monsoon NWP blends westerly shear poorly, mistiming convective triggers.',
    aiRemedy: 'Temperature-gradient routing models winter-monsoon boundary interactions accurately.',
    color: 'cyan',
  },
  {
    id: 'OTHER',
    name: 'General Monsoon Circulation',
    shortName: 'General',
    icon: <Wind className="h-4 w-4" />,
    synopticMechanism: 'Transitional synoptic circulation without an intense synoptic trigger or extreme gradient.',
    signature: 'Moderate tropospheric winds, near-climatological pressure field, isolated convective cells',
    biasTendency: 'Random localized scatter errors and moderate background drizzle over-prediction.',
    aiRemedy: 'Global random forest post-processor provides generalized bias calibration.',
    color: 'indigo',
  },
];

interface TeamMember {
  initials: string;
  name: string;
}

const TEAM_MEMBERS: TeamMember[] = [
  { initials: 'GG', name: 'Gaurav Gautam' },
  { initials: 'DM', name: 'Debosmita Mukhopadhyay' },
  { initials: 'SS', name: 'Shashwat Sahu' },
  { initials: 'PR', name: 'Parinita Ramsagar' },
  { initials: 'LM', name: 'Likhitha Mylavarapu' },
  { initials: 'SS', name: 'Shubham Sagar' },
];

export interface WorkflowStepItem {
  step: number;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  badgeText: string;
  metrics: { label: string; val: string }[];
  details: string;
}

export const WORKFLOW_STEPS: WorkflowStepItem[] = [
  {
    step: 1,
    title: 'DATA',
    subtitle: 'NWP Grid & Ground Telemetry Ingestion',
    description: 'Raw NOAA GFS 0.25° NWP and IMD AWS calibrated surface observations',
    category: 'Ingestion Phase',
    badgeText: '29 Variables',
    metrics: [
      { label: 'Base NWP Grid', val: 'NOAA GFS 0.25° Global Model' },
      { label: 'Validation Sensor', val: 'IMD AWS High-Density Gauges' },
      { label: 'Atmospheric Predictors', val: '29 Features (Wind, PW, CAPE)' },
      { label: 'Telemetry Inflow', val: '< 180ms Real-Time Pipeline' },
    ],
    details:
      'Continuous streaming of operational numerical weather prediction grids (u10, v10, MSLP, RH, precipitable water, CAPE) combined with real-time ground truth from calibrated automatic weather stations across India.',
  },
  {
    step: 2,
    title: 'REGIME',
    subtitle: 'Synoptic Pattern Diagnosis',
    description: 'Objective classification into 6 canonical meteorological regimes',
    category: 'Diagnostic Phase',
    badgeText: '93.55% Accuracy',
    metrics: [
      { label: 'Classifier Model', val: 'Multi-class Gradient Boosting' },
      { label: 'Monsoon Classes', val: '6 Canonical Dynamic Regimes' },
      { label: 'Diagnostic Signal', val: 'Zonal Shear & Tropospheric PW' },
      { label: 'Held-out F1 Score', val: '0.934 Across 4 Monsoon Seasons' },
    ],
    details:
      'Objectively classifies macro-scale synoptic circulation (Active Monsoon, Break Spell, Coastal Orographic, Monsoon Depression, Westerly Trough, General) to dynamically select the optimal post-processing physics model.',
  },
  {
    step: 3,
    title: 'CALIBRATION',
    subtitle: 'Regime-Conditioned ML Bias Fix',
    description: 'Condition-specific ML regressors eliminate severe orographic bias',
    category: 'Correction Phase',
    badgeText: '-22.3% RMSE Cut',
    metrics: [
      { label: 'Orographic Error Cut', val: '22.3% RMSE Cut (9.03 vs 11.62 mm)' },
      { label: 'False Alarm Cut', val: '-40.5% During Break Spells' },
      { label: 'Model Architecture', val: 'Quantile-Conditioned ML Post-Processor' },
      { label: 'Ghats Relief', val: 'Eliminates 2× to 3× Windward Over-Forecast' },
    ],
    details:
      'Applies specialized post-processors that eradicate severe NWP mountain blocking over-forecast along the Western Ghats and suppress phantom drizzle during break monsoon periods.',
  },
  {
    step: 4,
    title: 'PROBABILITY',
    subtitle: 'Operational Risk Exceedance',
    description: 'Platt-calibrated exceedance risks across 5 IMD operational thresholds',
    category: 'Decision Phase',
    badgeText: '5 Warning Tiers',
    metrics: [
      { label: 'Probability Engine', val: 'Platt-Scaled Sigmoid Transform' },
      { label: 'IMD Alert Tiers', val: '≥2.5, ≥7.5, ≥15.6, ≥64.5, ≥115.6 mm' },
      { label: 'Reliability Index', val: 'Brier Score 0.082 (vs 0.145 raw)' },
      { label: 'Decision Policy', val: 'Cost-Loss Minimized Thresholds (Tau)' },
    ],
    details:
      'Translates deterministic rainfall amounts into actionable, calibrated exceedance probabilities, enabling disaster management authorities to trigger flood and heavy rain advisories with quantified statistical confidence.',
  },
  {
    step: 5,
    title: 'REVIEW',
    subtitle: 'Human-in-the-Loop Audit',
    description: 'Forecaster review and immutable verification against IMD ground truth',
    category: 'Governance Phase',
    badgeText: 'Zero Hallucination',
    metrics: [
      { label: 'Spatial Verification', val: '2D Fractions Skill Score (FSS = 0.84)' },
      { label: 'Evaluation Corpus', val: '14,256 Spatio-Temporal Samples' },
      { label: 'Operational Control', val: 'Forecaster-Approved Decision Support' },
      { label: 'Integrity Guarantee', val: 'Unmonitored Strictly DATA UNAVAILABLE' },
    ],
    details:
      'Empowers operational meteorologists and disaster response teams with complete transparency. AI provides high-precision guidance while authorized human forecasters retain final decision-making authority.',
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigateToForecast,
  onNavigateToVerification,
  districts,
  selectedDistrictId,
  onSelectDistrict,
  activeForecast,
  geoJsonData,
  isDarkMode,
  onLoginClick,
  onQuickDemo,
  isLoggedIn = false,
}) => {
  const { setMode } = useWeather();

  // Active regime selected in the interactive landing switcher
  const [selectedRegime, setSelectedRegime] = useState<SynopticRegime>('COASTAL_OROGRAPHIC');

  // Interactive "How VarshaPurvanumanAI Works" active step (1 to 5)
  const [activeWorkflowStep, setActiveWorkflowStep] = useState<number>(1);

  // Smooth scroll helper for landing page anchors
  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.pushState(null, '', `#${targetId}`);
    }
  };

  // Interactive NWP Bias Correction Sandbox State
  const [simRawNwp, setSimRawNwp] = useState<number>(38.5);
  const [simRegime, setSimRegime] = useState<SynopticRegime>('COASTAL_OROGRAPHIC');

  // Calculate live simulated AI correction based on regime physics
  const calculateSimulatedCorrection = (raw: number, regime: SynopticRegime) => {
    let corrected = raw;
    let reductionPct = 0;

    switch (regime) {
      case 'COASTAL_OROGRAPHIC':
        // Orographic over-prediction correction (~28% reduction)
        corrected = Math.max(0, raw * 0.72 - (raw > 50 ? 6.0 : 0));
        reductionPct = raw > 0 ? ((raw - corrected) / raw) * 100 : 0;
        break;
      case 'ACTIVE_MONSOON':
        // Peak surge dampening (~18% reduction)
        corrected = Math.max(0, raw * 0.82);
        reductionPct = raw > 0 ? ((raw - corrected) / raw) * 100 : 0;
        break;
      case 'BREAK_MONSOON':
        // False positive dampening (~45% reduction for light/moderate)
        corrected = raw < 15 ? Math.max(0, raw * 0.45) : Math.max(0, raw * 0.65);
        reductionPct = raw > 0 ? ((raw - corrected) / raw) * 100 : 0;
        break;
      case 'DEPRESSION':
        // Spatial refocusing (~12% calibration)
        corrected = Math.max(0, raw * 0.88);
        reductionPct = raw > 0 ? ((raw - corrected) / raw) * 100 : 0;
        break;
      case 'WESTERN_DISTURBANCE':
        corrected = Math.max(0, raw * 0.85);
        reductionPct = raw > 0 ? ((raw - corrected) / raw) * 100 : 0;
        break;
      case 'OTHER':
      default:
        corrected = Math.max(0, raw * 0.78);
        reductionPct = raw > 0 ? ((raw - corrected) / raw) * 100 : 0;
        break;
    }

    // Platt Calibrated Exceedance Probabilities (Sigmoid approximation)
    const prob2_5 = 1 / (1 + Math.exp(-(corrected - 2.5) / 4.0));
    const prob7_5 = 1 / (1 + Math.exp(-(corrected - 7.5) / 6.0));
    const prob15_6 = 1 / (1 + Math.exp(-(corrected - 15.6) / 10.0));
    const prob64_5 = 1 / (1 + Math.exp(-(corrected - 64.5) / 18.0));
    const prob115_6 = 1 / (1 + Math.exp(-(corrected - 115.6) / 24.0));

    return {
      corrected: parseFloat(corrected.toFixed(1)),
      reductionPct: parseFloat(reductionPct.toFixed(1)),
      probabilities: [
        { label: '≥ 2.5 mm (Rainy Day)', prob: Math.min(100, Math.round(prob2_5 * 100)) },
        { label: '≥ 7.5 mm (Surge)', prob: Math.min(100, Math.round(prob7_5 * 100)) },
        { label: '≥ 15.6 mm (Moderate)', prob: Math.min(100, Math.round(prob15_6 * 100)) },
        { label: '≥ 64.5 mm (Heavy)', prob: Math.min(100, Math.round(prob64_5 * 100)) },
        { label: '≥ 115.6 mm (Very Heavy)', prob: Math.min(100, Math.round(prob115_6 * 100)) },
      ],
    };
  };

  const simResult = calculateSimulatedCorrection(simRawNwp, simRegime);

  return (
    <div className="space-y-16 relative">
      {/* Mountain Panoramic Background across the Entire Landing Page */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <img
          src="/images/green_mountain_clear.jpg"
          alt="Monsoon Mountains Background"
          className="w-full h-full object-cover object-center scale-105"
        />
        <div
          className={`absolute inset-0 transition-colors duration-300 ${
            isDarkMode
              ? 'bg-slate-950/45 backdrop-blur-[1px]'
              : 'bg-slate-100/40 backdrop-blur-[1px]'
          }`}
        />
      </div>

      {/* 1. Full-Bleed Hero Section with Clear Green Mountain Background */}
      <section
        id="hero"
        className="relative overflow-hidden w-full min-h-[560px] sm:min-h-[640px] lg:min-h-[680px] flex items-center border-b border-slate-800/80 transition-all duration-300 z-10"
      >
        {/* Background Image: Lush Green Mountains under Cool Monsoon Overcast */}
        <img
          src="/images/green_mountain_clear.jpg"
          alt="Lush green mountains under monsoon rain clouds"
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
        />

        {/* Subtle cool atmospheric vignette on the left for maximum text contrast, keeping the mountains 100% visible and vivid */}
        <div
          className="absolute inset-0 pointer-events-none bg-gradient-to-r from-slate-950/85 via-slate-950/40 to-transparent"
        />
        <div
          className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#070e1d] via-transparent to-transparent"
        />

        {/* Hero Content Container */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16 sm:py-24">
          <div className="max-w-2xl space-y-4">
            {/* Eyebrow: MINISTRY OF EARTH SCIENCES with Indian Tricolor Bar */}
            <div>
              <div className="text-xs sm:text-sm font-bold uppercase tracking-widest text-slate-200">
                MINISTRY OF EARTH SCIENCES (MoES) / IMD
              </div>
              <div className="flex h-1.5 w-14 rounded overflow-hidden shadow-sm mt-1.5">
                <div className="w-1/3 bg-[#FF9933]" />
                <div className="w-1/3 bg-white" />
                <div className="w-1/3 bg-[#138808]" />
              </div>
            </div>

            {/* Giant Title */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-none drop-shadow-lg pt-1">
              VarshaPurvanumanAI
            </h1>

            {/* Tagline / Subtitle */}
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight drop-shadow">
              Regime-Aware AI Post-Processing of Monsoon Rainfall Forecasts
            </h2>

            {/* Paragraph */}
            <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed drop-shadow-sm font-normal">
              Smarter meteorological post-processing for safer and more accurate monsoon rainfall prediction.
            </p>

            {/* CTA Buttons side by side matching reference */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <button
                onClick={() => {
                  if (!isLoggedIn && onLoginClick) {
                    onLoginClick();
                  } else {
                    onNavigateToForecast();
                  }
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2.5 rounded-lg text-sm shadow-md shadow-blue-600/30 flex items-center gap-2 transition hover:scale-[1.02] cursor-pointer"
              >
                <span>Enter Platform</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <a
                href="#how-it-works"
                onClick={(e) => handleScrollTo(e, 'how-it-works')}
                className="bg-slate-900/70 hover:bg-slate-900/90 text-white border border-slate-700/80 font-medium px-5 py-2.5 rounded-lg text-sm shadow backdrop-blur-sm flex items-center gap-2 transition cursor-pointer"
              >
                <span>Explore How It Works</span>
                <ArrowDown className="h-4 w-4" />
              </a>
            </div>

            {/* Bottom-left attribution with vertical border matching reference */}
            <div className="border-l-2 border-slate-500/80 pl-3 pt-1 mt-6">
              <div className="text-xs sm:text-sm text-slate-300 font-medium">
                Developed by <span className="text-blue-400 font-semibold">The Steel Bytes 800</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                Smart India Hackathon 2026 • SIH26080
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Sections wrapped in max-w-7xl */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 relative z-10">
        {/* 1. About VarshaPurvanumanAI Section */}
        <section
          id="about"
          className="scroll-mt-24 rounded-3xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 p-6 sm:p-10 shadow-sm space-y-8"
        >
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 tracking-wider">
              <Info className="h-3.5 w-3.5" />
              <span>ABOUT THE PLATFORM • SIH26080</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Next-Generation Precipitation Intelligence
            </h2>
            <div className="h-1 w-14 bg-blue-600 rounded mx-auto" />
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              Developed for the <strong>Ministry of Earth Sciences (MoES)</strong> & <strong>India Meteorological Department (IMD)</strong> under <strong>Smart India Hackathon 2026 (Problem Statement SIH26080)</strong> by <strong>The Steel Bytes 800</strong>.
            </p>
          </div>

          {/* 3 Pillar Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-6 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Physics-Informed Regime ML
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Standard AI models fail across India because monsoon rainfall behaves radically differently during active surges vs break spells. Our architecture first classifies circulation into 6 canonical meteorological regimes before applying specialized conditioning.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-6 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Zero Synthetic Fabrication
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Operational meteorology cannot tolerate AI hallucination. VarshaPurvanumanAI strictly evaluates on 14,256 verified spatio-temporal samples across 4 monsoon seasons (JJAS 2021–2023, June 2024). Unmonitored districts explicitly report DATA UNAVAILABLE.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-6 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <Activity className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Calibrated Early Warnings
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Instead of single-number point forecasts, we compute Platt-calibrated exceedance probabilities across 5 IMD operational thresholds (≥2.5mm to ≥115.5mm), delivering actionable risk scores for flood resilience and disaster response.
              </p>
            </div>
          </div>

          {/* Technical Specification Bar */}
          <div className="rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/60 p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <Code2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Core Meteorological & Machine Learning Stack
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  NOAA GFS 0.25° NWP • IMD AWS Network • PyTorch & Scikit-Learn • FastAPI • React 19 • Leaflet Geospatial
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <a
                href="#how-it-works"
                onClick={(e) => handleScrollTo(e, 'how-it-works')}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                View Pipeline Architecture →
              </a>
            </div>
          </div>
        </section>

        {/* 2. National Monsoon Station Hubs • 10 Priority Indian Cities */}
        <section id="stations" className="scroll-mt-24">
          <NationalCitiesWeatherGrid
            onSelectCity={(districtId) => {
              if (!isLoggedIn && onLoginClick) {
                onLoginClick();
              } else {
                onNavigateToForecast(districtId);
              }
            }}
            isDarkMode={isDarkMode}
          />
        </section>

        {/* 3. Interactive NWP Bias Correction Sandbox */}
        <section id="sandbox" className="rounded-3xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 mb-2">
              <Sliders className="h-3.5 w-3.5 text-indigo-500" />
              <span>Interactive Model Sandbox</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Test Regime-Conditioned Bias Correction Live
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Drag the raw NWP rainfall accumulation slider to observe how our specialized machine learning models rectify over-forecast errors and calculate calibrated risk probabilities in real time.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500">Regime Model:</span>
            <select
              value={simRegime}
              onChange={(e) => {
                const r = e.target.value as SynopticRegime;
                setSimRegime(r);
                setSelectedRegime(r);
                setMode(r);
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 cursor-pointer"
            >
              {REGIME_METAS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Interactive Slider & Gauge */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                  <CloudRain className="h-4 w-4 text-indigo-500" />
                  <span>Raw NOAA GFS Forecast Accumulation:</span>
                </span>
                <span className="text-lg font-mono text-indigo-600 dark:text-indigo-400">
                  {simRawNwp.toFixed(1)} mm
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="120"
                step="0.5"
                value={simRawNwp}
                onChange={(e) => setSimRawNwp(parseFloat(e.target.value))}
                className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />

              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>0 mm (Dry)</span>
                <span>35.5 mm (Moderate)</span>
                <span>64.5 mm (Heavy)</span>
                <span>120 mm (Extreme)</span>
              </div>
            </div>

            {/* Comparison Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Raw GFS NWP
                </span>
                <span className="text-xl font-mono font-bold text-slate-800 dark:text-slate-200">
                  {simRawNwp.toFixed(1)} <span className="text-xs font-normal">mm</span>
                </span>
                <span className="text-[10px] text-rose-500 font-semibold block mt-1">
                  Over-predicted
                </span>
              </div>

              <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 p-4 border border-emerald-300 dark:border-emerald-800 text-center">
                <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block mb-1">
                  AI Corrected
                </span>
                <span className="text-xl font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {simResult.corrected} <span className="text-xs font-normal">mm</span>
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold block mt-1">
                  Truth-Calibrated
                </span>
              </div>

              <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 p-4 border border-indigo-200 dark:border-indigo-800 text-center">
                <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 block mb-1">
                  Bias Reduced
                </span>
                <span className="text-xl font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {simResult.reductionPct}%
                </span>
                <span className="text-[10px] text-indigo-500 font-semibold block mt-1">
                  Systematic Fix
                </span>
              </div>
            </div>

            {/* Visual Differential Bar */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Accumulation Delta Comparison
              </span>
              <div className="h-6 w-full rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                <div
                  style={{ width: `${Math.min(100, Math.max(8, (simResult.corrected / 120) * 100))}%` }}
                  className="bg-emerald-500 h-full flex items-center justify-center text-[10px] font-bold text-white transition-all duration-200 truncate px-1.5"
                >
                  AI Output ({simResult.corrected} mm)
                </div>
                <div
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(8, ((simRawNwp - simResult.corrected) / 120) * 100)
                    )}%`,
                  }}
                  className="bg-rose-400/80 h-full flex items-center justify-center text-[10px] font-bold text-white transition-all duration-200 truncate px-1.5"
                >
                  Bias Cut (-{(simRawNwp - simResult.corrected).toFixed(1)} mm)
                </div>
              </div>
            </div>
          </div>

          {/* Probabilities Output Panel */}
          <div className="lg:col-span-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-6 border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                <Activity className="h-4 w-4 text-emerald-500" />
                <span>Calibrated Risk Exceedance Probabilities</span>
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                Platt Scaled
              </span>
            </div>

            <div className="space-y-3">
              {simResult.probabilities.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-300">{item.label}</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400">
                      {item.prob}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      style={{ width: `${item.prob}%` }}
                      className={`h-full transition-all duration-300 ${
                        item.prob > 60
                          ? 'bg-rose-500'
                          : item.prob > 30
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700">
              *Calibrated using Platt-scaled sigmoid transformation fitted strictly to held-out IMD 0.25° gridded observation ground truth.
            </p>
          </div>
        </div>
      </section>

      {/* 4. End-to-End Scientific Architecture Workflow matching 2nd reference image */}
      <section
        id="how-it-works"
        className="scroll-mt-24 rounded-3xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 p-6 sm:p-10 shadow-sm space-y-8"
      >
        {/* Header with Title and Blue Underline Accent matching Reference Image */}
        <div className="text-center space-y-3">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            How{' '}
            <span className="relative inline-block">
              VarshaPurvanumanAI
              <span className="absolute -bottom-2.5 left-0 right-0 h-1 bg-blue-600 rounded-full mx-auto w-3/4"></span>
            </span>{' '}
            Works
          </h2>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-medium pt-2">
            From raw numerical weather prediction to calibrated operational precipitation intelligence.
          </p>
        </div>

        {/* 5 Process Cards in a Row matching Reference Image */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {WORKFLOW_STEPS.map((step) => {
            const isActive = activeWorkflowStep === step.step;
            return (
              <button
                key={step.step}
                onClick={() => setActiveWorkflowStep(step.step)}
                className={`text-left p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col items-center text-center justify-between min-h-[190px] group ${
                  isActive
                    ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 shadow-md ring-2 ring-blue-500/30 -translate-y-1'
                    : 'bg-white dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80 hover:border-blue-400 hover:shadow-xs'
                }`}
              >
                {/* Circular Step Number */}
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm mb-3 transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                      : 'bg-blue-600/90 text-white group-hover:bg-blue-600'
                  }`}
                >
                  {step.step}
                </div>

                {/* Title in Uppercase Bold */}
                <div className="space-y-1 my-auto">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug line-clamp-3">
                    {step.description}
                  </p>
                </div>

                {/* Active status pill */}
                <div className="mt-3">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 group-hover:text-blue-600'
                    }`}
                  >
                    {step.badgeText}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Interactive Step Live Inspection Stage (Provides a MORE Interactive Way!) */}
        <div className="rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/70 dark:border-slate-700/70 pb-3">
            <div className="flex items-center space-x-3">
              <span className="h-7 w-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                {activeWorkflowStep}
              </span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                  {WORKFLOW_STEPS[activeWorkflowStep - 1].category}
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Phase 0{activeWorkflowStep}: {WORKFLOW_STEPS[activeWorkflowStep - 1].title} —{' '}
                  {WORKFLOW_STEPS[activeWorkflowStep - 1].subtitle}
                </h4>
              </div>
            </div>

            {/* Prev / Next Step Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveWorkflowStep((prev) => (prev > 1 ? prev - 1 : 5))}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer"
              >
                ← Prev Phase
              </button>
              <span className="text-xs font-mono text-slate-400">{activeWorkflowStep} of 5</span>
              <button
                onClick={() => setActiveWorkflowStep((prev) => (prev < 5 ? prev + 1 : 1))}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-xs cursor-pointer"
              >
                Next Phase →
              </button>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {WORKFLOW_STEPS[activeWorkflowStep - 1].details}
          </p>

          {/* Dynamic 4-Metric Grid for Current Active Phase */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {WORKFLOW_STEPS[activeWorkflowStep - 1].metrics.map((m, idx) => (
              <div
                key={idx}
                className="rounded-xl bg-white dark:bg-slate-900/60 p-3 border border-slate-200/80 dark:border-slate-700/80"
              >
                <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">
                  {m.label}
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5 block truncate">
                  {m.val}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Decision Support Architecture Dark Banner matching Reference Image */}
        <div className="rounded-2xl bg-[#091322] text-white p-5 sm:p-6 border border-blue-900/60 shadow-xl flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-xl bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-blue-400 shrink-0 shadow-lg shadow-blue-500/20">
              <ShieldCheck className="h-6 w-6 text-blue-400" />
            </div>
            <div className="space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                DECISION SUPPORT ARCHITECTURE
              </div>
              <h4 className="text-base sm:text-lg font-bold text-white tracking-tight">
                &ldquo;AI recommends. The authorised meteorologist & disaster authority decides.&rdquo;
              </h4>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                VarshaPurvanumanAI ensures full Human-in-the-loop control. No alert or mitigation action is enacted without explicit section & chief meteorologist verification.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center">
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-semibold bg-slate-800/90 border border-slate-700 text-slate-200 shadow-sm">
              <Users className="h-3.5 w-3.5 text-blue-400" />
              <span>Forecaster-Approved Planning</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Team Accreditation Section matching reference image */}
      <section
        id="team"
        className="scroll-mt-24 rounded-3xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 p-8 sm:p-12 shadow-sm space-y-8"
      >
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            <span>HACKATHON PROJECT TEAM</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            The Steel Bytes 800
          </h2>
          <div className="h-1 w-12 bg-blue-600 rounded mx-auto" />
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium">
            Smart India Hackathon 2026 • Problem Statement: SIH26080 • Ministry of Earth Sciences
          </p>
        </div>

        {/* 6 Teammate Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {TEAM_MEMBERS.map((member, idx) => (
            <div
              key={idx}
              className="bg-white/85 dark:bg-slate-800/85 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4 sm:p-5 flex items-center space-x-4 shadow-xs hover:shadow-md hover:border-blue-400/50 transition group"
            >
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold text-base flex items-center justify-center shrink-0 shadow-md shadow-blue-600/30 group-hover:scale-105 transition-transform">
                {member.initials}
              </div>
              <div className="min-w-0">
                <h4 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                  {member.name}
                </h4>
              </div>
            </div>
          ))}
        </div>
      </section>
      </div>

      {/* 7. Bottom Footer matching reference image (RailSamanvayAI style) with solid fill */}
      <footer className="w-full border-t border-slate-800 bg-[#070e1d] text-white mt-16 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-7 space-y-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Left App Branding */}
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30 shrink-0">
                <CloudRain className="h-5 w-5" />
              </div>
              <div>
                <div className="font-extrabold text-base tracking-tight text-white">
                  VarshaPurvanumanAI
                </div>
                <div className="text-[11px] text-slate-400">
                  AI-Powered Regime-Aware Post-Processing of Monsoon Rainfall Forecasts
                </div>
              </div>
            </div>

            {/* Center Team Attribution */}
            <div className="text-center text-xs text-slate-300">
              <div>
                Developed by <span className="text-[#38bdf8] font-semibold">The Steel Bytes 800</span>
              </div>
              <div className="text-[11px] font-mono mt-0.5 text-slate-400">
                Smart India Hackathon 2026 • <span className="text-[#38bdf8] font-semibold">SIH26080</span>
              </div>
            </div>

            {/* Right Navigation Links & Login */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:space-x-6 text-xs sm:text-sm text-slate-300">
              <a
                href="#about"
                onClick={(e) => handleScrollTo(e, 'about')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                About
              </a>
              <a
                href="#stations"
                onClick={(e) => handleScrollTo(e, 'stations')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Stations
              </a>
              <a
                href="#how-it-works"
                onClick={(e) => handleScrollTo(e, 'how-it-works')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                How It Works
              </a>
              <a
                href="#team"
                onClick={(e) => handleScrollTo(e, 'team')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Team
              </a>
              <button
                onClick={() => (onLoginClick ? onLoginClick() : onNavigateToForecast())}
                className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <span>Login</span>
                <span className="text-blue-200">→</span>
              </button>
            </div>
          </div>

          {/* Horizontal Divider Line matching RailSamanvayAI reference */}
          <div className="border-t border-slate-800/80" />

          {/* Bottom Copyright & Hackathon Innovation Platform Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
            <div>© 2026 VarshaPurvanumanAI • Ministry of Earth Sciences, Government of India.</div>
            <div>Smart India Hackathon 2026 Innovation Platform</div>
          </div>
        </div>
      </footer>
    </div>
  );
};

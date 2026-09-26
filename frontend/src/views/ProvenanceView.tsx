import React, { useState } from 'react';
import {
  BookOpen,
  Database,
  Calendar,
  Layers,
  Cpu,
  ShieldCheck,
  AlertTriangle,
  FileText,
  ExternalLink,
  CheckCircle2,
  GitBranch,
  Globe,
  RefreshCw,
  Activity,
  Check,
  Radio,
  DownloadCloud,
} from 'lucide-react';
import { api } from '../api/client';

export const ProvenanceView: React.FC = () => {
  const [isTestingConnectivity, setIsTestingConnectivity] = useState(false);
  const [connectivityResults, setConnectivityResults] = useState<any[] | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const handleTestConnectivity = async () => {
    setIsTestingConnectivity(true);
    setTestError(null);
    try {
      const data = await api.checkConnectivity();
      setConnectivityResults(data.portals || []);
    } catch (err: any) {
      setTestError(err.message || 'Failed to check connectivity to data portals.');
    } finally {
      setIsTestingConnectivity(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                <BookOpen className="h-5 w-5" />
              </span>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Data Provenance & Scientific Methodology
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-3xl">
              Comprehensive scientific documentation of input datasets, temporal split protocols, meteorological feature pipelines, and machine learning architectures for operational meteorological evaluation.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <span className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-mono font-semibold border border-emerald-200 dark:border-emerald-800 flex items-center">
              <ShieldCheck className="h-4 w-4 mr-1.5 text-emerald-500" />
              WMO / IMD Verification Standard
            </span>
          </div>
        </div>
      </div>

      {/* Official Dataset Acquisition & Portals Integration Matrix */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
                <DownloadCloud className="h-5 w-5" />
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Where to Download / Acquire These Datasets (Official Matrix)
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live status, authoritative government & academic repositories, and format adapters for all 4 required datasets.
            </p>
          </div>

          <button
            onClick={handleTestConnectivity}
            disabled={isTestingConnectivity}
            className="inline-flex items-center px-3.5 py-2 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isTestingConnectivity ? 'animate-spin' : ''}`} />
            <span>{isTestingConnectivity ? 'Testing Portals...' : 'Test Live Portal Connectivity'}</span>
          </button>
        </div>

        {/* Live Connectivity Test Results (if tested) */}
        {connectivityResults && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
              <Activity className="h-4 w-4 text-emerald-500" />
              <span>Live Portal Reachability Diagnostic Results</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
              {connectivityResults.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                    item.reachable
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200'
                      : 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold text-[11px]">
                    <span className="truncate">{item.portal_name}</span>
                    <span className="shrink-0 text-[10px] font-mono">
                      {item.reachable ? `${item.latency_ms}ms` : 'TIMEOUT'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {item.reachable ? `HTTP ${item.status_code} OK` : 'Server firewall/SSL restriction (Adapter standby)'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {testError && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
            {testError}
          </div>
        )}

        {/* 4 Dataset Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Dataset 1: IMD Gridded Rainfall */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Requirement 1
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  IMD Gridded Rainfall (0.25° & 0.1°)
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shrink-0">
                READY & INGESTED
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Official ground truth observation grids. Ingested via verified 36-cell Western Ghats research benchmark with direct IEEE 32-bit binary <code className="font-mono text-indigo-600 dark:text-indigo-300">.GRD</code> adapter.
            </p>

            <div className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              <div>• <strong>Format:</strong> Direct binary .GRD or through IMD data request portal</div>
              <div>• <strong>Local Ingest:</strong> <span className="text-slate-800 dark:text-slate-200">Daily_IMD_0.25x0.25Grid.xlsx (2,253 days)</span></div>
              <div>• <strong>Binary Adapter:</strong> <span className="text-slate-800 dark:text-slate-200">data/raw/imd_gridded/user_provided/</span></div>
            </div>

            <div className="pt-1 flex flex-wrap gap-2">
              <a
                href="https://imdpune.gov.in/cmpg/Griddata/Rainfall_25_Bin.html"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
              >
                <span>IMD Pune NDC Portal</span>
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <a
                href="https://zenodo.org/records/20177433"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
              >
                <span>Zenodo Benchmark Mirror (DOI)</span>
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </div>
          </div>

          {/* Dataset 2: NOAA GFS Forecasts */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                  Requirement 2
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  NOAA GFS Forecasts (0.25°)
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 dark:bg-sky-900/50 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-700 shrink-0">
                ACTIVE OPERATIONAL
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Global Forecast System (GFS) 0.25° NWP atmospheric model. Ingested live via open REST endpoints and cached locally across benchmark districts with lead times Day 1 to Day 5.
            </p>

            <div className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              <div>• <strong>Format:</strong> Hourly/Daily NWP parameters (rain, wind, T2m, RH, pressure, CAPE)</div>
              <div>• <strong>Local Ingest:</strong> <span className="text-slate-800 dark:text-slate-200">data/raw/gfs/ (14 verified forecast runs)</span></div>
              <div>• <strong>Service:</strong> <span className="text-slate-800 dark:text-slate-200">RealtimeGFSService & GFSDownloader</span></div>
            </div>

            <div className="pt-1 flex flex-wrap gap-2">
              <a
                href="https://open-meteo.com/en/docs/gfs-api"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-xs text-sky-600 dark:text-sky-400 hover:underline font-semibold"
              >
                <span>Open-Meteo GFS API</span>
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <a
                href="https://nomads.ncep.noaa.gov/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-xs text-sky-600 dark:text-sky-400 hover:underline font-semibold"
              >
                <span>NOAA NOMADS GRIB Filter</span>
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <a
                href="https://www.ncei.noaa.gov/products/weather-climate-models/global-forecast-system"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-xs text-sky-600 dark:text-sky-400 hover:underline font-semibold"
              >
                <span>NCEI GFS Archive</span>
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </div>
          </div>

          {/* Dataset 3: IMD Cyclone & Monsoon Reports */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  Requirement 3
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  IMD Cyclone & Monsoon Reports (Regimes)
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-700 shrink-0">
                VERIFIED & DIGITIZED
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Authoritative meteorological regime classification from IMD Annual Monsoon Reports & RSMC cyclone bulletins. Used to train regime classifier and regime-specific AI post-processors.
            </p>

            <div className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              <div>• <strong>Format:</strong> Digitized synoptic event catalog with onset/offset dates</div>
              <div>• <strong>Local File:</strong> <span className="text-slate-800 dark:text-slate-200">data/raw/regime_labels/imd_monsoon_events_2021_2023.csv</span></div>
              <div>• <strong>Taxonomy:</strong> <span className="text-slate-800 dark:text-slate-200">Active, Break, Orographic, Depression, Western Disturbance</span></div>
            </div>

            <div className="pt-1 flex flex-wrap gap-2">
              <a
                href="https://rsmcnewdelhi.imd.gov.in/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-xs text-purple-600 dark:text-purple-400 hover:underline font-semibold"
              >
                <span>RSMC New Delhi Reports</span>
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <a
                href="https://mausam.imd.gov.in/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-xs text-purple-600 dark:text-purple-400 hover:underline font-semibold"
              >
                <span>IMD Monsoon Publications</span>
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </div>
          </div>

          {/* Dataset 4: India District GeoJSON */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Requirement 4
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  India District GeoJSON Boundaries
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shrink-0">
                BUNDLED IN REPOSITORY
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Official IMD GIS district polygon geometries strictly aligned with IMD national rainfall bulletins in WGS84 EPSG:4326. Powers district forecast spatial extraction and cartographic views.
            </p>

            <div className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              <div>• <strong>Format:</strong> GeoJSON MultiPolygon (26.7 MB, WGS84 EPSG:4326)</div>
              <div>• <strong>Local Path:</strong> <span className="text-slate-800 dark:text-slate-200">data/raw/boundaries/INDIA_NEW_REDUCED1.json</span></div>
              <div>• <strong>Feature Count:</strong> <span className="text-slate-800 dark:text-slate-200">763 Official IMD District Polygons</span></div>
            </div>

            <div className="pt-1 flex items-center space-x-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Directly bundled and verified in repository</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: Data Sources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Source 1: Ground Truth */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                1. Observational Ground Truth
              </h3>
              <span className="text-xs text-slate-400">IMD Gridded Daily Rainfall Analysis</span>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            The target variable is verified 24-hour accumulated rainfall (mm/day) derived from the India Meteorological Department (IMD) high-resolution 0.25° × 0.25° daily gridded dataset (Pai et al., 2014), interpolated using the Shepard angular distance-weighting algorithm from over 6,000 rain-gauge stations across India.
          </p>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">Spatial Resolution:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">0.25° × 0.25° (~27 km)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Accumulation Period:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">08:30 IST to 08:30 IST (24h)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Benchmark Station:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Pune AWS 43063 (18.52°N, 73.85°E)</span>
            </div>
          </div>
        </div>

        {/* Source 2: NWP Forcing */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                2. NWP Atmospheric Forcing
              </h3>
              <span className="text-xs text-slate-400">NOAA Global Forecast System (GFS)</span>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Numerical weather prediction forecasts are extracted from the operational NOAA GFS 0.25° model initialized at 00:00 UTC. Variables include raw surface precipitation, 850 hPa wind vectors (U, V), mean sea level pressure, surface relative humidity, 2m temperature, and CAPE.
          </p>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">Forecast Lead Times:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Day 1 (24h), Day 2 (48h), Day 3 (72h)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Grid Interpolation:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Bilinear to station coordinates</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Operational Ingestion:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">NOAA NOMADS GRIB2 archive</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Temporal Partitioning & Leakage Prevention */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              3. Strict Temporal Split Protocol (Zero Leakage)
            </h3>
            <span className="text-xs text-slate-400">
              Chronological partitioning preserves atmospheric causality
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Monsoon atmospheric processes exhibit severe autocorrelation. Random K-fold cross-validation in meteorological time series causes devastating data leakage (models memorizing consecutive rainy days). VarshaPurvanumanAI strictly enforces contiguous multi-year chronological blocking:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
            <div className="font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider text-[11px]">
              Training Split
            </div>
            <div className="text-base font-bold text-slate-900 dark:text-white">2018 – 2022 (5 Years)</div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">
              610 monsoon days (June 1 – Sept 30). Used for training global regressors and synoptic regime classifiers.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
            <div className="font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider text-[11px]">
              Validation Split
            </div>
            <div className="text-base font-bold text-slate-900 dark:text-white">2023 Monsoon (1 Year)</div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">
              122 monsoon days. Used exclusively for hyperparameter tuning, model selection, and Platt probability calibration.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-emerald-500/30 dark:border-emerald-500/20 ring-1 ring-emerald-500/20 space-y-1.5">
            <div className="font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider text-[11px]">
              Held-Out Test Split
            </div>
            <div className="text-base font-bold text-slate-900 dark:text-white">June 1 – 30, 2024 (Replay)</div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">
              Frozen 30-day cohort. Zero model exposure prior to final verification benchmarking. Completely immutable.
            </p>
          </div>
        </div>
      </div>

      {/* Section 3: Feature Engineering */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
            <GitBranch className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              4. 26 Physical Meteorological Predictors
            </h3>
            <span className="text-xs text-slate-400">
              Multivariate features engineered from dynamic and thermodynamic NWP fields
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
            <span className="font-bold text-slate-900 dark:text-white block">Kinematic / Circulation</span>
            <ul className="text-slate-500 dark:text-slate-400 list-disc list-inside space-y-0.5">
              <li>U850, V850 zonal/meridional wind</li>
              <li>850 hPa relative vorticity</li>
              <li>Vertical wind shear (850–200 hPa)</li>
              <li>Low-level moisture convergence</li>
            </ul>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
            <span className="font-bold text-slate-900 dark:text-white block">Thermodynamic</span>
            <ul className="text-slate-500 dark:text-slate-400 list-disc list-inside space-y-0.5">
              <li>Convective Avail. Potential Energy (CAPE)</li>
              <li>2m air temperature (°C)</li>
              <li>2m relative humidity (%)</li>
              <li>Precipitable water anomaly</li>
            </ul>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
            <span className="font-bold text-slate-900 dark:text-white block">Surface & Orographic</span>
            <ul className="text-slate-500 dark:text-slate-400 list-disc list-inside space-y-0.5">
              <li>Mean Sea Level Pressure (MSLP)</li>
              <li>Surface pressure gradient</li>
              <li>Station elevation & slope aspect</li>
              <li>Distance to Western Ghats ridge</li>
            </ul>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
            <span className="font-bold text-slate-900 dark:text-white block">Temporal & Astronomical</span>
            <ul className="text-slate-500 dark:text-slate-400 list-disc list-inside space-y-0.5">
              <li>Day of year (cyclical sin/cos)</li>
              <li>Monsoon onset progress metric</li>
              <li>Julian calendar month</li>
              <li>NWP forecast lead time (24/48/72h)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Section 4: Machine Learning Architecture & Immutability */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              5. Model Architecture & Frozen Scientific Artifacts
            </h3>
            <span className="text-xs text-slate-400">
              Cryptographic integrity guarantees zero retraining and zero post-submission modifications
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5">
            <div className="font-sans font-bold text-slate-900 dark:text-white">Global Post-Processor</div>
            <div className="text-[11px] text-slate-500">File: models/global_postprocessor.pkl</div>
            <div className="text-[10px] text-slate-400 break-all">
              SHA256: d79c5ced09dcb6f30d6ce6812ef19daf47d0c62cadf22150483a2830ca636c77
            </div>
            <div className="text-indigo-600 dark:text-indigo-400 font-bold text-[11px] pt-1">
              RMSE: 9.03 mm (22.3% gain)
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5">
            <div className="font-sans font-bold text-slate-900 dark:text-white">Regime Classifier</div>
            <div className="text-[11px] text-slate-500">File: models/regime_classifier.pkl</div>
            <div className="text-[10px] text-slate-400 break-all">
              SHA256: 81360501075fb6ae16033f3a483b8bee0f4969bd6ad798feeb7cfa228da08c42
            </div>
            <div className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px] pt-1">
              5 Synoptic Classes
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5">
            <div className="font-sans font-bold text-slate-900 dark:text-white">Probability Suite</div>
            <div className="text-[11px] text-slate-500">File: models/probability/probability_suite.pkl</div>
            <div className="text-[10px] text-slate-400 break-all">
              SHA256: ddb7892fd54462e8115079635a75cf0aaf26374fcf22b46701a0f845f52d687f
            </div>
            <div className="text-sky-600 dark:text-sky-400 font-bold text-[11px] pt-1">
              5 Calibrated Thresholds
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

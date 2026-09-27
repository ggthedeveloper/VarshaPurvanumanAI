import React, { useState, useEffect, useMemo } from 'react';
import {
  Globe2,
  Building2,
  MapPin,
  Grid3X3,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Info,
  Layers,
  ArrowRight,
  Droplets,
  Compass,
  CheckCircle2,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import { api } from '../../api/client';
import {
  DistrictItem,
  IndiaOverviewResponse,
  StateForecastResponse,
  StateSummaryItem,
  DistrictSummaryItem,
  NationalDataStatusMatrix,
} from '../../types/api';

export type HierarchyLevel = 'india' | 'state' | 'district' | 'grid';

interface HierarchicalForecastNavigatorProps {
  districts: DistrictItem[];
  selectedDistrictId: string;
  onSelectDistrict: (districtId: string) => void;
  isDarkMode: boolean;
  onViewGridDetails?: () => void;
}

export const HierarchicalForecastNavigator: React.FC<HierarchicalForecastNavigatorProps> = ({
  districts,
  selectedDistrictId,
  onSelectDistrict,
  isDarkMode,
}) => {
  const [currentLevel, setCurrentLevel] = useState<HierarchyLevel>('district');
  const [selectedState, setSelectedState] = useState<string>('MAHARASHTRA');

  // National data state
  const [indiaOverview, setIndiaOverview] = useState<IndiaOverviewResponse | null>(null);
  const [stateForecast, setStateForecast] = useState<StateForecastResponse | null>(null);
  const [gridData, setGridData] = useState<any | null>(null);
  const [dataMatrix, setDataMatrix] = useState<NationalDataStatusMatrix | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Find active district item
  const currentDistrict = useMemo(
    () => districts.find((d) => d.district_id === selectedDistrictId),
    [districts, selectedDistrictId]
  );

  // Sync selected state when district changes
  useEffect(() => {
    if (currentDistrict?.state) {
      setSelectedState(currentDistrict.state.toUpperCase());
    }
  }, [currentDistrict]);

  // Load India Overview on mount
  useEffect(() => {
    let isMounted = true;
    api
      .getIndiaOverview()
      .then((res) => {
        if (isMounted) setIndiaOverview(res);
      })
      .catch((e) => console.warn('India overview fetch note:', e));

    api
      .getDataStatusMatrix()
      .then((res) => {
        if (isMounted) setDataMatrix(res);
      })
      .catch((e) => console.warn('Data status matrix fetch note:', e));

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch State forecast when selectedState changes
  useEffect(() => {
    if (!selectedState) return;
    let isMounted = true;
    setIsLoading(true);
    api
      .getStateForecast(selectedState)
      .then((res) => {
        if (isMounted) setStateForecast(res);
      })
      .catch((e) => console.warn(`State forecast fetch note for ${selectedState}:`, e))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedState]);

  // Fetch Grid product when entering grid level
  useEffect(() => {
    if (currentLevel !== 'grid') return;
    let isMounted = true;
    api
      .getNationalGrid()
      .then((res) => {
        if (isMounted) setGridData(res);
      })
      .catch((e) => console.warn('Grid product fetch note:', e));

    return () => {
      isMounted = false;
    };
  }, [currentLevel]);

  // All distinct states from district catalog
  const availableStates = useMemo(() => {
    const s = new Set<string>();
    districts.forEach((d) => {
      if (d.state) s.add(d.state.toUpperCase());
    });
    return Array.from(s).sort();
  }, [districts]);

  // Constituent districts for current state
  const stateDistricts = useMemo(() => {
    if (!selectedState) return [];
    return districts.filter((d) => d.state && d.state.toUpperCase() === selectedState);
  }, [districts, selectedState]);

  // Filtered state list for India overview search
  const filteredStates = useMemo(() => {
    if (!indiaOverview?.states) return [];
    if (!searchQuery) return indiaOverview.states;
    const q = searchQuery.toLowerCase();
    return indiaOverview.states.filter((st) => st.state_name.toLowerCase().includes(q));
  }, [indiaOverview, searchQuery]);

  return (
    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5 transition-all">
      {/* 1. Hierarchical Navigation Breadcrumb Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-1 sm:space-x-2 text-xs font-semibold overflow-x-auto py-1">
          {/* Level 1: India */}
          <button
            onClick={() => setCurrentLevel('india')}
            className={`px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition cursor-pointer shrink-0 ${
              currentLevel === 'india'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Globe2 className="h-3.5 w-3.5" />
            <span>1. All India</span>
          </button>

          <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />

          {/* Level 2: State */}
          <button
            onClick={() => setCurrentLevel('state')}
            className={`px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition cursor-pointer shrink-0 ${
              currentLevel === 'state'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span className="truncate max-w-[120px]">{selectedState || 'State'}</span>
          </button>

          <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />

          {/* Level 3: District */}
          <button
            onClick={() => setCurrentLevel('district')}
            className={`px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition cursor-pointer shrink-0 ${
              currentLevel === 'district'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <MapPin className="h-3.5 w-3.5" />
            <span className="truncate max-w-[120px]">{currentDistrict?.name || 'District'}</span>
          </button>

          <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />

          {/* Level 4: Grid */}
          <button
            onClick={() => setCurrentLevel('grid')}
            className={`px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition cursor-pointer shrink-0 ${
              currentLevel === 'grid'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Grid3X3 className="h-3.5 w-3.5" />
            <span>4. 0.25° Grid Cells</span>
          </button>
        </div>

        {/* Status Badge */}
        <div className="flex items-center space-x-2 shrink-0">
          {currentDistrict?.district_id === 'pune' ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
              VALIDATED_FORECAST (AWS 43063)
            </span>
          ) : currentDistrict?.coverage_status === 'PROCESSED_BENCHMARK' || currentDistrict?.coverage_status === 'OPERATIONAL_NWP' ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-300/60">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500 mr-1.5" />
              FORECAST_AVAILABLE_UNVERIFIED
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400 mr-1.5" />
              DATA_UNAVAILABLE (Zero Fabrication)
            </span>
          )}
        </div>
      </div>

      {/* 2. LEVEL 1: ALL-INDIA SYNOPTIC OVERVIEW */}
      {currentLevel === 'india' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Globe2 className="h-5 w-5 text-indigo-500" />
                <span>All-India Synoptic Monsoon Overview</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Monitoring 40 States and Union Territories covering 763 administrative districts.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Search state..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900">
              <div className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase">
                Total States / UTs
              </div>
              <div className="text-2xl font-bold font-mono text-indigo-900 dark:text-indigo-100 mt-0.5">
                {indiaOverview?.total_states || 40}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900">
              <div className="text-[10px] font-bold text-sky-700 dark:text-sky-300 uppercase">
                Supported Districts
              </div>
              <div className="text-2xl font-bold font-mono text-sky-900 dark:text-sky-100 mt-0.5">
                {indiaOverview?.total_districts || 763}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900">
              <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">
                Ground Truth Benchmark
              </div>
              <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-200 mt-1">
                Western Ghats (8 Dist.)
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                Operational NWP
              </div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1">
                NOAA GFS 0.25° Global
              </div>
            </div>
          </div>

          {/* State Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto pr-1">
            {filteredStates.map((st) => (
              <button
                key={st.state_name}
                onClick={() => {
                  setSelectedState(st.state_name.toUpperCase());
                  setCurrentLevel('state');
                }}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  selectedState === st.state_name.toUpperCase()
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-400 shadow-xs'
                    : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {st.state_name}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0"
                      style={{
                        backgroundColor: `${st.warning_category.color}20`,
                        color: st.warning_category.color,
                        border: `1px solid ${st.warning_category.color}40`,
                      }}
                    >
                      {st.warning_category.level.split('_')[0]}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {st.district_count} Districts
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400">
                    {st.dominant_regime ? st.dominant_regime.replace(/_/g, ' ') : 'Unmonitored'}
                  </span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center">
                    Drill down <ChevronRight className="h-3 w-3 ml-0.5" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. LEVEL 2: STATE-LEVEL VIEW */}
      {currentLevel === 'state' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentLevel('india')}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center"
                >
                  ← Back to India
                </button>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  State Overview
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1 flex items-center space-x-2">
                <Building2 className="h-5 w-5 text-indigo-500" />
                <span>{selectedState}</span>
                <span className="text-xs font-normal text-slate-500">
                  ({stateDistricts.length} administrative districts)
                </span>
              </h2>
            </div>

            {/* State Selector Dropdown */}
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {availableStates.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* District Cards within State */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto pr-1">
            {stateDistricts.map((d) => {
              const isSelected = d.district_id === selectedDistrictId;
              const isBenchmark = d.district_id === 'pune';

              return (
                <button
                  key={d.district_id}
                  onClick={() => {
                    onSelectDistrict(d.district_id);
                    setCurrentLevel('district');
                  }}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 shadow-xs'
                      : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {d.name}
                      </span>
                      {isBenchmark && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 shrink-0">
                          BENCHMARK
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                      {d.latitude.toFixed(2)}°N, {d.longitude.toFixed(2)}°E
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400">
                      {d.coverage_status === 'BENCHMARK_ACTIVE'
                        ? 'Ground Truth Active'
                        : d.coverage_status === 'PROCESSED_BENCHMARK'
                        ? 'NWP Operational'
                        : 'Unmonitored'}
                    </span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center">
                      Select <ChevronRight className="h-3 w-3 ml-0.5" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. LEVEL 3: DISTRICT-LEVEL DETAIL */}
      {currentLevel === 'district' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentLevel('state')}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center"
                >
                  ← Back to {selectedState}
                </button>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Granular District Product
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1 flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-indigo-500" />
                <span>{currentDistrict?.name || 'Selected District'}</span>
                <span className="text-xs font-normal text-slate-500">
                  ({currentDistrict?.state || 'India'})
                </span>
              </h2>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentLevel('grid')}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                <Grid3X3 className="h-3.5 w-3.5 text-indigo-500" />
                <span>Inspect Intersecting 0.25° Grid Cells</span>
              </button>
            </div>
          </div>

          {/* Quick Notice on Scientific Data Transparency */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-start space-x-2.5">
            <Info className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 dark:text-white">
                Meteorological Integrity Guarantee:
              </span>{' '}
              All area-weighted polygon aggregations derive from real NOAA GFS NWP 0.25° grids.
              {currentDistrict?.district_id === 'pune'
                ? ' Ground truth observations are strictly cross-verified with IMD Pune NDC AWS 43063.'
                : ' Unverified regions reflect raw operational models with zero fabricated precipitation.'}
            </div>
          </div>
        </div>
      )}

      {/* 5. LEVEL 4: GRID CELL OVERLAY */}
      {currentLevel === 'grid' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentLevel('district')}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center"
                >
                  ← Back to District
                </button>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Pre-Aggregation NWP Grid
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1 flex items-center space-x-2">
                <Grid3X3 className="h-5 w-5 text-indigo-500" />
                <span>0.25° (~27 km) Mesoscale NWP Grid Cells</span>
              </h2>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400">
              Resolution: 0.25° × 0.25° | Domain: Western Ghats / All-India
            </div>
          </div>

          {/* Grid Overview Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-500">Domain Bounds</span>
              <div className="text-xs font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                18.00°N - 19.25°N, 73.00°E - 74.25°E
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-500">Total Grid Nodes</span>
              <div className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                36 Mesoscale Calibration Cells
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-500">Spatial Aggregation</span>
              <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                Area-Weighted Polygon Intersection
              </div>
            </div>
          </div>

          {/* Grid Table Preview */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Grid Lat/Lon</th>
                  <th className="py-2.5 px-3 font-semibold">Intersecting District</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Raw NWP (mm)</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Regime-Aware ML (mm)</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Observed Ground Truth</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Circulation Regime</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-800 dark:text-slate-200">
                {gridData?.cells?.slice(0, 10).map((cell: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-2 px-3 font-mono font-medium">
                      {cell.latitude.toFixed(2)}°N, {cell.longitude.toFixed(2)}°E
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-700 dark:text-slate-300">
                      {cell.district_name || 'Western Ghats'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono">
                      {cell.raw_nwp_rainfall_mm !== null ? `${cell.raw_nwp_rainfall_mm.toFixed(1)} mm` : '—'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {cell.corrected_rainfall_mm !== null ? `${cell.corrected_rainfall_mm.toFixed(1)} mm` : '—'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                      {cell.observed_rainfall_mm !== null ? `${cell.observed_rainfall_mm.toFixed(1)} mm` : '—'}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                        {cell.predicted_regime || 'COASTAL_OROGRAPHIC'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

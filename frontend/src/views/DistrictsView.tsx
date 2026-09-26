import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Compass,
} from 'lucide-react';
import { DistrictItem, AppRoute } from '../types/api';

interface DistrictsViewProps {
  districts: DistrictItem[];
  selectedDistrictId: string;
  onSelectDistrict: (districtId: string) => void;
  onNavigate: (route: AppRoute) => void;
}

export const DistrictsView: React.FC<DistrictsViewProps> = ({
  districts,
  selectedDistrictId,
  onSelectDistrict,
  onNavigate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'BENCHMARK' | 'UNAVAILABLE'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Extract unique states
  const states = useMemo(() => {
    const s = new Set<string>();
    districts.forEach((d) => {
      if (d.state) s.add(d.state);
    });
    return ['ALL', ...Array.from(s).sort()];
  }, [districts]);

  const isCovered = (d: DistrictItem) =>
    d.coverage_status === 'BENCHMARK_ACTIVE' ||
    d.coverage_status === 'PROCESSED_BENCHMARK' ||
    d.coverage_status === 'OPERATIONAL_NWP';

  // Filter districts
  const filteredDistricts = useMemo(() => {
    return districts
      .filter((d) => {
        const matchesSearch =
          d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.district_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (d.state && d.state.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesState = selectedState === 'ALL' || d.state === selectedState;

        const covered = isCovered(d);
        const matchesStatus =
          statusFilter === 'ALL' ||
          (statusFilter === 'BENCHMARK' && covered) ||
          (statusFilter === 'UNAVAILABLE' && !covered);

        return matchesSearch && matchesState && matchesStatus;
      })
      .sort((a, b) => {
        // Active benchmark always at top
        if (a.coverage_status === 'BENCHMARK_ACTIVE') return -1;
        if (b.coverage_status === 'BENCHMARK_ACTIVE') return 1;
        return a.name.localeCompare(b.name);
      });
  }, [districts, searchTerm, selectedState, statusFilter]);

  const totalPages = Math.ceil(filteredDistricts.length / pageSize) || 1;
  const paginatedDistricts = filteredDistricts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSelectAndNavigate = (districtId: string) => {
    onSelectDistrict(districtId);
    onNavigate('forecast');
  };

  const benchmarkCount = districts.filter(isCovered).length;
  const unavailableCount = districts.length - benchmarkCount;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                <MapPin className="h-5 w-5" />
              </span>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Administrative District Registry & Station Explorer
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-3xl">
              Catalog of {districts.length || 81} representative meteorological station locations across Indian states and union territories. Real NWP telemetry and regime-aware AI evaluation active with authentic NOAA GFS data.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <div className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800 flex items-center">
              <ShieldCheck className="h-4 w-4 mr-1.5 text-emerald-500" />
              {benchmarkCount} Active NWP & Benchmarks
            </div>
            {unavailableCount > 0 && (
              <div className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold border border-slate-200 dark:border-slate-700">
                {unavailableCount} Data Feeds Pending
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Explanatory Scientific Policy Notice */}
      <div className="bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl p-4 flex items-start space-x-3 text-xs text-slate-700 dark:text-slate-300">
        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-slate-900 dark:text-white">
            Operational Policy: Zero Synthetic Meteorological Data
          </span>
          <p className="text-slate-600 dark:text-slate-400">
            In accordance with WMO and IMD meteorological verification standards, VarshaPurvanumanAI refuses to synthesize or fabricate rainfall forecasts for districts where live telemetry feeds are not established. Selecting an unmonitored district displays an honest <strong>DATA UNAVAILABLE</strong> notice rather than simulated precipitation.
          </p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search district name, state, or ID..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>

        {/* State Filter & Coverage Status Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-medium">State:</span>
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setCurrentPage(1);
              }}
              className="py-1.5 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {states.map((st) => (
                <option key={st} value={st}>
                  {st === 'ALL' ? 'All States (78 Districts)' : st}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => {
                setStatusFilter('BENCHMARK');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                statusFilter === 'BENCHMARK'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Benchmark
            </button>
            <button
              onClick={() => {
                setStatusFilter('UNAVAILABLE');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                statusFilter === 'UNAVAILABLE'
                  ? 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Pending
            </button>
          </div>
        </div>
      </div>

      {/* District Registry Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Station / District</th>
                <th className="py-3 px-4">State</th>
                <th className="py-3 px-4">Coordinates</th>
                <th className="py-3 px-4">Station ID / Code</th>
                <th className="py-3 px-4">Coverage Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {paginatedDistricts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No districts match your search or filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedDistricts.map((d) => {
                  const isBenchmark = d.coverage_status === 'BENCHMARK_ACTIVE';
                  const isSelected = d.district_id === selectedDistrictId;

                  return (
                    <tr
                      key={d.district_id}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition ${
                        isSelected ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <MapPin
                            className={`h-4 w-4 shrink-0 ${
                              isBenchmark ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
                            }`}
                          />
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {d.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ID: {d.district_id}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                        {d.state || 'India'}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {d.latitude ? `${d.latitude.toFixed(2)}°N, ${d.longitude?.toFixed(2)}°E` : '—'}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                        {isBenchmark
                          ? 'IMD-AWS-43063'
                          : d.coverage_status === 'PROCESSED_BENCHMARK' || d.coverage_status === 'OPERATIONAL_NWP'
                          ? 'NOAA-GFS-0.25'
                          : 'UNMONITORED'}
                      </td>

                      <td className="py-3 px-4">
                        {isBenchmark ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            ● BENCHMARK ACTIVE
                          </span>
                        ) : d.coverage_status === 'PROCESSED_BENCHMARK' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
                            ● PROCESSED BENCHMARK
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            DATA UNAVAILABLE
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleSelectAndNavigate(d.district_id)}
                          className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer inline-flex items-center space-x-1 ${
                            isBenchmark || d.coverage_status === 'PROCESSED_BENCHMARK' || d.coverage_status === 'OPERATIONAL_NWP'
                              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span>{isBenchmark ? 'View Benchmark' : (d.coverage_status === 'PROCESSED_BENCHMARK' || d.coverage_status === 'OPERATIONAL_NWP') ? 'View Forecast' : 'Inspect'}</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div>
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, filteredDistricts.length)} of {filteredDistricts.length} stations
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-mono text-slate-700 dark:text-slate-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

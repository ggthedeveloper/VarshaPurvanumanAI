import React, { useState, useMemo } from 'react';
import { Table, Search, ArrowUpDown, ShieldCheck, AlertCircle, ExternalLink } from 'lucide-react';
import { DistrictItem, CombinedForecastResponse } from '../../types/api';

interface ForecastTableProps {
  districts: DistrictItem[];
  selectedDistrictId: string;
  onSelectDistrict: (districtId: string) => void;
  activeForecast: CombinedForecastResponse | null;
}

export const ForecastTable: React.FC<ForecastTableProps> = ({
  districts,
  selectedDistrictId,
  onSelectDistrict,
  activeForecast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('ALL');
  const [sortField, setSortField] = useState<'name' | 'state'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Extract unique states for filter
  const states = useMemo(() => {
    const s = new Set<string>();
    districts.forEach((d) => s.add(d.state));
    return ['ALL', ...Array.from(s).sort()];
  }, [districts]);

  // Filter & sort
  const filteredDistricts = useMemo(() => {
    return districts
      .filter((d) => {
        const matchesSearch =
          d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.district_id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesState = selectedState === 'ALL' || d.state === selectedState;
        return matchesSearch && matchesState;
      })
      .sort((a, b) => {
        // Benchmark active always tops
        if (a.coverage_status === 'BENCHMARK_ACTIVE' && b.coverage_status !== 'BENCHMARK_ACTIVE') {
          return -1;
        }
        if (b.coverage_status === 'BENCHMARK_ACTIVE' && a.coverage_status !== 'BENCHMARK_ACTIVE') {
          return 1;
        }

        const fieldA = a[sortField].toLowerCase();
        const fieldB = b[sortField].toLowerCase();
        return sortOrder === 'asc' ? fieldA.localeCompare(fieldB) : fieldB.localeCompare(fieldA);
      });
  }, [districts, searchTerm, selectedState, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredDistricts.length / pageSize) || 1;
  const paginatedDistricts = filteredDistricts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const toggleSort = (field: 'name' | 'state') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
      {/* Header & Search Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
            <Table className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              District & Station Forecast Registry
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Verified administrative locations and telemetry status ({districts.length} total entries)
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search district..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* State Filter */}
          <select
            value={selectedState}
            onChange={(e) => {
              setSelectedState(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            {states.map((s) => (
              <option key={s} value={s}>
                {s === 'ALL' ? 'All Regions' : s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th
                onClick={() => toggleSort('name')}
                className="py-3 px-4 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200"
              >
                <div className="flex items-center space-x-1">
                  <span>Location / Station</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('state')}
                className="py-3 px-4 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200"
              >
                <div className="flex items-center space-x-1">
                  <span>State</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-3 px-4">Raw NWP</th>
              <th className="py-3 px-4">AI Corrected</th>
              <th className="py-3 px-4">Predicted Regime</th>
              <th className="py-3 px-4">Coverage Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {paginatedDistricts.map((d) => {
              const isPune = d.coverage_status === 'BENCHMARK_ACTIVE';
              const isSelected = d.district_id === selectedDistrictId;

              return (
                <tr
                  key={d.district_id}
                  onClick={() => onSelectDistrict(d.district_id)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/40'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                    <div className="flex items-center space-x-2">
                      <span>{d.name}</span>
                      {isPune && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                          BENCHMARK
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{d.state}</td>
                  <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                    {isSelected && activeForecast
                      ? `${activeForecast.raw_nwp_rainfall_mm.toFixed(1)} mm`
                      : d.raw_nwp_rainfall_mm !== undefined && d.raw_nwp_rainfall_mm !== null
                      ? `${d.raw_nwp_rainfall_mm.toFixed(1)} mm`
                      : '—'}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {isSelected && activeForecast
                      ? `${activeForecast.corrected_rainfall_mm.toFixed(1)} mm`
                      : d.corrected_rainfall_mm !== undefined && d.corrected_rainfall_mm !== null
                      ? `${d.corrected_rainfall_mm.toFixed(1)} mm`
                      : '—'}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300">
                      {(isSelected && activeForecast
                        ? activeForecast.predicted_regime
                        : d.predicted_regime ?? 'ACTIVE_MONSOON'
                      ).replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {isPune ? (
                      <span className="inline-flex items-center text-emerald-700 dark:text-emerald-300 font-medium text-xs">
                        <ShieldCheck className="h-3.5 w-3.5 mr-1 text-emerald-600 dark:text-emerald-400" />
                        Station Benchmark
                      </span>
                    ) : d.coverage_status === 'PROCESSED_BENCHMARK' || d.coverage_status === 'OPERATIONAL_NWP' || d.coverage_status === 'OPERATIONAL_ACTIVE' ? (
                      <span className="inline-flex items-center text-sky-700 dark:text-sky-300 font-medium text-xs">
                        <ShieldCheck className="h-3.5 w-3.5 mr-1 text-sky-500" />
                        Real GFS NWP
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-slate-400 font-medium text-xs">
                        Data Unavailable
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectDistrict(d.district_id);
                      }}
                      className={`inline-flex items-center px-2 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                      title="Inspect District Details"
                    >
                      <span>{isSelected ? 'Viewing' : 'Inspect'}</span>
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
        <span>
          Showing {(currentPage - 1) * pageSize + 1} to{' '}
          {Math.min(currentPage * pageSize, filteredDistricts.length)} of {filteredDistricts.length} entries
        </span>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Previous
          </button>
          <span className="px-2 font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

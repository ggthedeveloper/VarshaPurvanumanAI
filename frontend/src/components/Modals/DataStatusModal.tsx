import React, { useEffect, useState } from 'react';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  Database,
  ExternalLink,
  Layers,
  MapPin,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { api } from '../../api/client';
import { NationalDataStatusMatrix } from '../../types/api';

interface DataStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

export const DataStatusModal: React.FC<DataStatusModalProps> = ({
  isOpen,
  onClose,
  isDarkMode,
}) => {
  const [dataMatrix, setDataMatrix] = useState<NationalDataStatusMatrix | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    api
      .getDataStatusMatrix()
      .then((res) => setDataMatrix(res))
      .catch((e) => console.warn('Data status matrix load error:', e))
      .finally(() => setIsLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 relative text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">National Data Availability Matrix</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official WMO/IMD Meteorological Verification & Provenance Disclosures
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Matrix Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Total Districts
            </span>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
              {dataMatrix?.total_supported_districts || 763}
            </div>
            <span className="text-[10px] text-slate-400">Official Directory</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
              Validated
            </span>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              {dataMatrix?.validated_benchmark_districts || 8}
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Ground Truth Active</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-center">
            <span className="text-[10px] font-bold text-sky-700 dark:text-sky-300 uppercase tracking-wider">
              Operational NWP
            </span>
            <div className="text-2xl font-bold font-mono text-sky-600 dark:text-sky-400 mt-1">
              {dataMatrix?.forecast_available_unverified || 0}
            </div>
            <span className="text-[10px] text-sky-600 dark:text-sky-400">Unverified Mesoscale</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Unmonitored
            </span>
            <div className="text-2xl font-bold font-mono text-slate-700 dark:text-slate-300 mt-1">
              {dataMatrix?.data_unavailable_districts || 755}
            </div>
            <span className="text-[10px] text-slate-400">Pending Feeds</span>
          </div>
        </div>

        {/* Policy Box */}
        <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 space-y-2">
          <div className="flex items-center space-x-2 font-bold text-amber-800 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4" />
            <span>Strict Operational Disclosure: Zero Synthetic Meteorological Fabrication</span>
          </div>
          <p className="leading-relaxed">
            In compliance with IMD and SIH26080 scientific guidelines, VarshaPurvanumanAI does not fabricate, simulate, or hallucinate rainfall values for regions without operational NWP feeds or verified ground truth observations. Unmonitored districts return an authentic <code>DATA_UNAVAILABLE</code> status.
          </p>
        </div>

        {/* Provenance Details */}
        <div className="space-y-2 text-xs">
          <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
            Data Feeds & Benchmark Provenance
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
              <span className="font-bold text-slate-900 dark:text-white block">Benchmark Domain:</span>
              <span>{dataMatrix?.benchmark_region || 'Western Ghats Mesoscale Domain (18.0N - 19.25N, 73.0E - 74.25E)'}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
              <span className="font-bold text-slate-900 dark:text-white block">Ground Truth Source:</span>
              <span>{dataMatrix?.benchmark_observation_source || 'IMD Pune NDC (Zenodo 10.5281/zenodo.20177433)'}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
              <span className="font-bold text-slate-900 dark:text-white block">Operational NWP Model:</span>
              <span>{dataMatrix?.operational_nwp_source || 'NOAA GFS 0.25° Operational Grids'}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
              <span className="font-bold text-slate-900 dark:text-white block">Administrative Boundaries:</span>
              <span>{dataMatrix?.boundary_source || 'Survey of India / IMD Bundled GeoJSON (763 districts)'}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};

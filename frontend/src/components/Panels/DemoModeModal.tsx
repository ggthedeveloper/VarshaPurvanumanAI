import React, { useState } from 'react';
import { X, Play, Sliders, AlertTriangle, RefreshCw, Cpu } from 'lucide-react';
import { api } from '../../api/client';
import { CombinedForecastResponse } from '../../types/api';

interface DemoModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyDemoForecast: (fcst: CombinedForecastResponse) => void;
}

export const DemoModeModal: React.FC<DemoModeModalProps> = ({
  isOpen,
  onClose,
  onApplyDemoForecast,
}) => {
  const [nwpRainfall, setNwpRainfall] = useState<number>(35.0);
  const [windSpeed, setWindSpeed] = useState<number>(12.5);
  const [uWind, setUWind] = useState<number>(10.0);
  const [vWind, setVWind] = useState<number>(-3.0);
  const [humidity, setHumidity] = useState<number>(92.0);
  const [temperature, setTemperature] = useState<number>(25.0);
  const [cape, setCape] = useState<number>(1800.0);
  const [pressure, setPressure] = useState<number>(975.0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [demoResult, setDemoResult] = useState<CombinedForecastResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSimulate = async () => {
    setIsRunning(true);
    setErrorMessage(null);
    try {
      const response = await api.predictForecast({
        nwp_rainfall: nwpRainfall,
        wind_speed_ms: windSpeed,
        u_wind_10m: uWind,
        v_wind_10m: vWind,
        relative_humidity_2m: humidity,
        temperature_2m: temperature,
        surface_pressure: pressure,
        cape: cape,
        month: 7,
        day_of_year: 200,
        latitude: 18.5204,
        longitude: 73.8567,
      });

      // Mark result as DEMO_DATA explicitly
      const markedDemoResult: CombinedForecastResponse = {
        ...response,
        data_status: 'DEMO_DATA',
        prediction_source: 'interactive_sih_demo_simulation',
      };

      setDemoResult(markedDemoResult);
    } catch (err: any) {
      setErrorMessage(err.message || 'Simulation failed');
    } finally {
      setIsRunning(false);
    }
  };

  const handleApplyToDashboard = () => {
    if (demoResult) {
      onApplyDemoForecast(demoResult);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-amber-400 dark:border-amber-600 w-full max-w-2xl shadow-2xl p-6 space-y-5 relative">
        {/* DEMO WATERMARK BANNER */}
        <div className="bg-amber-100 dark:bg-amber-950 border border-amber-300 dark:border-amber-700 rounded-lg p-2.5 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-center space-x-1.5 font-bold uppercase tracking-wider">
            <AlertTriangle className="h-4 w-4 text-amber-600 animate-pulse" />
            <span>Interactive Scenario Demo Mode (Simulated Inputs)</span>
          </div>
          <span className="font-semibold text-[10px] bg-amber-200 dark:bg-amber-800 px-2 py-0.5 rounded">
            DEMO DATA ONLY
          </span>
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <Sliders className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Interactive Meteorological Scenario Simulator
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Input Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <div className="flex justify-between mb-1">
              <label className="font-medium text-slate-700 dark:text-slate-300">Raw NWP Rainfall (mm)</label>
              <span className="font-mono font-bold text-indigo-600">{nwpRainfall} mm</span>
            </div>
            <input
              type="range"
              min="0"
              max="150"
              step="1"
              value={nwpRainfall}
              onChange={(e) => setNwpRainfall(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <label className="font-medium text-slate-700 dark:text-slate-300">10m Wind Speed (m/s)</label>
              <span className="font-mono font-bold text-indigo-600">{windSpeed} m/s</span>
            </div>
            <input
              type="range"
              min="0"
              max="35"
              step="0.5"
              value={windSpeed}
              onChange={(e) => setWindSpeed(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <label className="font-medium text-slate-700 dark:text-slate-300">Relative Humidity (%)</label>
              <span className="font-mono font-bold text-indigo-600">{humidity}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              step="1"
              value={humidity}
              onChange={(e) => setHumidity(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <label className="font-medium text-slate-700 dark:text-slate-300">Surface CAPE (J/kg)</label>
              <span className="font-mono font-bold text-indigo-600">{cape} J/kg</span>
            </div>
            <input
              type="range"
              min="0"
              max="4000"
              step="50"
              value={cape}
              onChange={(e) => setCape(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <label className="font-medium text-slate-700 dark:text-slate-300">2m Temperature (°C)</label>
              <span className="font-mono font-bold text-indigo-600">{temperature}°C</span>
            </div>
            <input
              type="range"
              min="15"
              max="45"
              step="0.5"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <label className="font-medium text-slate-700 dark:text-slate-300">Surface Pressure (hPa)</label>
              <span className="font-mono font-bold text-indigo-600">{pressure} hPa</span>
            </div>
            <input
              type="range"
              min="900"
              max="1020"
              step="1"
              value={pressure}
              onChange={(e) => setPressure(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Run Simulator Button */}
        <div className="flex items-center space-x-3 pt-2">
          <button
            onClick={handleSimulate}
            disabled={isRunning}
            className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center justify-center space-x-2 shadow-md transition disabled:opacity-50"
          >
            {isRunning ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            <span>Execute AI Model Pipeline</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}

        {/* Simulation Output Card */}
        {demoResult && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
              <span className="flex items-center">
                <Cpu className="h-4 w-4 mr-1 text-indigo-500" />
                Pipeline Response Output
              </span>
              <span className="text-amber-600 dark:text-amber-400 font-mono text-[10px]">
                DEMO_DATA
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block">AI Corrected</span>
                <span className="font-bold text-emerald-600 text-sm">
                  {demoResult.corrected_rainfall_mm.toFixed(1)} mm
                </span>
              </div>
              <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block">Predicted Regime</span>
                <span className="font-bold text-indigo-600 text-sm truncate block">
                  {demoResult.predicted_regime}
                </span>
              </div>
              <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block">P(≥15.6mm)</span>
                <span className="font-bold text-rose-600 text-sm">
                  {((demoResult.heavy_rainfall_probabilities.find((p) => p.threshold_mm === 15.6)?.exceedance_probability || 0) * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            <button
              onClick={handleApplyToDashboard}
              className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs transition"
            >
              Apply Demo Result to Live Dashboard View
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Layers, MapPin, AlertCircle, Info, ShieldCheck } from 'lucide-react';
import { DistrictItem, CombinedForecastResponse } from '../../types/api';

export type MapLayerType =
  | 'corrected'
  | 'raw_nwp'
  | 'difference'
  | 'regime'
  | 'probability';

interface RainfallMapProps {
  districts: DistrictItem[];
  selectedDistrictId: string;
  onSelectDistrict: (districtId: string) => void;
  activeForecast: CombinedForecastResponse | null;
  geoJsonData: any | null;
  isDarkMode: boolean;
}

// Custom DivIcon for Pune Benchmark Station
const createBenchmarkStationIcon = (isSelected: boolean) => {
  return L.divIcon({
    className: 'custom-benchmark-marker',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center;">
        <div style="
          width: 22px;
          height: 22px;
          background: #10b981;
          border: 3px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 0 12px rgba(16, 185, 129, 0.8);
          animation: station-pulse 2s infinite;
        "></div>
        <div style="
          position: absolute;
          top: -24px;
          white-space: nowrap;
          background: #064e3b;
          color: #a7f3d0;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid #10b981;
          pointer-events: none;
        ">
          PUNE BENCHMARK STATION
        </div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

// Custom DivIcon for standard reference districts
const createReferenceDistrictIcon = (isSelected: boolean) => {
  return L.divIcon({
    className: 'custom-ref-marker',
    html: `
      <div style="
        width: 10px;
        height: 10px;
        background: ${isSelected ? '#6366f1' : '#94a3b8'};
        border: 2px solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 1px 3px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  });
};

// Map center controller
const ChangeView: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

export const RainfallMap: React.FC<RainfallMapProps> = ({
  districts,
  selectedDistrictId,
  onSelectDistrict,
  activeForecast,
  geoJsonData,
  isDarkMode,
}) => {
  const [activeLayer, setActiveLayer] = useState<MapLayerType>('corrected');

  // Default view centered on Central/Western India (Pune / Maharashtra)
  const defaultCenter: [number, number] = [18.5204, 73.8567];
  const defaultZoom = 6;

  // Tile layer URL depending on light/dark mode
  const tileUrl = isDarkMode
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  // GeoJSON style handler
  const geoJsonStyle = (feature: any) => {
    const isPuneDistrict =
      feature?.properties?.DISTRICT?.toUpperCase() === 'PUNE' ||
      feature?.properties?.District?.toUpperCase() === 'PUNE';

    return {
      fillColor: isPuneDistrict ? '#6366f1' : '#94a3b8',
      weight: isPuneDistrict ? 2 : 0.8,
      opacity: 0.7,
      color: isPuneDistrict ? '#4338ca' : '#cbd5e1',
      fillOpacity: isPuneDistrict ? 0.15 : 0.05,
    };
  };

  const onEachFeature = (feature: any, layer: L.Layer) => {
    const districtName = feature?.properties?.DISTRICT || feature?.properties?.District || 'District';
    const isPune = districtName.toUpperCase() === 'PUNE';

    layer.bindTooltip(
      `<strong>${districtName}</strong><br/>${
        isPune
          ? 'Contains PUNE BENCHMARK STATION (18.50°N, 73.80°E)<br/><span style="color:#f59e0b">Spatial district aggregate unavailable</span>'
          : '<span style="color:#ef4444">District-level data unavailable</span>'
      }`,
      { sticky: true }
    );

    layer.on({
      click: () => {
        const matched = districts.find(
          (d) => d.name.toUpperCase() === districtName.toUpperCase()
        );
        if (matched) {
          onSelectDistrict(matched.district_id);
        } else if (isPune) {
          onSelectDistrict('pune');
        }
      },
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
      {/* Map Control Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Interactive Forecast & Station Map
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Verified geographic coverage & station-level benchmark visualization
            </p>
          </div>
        </div>

        {/* Layer Switcher Buttons */}
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-medium overflow-x-auto">
          <button
            onClick={() => setActiveLayer('corrected')}
            className={`px-2.5 py-1 rounded transition ${
              activeLayer === 'corrected'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            AI Corrected
          </button>
          <button
            onClick={() => setActiveLayer('raw_nwp')}
            className={`px-2.5 py-1 rounded transition ${
              activeLayer === 'raw_nwp'
                ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            Raw NWP
          </button>
          <button
            onClick={() => setActiveLayer('difference')}
            className={`px-2.5 py-1 rounded transition ${
              activeLayer === 'difference'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            Δ Bias
          </button>
          <button
            onClick={() => setActiveLayer('regime')}
            className={`px-2.5 py-1 rounded transition ${
              activeLayer === 'regime'
                ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            Regime
          </button>
          <button
            onClick={() => setActiveLayer('probability')}
            className={`px-2.5 py-1 rounded transition ${
              activeLayer === 'probability'
                ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            P(≥15.6mm)
          </button>
        </div>
      </div>

      {/* Map Canvas Container */}
      <div className="relative h-[480px] w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <ChangeView center={defaultCenter} zoom={defaultZoom} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url={tileUrl}
          />

          {/* Verified Official GeoJSON Boundaries */}
          {geoJsonData && (
            <GeoJSON
              data={geoJsonData}
              style={geoJsonStyle}
              onEachFeature={onEachFeature}
            />
          )}

          {/* District & Station Centroid Markers */}
          {districts.map((d) => {
            const isPune = d.district_id === 'pune';
            const isSelected = d.district_id === selectedDistrictId;

            return (
              <Marker
                key={d.district_id}
                position={[d.latitude, d.longitude]}
                icon={
                  isPune
                    ? createBenchmarkStationIcon(isSelected)
                    : createReferenceDistrictIcon(isSelected)
                }
                eventHandlers={{
                  click: () => onSelectDistrict(d.district_id),
                }}
              >
                <Popup>
                  <div className="p-1 space-y-1.5 text-xs font-sans">
                    <div className="font-bold text-slate-900 text-sm">
                      {isPune ? 'PUNE BENCHMARK STATION' : d.name}
                    </div>
                    <div className="text-slate-500">
                      Coordinates: {d.latitude.toFixed(2)}°N, {d.longitude.toFixed(2)}°E
                    </div>

                    {isPune && activeForecast ? (
                      <div className="bg-emerald-50 p-2 rounded border border-emerald-200 text-emerald-950 space-y-1">
                        <div className="font-semibold text-[11px] text-emerald-800">
                          Verified Station-Level Benchmark
                        </div>
                        <div>Raw NWP: <strong>{activeForecast.raw_nwp_rainfall_mm.toFixed(1)} mm</strong></div>
                        <div>AI Corrected: <strong>{activeForecast.corrected_rainfall_mm.toFixed(1)} mm</strong></div>
                        <div>Regime: <strong>{activeForecast.predicted_regime}</strong></div>
                        <div className="text-[10px] text-amber-700 font-medium pt-1">
                          *District-level spatial average unavailable.
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-100 p-2 rounded border border-slate-200 text-slate-700">
                        <div className="font-semibold text-rose-600 flex items-center">
                          <AlertCircle className="h-3.5 w-3.5 mr-1" />
                          District-level data unavailable
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">
                          Active telemetry only available for Pune Benchmark Station. No synthetic data generated.
                        </div>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Map Legend Overlay */}
        <div className="absolute bottom-4 right-4 z-1000 bg-white/95 dark:bg-slate-900/95 backdrop-blur rounded-lg border border-slate-200 dark:border-slate-800 p-3 shadow-lg text-xs space-y-2 max-w-xs">
          <div className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px] flex items-center justify-between">
            <span>Verified Rainfall Scale (mm)</span>
            <span className="text-[9px] text-slate-400 font-normal">IMD Standards</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <div className="flex items-center space-x-1.5">
              <span className="h-2.5 w-2.5 rounded bg-sky-300" />
              <span>&lt; 2.5 mm <span className="text-slate-400">(Dry)</span></span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="h-2.5 w-2.5 rounded bg-blue-500" />
              <span>≥ 2.5 mm <span className="text-[10px] text-blue-600 font-semibold">[OP]</span></span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="h-2.5 w-2.5 rounded bg-indigo-500" />
              <span>≥ 7.5 mm <span className="text-[10px] text-purple-600 font-semibold">[EXP]</span></span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="h-2.5 w-2.5 rounded bg-emerald-500" />
              <span>≥ 15.6 mm <span className="text-[10px] text-blue-600 font-semibold">[OP]</span></span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="h-2.5 w-2.5 rounded bg-amber-500" />
              <span>≥ 64.5 mm <span className="text-[10px] text-blue-600 font-semibold">[OP]</span></span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="h-2.5 w-2.5 rounded bg-rose-600" />
              <span>≥ 115.6 mm <span className="text-[10px] text-blue-600 font-semibold">[OP]</span></span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 flex items-center justify-between">
            <span className="flex items-center">
              <span className="h-2 w-2 rounded-full bg-emerald-500 mr-1.5" />
              Active Station Marker
            </span>
            <span className="flex items-center">
              <span className="h-2 w-2 rounded-full bg-slate-400 mr-1.5" />
              Reference District
            </span>
          </div>
        </div>
      </div>

      {/* Scope Clarification Notice */}
      <div className="flex items-start space-x-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
        <Info className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
        <span>
          <strong>Geographic Coverage Scope:</strong> The active operational pipeline currently provides real-time verification and forecast predictions for the <strong>PUNE BENCHMARK STATION (18.50°N, 73.80°E)</strong> as a station-level benchmark. District-level spatial polygon aggregates are marked as <em>District-level data unavailable</em> to maintain scientific accuracy without synthetic extrapolation.
        </span>
      </div>
    </div>
  );
};

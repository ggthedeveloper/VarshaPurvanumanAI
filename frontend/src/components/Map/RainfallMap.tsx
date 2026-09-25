import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Layers,
  MapPin,
  AlertCircle,
  Info,
  Mountain,
  Globe2,
  Map as MapIcon,
  Sparkles,
} from 'lucide-react';
import { DistrictItem, CombinedForecastResponse } from '../../types/api';

export type MapLayerType =
  | 'corrected'
  | 'raw_nwp'
  | 'difference'
  | 'regime'
  | 'probability';

export type BaseMapType = 'terrain' | 'satellite' | 'streets';

interface RainfallMapProps {
  districts: DistrictItem[];
  selectedDistrictId: string;
  onSelectDistrict: (districtId: string) => void;
  activeForecast: CombinedForecastResponse | null;
  geoJsonData: any | null;
  isDarkMode: boolean;
}

// Google Maps API Key from environment configuration (never hardcoded in source)
const GOOGLE_MAPS_KEY = ((import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || '').trim();
const HAS_GOOGLE_MAPS_KEY = Boolean(GOOGLE_MAPS_KEY);

// Custom DivIcon for Pune Benchmark Station
const createBenchmarkStationIcon = (isSelected: boolean) => {
  return L.divIcon({
    className: 'custom-benchmark-marker',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center;">
        <div style="
          width: 24px;
          height: 24px;
          background: #10b981;
          border: 3px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 0 16px rgba(16, 185, 129, 0.9);
          animation: station-pulse 2s infinite;
        "></div>
        <div style="
          position: absolute;
          top: -26px;
          white-space: nowrap;
          background: #064e3b;
          color: #a7f3d0;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 4px;
          border: 1px solid #10b981;
          box-shadow: 0 2px 6px rgba(0,0,0,0.25);
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
        width: ${isSelected ? '14px' : '10px'};
        height: ${isSelected ? '14px' : '10px'};
        background: ${isSelected ? '#6366f1' : '#94a3b8'};
        border: 2px solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 1px 4px rgba(0,0,0,0.35);
        transition: all 0.2s ease;
      "></div>
    `,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
};

// Pre-computed static DivIcons to prevent recreating 675 DOM icons on every re-render (Phase 10 optimization)
const benchmarkIconSelected = createBenchmarkStationIcon(true);
const benchmarkIconUnselected = createBenchmarkStationIcon(false);
const referenceIconSelected = createReferenceDistrictIcon(true);
const referenceIconUnselected = createReferenceDistrictIcon(false);

// Component to dynamically resize and fly map view ONLY on actual district change without shaking/jitter
const MapViewportController: React.FC<{
  targetDistrictId: string;
  center: [number, number];
  zoom: number;
  baseMap: BaseMapType;
}> = ({ targetDistrictId, center, zoom, baseMap }) => {
  const map = useMap();
  const lastFlownDistrictRef = useRef<string | null>(null);
  const isInitialMountRef = useRef<boolean>(true);

  // ResizeObserver for clean map container size invalidation without jitter or timers
  useEffect(() => {
    map.invalidateSize();

    const container = map.getContainer();
    if (!container || typeof ResizeObserver === 'undefined') return;

    let resizeTimer: any = null;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        map.invalidateSize();
      }, 100);
    });

    ro.observe(container);
    return () => {
      clearTimeout(resizeTimer);
      ro.disconnect();
    };
  }, [map]);

  // Smooth camera fly-to ONLY when selected district actually changes
  useEffect(() => {
    const [targetLat, targetLng] = center;

    // On initial mount, set center immediately without animation to prevent bounce/shake
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      lastFlownDistrictRef.current = targetDistrictId;
      map.setView([targetLat, targetLng], zoom, { animate: false });
      return;
    }

    // Only fly if the selected district changed
    if (lastFlownDistrictRef.current !== targetDistrictId) {
      lastFlownDistrictRef.current = targetDistrictId;
      const currentCenter = map.getCenter();
      const dist = Math.hypot(currentCenter.lat - targetLat, currentCenter.lng - targetLng);
      const zoomDiff = Math.abs(map.getZoom() - zoom);

      // Only fly if the camera is not already within precision range
      if (dist > 0.005 || zoomDiff > 0.5) {
        map.flyTo([targetLat, targetLng], zoom, {
          duration: 0.8,
          easeLinearity: 0.25,
          noMoveStart: true,
        });
      }
    }
  }, [targetDistrictId, center, zoom, map]);

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
  // Default to terrain for optimal monsoon orographic visualization
  const [baseMap, setBaseMap] = useState<BaseMapType>('terrain');

  const isValidCoord = (lat: any, lng: any): boolean =>
    typeof lat === 'number' && !isNaN(lat) && lat >= -90 && lat <= 90 &&
    typeof lng === 'number' && !isNaN(lng) && lng >= -180 && lng <= 180;

  // Compute map center based on selected district with memoization
  const selectedDistrict = useMemo(
    () => districts.find((d) => d.district_id === selectedDistrictId),
    [districts, selectedDistrictId]
  );

  const mapCenter: [number, number] = useMemo(() => {
    return selectedDistrict && isValidCoord(selectedDistrict.latitude, selectedDistrict.longitude)
      ? [selectedDistrict.latitude, selectedDistrict.longitude]
      : [18.5204, 73.8567]; // Pune default
  }, [selectedDistrict]);

  const mapZoom = useMemo(() => {
    return selectedDistrict ? (selectedDistrictId === 'pune' ? 8 : 7) : 6;
  }, [selectedDistrict, selectedDistrictId]);

  // Base map tile configuration with safe OpenStreetMap fallback when API key is not supplied
  const getTileConfig = () => {
    if (HAS_GOOGLE_MAPS_KEY) {
      switch (baseMap) {
        case 'terrain':
          return {
            url: `https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}&key=${GOOGLE_MAPS_KEY}`,
            attribution: '&copy; Google Maps (Physical Terrain)',
            maxZoom: 20,
          };
        case 'satellite':
          return {
            url: `https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&key=${GOOGLE_MAPS_KEY}`,
            attribution: '&copy; Google Maps (Satellite Hybrid)',
            maxZoom: 20,
          };
        case 'streets':
        default:
          return {
            url: `https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=${GOOGLE_MAPS_KEY}`,
            attribution: '&copy; Google Maps (Roadmap)',
            maxZoom: 20,
          };
      }
    }

    // Safe OpenStreetMap / CartoDB fallback when VITE_GOOGLE_MAPS_API_KEY is not configured
    switch (baseMap) {
      case 'terrain':
        return {
          url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          maxZoom: 19,
        };
      case 'satellite':
        return {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          attribution: '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
          maxZoom: 18,
        };
      case 'streets':
      default:
        return {
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        };
    }
  };

  const tileConfig = getTileConfig();

  // GeoJSON style handler optimized for Canvas rendering
  const geoJsonStyle = (feature: any) => {
    const isPuneDistrict =
      feature?.properties?.DISTRICT?.toUpperCase() === 'PUNE' ||
      feature?.properties?.District?.toUpperCase() === 'PUNE';

    return {
      fillColor: isPuneDistrict ? '#10b981' : '#64748b',
      weight: isPuneDistrict ? 2.5 : 0.8,
      opacity: isPuneDistrict ? 0.9 : 0.6,
      color: isPuneDistrict ? '#059669' : (baseMap === 'satellite' ? '#ffffff' : '#94a3b8'),
      fillOpacity: isPuneDistrict ? 0.25 : 0.05,
    };
  };

  const onEachFeature = (feature: any, layer: L.Layer) => {
    const districtName =
      feature?.properties?.DISTRICT || feature?.properties?.District || 'District';
    const isPune = districtName.toUpperCase() === 'PUNE';

    layer.bindTooltip(
      `<strong>${districtName}</strong><br/>${
        isPune
          ? '<span style="color:#10b981;font-weight:600">PUNE BENCHMARK STATION (18.50°N, 73.80°E)</span>'
          : '<span style="color:#6366f1">Operational AI Forecast Station</span>'
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

  // Memoize all verified district centroid markers to prevent churning DOM DivIcons during pan/zoom/state transitions
  const districtMarkers = useMemo(() => {
    return districts
      .filter((d) => isValidCoord(d.latitude, d.longitude))
      .map((d) => {
        const isPune = d.district_id === 'pune';
        const isSelected = d.district_id === selectedDistrictId;
        const markerIcon = isPune
          ? (isSelected ? benchmarkIconSelected : benchmarkIconUnselected)
          : (isSelected ? referenceIconSelected : referenceIconUnselected);

        return (
          <Marker
            key={d.district_id}
            position={[d.latitude, d.longitude]}
            icon={markerIcon}
            eventHandlers={{
              click: () => onSelectDistrict(d.district_id),
            }}
          >
            <Popup>
              <div className="p-1 space-y-1.5 text-xs font-sans">
                <div className="font-bold text-slate-900 text-sm">
                  {isPune ? 'PUNE BENCHMARK STATION' : `${d.name}, ${d.state}`}
                </div>
                <div className="text-slate-500">
                  Coordinates: {d.latitude.toFixed(2)}°N, {d.longitude.toFixed(2)}°E
                </div>

                {isPune && activeForecast ? (
                  <div className="bg-emerald-50 p-2 rounded border border-emerald-200 text-emerald-950 space-y-1">
                    <div className="font-semibold text-[11px] text-emerald-800">
                      Verified Station-Level Benchmark (Historical Replay)
                    </div>
                    <div>
                      Raw NWP: <strong>{activeForecast.raw_nwp_rainfall_mm.toFixed(1)} mm</strong>
                    </div>
                    <div>
                      AI Corrected: <strong>{activeForecast.corrected_rainfall_mm.toFixed(1)} mm</strong>
                    </div>
                    <div>
                      Regime: <strong>{activeForecast.predicted_regime}</strong>
                    </div>
                    <div className="text-[10px] text-amber-700 font-medium pt-1">
                      *Station-level benchmark (18.50°N, 73.80°E).
                    </div>
                  </div>
                ) : d.coverage_status === 'OPERATIONAL_ACTIVE' ? (
                  <div className="bg-indigo-50 p-2 rounded border border-indigo-200 text-indigo-950 space-y-1">
                    <div className="font-semibold text-[11px] text-indigo-800">
                      Operational Regime-Aware AI Forecast
                    </div>
                    <div>
                      Raw NWP: <strong>{(isSelected && activeForecast ? activeForecast.raw_nwp_rainfall_mm : d.raw_nwp_rainfall_mm)?.toFixed(1) ?? '—'} mm</strong>
                    </div>
                    <div>
                      AI Corrected: <strong className="text-emerald-700">{(isSelected && activeForecast ? activeForecast.corrected_rainfall_mm : d.corrected_rainfall_mm)?.toFixed(1) ?? '—'} mm</strong>
                    </div>
                    <div>
                      Regime: <strong>{isSelected && activeForecast ? activeForecast.predicted_regime : (d.predicted_regime ?? 'OPERATIONAL')}</strong>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-100 p-2 rounded border border-slate-200 text-slate-700">
                    <div className="font-semibold text-rose-600 flex items-center">
                      <AlertCircle className="h-3.5 w-3.5 mr-1" />
                      Station-level benchmark only
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Click marker to view forecast.
                    </div>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      });
  }, [districts, selectedDistrictId, activeForecast, onSelectDistrict]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
      {/* Map Control Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Interactive Forecast & Station Map
              </h3>
              <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                <Sparkles className="h-3 w-3 mr-1" />
                {HAS_GOOGLE_MAPS_KEY ? 'Google Maps Powered' : 'OpenStreetMap / CartoDB'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Verified geographic coverage & station-level benchmark visualization
            </p>
          </div>
        </div>

        {/* Dual Switchers: Base Map & Forecast Layer */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Base Map Switcher */}
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-medium">
            <span className="text-[10px] text-slate-400 px-1 font-semibold uppercase">Base:</span>
            <button
              onClick={() => setBaseMap('terrain')}
              title="Google Physical Terrain (Orographic Relief)"
              className={`flex items-center space-x-1 px-2 py-1 rounded transition ${
                baseMap === 'terrain'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <Mountain className="h-3 w-3" />
              <span>Terrain</span>
            </button>
            <button
              onClick={() => setBaseMap('satellite')}
              title="Google Satellite Hybrid"
              className={`flex items-center space-x-1 px-2 py-1 rounded transition ${
                baseMap === 'satellite'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <Globe2 className="h-3 w-3" />
              <span>Satellite</span>
            </button>
            <button
              onClick={() => setBaseMap('streets')}
              title="Google Streets"
              className={`flex items-center space-x-1 px-2 py-1 rounded transition ${
                baseMap === 'streets'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <MapIcon className="h-3 w-3" />
              <span>Roads</span>
            </button>
          </div>

          {/* Forecast Layer Switcher */}
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
      </div>

      {/* Fallback Cartography Notice when Google Maps API Key is omitted */}
      {!HAS_GOOGLE_MAPS_KEY && (
        <div className="flex items-center space-x-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-600 dark:text-slate-300">
          <Info className="h-4 w-4 text-slate-500 shrink-0" />
          <span>
            Google Maps API key not configured; rendering verified OpenStreetMap / CartoDB cartography. Set <code className="font-mono text-[11px] bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded">VITE_GOOGLE_MAPS_API_KEY</code> in environment to enable Google Maps tiles.
          </span>
        </div>
      )}

      {/* Map Canvas Container */}
      <div className="relative h-[520px] w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          scrollWheelZoom={true}
          preferCanvas={true}
          style={{ height: '100%', width: '100%' }}
        >
          <MapViewportController
            targetDistrictId={selectedDistrictId}
            center={mapCenter}
            zoom={mapZoom}
            baseMap={baseMap}
          />
          <TileLayer
            key={baseMap}
            attribution={tileConfig.attribution}
            url={tileConfig.url}
            maxZoom={tileConfig.maxZoom}
          />

          {/* Verified Official GeoJSON Boundaries with Canvas acceleration */}
          {geoJsonData && (
            <GeoJSON
              data={geoJsonData}
              style={geoJsonStyle}
              onEachFeature={onEachFeature}
            />
          )}

          {/* District & Station Centroid Markers - Memoized to prevent 675 DivIcon reallocations on render */}
          {districtMarkers}
        </MapContainer>

        {/* Map Legend Overlay */}
        <div className="absolute bottom-4 right-4 z-[1000] bg-white/95 dark:bg-slate-900/95 backdrop-blur rounded-lg border border-slate-200 dark:border-slate-800 p-3 shadow-lg text-xs space-y-2 max-w-xs pointer-events-auto">
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

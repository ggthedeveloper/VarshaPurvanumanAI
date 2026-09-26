import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  CloudRain,
  Sun,
  Waves,
  Zap,
  Snowflake,
  Wind,
  Sparkles,
  MapPin,
  Mountain,
  Building2,
  Droplets,
  Play,
  Pause,
  Maximize2
} from 'lucide-react';
import { SynopticRegime } from '../../types/api';

export interface InteractiveWeatherShowcaseProps {
  selectedRegime: SynopticRegime;
  onSelectRegime: (regime: SynopticRegime) => void;
  isDarkMode: boolean;
}

interface RegimeMeta {
  id: SynopticRegime;
  name: string;
  shortName: string;
  icon: React.ReactNode;
  temp: string;
  rainRate: string;
  windSpeed: string;
  description: string;
}

const REGIME_OPTIONS: RegimeMeta[] = [
  {
    id: 'ACTIVE_MONSOON',
    name: 'Active Monsoon Surge',
    shortName: 'Active',
    icon: <CloudRain className="h-4 w-4" />,
    temp: '24.2°C',
    rainRate: '42.8 mm/h',
    windSpeed: '38 km/h',
    description: 'Heavy continuous rain falling across the lush mountain valleys and peaks',
  },
  {
    id: 'BREAK_MONSOON',
    name: 'Break Monsoon Spell',
    shortName: 'Break Spell',
    icon: <Sun className="h-4 w-4" />,
    temp: '31.5°C',
    rainRate: '0.0 mm/h',
    windSpeed: '12 km/h',
    description: 'Dry spell with golden sunlight breaking through morning mist on the hills',
  },
  {
    id: 'COASTAL_OROGRAPHIC',
    name: 'Coastal & Offshore Trough Active Simulation',
    shortName: 'Coastal / Ghats',
    icon: <Waves className="h-4 w-4" />,
    temp: '23.8°C',
    rainRate: '68.4 mm/h',
    windSpeed: '52 km/h',
    description: 'Intense orographic cloudburst along the Western Ghats escarpment and waterfalls',
  },
  {
    id: 'DEPRESSION',
    name: 'Monsoon Depression Squall Line',
    shortName: 'Depression',
    icon: <Zap className="h-4 w-4" />,
    temp: '22.9°C',
    rainRate: '74.2 mm/h',
    windSpeed: '64 km/h',
    description: 'Torrential cyclonic downpour with thunder, gusting winds, and heavy runoff',
  },
  {
    id: 'WESTERN_DISTURBANCE',
    name: 'Westerly Trough Cold Front',
    shortName: 'Westerly Trough',
    icon: <Snowflake className="h-4 w-4" />,
    temp: '18.6°C',
    rainRate: '16.5 mm/h',
    windSpeed: '34 km/h',
    description: 'Cool crisp showers drifting across the upper ridges and high elevation slopes',
  },
  {
    id: 'OTHER',
    name: 'General Monsoon Circulation',
    shortName: 'General',
    icon: <Wind className="h-4 w-4" />,
    temp: '26.0°C',
    rainRate: '12.0 mm/h',
    windSpeed: '20 km/h',
    description: 'Steady gentle showers and rolling fog drifting over the forest canopy',
  },
];

export const InteractiveWeatherShowcase: React.FC<InteractiveWeatherShowcaseProps> = ({
  selectedRegime,
  onSelectRegime,
  isDarkMode,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Scene Selection: default to hills/mountain picture
  const [selectedScene, setSelectedScene] = useState<'hills' | 'city'>('hills');
  const [isRaining, setIsRaining] = useState(true);
  const [interactiveNotice, setInteractiveNotice] = useState<string | null>(null);

  const activeMeta = REGIME_OPTIONS.find((r) => r.id === selectedRegime) || REGIME_OPTIONS[0];

  // Particle and Ripple State Refs
  const stateRef = useRef({
    drops: [] as Array<{ x: number; y: number; speed: number; len: number; opacity: number; width: number }>,
    mistBanks: [] as Array<{ x: number; y: number; width: number; height: number; speed: number; opacity: number }>,
    ripples: [] as Array<{ x: number; y: number; radius: number; maxRadius: number; opacity: number }>,
    lightning: { active: false, opacity: 0, x: 0 },
  });

  // Trigger interactive lightning flash or rain ripple on click
  const triggerLightningPulse = useCallback((clickX?: number, clickY?: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const x = clickX ?? canvas.width * (0.2 + Math.random() * 0.6);
    const y = clickY ?? canvas.height * (0.3 + Math.random() * 0.5);

    // Ripple
    stateRef.current.ripples.push({
      x,
      y,
      radius: 5,
      maxRadius: 85,
      opacity: 0.9,
    });

    if (selectedRegime !== 'BREAK_MONSOON') {
      stateRef.current.lightning = {
        active: true,
        opacity: 0.85,
        x,
      };
      setInteractiveNotice('⚡ Monsoon Thunder & Rain Pulse Triggered');
    } else {
      setInteractiveNotice('☀️ Warm Sunbeams Shimmering on the Hills');
    }

    const timer = setTimeout(() => setInteractiveNotice(null), 2000);
    return () => clearTimeout(timer);
  }, [selectedRegime]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    triggerLightningPulse(x, y);
  };

  // Canvas Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof canvas.getContext !== 'function') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 450);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    // Initialize raindrops
    const dropDensity = selectedRegime === 'BREAK_MONSOON' ? 0 : selectedRegime === 'DEPRESSION' ? 220 : 140;
    stateRef.current.drops = Array.from({ length: dropDensity }, () => ({
      x: Math.random() * (width + 100) - 50,
      y: Math.random() * height,
      speed: 12 + Math.random() * 14,
      len: 16 + Math.random() * 22,
      opacity: 0.4 + Math.random() * 0.5,
      width: 1 + Math.random() * 1.5,
    }));

    // Initialize mist banks rolling across hills
    stateRef.current.mistBanks = Array.from({ length: 4 }, (_, i) => ({
      x: (width / 4) * i,
      y: height * (0.35 + (i % 3) * 0.18),
      width: width * 0.55,
      height: height * 0.25,
      speed: 0.25 + Math.random() * 0.35,
      opacity: selectedRegime === 'BREAK_MONSOON' ? 0.08 : 0.22,
    }));

    let isSubscribed = true;

    const render = () => {
      if (!isSubscribed) return;

      ctx.clearRect(0, 0, width, height);

      // 1. Break Monsoon Sunbeam Overlay
      if (selectedRegime === 'BREAK_MONSOON') {
        const sunGrad = ctx.createRadialGradient(width * 0.65, height * 0.2, 20, width * 0.65, height * 0.2, width * 0.7);
        sunGrad.addColorStop(0, 'rgba(251, 191, 36, 0.35)');
        sunGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.15)');
        sunGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = sunGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // 2. Rolling Mountain Mist Layer
      stateRef.current.mistBanks.forEach((mist) => {
        mist.x += mist.speed;
        if (mist.x > width + 100) {
          mist.x = -mist.width;
        }

        const mistGrad = ctx.createRadialGradient(
          mist.x + mist.width / 2,
          mist.y + mist.height / 2,
          10,
          mist.x + mist.width / 2,
          mist.y + mist.height / 2,
          mist.width / 2
        );
        mistGrad.addColorStop(0, `rgba(255, 255, 255, ${mist.opacity})`);
        mistGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = mistGrad;
        ctx.fillRect(mist.x, mist.y, mist.width, mist.height);
      });

      // 3. Falling Raindrops
      if (isRaining && selectedRegime !== 'BREAK_MONSOON') {
        ctx.save();
        ctx.strokeStyle = isDarkMode ? 'rgba(224, 242, 254, 0.7)' : 'rgba(255, 255, 255, 0.65)';

        stateRef.current.drops.forEach((d) => {
          d.y += d.speed;
          d.x += selectedRegime === 'WESTERN_DISTURBANCE' ? 3.5 : 2.0; // natural slanting rain with wind

          if (d.y > height) {
            d.y = -20;
            d.x = Math.random() * (width + 100) - 50;

            // Occasional splash ripple on the mountain ground
            if (Math.random() > 0.94) {
              stateRef.current.ripples.push({
                x: d.x,
                y: height * (0.65 + Math.random() * 0.3),
                radius: 2,
                maxRadius: 18,
                opacity: 0.6,
              });
            }
          }

          ctx.lineWidth = d.width;
          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x + 2, d.y + d.len);
          ctx.stroke();
        });

        ctx.restore();
      }

      // 4. Water Splash Ripples
      stateRef.current.ripples.forEach((r, idx) => {
        r.radius += 1.8;
        r.opacity -= 0.03;

        ctx.save();
        ctx.strokeStyle = `rgba(255, 255, 255, ${Math.max(0, r.opacity)})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, r.radius * 1.5, r.radius * 0.6, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        if (r.opacity <= 0) {
          stateRef.current.ripples.splice(idx, 1);
        }
      });

      // 5. Lightning Flash Illumination
      if (stateRef.current.lightning.active) {
        stateRef.current.lightning.opacity -= 0.05;

        ctx.save();
        ctx.fillStyle = `rgba(255, 255, 255, ${stateRef.current.lightning.opacity * 0.45})`;
        ctx.fillRect(0, 0, width, height);

        // Lightning bolt arc in cloud
        ctx.strokeStyle = '#e0e7ff';
        ctx.shadowColor = '#818cf8';
        ctx.shadowBlur = 16;
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = stateRef.current.lightning.opacity;

        ctx.beginPath();
        let lx = stateRef.current.lightning.x;
        let ly = 0;
        ctx.moveTo(lx, ly);
        while (ly < height * 0.65) {
          lx += (Math.random() - 0.5) * 45;
          ly += 20 + Math.random() * 30;
          ctx.lineTo(lx, ly);
        }
        ctx.stroke();
        ctx.restore();

        if (stateRef.current.lightning.opacity <= 0) {
          stateRef.current.lightning.active = false;
        }
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isSubscribed = false;
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [selectedRegime, isDarkMode, isRaining]);

  const activeImageSrc = selectedScene === 'hills'
    ? '/images/monsoon_hills_rain.jpg'
    : '/images/monsoon_city_rain.jpg';

  return (
    <div className="space-y-4 pt-2">
      {/* 1. Header with Title & Interaction Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <span
          className={`font-bold uppercase tracking-wider flex items-center space-x-1.5 ${
            isDarkMode ? 'text-indigo-300' : 'text-indigo-800'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-pulse" />
          <span>Interactive Weather Simulation • Click to Test Regimes</span>
        </span>
        <span className={`text-[11px] font-medium flex items-center space-x-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
          <Droplets className="h-3.5 w-3.5 text-sky-400 animate-bounce" />
          <span>Click anywhere on the hills to trigger lightning & rain ripples</span>
        </span>
      </div>

      {/* 2. Interactive Regime Selector Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {REGIME_OPTIONS.map((r) => {
          const isSelected = selectedRegime === r.id;
          return (
            <button
              key={r.id}
              onClick={() => onSelectRegime(r.id)}
              className={`flex items-center space-x-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/30 scale-102 font-bold'
                  : isDarkMode
                  ? 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-700/80 hover:border-slate-600'
                  : 'bg-white/90 hover:bg-slate-100 text-slate-700 border-slate-200/90 hover:border-indigo-300 shadow-xs'
              }`}
            >
              <span className={isSelected ? 'text-white' : 'text-indigo-500 dark:text-indigo-400'}>{r.icon}</span>
              <span className="truncate">{r.shortName}</span>
            </button>
          );
        })}
      </div>

      {/* 3. The Beautiful Weather Picture & Rain Animation Showcase */}
      <div
        ref={containerRef}
        onClick={handleCanvasClick}
        className={`group relative overflow-hidden rounded-3xl border shadow-2xl transition-all duration-300 cursor-pointer ${
          isDarkMode ? 'border-slate-800 shadow-indigo-950/30' : 'border-slate-300 shadow-xl shadow-slate-300/50'
        }`}
        style={{ minHeight: '380px', maxHeight: '520px' }}
      >
        {/* The High-Resolution Monsoon Photograph */}
        <img
          src={activeImageSrc}
          alt={selectedScene === 'hills' ? 'Monsoon rain falling on Western Ghats hills' : 'Monsoon rain falling on Mumbai city skyline'}
          className="w-full h-full object-cover object-center transform transition-transform duration-700 group-hover:scale-102"
          style={{ minHeight: '380px' }}
          loading="eager"
        />

        {/* Ambient Darkened Gradient for Text Contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/50 pointer-events-none" />

        {/* The Live Animated Rain, Mist, and Lightning Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />

        {/* Floating Top HUD: Scene Location & Regime Title */}
        <div className="absolute top-4 left-4 right-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pointer-events-none z-20">
          {/* Location Badge */}
          <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-950/80 border border-white/20 text-white backdrop-blur-md shadow-xl pointer-events-auto">
            <MapPin className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs font-bold tracking-wide">
              {selectedScene === 'hills' ? 'Western Ghats • Maharashtra Valley' : 'Mumbai Coastal Skyline • Marine Drive'}
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping ml-1" />
          </div>

          {/* Active Regime Telemetry HUD Card */}
          <div className="flex items-center space-x-3 px-4 py-2 rounded-2xl bg-slate-950/85 border border-white/20 text-white backdrop-blur-md shadow-2xl pointer-events-auto">
            <div>
              <div className="text-xs font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-indigo-200 to-emerald-300">
                {activeMeta.name}
              </div>
              <div className="text-[10px] text-slate-300 max-w-xs truncate">
                {activeMeta.description}
              </div>
            </div>

            <div className="hidden sm:flex items-center space-x-2.5 pl-3 border-l border-white/20 font-mono text-[11px]">
              <span className="text-amber-300 font-bold">{activeMeta.temp}</span>
              <span className="text-sky-300 font-bold">{activeMeta.rainRate}</span>
              <span className="text-emerald-300">{activeMeta.windSpeed}</span>
            </div>
          </div>
        </div>

        {/* Interactive Notice Toast */}
        {interactiveNotice && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-indigo-600/90 border border-indigo-400 text-white text-xs font-bold shadow-2xl backdrop-blur-md animate-bounce z-30 pointer-events-none">
            {interactiveNotice}
          </div>
        )}

        {/* Floating Bottom Toolbar: Scene Toggle & Rain Animation Controls */}
        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none z-20">
          {/* Quick Scene Switcher (Hills vs City) */}
          <div className="pointer-events-auto flex items-center p-1 rounded-2xl bg-slate-950/85 border border-white/20 backdrop-blur-md shadow-lg">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedScene('hills');
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedScene === 'hills'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Mountain className="h-3.5 w-3.5" />
              <span>Hills & Mountains</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedScene('city');
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedScene === 'city'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>City Skyline</span>
            </button>
          </div>

          {/* Rain Animation and Trigger Controls */}
          <div className="pointer-events-auto flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                triggerLightningPulse();
              }}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/40 border border-indigo-400/40 transition transform active:scale-95 cursor-pointer backdrop-blur-md"
            >
              <Zap className="h-3.5 w-3.5 text-amber-300 fill-amber-300" />
              <span>Trigger Pulse</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsRaining(!isRaining);
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-950/85 hover:bg-slate-900 border border-white/20 text-slate-200 hover:text-white transition cursor-pointer backdrop-blur-md"
              title={isRaining ? 'Pause rain animation' : 'Resume rain animation'}
            >
              {isRaining ? (
                <>
                  <Pause className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Pause Rain</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Play Rain</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

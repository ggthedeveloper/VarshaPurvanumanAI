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
  Compass,
  Radio,
  Eye,
  Layers,
  Activity,
  Flame,
  Droplets,
  RotateCcw,
  CheckCircle2,
  Info
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
  windDir: string;
  cape: string;
  humidity: string;
  description: string;
  badgeColor: string;
}

const REGIME_OPTIONS: RegimeMeta[] = [
  {
    id: 'ACTIVE_MONSOON',
    name: 'Active Monsoon Surge',
    shortName: 'Active',
    icon: <CloudRain className="h-4 w-4" />,
    temp: '26.4°C',
    rainRate: '38.5 mm/h',
    windSpeed: '42 km/h',
    windDir: 'WSW',
    cape: '2,840 J/kg',
    humidity: '94%',
    description: 'Low-level monsoon trough south of normal • Heavy widespread convective squall bands',
    badgeColor: 'sky',
  },
  {
    id: 'BREAK_MONSOON',
    name: 'Break Monsoon Spell',
    shortName: 'Break Spell',
    icon: <Sun className="h-4 w-4" />,
    temp: '33.8°C',
    rainRate: '0.0 mm/h',
    windSpeed: '14 km/h',
    windDir: 'NW',
    cape: '820 J/kg',
    humidity: '48%',
    description: 'Monsoon trough shifted to Himalayan foothills • Central India dry spell & thermal ridge',
    badgeColor: 'amber',
  },
  {
    id: 'COASTAL_OROGRAPHIC',
    name: 'Coastal & Offshore Trough Active Simulation',
    shortName: 'Coastal / Ghats',
    icon: <Waves className="h-4 w-4" />,
    temp: '25.1°C',
    rainRate: '56.2 mm/h',
    windSpeed: '48 km/h',
    windDir: 'WSW',
    cape: '2,450 J/kg',
    humidity: '98%',
    description: 'Strong onshore Arabian Sea low-level jet • Intense orographic uplift on Western Ghats',
    badgeColor: 'teal',
  },
  {
    id: 'DEPRESSION',
    name: 'Monsoon Depression Squall Line',
    shortName: 'Depression',
    icon: <Zap className="h-4 w-4" />,
    temp: '24.8°C',
    rainRate: '64.0 mm/h',
    windSpeed: '58 km/h',
    windDir: 'SE',
    cape: '3,200 J/kg',
    humidity: '96%',
    description: 'Deep cyclonic vortex organized from Bay of Bengal • Torrential spirals and squall lines',
    badgeColor: 'purple',
  },
  {
    id: 'WESTERN_DISTURBANCE',
    name: 'Westerly Trough Cold Front',
    shortName: 'Westerly Trough',
    icon: <Snowflake className="h-4 w-4" />,
    temp: '19.4°C',
    rainRate: '18.2 mm/h',
    windSpeed: '36 km/h',
    windDir: 'WNW',
    cape: '1,450 J/kg',
    humidity: '72%',
    description: 'Upper-tropospheric jet streak & mid-latitude trough • Hail risk and frontal rain',
    badgeColor: 'cyan',
  },
  {
    id: 'OTHER',
    name: 'General Monsoon Circulation',
    shortName: 'General',
    icon: <Wind className="h-4 w-4" />,
    temp: '28.2°C',
    rainRate: '8.4 mm/h',
    windSpeed: '22 km/h',
    windDir: 'SW',
    cape: '1,680 J/kg',
    humidity: '82%',
    description: 'Climatological baseline circulation • Scattered isolated convective showers',
    badgeColor: 'emerald',
  },
];

interface StationPin {
  id: string;
  name: string;
  type: string;
  xPct: number; // percentage width
  yPct: number; // percentage height
  rain: string;
  temp: string;
  wind: string;
}

const STATION_HOTSPOTS: StationPin[] = [
  { id: 'mumbai', name: 'Mumbai Doppler (Santacruz)', type: 'Coastal Radar', xPct: 22, yPct: 48, rain: '34.2 mm/h', temp: '26.8°C', wind: '42 km/h WSW' },
  { id: 'mahabaleshwar', name: 'Mahabaleshwar (Ghats)', type: 'Orographic AWS', xPct: 40, yPct: 70, rain: '72.4 mm/h', temp: '21.0°C', wind: '54 km/h W' },
  { id: 'pune', name: 'Pune AWS (Pashan)', type: 'Rain Shadow AWS', xPct: 52, yPct: 54, rain: '14.8 mm/h', temp: '27.4°C', wind: '26 km/h WSW' },
  { id: 'nagpur', name: 'Nagpur Radar (IMD)', type: 'Central Doppler', xPct: 78, yPct: 36, rain: '28.6 mm/h', temp: '28.9°C', wind: '32 km/h SE' },
];

export const InteractiveWeatherShowcase: React.FC<InteractiveWeatherShowcaseProps> = ({
  selectedRegime,
  onSelectRegime,
  isDarkMode,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Layer Toggles
  const [layers, setLayers] = useState({
    radar: true,
    clouds: true,
    wind: true,
    lightning: true,
  });

  // Interactive State
  const [activeStation, setActiveStation] = useState<StationPin | null>(null);
  const [interactiveNotice, setInteractiveNotice] = useState<string | null>(null);
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number; lat: string; lon: string; dbz: number } | null>(null);

  const activeMeta = REGIME_OPTIONS.find((r) => r.id === selectedRegime) || REGIME_OPTIONS[0];

  // Particle and Ripple State Refs for 60fps Canvas Animation
  const stateRef = useRef({
    sweepAngle: 0,
    drops: [] as Array<{ x: number; y: number; speed: number; len: number; opacity: number }>,
    windParticles: [] as Array<{ x: number; y: number; speed: number; len: number; angle: number; opacity: number }>,
    ripples: [] as Array<{ x: number; y: number; radius: number; maxRadius: number; opacity: number; color: string }>,
    lightningBolts: [] as Array<{
      segments: Array<{ x1: number; y1: number; x2: number; y2: number }>;
      opacity: number;
    }>,
    solarRays: 0,
  });

  // Trigger interactive lightning flash or pulse
  const triggerConvectivePulse = useCallback((clickX?: number, clickY?: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const targetX = clickX ?? canvas.width * (0.3 + Math.random() * 0.4);
    const targetY = clickY ?? canvas.height * (0.3 + Math.random() * 0.5);

    // Add shockwave ripple
    stateRef.current.ripples.push({
      x: targetX,
      y: targetY,
      radius: 4,
      maxRadius: selectedRegime === 'BREAK_MONSOON' ? 90 : 130,
      opacity: 1.0,
      color: selectedRegime === 'BREAK_MONSOON' ? '#f59e0b' : selectedRegime === 'WESTERN_DISTURBANCE' ? '#38bdf8' : '#6366f1',
    });

    if (selectedRegime !== 'BREAK_MONSOON') {
      // Generate realistic branching lightning bolt
      const segments: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
      const startX = targetX + (Math.random() - 0.5) * 80;
      const startY = 0;

      const createBranch = (x1: number, y1: number, x2: number, y2: number, depth: number) => {
        if (depth > 4) {
          segments.push({ x1, y1, x2, y2 });
          return;
        }
        const midX = (x1 + x2) / 2 + (Math.random() - 0.5) * (60 / (depth + 1));
        const midY = (y1 + y2) / 2 + (Math.random() - 0.2) * (30 / (depth + 1));
        createBranch(x1, y1, midX, midY, depth + 1);
        createBranch(midX, midY, x2, y2, depth + 1);

        // Branching fork
        if (Math.random() > 0.6 && depth < 3) {
          const forkX = midX + (Math.random() - 0.5) * 50;
          const forkY = midY + Math.random() * 40;
          createBranch(midX, midY, forkX, forkY, depth + 2);
        }
      };

      createBranch(startX, startY, targetX, targetY, 0);
      stateRef.current.lightningBolts.push({ segments, opacity: 1.0 });

      setInteractiveNotice('⚡ Convective Lightning Discharged');
    } else {
      setInteractiveNotice('☀️ Solar Thermal Pulse Generated');
    }

    const timer = setTimeout(() => setInteractiveNotice(null), 2200);
    return () => clearTimeout(timer);
  }, [selectedRegime]);

  // Handle canvas click / touch
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    triggerConvectivePulse(x, y);
  };

  // Handle canvas mouse move for interactive targeting reticle
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const latVal = (15.5 + (1 - y / canvas.height) * 8.5).toFixed(2);
    const lonVal = (71.0 + (x / canvas.width) * 9.5).toFixed(2);
    const distCenter = Math.hypot(x - canvas.width * 0.45, y - canvas.height * 0.5);
    const dbz = selectedRegime === 'BREAK_MONSOON'
      ? Math.max(5, Math.round(18 - distCenter * 0.05))
      : Math.min(65, Math.max(15, Math.round(58 - distCenter * 0.08 + Math.sin(x * 0.05) * 8)));

    setHoverCoord({
      x,
      y,
      lat: `${latVal}°N`,
      lon: `${lonVal}°E`,
      dbz,
    });
  };

  const handleCanvasMouseLeave = () => {
    setHoverCoord(null);
  };

  // Main Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof canvas.getContext !== 'function') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = Math.min(420, Math.max(300, width * 0.42)));

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = Math.min(420, Math.max(300, width * 0.42));
    };

    window.addEventListener('resize', handleResize);

    // Initialize particles
    const dropCount = selectedRegime === 'BREAK_MONSOON' ? 0 : selectedRegime === 'DEPRESSION' ? 140 : 90;
    stateRef.current.drops = Array.from({ length: dropCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      speed: 7 + Math.random() * 9,
      len: 12 + Math.random() * 16,
      opacity: 0.35 + Math.random() * 0.45,
    }));

    stateRef.current.windParticles = Array.from({ length: 60 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      speed: 2 + Math.random() * 4,
      len: 20 + Math.random() * 30,
      angle: selectedRegime === 'WESTERN_DISTURBANCE' ? 0.35 : selectedRegime === 'DEPRESSION' ? 0.8 : -0.25,
      opacity: 0.2 + Math.random() * 0.3,
    }));

    let isSubscribed = true;

    const render = () => {
      if (!isSubscribed) return;

      // 1. Clear & Background Sky
      ctx.clearRect(0, 0, width, height);

      // Gradient background according to regime and theme
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      if (selectedRegime === 'BREAK_MONSOON') {
        if (isDarkMode) {
          bgGrad.addColorStop(0, '#1c1917');
          bgGrad.addColorStop(0.5, '#292524');
          bgGrad.addColorStop(1, '#0c0a09');
        } else {
          bgGrad.addColorStop(0, '#e0f2fe');
          bgGrad.addColorStop(0.4, '#fef3c7');
          bgGrad.addColorStop(1, '#ffedd5');
        }
      } else if (selectedRegime === 'WESTERN_DISTURBANCE') {
        if (isDarkMode) {
          bgGrad.addColorStop(0, '#082f49');
          bgGrad.addColorStop(0.6, '#0f172a');
          bgGrad.addColorStop(1, '#020617');
        } else {
          bgGrad.addColorStop(0, '#bae6fd');
          bgGrad.addColorStop(0.7, '#e0f2fe');
          bgGrad.addColorStop(1, '#f1f5f9');
        }
      } else if (selectedRegime === 'DEPRESSION') {
        if (isDarkMode) {
          bgGrad.addColorStop(0, '#2e1065');
          bgGrad.addColorStop(0.5, '#1e1b4b');
          bgGrad.addColorStop(1, '#09090b');
        } else {
          bgGrad.addColorStop(0, '#e9d5ff');
          bgGrad.addColorStop(0.6, '#cbd5e1');
          bgGrad.addColorStop(1, '#94a3b8');
        }
      } else {
        // Active Monsoon / Coastal / General
        if (isDarkMode) {
          bgGrad.addColorStop(0, '#0c192c');
          bgGrad.addColorStop(0.5, '#0f172a');
          bgGrad.addColorStop(1, '#020617');
        } else {
          bgGrad.addColorStop(0, '#bae6fd');
          bgGrad.addColorStop(0.5, '#e2e8f0');
          bgGrad.addColorStop(1, '#cbd5e1');
        }
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      const radarCenterX = width * 0.44;
      const radarCenterY = height * 0.52;
      const maxRadius = Math.min(width, height) * 0.46;

      // 2. Break Monsoon Solar Coronal Rays
      if (selectedRegime === 'BREAK_MONSOON') {
        stateRef.current.solarRays += 0.005;
        const sunX = width * 0.72;
        const sunY = height * 0.32;
        const sunGrad = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 140);
        sunGrad.addColorStop(0, 'rgba(251, 191, 36, 0.85)');
        sunGrad.addColorStop(0.3, 'rgba(245, 158, 11, 0.4)');
        sunGrad.addColorStop(0.7, 'rgba(217, 119, 6, 0.15)');
        sunGrad.addColorStop(1, 'rgba(217, 119, 6, 0)');

        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 140, 0, Math.PI * 2);
        ctx.fill();

        // Sun disc
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(sunX, sunY, 26, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Cloud Albedo Layer
      if (layers.clouds) {
        ctx.save();
        const cloudCount = selectedRegime === 'BREAK_MONSOON' ? 3 : 6;
        for (let i = 0; i < cloudCount; i++) {
          const cx = (width * 0.15 * i + stateRef.current.sweepAngle * 18) % (width + 200) - 100;
          const cy = height * 0.15 + (i % 3) * (height * 0.22);
          const r = 50 + (i % 2) * 35;
          const cloudGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, r);
          cloudGrad.addColorStop(0, isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.45)');
          cloudGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = cloudGrad;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 4. Doppler Radar Rings & Echo Clusters
      if (layers.radar) {
        ctx.save();

        // Range rings
        ctx.strokeStyle = isDarkMode ? 'rgba(99, 102, 241, 0.22)' : 'rgba(79, 70, 229, 0.18)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);

        [0.25, 0.5, 0.75, 1.0].forEach((fraction) => {
          const r = maxRadius * fraction;
          ctx.beginPath();
          ctx.arc(radarCenterX, radarCenterY, r, 0, Math.PI * 2);
          ctx.stroke();

          // Distance label
          ctx.setLineDash([]);
          ctx.font = '10px monospace';
          ctx.fillStyle = isDarkMode ? 'rgba(148, 163, 184, 0.6)' : 'rgba(71, 85, 105, 0.7)';
          ctx.fillText(`${Math.round(fraction * 200)}km`, radarCenterX + 6, radarCenterY - r + 12);
          ctx.setLineDash([4, 4]);
        });

        // Crosshairs
        ctx.beginPath();
        ctx.moveTo(radarCenterX - maxRadius, radarCenterY);
        ctx.lineTo(radarCenterX + maxRadius, radarCenterY);
        ctx.moveTo(radarCenterX, radarCenterY - maxRadius);
        ctx.lineTo(radarCenterX, radarCenterY + maxRadius);
        ctx.stroke();
        ctx.setLineDash([]);

        // Radar Sweep Beam
        stateRef.current.sweepAngle += 0.022;
        const sweepAngle = stateRef.current.sweepAngle;

        const sweepGrad = ctx.createRadialGradient(
          radarCenterX,
          radarCenterY,
          10,
          radarCenterX,
          radarCenterY,
          maxRadius
        );
        sweepGrad.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
        sweepGrad.addColorStop(1, 'rgba(16, 185, 129, 0.05)');

        ctx.fillStyle = sweepGrad;
        ctx.beginPath();
        ctx.moveTo(radarCenterX, radarCenterY);
        ctx.arc(radarCenterX, radarCenterY, maxRadius, sweepAngle - 0.45, sweepAngle, false);
        ctx.closePath();
        ctx.fill();

        // Sweep leading line
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(radarCenterX, radarCenterY);
        ctx.lineTo(
          radarCenterX + Math.cos(sweepAngle) * maxRadius,
          radarCenterY + Math.sin(sweepAngle) * maxRadius
        );
        ctx.stroke();

        // Synthetic Precipitation Reflectivity Blobs (dBZ returns)
        if (selectedRegime !== 'BREAK_MONSOON') {
          const blobConfigs = [
            { ox: -40, oy: -30, r: 45, dbz: 'red' },
            { ox: 30, oy: 20, r: 60, dbz: 'orange' },
            { ox: -10, oy: 60, r: 40, dbz: 'yellow' },
            { ox: 80, oy: -40, r: 50, dbz: 'green' },
          ];

          blobConfigs.forEach((b) => {
            const bx = radarCenterX + b.ox + Math.sin(sweepAngle * 0.5) * 10;
            const by = radarCenterY + b.oy + Math.cos(sweepAngle * 0.5) * 8;
            const bGrad = ctx.createRadialGradient(bx, by, 5, bx, by, b.r);

            if (b.dbz === 'red') {
              bGrad.addColorStop(0, 'rgba(239, 68, 68, 0.65)');
              bGrad.addColorStop(0.5, 'rgba(249, 115, 22, 0.4)');
              bGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
            } else if (b.dbz === 'orange') {
              bGrad.addColorStop(0, 'rgba(249, 115, 22, 0.55)');
              bGrad.addColorStop(0.6, 'rgba(234, 179, 8, 0.3)');
              bGrad.addColorStop(1, 'rgba(249, 115, 22, 0)');
            } else if (b.dbz === 'yellow') {
              bGrad.addColorStop(0, 'rgba(234, 179, 8, 0.5)');
              bGrad.addColorStop(0.7, 'rgba(34, 197, 94, 0.25)');
              bGrad.addColorStop(1, 'rgba(234, 179, 8, 0)');
            } else {
              bGrad.addColorStop(0, 'rgba(34, 197, 94, 0.45)');
              bGrad.addColorStop(1, 'rgba(34, 197, 94, 0)');
            }

            ctx.fillStyle = bGrad;
            ctx.beginPath();
            ctx.arc(bx, by, b.r, 0, Math.PI * 2);
            ctx.fill();
          });
        }

        ctx.restore();
      }

      // 5. Wind Vector Streamlines
      if (layers.wind) {
        ctx.save();
        ctx.strokeStyle = isDarkMode ? 'rgba(56, 189, 248, 0.4)' : 'rgba(2, 132, 199, 0.45)';
        ctx.lineWidth = 1.2;

        stateRef.current.windParticles.forEach((wp) => {
          wp.x += Math.cos(wp.angle) * wp.speed;
          wp.y += Math.sin(wp.angle) * wp.speed;

          if (wp.x > width + 40) wp.x = -20;
          if (wp.x < -40) wp.x = width + 20;
          if (wp.y > height + 40) wp.y = -20;
          if (wp.y < -40) wp.y = height + 20;

          ctx.beginPath();
          ctx.moveTo(wp.x, wp.y);
          ctx.lineTo(
            wp.x - Math.cos(wp.angle) * wp.len,
            wp.y - Math.sin(wp.angle) * wp.len
          );
          ctx.stroke();

          // Small arrowhead or particle dot
          ctx.fillStyle = isDarkMode ? '#38bdf8' : '#0284c7';
          ctx.beginPath();
          ctx.arc(wp.x, wp.y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        });

        ctx.restore();
      }

      // 6. Raindrop Streaks
      if (selectedRegime !== 'BREAK_MONSOON') {
        ctx.save();
        ctx.strokeStyle = isDarkMode ? 'rgba(147, 197, 253, 0.65)' : 'rgba(59, 130, 246, 0.55)';
        ctx.lineWidth = 1.4;

        stateRef.current.drops.forEach((d) => {
          d.y += d.speed;
          d.x += selectedRegime === 'WESTERN_DISTURBANCE' ? 2 : 1;

          if (d.y > height) {
            d.y = -10;
            d.x = Math.random() * width;
          }

          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x + 1.5, d.y + d.len);
          ctx.stroke();
        });

        ctx.restore();
      }

      // 7. Interactive Ripples & Shockwaves
      stateRef.current.ripples.forEach((r, idx) => {
        r.radius += 2.8;
        r.opacity -= 0.022;

        ctx.save();
        ctx.strokeStyle = r.color;
        ctx.globalAlpha = Math.max(0, r.opacity);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        if (r.opacity <= 0) {
          stateRef.current.ripples.splice(idx, 1);
        }
      });

      // 8. Lightning Bolts
      if (layers.lightning) {
        stateRef.current.lightningBolts.forEach((bolt, idx) => {
          bolt.opacity -= 0.045;

          ctx.save();
          // Ambient flash
          ctx.fillStyle = `rgba(255, 255, 255, ${bolt.opacity * 0.35})`;
          ctx.fillRect(0, 0, width, height);

          // Bolt glow
          ctx.strokeStyle = '#c7d2fe';
          ctx.shadowColor = '#818cf8';
          ctx.shadowBlur = 12;
          ctx.lineWidth = 2.5;
          ctx.globalAlpha = Math.max(0, bolt.opacity);

          ctx.beginPath();
          bolt.segments.forEach((seg) => {
            ctx.moveTo(seg.x1, seg.y1);
            ctx.lineTo(seg.x2, seg.y2);
          });
          ctx.stroke();
          ctx.restore();

          if (bolt.opacity <= 0) {
            stateRef.current.lightningBolts.splice(idx, 1);
          }
        });
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
  }, [selectedRegime, isDarkMode, layers]);

  return (
    <div className="space-y-4 pt-2">
      {/* 1. Header with Title & Interaction Tip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <span
          className={`font-bold uppercase tracking-wider flex items-center space-x-1.5 ${
            isDarkMode ? 'text-indigo-300' : 'text-indigo-800'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-pulse" />
          <span>Interactive Weather Simulation • Click to Test Regimes</span>
        </span>
        <span className={`text-[11px] font-medium flex items-center space-x-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
          <Radio className="h-3 w-3 text-emerald-500 animate-ping" />
          <span>Click on radar to generate lightning pulse • Move cursor to inspect dBZ</span>
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

      {/* 3. The Interactive Weather Picture Showcase (Visual Meteorological Canvas) */}
      <div
        ref={containerRef}
        className={`relative overflow-hidden rounded-2xl border shadow-2xl transition-all ${
          isDarkMode
            ? 'bg-slate-950/90 border-slate-800 shadow-indigo-950/20'
            : 'bg-slate-900 border-slate-300 shadow-slate-300/40'
        }`}
        style={{ minHeight: '340px' }}
      >
        {/* Canvas Display */}
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={handleCanvasMouseLeave}
          className="w-full h-full block cursor-crosshair select-none"
        />

        {/* Station Hotspot Pins Overlay */}
        {STATION_HOTSPOTS.map((station) => {
          const isHotspotActive = activeStation?.id === station.id;
          return (
            <div
              key={station.id}
              style={{ left: `${station.xPct}%`, top: `${station.yPct}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveStation(isHotspotActive ? null : station);
                }}
                className={`relative group flex items-center justify-center p-1.5 rounded-full border transition transform hover:scale-125 cursor-pointer ${
                  isHotspotActive
                    ? 'bg-indigo-600 border-white text-white shadow-lg shadow-indigo-500/50'
                    : 'bg-slate-900/80 hover:bg-indigo-600 border-slate-400/60 text-slate-200 hover:text-white backdrop-blur-md'
                }`}
                title={station.name}
              >
                <MapPin className="h-3.5 w-3.5" />
                <span className="absolute -inset-1 rounded-full border border-indigo-400/40 animate-ping pointer-events-none" />
              </button>

              {/* Station Telemetry Popover */}
              {isHotspotActive && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 bottom-8 w-52 p-3 rounded-xl bg-slate-900/95 border border-indigo-500/50 text-white shadow-2xl backdrop-blur-xl z-30 animate-in fade-in zoom-in-95 duration-150"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold text-indigo-300 border-b border-white/10 pb-1 mb-2">
                    <span className="truncate">{station.name}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-200 font-mono">
                      {station.type}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                    <div className="bg-white/5 rounded p-1">
                      <span className="text-slate-400 block">Rainfall</span>
                      <span className="font-mono font-bold text-emerald-300">{station.rain}</span>
                    </div>
                    <div className="bg-white/5 rounded p-1">
                      <span className="text-slate-400 block">Temperature</span>
                      <span className="font-mono font-bold text-amber-300">{station.temp}</span>
                    </div>
                    <div className="col-span-2 bg-white/5 rounded p-1">
                      <span className="text-slate-400 block">Wind Telemetry</span>
                      <span className="font-mono text-sky-300">{station.wind}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Floating Top HUD: Live Radar Beacon & Regime Info */}
        <div className="absolute top-3 left-3 right-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pointer-events-none z-10">
          {/* Live Beacon Pill */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900/85 border border-white/15 text-white backdrop-blur-md shadow-lg pointer-events-auto">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[11px] font-bold tracking-wide">INSAT-3DR & DOPPLER RADAR</span>
            <span className="text-[10px] text-slate-400 font-mono hidden md:inline">| 250km COMPOSITE</span>
          </div>

          {/* Active Regime Telemetry HUD Card */}
          <div className="flex items-center space-x-3 px-3.5 py-2 rounded-xl bg-slate-900/90 border border-white/15 text-white backdrop-blur-md shadow-xl pointer-events-auto">
            <div className="text-left">
              <div className="text-xs font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-300 to-emerald-400">
                {activeMeta.name}
              </div>
              <div className="text-[10px] text-slate-300 line-clamp-1 max-w-xs">
                {activeMeta.description}
              </div>
            </div>

            <div className="hidden sm:flex items-center space-x-2 pl-2 border-l border-white/15 font-mono text-[11px]">
              <div className="flex items-center space-x-1 text-amber-300">
                <span>{activeMeta.temp}</span>
              </div>
              <div className="flex items-center space-x-1 text-sky-300">
                <span>{activeMeta.rainRate}</span>
              </div>
              <div className="flex items-center space-x-1 text-emerald-300">
                <span>{activeMeta.windSpeed}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Cursor Telemetry Tooltip */}
        {hoverCoord && (
          <div
            style={{
              left: Math.min(hoverCoord.x + 16, (canvasRef.current?.width || 800) - 180),
              top: Math.max(hoverCoord.y - 45, 12),
            }}
            className="absolute pointer-events-none z-20 px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-indigo-400/40 text-white backdrop-blur-md shadow-xl text-[10px] font-mono space-y-0.5"
          >
            <div className="text-indigo-300 font-bold">{hoverCoord.lat}, {hoverCoord.lon}</div>
            <div className="flex items-center justify-between space-x-3 text-slate-300">
              <span>Echo: <strong className="text-emerald-400">{hoverCoord.dbz} dBZ</strong></span>
              <span>Layer: <strong className="text-sky-300">{activeMeta.shortName}</strong></span>
            </div>
          </div>
        )}

        {/* Interactive Notice Toast */}
        {interactiveNotice && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-indigo-600/90 border border-indigo-400 text-white text-xs font-bold shadow-2xl backdrop-blur-md animate-bounce z-30 pointer-events-none">
            {interactiveNotice}
          </div>
        )}

        {/* Bottom Floating Toolbar: Layer Toggles & Lightning Trigger */}
        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none z-10">
          {/* Quick Trigger Button */}
          <button
            onClick={() => triggerConvectivePulse()}
            className="pointer-events-auto inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/40 border border-indigo-400/40 transition transform active:scale-95 cursor-pointer backdrop-blur-md"
          >
            <Zap className="h-3.5 w-3.5 text-amber-300 fill-amber-300" />
            <span>Trigger Convective Strike</span>
          </button>

          {/* Layer Toggles */}
          <div className="pointer-events-auto flex items-center space-x-1.5 p-1 rounded-xl bg-slate-900/85 border border-white/15 backdrop-blur-md">
            <button
              onClick={() => setLayers((prev) => ({ ...prev, radar: !prev.radar }))}
              className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
                layers.radar ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Doppler dBZ
            </button>
            <button
              onClick={() => setLayers((prev) => ({ ...prev, wind: !prev.wind }))}
              className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
                layers.wind ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Wind Vectors
            </button>
            <button
              onClick={() => setLayers((prev) => ({ ...prev, clouds: !prev.clouds }))}
              className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
                layers.clouds ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Cloud Albedo
            </button>
            <button
              onClick={() => setLayers((prev) => ({ ...prev, lightning: !prev.lightning }))}
              className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
                layers.lightning ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Lightning
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

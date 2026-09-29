import React, { useState, useEffect, useRef } from 'react';
import { Play, Cpu, RotateCw, Zap } from 'lucide-react';

interface DashboardMissionBannerProps {
  currentRegime?: string | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

interface LightningBolt {
  segments: { x1: number; y1: number; x2: number; y2: number; width: number }[];
  subBranches: { x1: number; y1: number; x2: number; y2: number; width: number }[];
  originX: number;
  originY: number;
  createdAt: number;
  durationMs: number;
}

interface RainDrop {
  x: number;
  y: number;
  length: number;
  speed: number;
  windDrift: number;
  opacity: number;
  width: number;
}

interface StormMistPuff {
  x: number;
  y: number;
  radius: number;
  speed: number;
  opacity: number;
  pulsePhase: number;
}

export const DashboardMissionBanner: React.FC<DashboardMissionBannerProps> = ({
  currentRegime = 'ACTIVE_MONSOON',
  onRefresh,
  isRefreshing = false,
}) => {
  const [justTriggered, setJustTriggered] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const triggerStrikeRef = useRef<((x?: number) => void) | null>(null);

  const handleActionClick = () => {
    setJustTriggered(true);
    // Trigger immediate dramatic lightning strike on manual calibration click
    if (triggerStrikeRef.current) {
      triggerStrikeRef.current();
    }
    if (onRefresh) {
      onRefresh();
    }
    setTimeout(() => {
      setJustTriggered(false);
    }, 2000);
  };

  // Realistic Procedural Thunderstorm Animation (Lightning strikes, cloud flashes, falling monsoon rain)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof canvas.getContext !== 'function') return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;
    let width = (canvas.width = canvas.offsetWidth || 800);
    let height = (canvas.height = canvas.offsetHeight || 210);

    const updateSize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        width = canvas.width = Math.round(rect.width);
        height = canvas.height = Math.round(rect.height);
      }
    };

    updateSize();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => updateSize());
      resizeObserver.observe(canvas);
    }
    window.addEventListener('resize', updateSize);

    // Active lightning state
    const activeBolts: LightningBolt[] = [];
    let flashAlpha = 0;
    let lastFlashX = width * 0.6;
    let lastFlashY = 15;

    // Helper to generate fractal lightning bolt
    const createBolt = (customX?: number): LightningBolt => {
      const startX = customX !== undefined ? customX : width * (0.35 + Math.random() * 0.48);
      const startY = Math.random() * (height * 0.12);

      const segments: { x1: number; y1: number; x2: number; y2: number; width: number }[] = [];
      const subBranches: { x1: number; y1: number; x2: number; y2: number; width: number }[] = [];

      let currentX = startX;
      let currentY = startY;
      const targetY = height * (0.72 + Math.random() * 0.28);
      const stepCount = 14 + Math.floor(Math.random() * 8);
      const dy = (targetY - startY) / stepCount;

      for (let i = 0; i < stepCount; i++) {
        const nextY = currentY + dy;
        const nextX = currentX + (Math.random() - 0.48) * (width > 600 ? 34 : 22);
        const branchWidth = Math.max(1.1, 3.4 * (1 - i / stepCount));

        segments.push({
          x1: currentX,
          y1: currentY,
          x2: nextX,
          y2: nextY,
          width: branchWidth,
        });

        // Spawn fork branches
        if (Math.random() < 0.45 && i > 2 && i < stepCount - 2) {
          let subX = currentX;
          let subY = currentY;
          const subSteps = 3 + Math.floor(Math.random() * 5);
          const forkAngle = (Math.random() > 0.5 ? 1 : -1) * (0.5 + Math.random() * 0.5);

          for (let j = 0; j < subSteps; j++) {
            const subNextY = subY + dy * 0.55;
            const subNextX = subX + Math.sin(forkAngle) * 16 + (Math.random() - 0.5) * 14;
            subBranches.push({
              x1: subX,
              y1: subY,
              x2: subNextX,
              y2: subNextY,
              width: Math.max(0.6, branchWidth * 0.5),
            });
            subX = subNextX;
            subY = subNextY;
          }
        }

        currentX = nextX;
        currentY = nextY;
      }

      return {
        segments,
        subBranches,
        originX: startX,
        originY: startY,
        createdAt: performance.now(),
        durationMs: 220 + Math.random() * 120,
      };
    };

    const triggerStrike = (targetX?: number) => {
      const bolt = createBolt(targetX);
      activeBolts.push(bolt);
      lastFlashX = bolt.originX;
      lastFlashY = bolt.originY;
      flashAlpha = 0.58;
    };

    triggerStrikeRef.current = triggerStrike;

    // Rain particles
    const rainDrops: RainDrop[] = [];
    const rainCount = 42;
    for (let i = 0; i < rainCount; i++) {
      rainDrops.push({
        x: Math.random() * (width + 200) - 100,
        y: Math.random() * height,
        length: 12 + Math.random() * 18,
        speed: 340 + Math.random() * 260,
        windDrift: 1.4 + Math.random() * 1.6,
        opacity: 0.18 + Math.random() * 0.35,
        width: Math.random() > 0.6 ? 1.4 : 0.9,
      });
    }

    // Mist puffs
    const mistPuffs: StormMistPuff[] = [
      { x: width * 0.2, y: height * 0.8, radius: 120, speed: 7, opacity: 0.07, pulsePhase: 0 },
      { x: width * 0.65, y: height * 0.75, radius: 150, speed: 10, opacity: 0.06, pulsePhase: 2.1 },
      { x: width * 0.85, y: height * 0.4, radius: 100, speed: 6, opacity: 0.05, pulsePhase: 4.2 },
    ];

    let lastTime = performance.now();
    let lastStrikeTime = performance.now();
    let nextStrikeInterval = 3200 + Math.random() * 3000;

    let isVisible = !document.hidden;
    const handleVisibility = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const render = (now: number) => {
      animFrameId = requestAnimationFrame(render);
      if (!isVisible) return;

      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Scheduled natural thunderstorm lightning strike
      if (now - lastStrikeTime > nextStrikeInterval) {
        lastStrikeTime = now;
        nextStrikeInterval = 3500 + Math.random() * 3200;

        if (Math.random() < 0.8) {
          triggerStrike();
        } else {
          lastFlashX = width * (0.4 + Math.random() * 0.4);
          lastFlashY = Math.random() * (height * 0.2);
          flashAlpha = 0.42;
        }
      }

      ctx.clearRect(0, 0, width, height);

      // 1. Drifting storm mist
      mistPuffs.forEach((puff) => {
        puff.x += puff.speed * dt;
        puff.pulsePhase += dt * 0.8;
        if (puff.x - puff.radius > width) {
          puff.x = -puff.radius;
        }

        const currentRadius = puff.radius * (1 + Math.sin(puff.pulsePhase) * 0.08);
        const grad = ctx.createRadialGradient(puff.x, puff.y, 0, puff.x, puff.y, currentRadius);
        grad.addColorStop(0, `rgba(148, 163, 184, ${puff.opacity})`);
        grad.addColorStop(1, 'rgba(148, 163, 184, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(puff.x, puff.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2. Monsoon rain streaks
      rainDrops.forEach((drop) => {
        drop.y += drop.speed * dt;
        drop.x += drop.windDrift * dt * 45;

        if (drop.y > height + 20) {
          drop.y = -drop.length - Math.random() * 15;
          drop.x = Math.random() * (width + 200) - 100;
        }
        if (drop.x > width + 100) {
          drop.x = -50;
        }

        ctx.strokeStyle = `rgba(186, 230, 253, ${drop.opacity})`;
        ctx.lineWidth = drop.width;
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x + drop.windDrift * 3.5, drop.y + drop.length);
        ctx.stroke();
      });

      // 3. Lightning bolts
      for (let b = activeBolts.length - 1; b >= 0; b--) {
        const bolt = activeBolts[b];
        const elapsed = now - bolt.createdAt;
        if (elapsed > bolt.durationMs) {
          activeBolts.splice(b, 1);
          continue;
        }

        const progress = elapsed / bolt.durationMs;
        const strobe = Math.sin(progress * Math.PI * 6.5);
        const boltAlpha = Math.max(0, (1 - progress) * (strobe > 0 ? 1 : 0.35));

        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Outer electric bloom glow
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#38bdf8';
        ctx.strokeStyle = `rgba(186, 230, 253, ${boltAlpha * 0.9})`;

        bolt.segments.forEach((seg) => {
          ctx.lineWidth = seg.width + 1.8;
          ctx.beginPath();
          ctx.moveTo(seg.x1, seg.y1);
          ctx.lineTo(seg.x2, seg.y2);
          ctx.stroke();
        });

        // Core white filament
        ctx.shadowBlur = 6;
        ctx.shadowColor = '#ffffff';
        ctx.strokeStyle = `rgba(255, 255, 255, ${boltAlpha})`;
        bolt.segments.forEach((seg) => {
          ctx.lineWidth = Math.max(1, seg.width * 0.45);
          ctx.beginPath();
          ctx.moveTo(seg.x1, seg.y1);
          ctx.lineTo(seg.x2, seg.y2);
          ctx.stroke();
        });

        // Fork branches
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#60a5fa';
        ctx.strokeStyle = `rgba(199, 210, 254, ${boltAlpha * 0.75})`;
        bolt.subBranches.forEach((sub) => {
          ctx.lineWidth = sub.width;
          ctx.beginPath();
          ctx.moveTo(sub.x1, sub.y1);
          ctx.lineTo(sub.x2, sub.y2);
          ctx.stroke();
        });

        ctx.restore();
      }

      // 4. Cloud Flash & Ambient Lightning Glow
      if (flashAlpha > 0.005) {
        const radGrad = ctx.createRadialGradient(
          lastFlashX,
          lastFlashY,
          5,
          lastFlashX,
          lastFlashY,
          Math.max(width * 0.55, 280)
        );
        radGrad.addColorStop(0, `rgba(224, 242, 254, ${flashAlpha * 0.52})`);
        radGrad.addColorStop(0.35, `rgba(186, 230, 253, ${flashAlpha * 0.32})`);
        radGrad.addColorStop(0.7, `rgba(96, 165, 250, ${flashAlpha * 0.12})`);
        radGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');

        ctx.fillStyle = radGrad;
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = `rgba(224, 242, 254, ${flashAlpha * 0.22})`;
        ctx.fillRect(0, 0, width, height);

        flashAlpha = Math.max(0, flashAlpha - dt * 2.8);
      }
    };

    animFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', updateSize);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      triggerStrikeRef.current = null;
    };
  }, []);

  const formattedRegime = (currentRegime || 'ACTIVE_MONSOON').replace(/_/g, ' ');

  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-800/80 shadow-xl bg-slate-950 min-h-[200px] sm:min-h-[205px] lg:min-h-[210px] flex items-center">
      {/* Background Thunderstorm & Lightning Landscape Photo */}
      <img
        src="/images/thunderstorm_weather.jpg"
        alt="Thunderstorm Lightning Weather"
        className="absolute inset-0 w-full h-full object-cover object-center brightness-110 contrast-105 scale-102 motion-safe:transition-transform motion-safe:duration-7000 hover:scale-100"
      />

      {/* Multi-Stop Atmospheric Gradient Overlays for High Contrast & Legibility */}
      <div className="absolute inset-0 bg-linear-to-r from-slate-950/85 via-slate-950/55 to-slate-950/10 pointer-events-none" />
      <div className="absolute inset-0 bg-linear-to-t from-slate-950/35 via-transparent to-transparent pointer-events-none" />

      {/* Live Animated Thunderstorm Canvas (Lightning, Cloud Illumination Flashes & Rain Streaks) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-[5]"
        aria-hidden="true"
      />

      {/* Perfectly Calibrated Banner Content Container */}
      <div className="relative z-10 w-full px-6 py-5 sm:px-7 sm:py-5.5 lg:px-8 lg:py-6 flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
        {/* Left Column: Mission Overline, Headline, Value Prop & Action Buttons */}
        <div className="space-y-2.5 max-w-2xl">
          {/* Overline Tag */}
          <div className="flex items-center space-x-2 text-[10.5px] sm:text-xs font-bold uppercase tracking-wider text-sky-400">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping mr-0.5" />
            <Zap className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
            <span>OPERATIONAL MONSOON PRECIPITATION AI • SIH26080</span>
          </div>

          {/* Main Headline */}
          <h2 className="text-xl sm:text-2xl lg:text-[26px] font-extrabold text-white tracking-tight leading-tight">
            Smarter Forecasting. <span className="text-slate-200">Resilient Communities.</span>
          </h2>

          {/* Subtitle / Mission Description */}
          <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed max-w-xl">
            Physics-guided AI correction of NOAA GFS NWP biases calibrated against IMD 0.25° gridded ground truth.
          </p>

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            {/* Primary Action Button */}
            <button
              type="button"
              onClick={handleActionClick}
              disabled={isRefreshing || justTriggered}
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-semibold text-xs transition-all shadow-md shadow-blue-600/30 cursor-pointer disabled:opacity-80 disabled:cursor-not-allowed"
            >
              {isRefreshing || justTriggered ? (
                <>
                  <RotateCw className="h-3.5 w-3.5 animate-spin text-white" />
                  <span>Calibrating Models (11.4 ms)...</span>
                </>
              ) : (
                <>
                  <Play className="h-3 w-3 fill-current" />
                  <span>Re-Run Bias Correction</span>
                </>
              )}
            </button>

            {/* Status Pill 1: Optimization / Calibration Benchmark */}
            <div className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-semibold backdrop-blur-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>IMD AWS: CALIBRATED</span>
            </div>

            {/* Status Pill 2: Dynamic Synoptic Regime */}
            <div className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700/80 text-sky-300 font-mono text-xs font-semibold backdrop-blur-xs">
              <Cpu className="h-3.5 w-3.5 text-indigo-400" />
              <span>REGIME: {formattedRegime}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Floating Frosted Glassmorphism Card */}
        <div className="relative shrink-0 md:max-w-xs w-full sm:w-auto self-start md:self-center">
          <div className="backdrop-blur-md bg-white/10 dark:bg-slate-900/40 border border-white/20 rounded-2xl p-4 sm:p-5 shadow-2xl text-center transition-all hover:bg-white/15">
            <p className="text-xs sm:text-sm italic font-medium text-white/95 leading-relaxed tracking-wide">
              &ldquo;Accurate forecasts today, a safer tomorrow.&rdquo;
            </p>
            <div className="h-px w-14 mx-auto bg-white/25 my-2.5" />
            <div className="text-sky-300 text-xs font-semibold tracking-wide">
              Ministry of Earth Sciences
            </div>
            <span className="text-[10px] text-slate-300/80 block mt-0.5">
              Government of India • IMD NDC
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

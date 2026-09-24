import React, { useEffect, useRef, useState } from 'react';
import { useWeather } from '../../context/WeatherContext';
import { SynopticRegime } from '../../types/api';

interface LiveWeatherBackgroundProps {
  isDarkMode?: boolean;
  opacity?: number;
  fixed?: boolean;
  interactive?: boolean;
  overrideRegime?: SynopticRegime;
}

interface RainDrop {
  x: number;
  y: number;
  length: number;
  speed: number;
  wind: number;
  opacity: number;
  width: number;
  layer: number; // 0 = bg, 1 = fg
}

interface SplashRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  color: string;
}

interface CloudPuff {
  x: number;
  y: number;
  radius: number;
  speed: number;
  opacity: number;
}

interface WindStreak {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
  thickness: number;
}

export const LiveWeatherBackground: React.FC<LiveWeatherBackgroundProps> = ({
  isDarkMode = true,
  opacity,
  fixed = true,
  interactive = true,
  overrideRegime,
}) => {
  const { enabled, effectiveRegime: contextRegime, intensity, lightningEnabled } = useWeather();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  const activeRegime = overrideRegime || contextRegime;

  // Track mouse coordinates for subtle deflection & ripple interaction
  const mousePosRef = useRef<{ x: number; y: number; active: boolean }>({ x: -1000, y: -1000, active: false });
  const ripplesRef = useRef<SplashRipple[]>([]);
  const [lightningFlash, setLightningFlash] = useState<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const canvas = canvasRef.current;
    if (!canvas || typeof canvas.getContext !== 'function') return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Mouse tracking for interactive water deflection & splash
    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY, active: true };
    };

    const handleMouseLeave = () => {
      mousePosRef.current = { x: -1000, y: -1000, active: false };
    };

    const handleClick = (e: MouseEvent) => {
      if (!interactive) return;
      ripplesRef.current.push({
        x: e.clientX,
        y: e.clientY,
        radius: 4,
        maxRadius: 36,
        opacity: isDarkMode ? 0.8 : 0.9,
        color: isDarkMode ? 'rgba(165, 243, 252, 0.7)' : 'rgba(2, 132, 199, 0.8)',
      });
    };

    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseleave', handleMouseLeave);
      window.addEventListener('click', handleClick);
    }

    // Determine particle counts based on intensity and regime
    const intensityMultiplier = intensity === 'subtle' ? 0.45 : intensity === 'dramatic' ? 1.6 : 1.0;

    let dropCount = 0;
    let windStreakCount = 0;
    let cloudCount = 0;
    let baseWind = 0;
    let baseDropSpeed = 16;

    switch (activeRegime) {
      case 'ACTIVE_MONSOON':
        dropCount = Math.round(180 * intensityMultiplier);
        windStreakCount = Math.round(15 * intensityMultiplier);
        cloudCount = 6;
        baseWind = 4.5;
        baseDropSpeed = 19;
        break;
      case 'BREAK_MONSOON':
        dropCount = Math.round(30 * intensityMultiplier);
        windStreakCount = 4;
        cloudCount = 10;
        baseWind = 1.5;
        baseDropSpeed = 11;
        break;
      case 'COASTAL_OROGRAPHIC':
        dropCount = Math.round(140 * intensityMultiplier);
        windStreakCount = Math.round(40 * intensityMultiplier);
        cloudCount = 8;
        baseWind = 9.0; // Strong onshore low-level jet
        baseDropSpeed = 17;
        break;
      case 'DEPRESSION':
        dropCount = Math.round(320 * intensityMultiplier);
        windStreakCount = Math.round(35 * intensityMultiplier);
        cloudCount = 12;
        baseWind = 8.0;
        baseDropSpeed = 24;
        break;
      case 'WESTERN_DISTURBANCE':
        dropCount = Math.round(80 * intensityMultiplier);
        windStreakCount = Math.round(25 * intensityMultiplier);
        cloudCount = 7;
        baseWind = 6.0;
        baseDropSpeed = 13;
        break;
      case 'OTHER':
      default:
        dropCount = Math.round(60 * intensityMultiplier);
        windStreakCount = 8;
        cloudCount = 5;
        baseWind = 2.0;
        baseDropSpeed = 14;
        break;
    }

    // Initialize Raindrops with theme-adapted opacity & stroke thickness
    const rainDrops: RainDrop[] = [];
    for (let i = 0; i < dropCount; i++) {
      const layer = Math.random() > 0.4 ? 1 : 0;
      // In lightmode: higher opacity and slightly bolder width to pop against light backgrounds
      const baseOpacity = isDarkMode
        ? layer === 1
          ? 0.35 + Math.random() * 0.35
          : 0.15 + Math.random() * 0.2
        : layer === 1
        ? 0.65 + Math.random() * 0.3
        : 0.4 + Math.random() * 0.25;

      const dropWidth = isDarkMode
        ? layer === 1
          ? 1.4
          : 0.9
        : layer === 1
        ? 1.8
        : 1.2;

      rainDrops.push({
        x: Math.random() * (width + 400) - 200,
        y: Math.random() * height,
        length: layer === 1 ? 16 + Math.random() * 18 : 8 + Math.random() * 10,
        speed: (baseDropSpeed + Math.random() * 8) * (layer === 1 ? 1 : 0.7),
        wind: baseWind + (Math.random() - 0.5) * 2,
        opacity: baseOpacity,
        width: dropWidth,
        layer,
      });
    }

    // Initialize Wind Streaks
    const windStreaks: WindStreak[] = [];
    for (let i = 0; i < windStreakCount; i++) {
      windStreaks.push({
        x: Math.random() * width,
        y: Math.random() * height,
        length: 60 + Math.random() * 140,
        speed: (baseWind * 2 + Math.random() * 5) * (intensity === 'dramatic' ? 1.4 : 1),
        opacity: isDarkMode ? 0.08 + Math.random() * 0.15 : 0.25 + Math.random() * 0.2,
        thickness: isDarkMode ? 0.8 + Math.random() * 1.5 : 1.2 + Math.random() * 1.6,
      });
    }

    // Initialize Clouds / Atmospheric Mist Puffs
    const cloudPuffs: CloudPuff[] = [];
    for (let i = 0; i < cloudCount; i++) {
      cloudPuffs.push({
        x: Math.random() * width,
        y: Math.random() * (height * 0.6),
        radius: 120 + Math.random() * 240,
        speed: (0.3 + Math.random() * 0.8) * (baseWind > 5 ? 1.5 : 1),
        // In lightmode: soft slate-blue shading creates visible, beautiful cloud volume
        opacity: isDarkMode ? 0.04 + Math.random() * 0.06 : 0.14 + Math.random() * 0.12,
      });
    }

    // Lightning scheduling for Depression & Active Monsoon
    let lastLightning = performance.now();
    let nextLightningInterval = (8 + Math.random() * 12) * 1000;

    let isTabVisible = !document.hidden;
    const handleVisibility = () => {
      isTabVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Animation Render Loop
    let lastTime = performance.now();

    const render = (now: number) => {
      animFrameIdRef.current = requestAnimationFrame(render);
      if (!isTabVisible) return;

      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      ctx.clearRect(0, 0, width, height);

      // 1. Render Atmospheric Lightning Flash
      if (lightningEnabled && (activeRegime === 'DEPRESSION' || activeRegime === 'ACTIVE_MONSOON')) {
        if (now - lastLightning > nextLightningInterval) {
          lastLightning = now;
          nextLightningInterval = (activeRegime === 'DEPRESSION' ? 5 + Math.random() * 7 : 10 + Math.random() * 14) * 1000;
          setLightningFlash(0.28);
        }
      }

      setLightningFlash((prev) => {
        if (prev <= 0.01) return 0;
        const next = prev - dt * 1.2;
        if (next > 0) {
          ctx.fillStyle = isDarkMode ? `rgba(224, 242, 254, ${next})` : `rgba(186, 230, 253, ${next * 1.2})`;
          ctx.fillRect(0, 0, width, height);
        }
        return Math.max(0, next);
      });

      // 2. Render Soft Cloud / Mist Puffs
      cloudPuffs.forEach((puff) => {
        puff.x += puff.speed * dt * 60;
        if (puff.x - puff.radius > width) {
          puff.x = -puff.radius;
          puff.y = Math.random() * (height * 0.6);
        }

        const grad = ctx.createRadialGradient(puff.x, puff.y, 0, puff.x, puff.y, puff.radius);
        // High-contrast soft blue-slate shading in light mode
        const puffColor = isDarkMode ? '148, 163, 184' : '147, 197, 253';
        grad.addColorStop(0, `rgba(${puffColor}, ${puff.opacity})`);
        grad.addColorStop(1, `rgba(${puffColor}, 0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(puff.x, puff.y, puff.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Render Wind Streaks (Coastal / Depression / Westerlies)
      if (windStreakCount > 0) {
        ctx.lineWidth = 1;
        windStreaks.forEach((streak) => {
          streak.x += streak.speed * dt * 60;
          if (streak.x > width + streak.length) {
            streak.x = -streak.length;
            streak.y = Math.random() * height;
          }

          const streakColor = isDarkMode
            ? activeRegime === 'WESTERN_DISTURBANCE'
              ? '186, 230, 253' // cool cyan
              : activeRegime === 'COASTAL_OROGRAPHIC'
              ? '153, 246, 228' // marine teal
              : '226, 232, 240'
            : activeRegime === 'WESTERN_DISTURBANCE'
            ? '8, 145, 178' // deep cyan in light mode
            : activeRegime === 'COASTAL_OROGRAPHIC'
            ? '13, 148, 136' // deep teal in light mode
            : activeRegime === 'DEPRESSION'
            ? '67, 56, 202' // deep indigo in light mode
            : '30, 64, 175'; // vibrant marine blue in light mode

          const grad = ctx.createLinearGradient(streak.x, streak.y, streak.x + streak.length, streak.y);
          grad.addColorStop(0, `rgba(${streakColor}, 0)`);
          grad.addColorStop(0.5, `rgba(${streakColor}, ${streak.opacity})`);
          grad.addColorStop(1, `rgba(${streakColor}, 0)`);

          ctx.strokeStyle = grad;
          ctx.lineWidth = streak.thickness;
          ctx.beginPath();
          ctx.moveTo(streak.x, streak.y);
          ctx.lineTo(streak.x + streak.length, streak.y + (baseWind > 5 ? 3 : 0));
          ctx.stroke();
        });
      }

      // 4. Render Rain Drops with Deflection & Depth
      const mouse = mousePosRef.current;
      // High-contrast, vibrant rainfall colors adapted to Light & Dark themes
      const dropColor = isDarkMode
        ? activeRegime === 'WESTERN_DISTURBANCE'
          ? '207, 250, 254'
          : activeRegime === 'COASTAL_OROGRAPHIC'
          ? '167, 243, 208'
          : '186, 230, 253'
        : activeRegime === 'COASTAL_OROGRAPHIC'
        ? '13, 148, 136' // deep teal
        : activeRegime === 'DEPRESSION'
        ? '67, 56, 202' // deep storm indigo
        : activeRegime === 'WESTERN_DISTURBANCE'
        ? '8, 145, 178' // deep cyan
        : activeRegime === 'BREAK_MONSOON'
        ? '2, 132, 199' // deep sky blue
        : '30, 64, 175'; // rich marine blue

      rainDrops.forEach((drop) => {
        // Interactive mouse deflection
        if (mouse.active) {
          const dx = drop.x - mouse.x;
          const dy = drop.y - mouse.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 10000 && distSq > 0) {
            const dist = Math.sqrt(distSq);
            const force = (1 - dist / 100) * 12;
            drop.x += (dx / dist) * force;
          }
        }

        drop.y += drop.speed * dt * 60;
        drop.x += drop.wind * dt * 60;

        // Ground splash on bottom or wrapping
        if (drop.y > height - 10) {
          if (Math.random() < (intensity === 'dramatic' ? 0.35 : 0.18)) {
            ripplesRef.current.push({
              x: drop.x,
              y: height - 6 + Math.random() * 4,
              radius: 1,
              maxRadius: drop.layer === 1 ? 9 : 5,
              opacity: drop.opacity * 0.8,
              color: isDarkMode
                ? 'rgba(186, 230, 253, 0.6)'
                : 'rgba(30, 64, 175, 0.7)',
            });
          }
          drop.y = -drop.length - Math.random() * 20;
          drop.x = Math.random() * (width + 300) - 150;
        }

        if (drop.x > width + 100) {
          drop.x = -50;
        }

        ctx.strokeStyle = `rgba(${dropColor}, ${drop.opacity})`;
        ctx.lineWidth = drop.width;
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x + drop.wind * 1.5, drop.y + drop.length);
        ctx.stroke();
      });

      // 5. Render Ground & Interactive Splash Ripples
      const activeRipples = ripplesRef.current;
      for (let i = activeRipples.length - 1; i >= 0; i--) {
        const ripple = activeRipples[i];
        ripple.radius += dt * 45;
        ripple.opacity -= dt * 1.6;

        if (ripple.opacity <= 0 || ripple.radius >= ripple.maxRadius) {
          activeRipples.splice(i, 1);
          continue;
        }

        ctx.strokeStyle = ripple.color.replace(/[\d\.]+\)$/, `${Math.max(0, ripple.opacity)})`);
        ctx.lineWidth = isDarkMode ? 1.2 : 1.6;
        ctx.beginPath();
        ctx.ellipse(ripple.x, ripple.y, ripple.radius * 1.6, ripple.radius * 0.7, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (interactive) {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseleave', handleMouseLeave);
        window.removeEventListener('click', handleClick);
      }
    };
  }, [enabled, activeRegime, intensity, lightningEnabled, isDarkMode, interactive]);

  if (!enabled) return null;

  // Background atmosphere tints based on weather regime
  const getAtmosphereGradient = () => {
    switch (activeRegime) {
      case 'ACTIVE_MONSOON':
        return isDarkMode
          ? 'from-slate-950 via-indigo-950/40 to-slate-950'
          : 'from-blue-100/90 via-sky-100/70 to-slate-100/90';
      case 'BREAK_MONSOON':
        return isDarkMode
          ? 'from-slate-950 via-sky-950/25 to-slate-950'
          : 'from-amber-100/80 via-sky-100/60 to-slate-50';
      case 'COASTAL_OROGRAPHIC':
        return isDarkMode
          ? 'from-slate-950 via-teal-950/35 to-slate-950'
          : 'from-teal-100/90 via-cyan-100/70 to-slate-100/80';
      case 'DEPRESSION':
        return isDarkMode
          ? 'from-slate-950 via-purple-950/45 to-slate-950'
          : 'from-indigo-200/90 via-purple-100/80 to-slate-200/90';
      case 'WESTERN_DISTURBANCE':
        return isDarkMode
          ? 'from-slate-950 via-blue-950/35 to-slate-950'
          : 'from-cyan-100/90 via-blue-100/70 to-slate-100/80';
      case 'OTHER':
      default:
        return isDarkMode
          ? 'from-slate-950 via-slate-900/40 to-slate-950'
          : 'from-slate-200/70 via-sky-100/50 to-slate-100/70';
    }
  };

  const defaultOpacity = fixed ? (isDarkMode ? 0.45 : 0.70) : (isDarkMode ? 0.85 : 0.95);
  const effectiveOpacity = opacity !== undefined ? opacity : defaultOpacity;

  return (
    <div
      className={`${
        fixed ? 'fixed inset-0 pointer-events-none z-0' : 'absolute inset-0'
      } overflow-hidden transition-colors duration-1000 bg-gradient-to-b ${getAtmosphereGradient()}`}
      style={{ opacity: effectiveOpacity }}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};

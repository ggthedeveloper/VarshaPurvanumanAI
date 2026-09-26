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
  windDrift: number;
  opacity: number;
  width: number;
  layer: number; // 0 = mist background, 1 = midground rain, 2 = foreground heavy
}

interface SplashRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  color: string;
}

interface SplashDroplet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number;
  radius: number;
  opacity: number;
  color: string;
}

interface CloudPuff {
  x: number;
  y: number;
  radius: number;
  speed: number;
  opacity: number;
  pulsePhase: number;
}

interface MistBank {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  opacity: number;
}

interface SunMote {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  alpha: number;
  phase: number;
}

interface CirrusStreak {
  x: number;
  y: number;
  length: number;
  thickness: number;
  speed: number;
  opacity: number;
  wavePhase: number;
  waveSpeed: number;
  color: string;
}

interface NightStar {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  twinklePhase: number;
  twinkleSpeed: number;
}

interface LightningBolt {
  segments: { x1: number; y1: number; x2: number; y2: number; width: number }[];
  subBranches: { x1: number; y1: number; x2: number; y2: number; width: number }[];
  alpha: number;
  createdAt: number;
  durationMs: number;
}

export const LiveWeatherBackground: React.FC<LiveWeatherBackgroundProps> = ({
  isDarkMode = true,
  opacity,
  fixed = true,
  interactive = true,
  overrideRegime,
}) => {
  const {
    enabled,
    effectiveRegime: contextRegime,
    intensity,
    lightningEnabled,
    instantLightningSignal,
    telemetry,
    effectiveTimeOfDay,
  } = useWeather();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const effectiveTimeOfDayRef = useRef(effectiveTimeOfDay);

  useEffect(() => {
    effectiveTimeOfDayRef.current = effectiveTimeOfDay;
  }, [effectiveTimeOfDay]);

  const activeRegime = overrideRegime || contextRegime;

  const mousePosRef = useRef<{ x: number; y: number; active: boolean; lastX: number; lastY: number }>({
    x: -1000,
    y: -1000,
    active: false,
    lastX: -1000,
    lastY: -1000,
  });
  const ripplesRef = useRef<SplashRipple[]>([]);
  const splashDropletsRef = useRef<SplashDroplet[]>([]);
  const activeBoltsRef = useRef<LightningBolt[]>([]);
  const flashAlphaRef = useRef<number>(0);

  // Helper to construct branching lightning bolts
  const createLightningBolt = (startX?: number, startY?: number): LightningBolt => {
    const canvas = canvasRef.current;
    const width = canvas ? canvas.width : window.innerWidth;
    const height = canvas ? canvas.height : window.innerHeight;

    const x0 = startX !== undefined ? startX : (width * 0.2 + Math.random() * width * 0.6);
    const y0 = startY !== undefined ? startY : Math.random() * (height * 0.12);

    const segments: { x1: number; y1: number; x2: number; y2: number; width: number }[] = [];
    const subBranches: { x1: number; y1: number; x2: number; y2: number; width: number }[] = [];

    let currentX = x0;
    let currentY = y0;
    const targetY = height * (0.65 + Math.random() * 0.3);
    const stepCount = 18 + Math.floor(Math.random() * 12);
    const dy = (targetY - y0) / stepCount;

    for (let i = 0; i < stepCount; i++) {
      const nextY = currentY + dy;
      const nextX = currentX + (Math.random() - 0.5) * 60;
      const branchWidth = Math.max(1.2, 3.5 * (1 - i / stepCount));

      segments.push({
        x1: currentX,
        y1: currentY,
        x2: nextX,
        y2: nextY,
        width: branchWidth,
      });

      // Spawn secondary sub-branches
      if (Math.random() < 0.45 && i > 3 && i < stepCount - 3) {
        let subX = currentX;
        let subY = currentY;
        const subSteps = 4 + Math.floor(Math.random() * 6);
        const subAngle = (Math.random() > 0.5 ? 1 : -1) * (0.4 + Math.random() * 0.6);

        for (let j = 0; j < subSteps; j++) {
          const subNextY = subY + dy * 0.6;
          const subNextX = subX + Math.sin(subAngle) * 24 + (Math.random() - 0.5) * 20;
          subBranches.push({
            x1: subX,
            y1: subY,
            x2: subNextX,
            y2: subNextY,
            width: Math.max(0.8, branchWidth * 0.5),
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
      alpha: 1.0,
      createdAt: performance.now(),
      durationMs: 220 + Math.random() * 100,
    };
  };

  // Watch for instant external lightning signals
  useEffect(() => {
    if (instantLightningSignal > 0 && enabled) {
      activeBoltsRef.current.push(createLightningBolt());
      flashAlphaRef.current = 0.65;
    }
  }, [instantLightningSignal, enabled]);

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

    // Interactive mouse movement & velocity
    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current = {
        x: e.clientX,
        y: e.clientY,
        active: true,
        lastX: mousePosRef.current.x,
        lastY: mousePosRef.current.y,
      };
    };

    const handleMouseLeave = () => {
      mousePosRef.current = { x: -1000, y: -1000, active: false, lastX: -1000, lastY: -1000 };
    };

    let lastClickTime = 0;
    const handleClick = (e: MouseEvent) => {
      if (!interactive) return;
      const now = performance.now();

      // Ripple effect
      ripplesRef.current.push({
        x: e.clientX,
        y: e.clientY,
        radius: 4,
        maxRadius: 48,
        opacity: isDarkMode ? 0.9 : 0.95,
        color: isDarkMode ? 'rgba(165, 243, 252, 0.8)' : 'rgba(2, 132, 199, 0.85)',
      });

      // Rapid double click triggers lightning in stormy regimes
      if (now - lastClickTime < 350 && (activeRegime === 'DEPRESSION' || activeRegime === 'ACTIVE_MONSOON')) {
        activeBoltsRef.current.push(createLightningBolt(e.clientX, 10));
        flashAlphaRef.current = 0.55;
      }
      lastClickTime = now;
    };

    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseleave', handleMouseLeave);
      window.addEventListener('click', handleClick);
    }

    // Determine particle counts and physics parameters from live telemetry
    const intensityMultiplier = intensity === 'subtle' ? 0.5 : intensity === 'dramatic' ? 1.7 : 1.0;
    const rainRate = typeof telemetry?.rainRateMmH === 'number' ? telemetry.rainRateMmH : 10;
    const windSpeed = typeof telemetry?.windSpeedMs === 'number' ? telemetry.windSpeedMs : 5;
    const cloudCover = typeof telemetry?.cloudCoverPct === 'number' ? telemetry.cloudCoverPct : 50;

    // -------------------------------------------------------------------------
    // Realistic Live Meteorological Parameter Binding
    // -------------------------------------------------------------------------
    const isDry = rainRate <= 0.1;
    let dropCount = 0;
    let baseDropSpeed = 16;
    let moteCount = 0;

    if (isDry) {
      // Dry weather at station: zero rain, clear or calm motes
      dropCount = 0;
      moteCount = activeRegime === 'BREAK_MONSOON' ? Math.round(40 * intensityMultiplier) : 15;
    } else {
      // Actively raining at station: scale dropCount with actual rainRate (mm/h)
      const multiplier =
        activeRegime === 'DEPRESSION' ? 20 :
        activeRegime === 'COASTAL_OROGRAPHIC' ? 16 :
        activeRegime === 'ACTIVE_MONSOON' ? 14 : 10;
      dropCount = Math.round(Math.min(360, Math.max(25, rainRate * multiplier)) * intensityMultiplier);
      baseDropSpeed = Math.min(26, 14 + rainRate * 0.4);
      moteCount = 0;
    }

    // Realistic wind speed & cloud puffs bound to live telemetry
    let baseWind = Math.max(0.6, Math.min(14, windSpeed * 0.35));
    let cloudCount =
      cloudCover < 15 ? 0 :
      cloudCover < 40 ? 2 :
      cloudCover < 70 ? 4 :
      cloudCover < 85 ? 7 : 10;

    let mistCount =
      telemetry.relativeHumidityPct > 88 && (rainRate > 2 || activeRegime === 'COASTAL_OROGRAPHIC')
        ? Math.min(5, Math.round((telemetry.relativeHumidityPct - 85) * 0.4))
        : 0;

    // 1. Initialize 3-Tier Raindrops
    const rainDrops: RainDrop[] = [];
    for (let i = 0; i < dropCount; i++) {
      const rand = Math.random();
      const layer = rand > 0.75 ? 2 : rand > 0.35 ? 1 : 0;

      let widthPx: number;
      let opacityVal: number;
      let lengthPx: number;
      let speedFactor: number;

      if (layer === 2) {
        // Foreground heavy drop
        widthPx = isDarkMode ? 1.8 : 2.4;
        opacityVal = isDarkMode ? 0.55 + Math.random() * 0.35 : 0.75 + Math.random() * 0.25;
        lengthPx = 28 + Math.random() * 22;
        speedFactor = 1.25;
      } else if (layer === 1) {
        // Midground standard rain
        widthPx = isDarkMode ? 1.2 : 1.7;
        opacityVal = isDarkMode ? 0.3 + Math.random() * 0.3 : 0.5 + Math.random() * 0.3;
        lengthPx = 16 + Math.random() * 16;
        speedFactor = 1.0;
      } else {
        // Background fine mist / drizzle
        widthPx = isDarkMode ? 0.8 : 1.1;
        opacityVal = isDarkMode ? 0.12 + Math.random() * 0.2 : 0.3 + Math.random() * 0.2;
        lengthPx = 8 + Math.random() * 10;
        speedFactor = 0.65;
      }

      rainDrops.push({
        x: Math.random() * (width + 500) - 250,
        y: Math.random() * height,
        length: lengthPx,
        speed: (baseDropSpeed + Math.random() * 8) * speedFactor,
        windDrift: baseWind + (Math.random() - 0.5) * 2,
        opacity: opacityVal,
        width: widthPx,
        layer,
      });
    }

    // 2. Initialize Rolling Storm Clouds
    const cloudPuffs: CloudPuff[] = [];
    for (let i = 0; i < cloudCount; i++) {
      cloudPuffs.push({
        x: Math.random() * width,
        y: Math.random() * (height * 0.5),
        radius: 140 + Math.random() * 260,
        speed: (0.4 + Math.random() * 0.9) * (baseWind > 5 ? 1.6 : 1),
        opacity: isDarkMode ? 0.05 + Math.random() * 0.08 : 0.16 + Math.random() * 0.14,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }

    // 3. Initialize Low Mist Banks for Coastal / Depression
    const mistBanks: MistBank[] = [];
    for (let i = 0; i < mistCount; i++) {
      mistBanks.push({
        x: Math.random() * width,
        y: height * (0.6 + Math.random() * 0.35),
        width: 350 + Math.random() * 500,
        height: 90 + Math.random() * 160,
        speed: (0.8 + Math.random() * 1.5) * (baseWind > 5 ? 1.8 : 1),
        opacity: isDarkMode ? 0.06 + Math.random() * 0.07 : 0.14 + Math.random() * 0.1,
      });
    }

    // 4. Initialize Break Monsoon Floating Sun Motes
    const sunMotes: SunMote[] = [];
    for (let i = 0; i < moteCount; i++) {
      sunMotes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 1.2 + Math.random() * 2.8,
        vx: (Math.random() - 0.5) * 0.6,
        vy: -0.2 - Math.random() * 0.6,
        alpha: 0.15 + Math.random() * 0.3,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // 5. Initialize Atmospheric Wispy Cirrus Cloud Streaks (Matching reference twilight sunset sky)
    const cirrusStreaks: CirrusStreak[] = [];
    const cirrusCount = 7;
    for (let i = 0; i < cirrusCount; i++) {
      const yRel = 0.06 + (i / cirrusCount) * 0.44; // Spread across upper 50% of the sky
      cirrusStreaks.push({
        x: Math.random() * (width + 500) - 250,
        y: yRel * height,
        length: 260 + Math.random() * 380,
        thickness: 8 + Math.random() * 14,
        speed: 0.10 + Math.random() * 0.28,
        opacity: isDarkMode ? 0.15 + Math.random() * 0.16 : 0.18 + Math.random() * 0.18,
        wavePhase: Math.random() * Math.PI * 2,
        waveSpeed: 0.25 + Math.random() * 0.45,
        color:
          effectiveTimeOfDay === 'evening'
            ? (i % 2 === 0 ? '195, 145, 210' : '225, 160, 175') // Twilight lavender & sunset rose
            : effectiveTimeOfDay === 'afternoon'
            ? '245, 210, 170' // Golden hour amber
            : effectiveTimeOfDay === 'dawn'
            ? '235, 180, 205' // Morning rose pastel
            : '255, 255, 255',
      });
    }

    // 6. Initialize Night Starlight Field (Active during nocturnal hours)
    const nightStars: NightStar[] = [];
    const starCount = 55;
    for (let s = 0; s < starCount; s++) {
      nightStars.push({
        x: Math.random() * width,
        y: Math.random() * (height * 0.65),
        radius: 0.6 + Math.random() * 1.3,
        alpha: 0.3 + Math.random() * 0.65,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.8 + Math.random() * 2.2,
      });
    }

    // Lightning scheduling for stormy regimes
    let lastLightningTime = performance.now();
    let nextLightningInterval = (activeRegime === 'DEPRESSION' ? 4 + Math.random() * 6 : 9 + Math.random() * 12) * 1000;

    let isTabVisible = !document.hidden;
    const handleVisibility = () => {
      isTabVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibility);

    let lastTime = performance.now();

    // -------------------------------------------------------------
    // Main High-Performance Animation Render Loop
    // -------------------------------------------------------------
    const render = (now: number) => {
      animFrameIdRef.current = requestAnimationFrame(render);
      if (!isTabVisible) return;

      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      ctx.clearRect(0, 0, width, height);

      // -------------------------------------------------------------
      // 0. Atmospheric Diurnal Sky Backdrop (Dawn, Day, Afternoon, Evening/Sunset, Night)
      // -------------------------------------------------------------
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      const currentTod = effectiveTimeOfDayRef.current;
      const isRainy = rainRate > 0.3;

      // For embedded cards (fixed === false), adjust alpha so underlying card styling/contrast is maintained
      const skyAlphaMultiplier = fixed ? 1.0 : (isDarkMode ? 0.70 : 0.28);

      if (currentTod === 'evening') {
        // Evening / Sunset: Matches reference image (Mangalagiri 5:02 PM twilight)
        // Deep twilight violet at zenith through dusky purple, mauve rose, down to glowing peach and radiant golden amber at the horizon
        if (isDarkMode) {
          skyGrad.addColorStop(0, `rgba(34, 28, 67, ${0.98 * skyAlphaMultiplier})`);     // Deep dusk violet (#221c43)
          skyGrad.addColorStop(0.24, `rgba(56, 42, 92, ${0.98 * skyAlphaMultiplier})`);   // Dusky royal purple (#382a5c)
          skyGrad.addColorStop(0.46, `rgba(86, 59, 113, ${0.96 * skyAlphaMultiplier})`);  // Rich mauve purple (#563b71)
          skyGrad.addColorStop(0.66, isRainy ? `rgba(92, 48, 85, ${0.95 * skyAlphaMultiplier})` : `rgba(130, 76, 127, ${0.95 * skyAlphaMultiplier})`); // Dusk rose (#824c7f)
          skyGrad.addColorStop(0.80, isRainy ? `rgba(125, 60, 68, ${0.95 * skyAlphaMultiplier})` : `rgba(179, 92, 114, ${0.95 * skyAlphaMultiplier})`); // Twilight coral (#b35c72)
          skyGrad.addColorStop(0.92, isRainy ? `rgba(165, 85, 65, ${0.96 * skyAlphaMultiplier})` : `rgba(217, 125, 101, ${0.96 * skyAlphaMultiplier})`); // Glowing sunset peach (#d97d65)
          skyGrad.addColorStop(1, isRainy ? `rgba(200, 120, 65, ${0.98 * skyAlphaMultiplier})` : `rgba(235, 180, 122, ${0.98 * skyAlphaMultiplier})`); // Warm golden amber horizon (#ebb47a)
        } else {
          // Light Mode Evening: Soft high-luminance pastel sunset sky
          skyGrad.addColorStop(0, `rgba(220, 214, 242, ${0.92 * skyAlphaMultiplier})`);   // Soft lavender twilight
          skyGrad.addColorStop(0.28, `rgba(240, 214, 228, ${0.88 * skyAlphaMultiplier})`); // Pastel dusk rose
          skyGrad.addColorStop(0.55, `rgba(254, 220, 206, ${0.86 * skyAlphaMultiplier})`); // Glowing peach
          skyGrad.addColorStop(0.78, `rgba(254, 230, 200, ${0.88 * skyAlphaMultiplier})`); // Warm apricot
          skyGrad.addColorStop(1, `rgba(254, 243, 212, ${0.94 * skyAlphaMultiplier})`);    // Golden amber cream horizon
        }
      } else if (currentTod === 'afternoon') {
        // Afternoon: Golden Hour radiance & warm atmospheric glow
        if (isDarkMode) {
          skyGrad.addColorStop(0, `rgba(20, 30, 55, ${0.98 * skyAlphaMultiplier})`);
          skyGrad.addColorStop(0.38, isRainy ? `rgba(30, 41, 59, ${0.92 * skyAlphaMultiplier})` : `rgba(30, 75, 110, ${0.90 * skyAlphaMultiplier})`);
          skyGrad.addColorStop(0.72, isRainy ? `rgba(51, 65, 85, ${0.88 * skyAlphaMultiplier})` : `rgba(160, 95, 25, ${0.88 * skyAlphaMultiplier})`);
          skyGrad.addColorStop(1, isRainy ? `rgba(71, 85, 105, ${0.90 * skyAlphaMultiplier})` : `rgba(225, 140, 30, ${0.92 * skyAlphaMultiplier})`);
        } else {
          skyGrad.addColorStop(0, `rgba(186, 230, 253, ${0.92 * skyAlphaMultiplier})`);
          skyGrad.addColorStop(0.6, `rgba(254, 215, 170, ${0.85 * skyAlphaMultiplier})`);
          skyGrad.addColorStop(1, `rgba(253, 186, 116, ${0.90 * skyAlphaMultiplier})`);
        }
      } else if (currentTod === 'dawn') {
        // Dawn: Soft morning pastel pink, lavender, and pale cyan
        if (isDarkMode) {
          skyGrad.addColorStop(0, `rgba(20, 22, 50, ${0.98 * skyAlphaMultiplier})`);
          skyGrad.addColorStop(0.38, `rgba(55, 48, 115, ${0.92 * skyAlphaMultiplier})`);
          skyGrad.addColorStop(0.70, `rgba(145, 45, 85, ${0.88 * skyAlphaMultiplier})`);
          skyGrad.addColorStop(1, `rgba(245, 155, 80, ${0.90 * skyAlphaMultiplier})`);
        } else {
          skyGrad.addColorStop(0, `rgba(199, 210, 254, ${0.90 * skyAlphaMultiplier})`);
          skyGrad.addColorStop(0.5, `rgba(251, 207, 232, ${0.85 * skyAlphaMultiplier})`);
          skyGrad.addColorStop(1, `rgba(254, 240, 138, ${0.90 * skyAlphaMultiplier})`);
        }
      } else if (currentTod === 'night') {
        // Night: Deep obsidian midnight navy in dark mode, luminous moonlit silvery blue in light mode
        if (isDarkMode) {
          skyGrad.addColorStop(0, `rgba(4, 8, 24, ${0.98 * skyAlphaMultiplier})`);
          skyGrad.addColorStop(0.48, `rgba(15, 23, 42, ${0.96 * skyAlphaMultiplier})`);
          skyGrad.addColorStop(1, isRainy ? `rgba(30, 41, 59, ${0.94 * skyAlphaMultiplier})` : `rgba(20, 32, 70, ${0.92 * skyAlphaMultiplier})`);
        } else {
          // Light Mode Night: Luminous celestial moonlit silver & periwinkle (crisp contrast for dark text)
          if (isRainy) {
            skyGrad.addColorStop(0, `rgba(215, 224, 235, ${0.92 * skyAlphaMultiplier})`); // Soft moonlit overcast slate
            skyGrad.addColorStop(0.5, `rgba(230, 236, 245, ${0.88 * skyAlphaMultiplier})`); // Silvery rain mist
            skyGrad.addColorStop(1, `rgba(245, 248, 252, ${0.92 * skyAlphaMultiplier})`); // Luminous pearl silver
          } else {
            skyGrad.addColorStop(0, `rgba(224, 234, 248, ${0.95 * skyAlphaMultiplier})`); // Soft moonlit celestial periwinkle
            skyGrad.addColorStop(0.35, `rgba(235, 242, 252, ${0.92 * skyAlphaMultiplier})`); // Silvery luminous moonlit blue
            skyGrad.addColorStop(0.70, `rgba(244, 247, 254, ${0.94 * skyAlphaMultiplier})`); // Pale luminous moonlight
            skyGrad.addColorStop(1, `rgba(250, 252, 255, ${0.96 * skyAlphaMultiplier})`); // Soft pearl white/silver glow
          }
        }
      } else {
        // Day: Crisp daylight azure
        if (isDarkMode) {
          skyGrad.addColorStop(0, `rgba(15, 28, 55, ${0.98 * skyAlphaMultiplier})`);
          skyGrad.addColorStop(0.5, isRainy ? `rgba(30, 41, 59, ${0.94 * skyAlphaMultiplier})` : `rgba(25, 60, 115, ${0.90 * skyAlphaMultiplier})`);
          skyGrad.addColorStop(1, isRainy ? `rgba(51, 65, 85, ${0.90 * skyAlphaMultiplier})` : `rgba(35, 85, 155, ${0.88 * skyAlphaMultiplier})`);
        } else {
          skyGrad.addColorStop(0, isRainy ? `rgba(203, 213, 225, ${0.90 * skyAlphaMultiplier})` : `rgba(224, 242, 254, ${0.90 * skyAlphaMultiplier})`);
          skyGrad.addColorStop(0.6, isRainy ? `rgba(148, 163, 184, ${0.85 * skyAlphaMultiplier})` : `rgba(186, 230, 253, ${0.85 * skyAlphaMultiplier})`);
          skyGrad.addColorStop(1, isRainy ? `rgba(100, 116, 139, ${0.90 * skyAlphaMultiplier})` : `rgba(147, 197, 253, ${0.85 * skyAlphaMultiplier})`);
        }
      }

      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Render night stars (active during nocturnal clear/partly cloudy skies)
      if (currentTod === 'night' && !isRainy && cloudCover < 85) {
        const starSkyClarity = Math.max(0.15, (100 - cloudCover) / 100);
        nightStars.forEach((star) => {
          star.twinklePhase += star.twinkleSpeed * dt;
          const currentAlpha = star.alpha * (0.55 + Math.sin(star.twinklePhase) * 0.45) * starSkyClarity;
          const starColor = isDarkMode ? '255, 255, 255' : '100, 116, 139';
          ctx.fillStyle = `rgba(${starColor}, ${currentAlpha * (isDarkMode ? 0.95 : 0.65)})`;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // Oscillatory dynamic wind gusts (wind surges periodically)
      const windGustOffset = Math.sin(now * 0.001) * 3.4 + Math.cos(now * 0.0024) * 2.0;
      const currentWind = baseWind + windGustOffset;

      // Render wispy stratified cirrus clouds (active during twilight & daytime)
      if (currentTod !== 'night') {
        cirrusStreaks.forEach((cs) => {
          cs.x += (cs.speed + currentWind * 0.08) * dt * 60;
          cs.wavePhase += cs.waveSpeed * dt;
          if (cs.x - cs.length > width + 100) {
            cs.x = -cs.length - 50;
            cs.y = (0.06 + Math.random() * 0.44) * height;
          }

          const waveY = Math.sin(cs.wavePhase) * 4;
          const grad = ctx.createLinearGradient(cs.x, cs.y + waveY, cs.x + cs.length, cs.y + waveY);
          grad.addColorStop(0, `rgba(${cs.color}, 0)`);
          grad.addColorStop(0.25, `rgba(${cs.color}, ${cs.opacity * 0.7})`);
          grad.addColorStop(0.5, `rgba(${cs.color}, ${cs.opacity})`);
          grad.addColorStop(0.75, `rgba(${cs.color}, ${cs.opacity * 0.7})`);
          grad.addColorStop(1, `rgba(${cs.color}, 0)`);

          ctx.save();
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.ellipse(
            cs.x + cs.length / 2,
            cs.y + waveY,
            cs.length / 2,
            cs.thickness * (0.85 + Math.sin(cs.wavePhase * 0.7) * 0.15),
            0,
            0,
            Math.PI * 2
          );
          ctx.fill();
          ctx.restore();
        });
      }

      // -------------------------------------------------------------
      // 1. Lightning Bolt Engine & Ambient Flash Strobe
      // -------------------------------------------------------------
      if (lightningEnabled && (activeRegime === 'DEPRESSION' || activeRegime === 'ACTIVE_MONSOON')) {
        if (now - lastLightningTime > nextLightningInterval) {
          lastLightningTime = now;
          nextLightningInterval =
            (activeRegime === 'DEPRESSION' ? 4 + Math.random() * 6 : 8 + Math.random() * 12) * 1000;

          // Generate a photorealistic branching lightning bolt
          activeBoltsRef.current.push(createLightningBolt());
          flashAlphaRef.current = 0.48;
        }
      }

      // Draw and decay active lightning bolts
      const bolts = activeBoltsRef.current;
      for (let b = bolts.length - 1; b >= 0; b--) {
        const bolt = bolts[b];
        const elapsed = now - bolt.createdAt;
        if (elapsed > bolt.durationMs) {
          bolts.splice(b, 1);
          continue;
        }

        // Strobe flicker simulation (2-3 pulses)
        const progress = elapsed / bolt.durationMs;
        const strobe = Math.sin(progress * Math.PI * 6);
        const boltAlpha = Math.max(0, (1 - progress) * (strobe > 0 ? 1 : 0.45));

        // Draw primary trunk
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Outer electric bloom glow
        ctx.shadowBlur = 24;
        ctx.shadowColor = isDarkMode ? '#93c5fd' : '#2563eb';
        ctx.strokeStyle = isDarkMode
          ? `rgba(186, 230, 253, ${boltAlpha * 0.95})`
          : `rgba(30, 64, 175, ${boltAlpha * 0.95})`;

        bolt.segments.forEach((seg) => {
          ctx.lineWidth = seg.width + 1.5;
          ctx.beginPath();
          ctx.moveTo(seg.x1, seg.y1);
          ctx.lineTo(seg.x2, seg.y2);
          ctx.stroke();
        });

        // Core brilliant white arc
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#ffffff';
        ctx.strokeStyle = `rgba(255, 255, 255, ${boltAlpha})`;
        bolt.segments.forEach((seg) => {
          ctx.lineWidth = Math.max(1, seg.width * 0.4);
          ctx.beginPath();
          ctx.moveTo(seg.x1, seg.y1);
          ctx.lineTo(seg.x2, seg.y2);
          ctx.stroke();
        });

        // Secondary sub-branches
        ctx.strokeStyle = isDarkMode
          ? `rgba(199, 210, 254, ${boltAlpha * 0.75})`
          : `rgba(67, 56, 202, ${boltAlpha * 0.75})`;
        bolt.subBranches.forEach((sub) => {
          ctx.lineWidth = sub.width;
          ctx.beginPath();
          ctx.moveTo(sub.x1, sub.y1);
          ctx.lineTo(sub.x2, sub.y2);
          ctx.stroke();
        });

        ctx.restore();
      }

      // Flash illumination decay directly on canvas without React state re-renders
      if (flashAlphaRef.current > 0.01) {
        ctx.fillStyle = isDarkMode
          ? `rgba(224, 242, 254, ${flashAlphaRef.current * 0.4})`
          : `rgba(186, 230, 253, ${flashAlphaRef.current * 0.55})`;
        ctx.fillRect(0, 0, width, height);
        flashAlphaRef.current = Math.max(0, flashAlphaRef.current - dt * 1.5);
      }

      // -------------------------------------------------------------
      // 2. Rolling Cloud Layers & Fog Banks
      // -------------------------------------------------------------
      cloudPuffs.forEach((puff) => {
        puff.x += (puff.speed + currentWind * 0.15) * dt * 60;
        puff.pulsePhase += dt * 0.8;
        if (puff.x - puff.radius > width) {
          puff.x = -puff.radius;
          puff.y = Math.random() * (height * 0.45);
        }

        const dynamicRadius = puff.radius * (1 + Math.sin(puff.pulsePhase) * 0.08);
        const grad = ctx.createRadialGradient(puff.x, puff.y, 0, puff.x, puff.y, dynamicRadius);
        let puffColor = isDarkMode ? '148, 163, 184' : '186, 215, 248';
        if (currentTod === 'evening') {
          puffColor = isDarkMode ? '185, 130, 175' : '235, 195, 215';
        } else if (currentTod === 'afternoon') {
          puffColor = isDarkMode ? '190, 150, 120' : '245, 215, 175';
        } else if (currentTod === 'dawn') {
          puffColor = isDarkMode ? '195, 140, 170' : '245, 205, 220';
        } else if (currentTod === 'night') {
          puffColor = isDarkMode ? '50, 60, 95' : '205, 218, 238';
        }

        grad.addColorStop(0, `rgba(${puffColor}, ${puff.opacity * (isDarkMode ? 1 : 0.65)})`);
        grad.addColorStop(1, `rgba(${puffColor}, 0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(puff.x, puff.y, dynamicRadius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Low altitude fog/mist banks for Coastal & Depression
      mistBanks.forEach((mist) => {
        mist.x += (mist.speed + currentWind * 0.2) * dt * 60;
        if (mist.x > width + 100) {
          mist.x = -mist.width - 50;
        }

        const mistGrad = ctx.createLinearGradient(mist.x, mist.y, mist.x + mist.width, mist.y);
        const mistColor = isDarkMode
          ? '148, 163, 184'
          : currentTod === 'night'
          ? '215, 225, 240'
          : '186, 230, 253';
        mistGrad.addColorStop(0, `rgba(${mistColor}, 0)`);
        mistGrad.addColorStop(0.5, `rgba(${mistColor}, ${mist.opacity * (isDarkMode ? 1 : 0.6)})`);
        mistGrad.addColorStop(1, `rgba(${mistColor}, 0)`);

        ctx.fillStyle = mistGrad;
        ctx.fillRect(mist.x, mist.y, mist.width, mist.height);
      });

      // -------------------------------------------------------------
      // 3. Sunbeams & Floating Motes (Break Monsoon or Dry Atmosphere)
      // -------------------------------------------------------------
      if (activeRegime === 'BREAK_MONSOON' || moteCount > 0) {
        sunMotes.forEach((mote) => {
          mote.x += (mote.vx + Math.sin(mote.phase) * 0.4) * dt * 60;
          mote.y += mote.vy * dt * 60;
          mote.phase += dt * 1.5;

          if (mote.y < -10) {
            mote.y = height + 10;
            mote.x = Math.random() * width;
          }

          const moteAlpha = mote.alpha * (0.7 + Math.sin(mote.phase) * 0.3);
          const moteColor =
            currentTod === 'evening'
              ? '251, 146, 60'
              : currentTod === 'afternoon'
              ? '251, 191, 36'
              : currentTod === 'dawn'
              ? '253, 186, 116'
              : isDarkMode
              ? '253, 230, 138'
              : '217, 119, 6';
          ctx.fillStyle = `rgba(${moteColor}, ${moteAlpha})`;
          ctx.beginPath();
          ctx.arc(mote.x, mote.y, mote.radius, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // -------------------------------------------------------------
      // 4. Multi-Layer Dynamic Raindrops with Wind Swerve
      // -------------------------------------------------------------
      const mouse = mousePosRef.current;
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
        // Interactive mouse vortex deflection
        if (mouse.active) {
          const dx = drop.x - mouse.x;
          const dy = drop.y - mouse.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 14400 && distSq > 0) {
            const dist = Math.sqrt(distSq);
            const force = (1 - dist / 120) * 16;
            drop.x += (dx / dist) * force;
          }
        }

        // Apply velocities with coordinated dynamic wind gusts
        drop.y += drop.speed * dt * 60;
        drop.x += (currentWind + drop.windDrift * 0.2) * dt * 60;

        // Ground splash & droplet ejection upon hitting the bottom
        if (drop.y > height - 12) {
          // Spawn concentric ripple
          if (Math.random() < (intensity === 'dramatic' ? 0.4 : 0.22)) {
            ripplesRef.current.push({
              x: drop.x,
              y: height - 8 + Math.random() * 6,
              radius: 1,
              maxRadius: drop.layer === 2 ? 14 : drop.layer === 1 ? 9 : 5,
              opacity: drop.opacity * 0.85,
              color: isDarkMode
                ? 'rgba(186, 230, 253, 0.7)'
                : 'rgba(30, 64, 175, 0.75)',
            });

            // Spawn explosive upward micro-splash droplets
            if (drop.layer >= 1) {
              const count = drop.layer === 2 ? 3 : 2;
              for (let k = 0; k < count; k++) {
                splashDropletsRef.current.push({
                  x: drop.x,
                  y: height - 6,
                  vx: (Math.random() - 0.5) * 5 + currentWind * 0.2,
                  vy: -2.5 - Math.random() * 4.5,
                  gravity: 0.32,
                  radius: drop.layer === 2 ? 1.6 : 1.1,
                  opacity: drop.opacity,
                  color: isDarkMode
                    ? 'rgba(224, 242, 254, 0.85)'
                    : 'rgba(30, 64, 175, 0.85)',
                });
              }
            }
          }

          // Reset drop to top with randomized position
          drop.y = -drop.length - Math.random() * 25;
          drop.x = Math.random() * (width + 400) - 200;
        }

        if (drop.x > width + 150) {
          drop.x = -100;
        } else if (drop.x < -150) {
          drop.x = width + 100;
        }

        // Draw raindrop with aerodynamic motion trail
        ctx.strokeStyle = `rgba(${dropColor}, ${drop.opacity})`;
        ctx.lineWidth = drop.width;
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x + currentWind * 1.8, drop.y + drop.length);
        ctx.stroke();
      });

      // -------------------------------------------------------------
      // 5. Physics-Based Splash Micro-Droplets
      // -------------------------------------------------------------
      const splashes = splashDropletsRef.current;
      for (let s = splashes.length - 1; s >= 0; s--) {
        const sp = splashes[s];
        sp.x += sp.vx * dt * 60;
        sp.y += sp.vy * dt * 60;
        sp.vy += sp.gravity * dt * 60;
        sp.opacity -= dt * 2.2;

        if (sp.opacity <= 0 || sp.y > height + 5) {
          splashes.splice(s, 1);
          continue;
        }

        ctx.fillStyle = sp.color.replace(/[\d\.]+\)$/, `${Math.max(0, sp.opacity)})`);
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // -------------------------------------------------------------
      // 6. Ground & Interactive Ripple Rings
      // -------------------------------------------------------------
      const activeRipples = ripplesRef.current;
      for (let i = activeRipples.length - 1; i >= 0; i--) {
        const ripple = activeRipples[i];
        ripple.radius += dt * 50;
        ripple.opacity -= dt * 1.5;

        if (ripple.opacity <= 0 || ripple.radius >= ripple.maxRadius) {
          activeRipples.splice(i, 1);
          continue;
        }

        ctx.strokeStyle = ripple.color.replace(/[\d\.]+\)$/, `${Math.max(0, ripple.opacity)})`);
        ctx.lineWidth = isDarkMode ? 1.3 : 1.7;
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
  }, [
    enabled,
    activeRegime,
    intensity,
    lightningEnabled,
    isDarkMode,
    interactive,
    effectiveTimeOfDay,
    telemetry.rainRateMmH,
    telemetry.windSpeedMs,
    telemetry.cloudCoverPct,
  ]);

  if (!enabled) return null;

  // Background atmosphere tints based on weather regime & diurnal cycle
  const getAtmosphereGradient = () => {
    if (effectiveTimeOfDay === 'evening') {
      return isDarkMode
        ? 'from-[#221c43] via-[#563b71] to-[#ebb47a]'
        : 'from-purple-100/90 via-rose-100/80 to-amber-100/90';
    }
    if (effectiveTimeOfDay === 'afternoon') {
      return isDarkMode
        ? 'from-[#141e37] via-[#1e4b6e] to-[#e18c1e]'
        : 'from-sky-200 via-amber-100 to-orange-200';
    }
    if (effectiveTimeOfDay === 'dawn') {
      return isDarkMode
        ? 'from-[#141632] via-[#373073] to-[#f59b50]'
        : 'from-indigo-100 via-pink-100 to-amber-100';
    }
    if (effectiveTimeOfDay === 'night') {
      return isDarkMode
        ? 'from-slate-950 via-slate-900 to-slate-950'
        : 'from-slate-50 via-sky-50/60 to-slate-50';
    }

    // Day
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

  const defaultOpacity = fixed ? (isDarkMode ? 0.95 : 0.88) : (isDarkMode ? 0.85 : 0.40);
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

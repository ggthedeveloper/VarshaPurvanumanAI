/**
 * Weather Visual State Architecture & Normalized Condition Mapping
 * 
 * Maps live application meteorological data (condition string, precipitation rate, regime)
 * into high-fidelity atmospheric visual states:
 * - RAIN: Subtle animated rain streaks, gentle atmospheric darkening, small water/rain droplets
 * - MIST: Soft moving fog banks, atmospheric haze, reduced distant contrast
 * - RAIN_MIST: Both subtle rain streaks and atmospheric mist
 * - CLOUDY: Atmospheric cloud drift, soft overcast diffuse lighting
 * - CLEAR: Clean atmospheric treatment without rain/mist
 */

export type WeatherVisualCondition = 'RAIN' | 'MIST' | 'RAIN_MIST' | 'CLOUDY' | 'CLEAR' | 'STORM';

export interface WeatherVisualDescriptor {
  condition: WeatherVisualCondition;
  hasRain: boolean;
  hasMist: boolean;
  hasClouds: boolean;
  isClear: boolean;
  hasStorm: boolean;
  rainIntensity: number; // 0 to 1
  mistIntensity: number; // 0 to 1
  label: string;
}

/**
 * Normalizes input text and determines the dominant atmospheric visual effect.
 * Safe against null, undefined, or unexpected values.
 */
export function resolveWeatherVisualState(
  conditionLabel?: string | null,
  rainRateMmH?: number | null,
  regime?: string | null
): WeatherVisualCondition {
  if (!conditionLabel && !rainRateMmH && !regime) {
    return 'CLEAR';
  }

  const text = (conditionLabel || '').trim().toLowerCase();
  const rainRate = typeof rainRateMmH === 'number' && !isNaN(rainRateMmH) ? rainRateMmH : 0;

  // Normalized token detection
  const stormKeywords = ['thunder', 'lightning', 'squall', 'storm', 'tempest'];
  const rainKeywords = ['rain', 'drizzle', 'shower', 'downpour', 'precipitation'];
  const mistKeywords = ['mist', 'fog', 'haze', 'foggy', 'smog'];
  const cloudKeywords = ['cloud', 'overcast', 'gloomy', 'broken clouds', 'passing clouds', 'scattered'];
  const clearKeywords = ['clear', 'dry', 'sun', 'fair', 'sunny'];

  const hasStormKeyword = stormKeywords.some((kw) => text.includes(kw));
  const hasRainKeyword = rainKeywords.some((kw) => text.includes(kw));
  const hasMistKeyword = mistKeywords.some((kw) => text.includes(kw));
  const hasCloudKeyword = cloudKeywords.some((kw) => text.includes(kw));
  const hasClearKeyword = clearKeywords.some((kw) => text.includes(kw));

  // 1. Thunderstorm / Severe squall
  if (hasStormKeyword) {
    return 'STORM';
  }

  // 2. Both Rain and Mist present (e.g. "Rain & Hill Mist", or rain keyword + mist keyword, or heavy rain with mist)
  if ((hasRainKeyword && hasMistKeyword) || (hasMistKeyword && rainRate > 1.5)) {
    return 'RAIN_MIST';
  }

  // 3. Active rainfall occurring (either explicit rain keyword, or rain rate > 0.3 without mist)
  if (hasRainKeyword || (rainRate > 0.3 && !hasMistKeyword)) {
    return 'RAIN';
  }

  // 4. Active mist / fog / haze occurring
  if (hasMistKeyword) {
    return 'MIST';
  }

  // 5. Cloudy / Overcast
  if (hasCloudKeyword) {
    return 'CLOUDY';
  }

  // 6. Clear / Dry
  if (hasClearKeyword) {
    return 'CLEAR';
  }

  // Fallback based on regime or rain rate
  if (regime === 'ACTIVE_MONSOON' || regime === 'COASTAL_OROGRAPHIC' || regime === 'DEPRESSION') {
    return rainRate > 0.1 ? 'RAIN' : 'CLOUDY';
  }

  if (regime === 'BREAK_MONSOON') {
    return 'CLEAR';
  }

  return 'CLEAR';
}

/**
 * Returns detailed descriptor with animation parameters.
 */
export function getWeatherVisualDescriptor(
  conditionLabel?: string | null,
  rainRateMmH?: number | null,
  regime?: string | null
): WeatherVisualDescriptor {
  const condition = resolveWeatherVisualState(conditionLabel, rainRateMmH, regime);

  return {
    condition,
    hasRain: condition === 'RAIN' || condition === 'RAIN_MIST' || condition === 'STORM',
    hasMist: condition === 'MIST' || condition === 'RAIN_MIST',
    hasClouds: condition === 'CLOUDY' || condition === 'STORM',
    isClear: condition === 'CLEAR',
    hasStorm: condition === 'STORM',
    rainIntensity: condition === 'STORM' ? 1.2 : condition === 'RAIN' ? 1.0 : condition === 'RAIN_MIST' ? 0.7 : 0,
    mistIntensity: condition === 'MIST' ? 1.0 : condition === 'RAIN_MIST' ? 0.6 : 0,
    label: condition === 'STORM' ? 'Thunderstorm' : condition.replace('_', ' + '),
  };
}

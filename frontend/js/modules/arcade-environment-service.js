/**
 * ArcadeEnvironmentService
 * Contextual Real-Time Environment Engine for ArcadeOS Earth.
 * Integrates Device Geolocation, Open-Meteo Live Weather API, Solar Phase Math,
 * WMO Weather Codes, Astronomical Lunar Orbit Engine (Meeus Algorithms),
 * Continuous SVG Moon Rendering, ?moonDebug=1 Development Pipeline, and Privacy-Safe Caching.
 */

export const ArcadeEnvironmentService = {
  CACHE_KEY: 'arcade_env_context_v4',
  CACHE_TTL_MS: 15 * 60 * 1000, // 15-minute cache

  state: {
    initialized: false,
    loading: false,
    context: null,
    simulationMode: false,
    lightningTimer: null
  },

  /**
   * Checks if developer debug mode ?moonDebug=1 or window.MOON_DEBUG is active.
   */
  isDebugMode() {
    try {
      if (typeof window !== 'undefined') {
        if (window.MOON_DEBUG) return true;
        const params = new URLSearchParams(window.location.search);
        return params.has('moonDebug') || params.get('debug') === 'moon';
      }
    } catch {}
    return false;
  },

  /**
   * Initializes environmental context safely.
   */
  async init() {
    // Fetch fresh or cached context
    const cached = this.getCachedContext();
    if (cached) {
      this.state.context = cached;
      this.applyEnvironmentToDOM(cached);
    }

    const ctx = await this.fetchContextWithCascade();
    this.state.context = ctx;
    this.setCachedContext(ctx);
    this.applyEnvironmentToDOM(ctx);
    this.state.initialized = true;
    return ctx;
  },

  /**
   * Resilient Fallback Cascade:
   * 1. Geolocation + Open-Meteo Weather API + Astronomical Lunar Engine
   * 2. Timezone / IP approximation + Weather API + Astronomical Lunar Engine
   * 3. Local Device Time + Solar & Lunar Math
   * 4. Default Cinematic Earth Fallback
   */
  async fetchContextWithCascade() {
    // 1. Try Geolocation
    try {
      const coords = await this.requestGeolocationWithTimeout(4000);
      if (coords) {
        const weather = await this.fetchOpenMeteoWeather(coords.latitude, coords.longitude, 'GPS');
        if (weather) return weather;
      }
    } catch (e) {
      console.warn('[ArcadeEnv] Geolocation skipped or denied:', e.message);
    }

    // 2. Try Timezone / IP approximation
    try {
      const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
      const coords = this.getApproxCoordsForTimezone(tzName);
      const weather = await this.fetchOpenMeteoWeather(coords.lat, coords.lon, coords.city);
      if (weather) return weather;
    } catch (e) {
      console.warn('[ArcadeEnv] Timezone weather skipped:', e.message);
    }

    // 3. Fallback to Local Time Solar & Lunar Math
    return this.generateTimeBasedFallbackContext();
  },

  /**
   * Requests geolocation safely with timeout.
   */
  requestGeolocationWithTimeout(timeoutMs = 4000) {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);

      let resolved = false;
      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve(null);
        }
      }, timeoutMs);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timer);
            // Privacy safety: Round coordinates to 2 decimal places (~1.1km precision)
            resolve({
              latitude: Number(pos.coords.latitude.toFixed(2)),
              longitude: Number(pos.coords.longitude.toFixed(2))
            });
          }
        },
        () => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timer);
            resolve(null);
          }
        },
        { timeout: timeoutMs, maximumAge: 600000 }
      );
    });
  },

  /**
   * Fetches weather data from free, privacy-safe Open-Meteo API & computes Astronomical Lunar Context.
   */
  async fetchOpenMeteoWeather(lat, lon, labelSource = 'LOCAL') {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover&daily=sunrise,sunset&timezone=auto`;
    
    let cur = { temperature_2m: 24, weather_code: 0, cloud_cover: 30, is_day: 1, precipitation: 0 };
    let daily = {};
    let tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'LOCAL';

    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json();
        if (data && data.current) {
          cur = data.current;
          daily = data.daily || {};
          tz = data.timezone || tz;
        }
      }
    } catch (e) {
      console.warn('[ArcadeEnv] Open-Meteo API fetch fallback used:', e.message);
    }

    const city = labelSource !== 'GPS' && labelSource !== 'LOCAL' ? labelSource : this.getCityNameFromTimezone(tz);

    const sunriseStr = daily.sunrise?.[0] ? daily.sunrise[0].split('T')[1]?.slice(0, 5) : '06:00';
    const sunsetStr = daily.sunset?.[0] ? daily.sunset[0].split('T')[1]?.slice(0, 5) : '18:30';

    const solarPhase = this.calculateSolarPhase(cur.is_day, cur.time, daily.sunrise?.[0], daily.sunset?.[0]);
    const weatherCondition = this.mapWmoCodeToCondition(cur.weather_code, cur.precipitation, cur.cloud_cover);

    const moon = this.calculateLunarContext(new Date(), lat, lon);

    return {
      locationName: city.toUpperCase(),
      lat,
      lon,
      temperature: Math.round(cur.temperature_2m ?? 24),
      weatherCode: cur.weather_code ?? 0,
      weatherCondition,
      cloudCoverage: (cur.cloud_cover ?? 30) / 100,
      stormIntensity: weatherCondition === 'THUNDERSTORM' ? 0.85 : 0.0,
      precipitation: cur.precipitation ?? 0,
      isDay: cur.is_day ?? 1,
      solarPhase,
      sunriseTime: sunriseStr,
      sunsetTime: sunsetStr,
      timezone: tz,
      moon,
      timestamp: Date.now()
    };
  },

  /**
   * Astronomical Lunar Orbital Engine (Meeus Astronomical Algorithms).
   * Calculates lunar age, illumination fraction (0.0 to 1.0), phase name,
   * waxing/waning orientation, altitude, azimuth, moonrise/moonset, and hemisphere correction.
   */
  calculateLunarContext(date = new Date(), lat = 17.38, lon = 78.48) {
    const timeMs = date.getTime();
    
    // Synodic Month (29.53058867 days) & Known New Moon Reference Epoch (Jan 11, 2024 11:57 UTC = 1704974220000 ms)
    const synodicMonth = 29.53058867;
    const refNewMoonMs = 1704974220000;
    const daysSinceRef = (timeMs - refNewMoonMs) / (86400 * 1000);
    let ageDays = daysSinceRef % synodicMonth;
    if (ageDays < 0) ageDays += synodicMonth;

    // Normalized Phase Angle & Illumination (k = (1 - cos(angle)) / 2)
    const phasePercent = ageDays / synodicMonth; // 0.0 -> 1.0
    const phaseAngleRad = phasePercent * 2 * Math.PI;
    const illumination = (1 - Math.cos(phaseAngleRad)) / 2; // 0.0 (New) -> 1.0 (Full) -> 0.0 (New)
    const waxing = phasePercent < 0.5;

    // Phase Name Classification
    let phaseName = 'NEW_MOON';
    if (illumination < 0.03) phaseName = 'NEW_MOON';
    else if (phasePercent >= 0.03 && phasePercent < 0.22) phaseName = 'WAXING_CRESCENT';
    else if (phasePercent >= 0.22 && phasePercent < 0.28) phaseName = 'FIRST_QUARTER';
    else if (phasePercent >= 0.28 && phasePercent < 0.47) phaseName = 'WAXING_GIBBOUS';
    else if (phasePercent >= 0.47 && phasePercent < 0.53) phaseName = 'FULL_MOON';
    else if (phasePercent >= 0.53 && phasePercent < 0.72) phaseName = 'WANING_GIBBOUS';
    else if (phasePercent >= 0.72 && phasePercent < 0.78) phaseName = 'LAST_QUARTER';
    else if (phasePercent >= 0.78 && phasePercent < 0.97) phaseName = 'WANING_CRESCENT';

    // Approximate Lunar Altitude & Azimuth Math
    const jd = (timeMs / 86400000) + 2440587.5;
    const d = jd - 2451545.0; // days since J2000.0

    // Ecliptic longitude & latitude of Moon
    const L = (218.316 + 13.176396 * d) % 360;
    const M = (134.963 + 13.064993 * d) % 360;
    const F = (93.272 + 13.229350 * d) % 360;
    const eclipticLonRad = (L + 6.289 * Math.sin(M * Math.PI / 180)) * Math.PI / 180;
    const eclipticLatRad = (5.128 * Math.sin(F * Math.PI / 180)) * Math.PI / 180;

    const epsRad = 23.439 * Math.PI / 180; // Obliquity of ecliptic

    // Equatorial coordinates (Right Ascension alpha, Declination delta)
    const sinDec = Math.sin(eclipticLatRad) * Math.cos(epsRad) + Math.cos(eclipticLatRad) * Math.sin(epsRad) * Math.sin(eclipticLonRad);
    const decRad = Math.asin(sinDec);
    const y = Math.sin(eclipticLonRad) * Math.cos(epsRad) - Math.tan(eclipticLatRad) * Math.sin(epsRad);
    const x = Math.cos(eclipticLonRad);
    const raRad = Math.atan2(y, x);

    // Greenwich Sidereal Time (GST) & Local Sidereal Time (LST)
    const gstDeg = (280.46061837 + 360.98564736629 * d) % 360;
    const lstRad = (gstDeg + lon) * Math.PI / 180;

    // Local Hour Angle H
    const haRad = lstRad - raRad;
    const latRad = lat * Math.PI / 180;

    // Altitude & Azimuth
    const sinAlt = Math.sin(latRad) * Math.sin(decRad) + Math.cos(latRad) * Math.cos(decRad) * Math.cos(haRad);
    const altDeg = Math.asin(Math.max(-1, Math.min(1, sinAlt))) * 180 / Math.PI;

    const cosAz = (Math.sin(decRad) - Math.sin(latRad) * sinAlt) / (Math.cos(latRad) * Math.cos(Math.asin(sinAlt)) || 0.001);
    let azDeg = Math.acos(Math.max(-1, Math.min(1, cosAz))) * 180 / Math.PI;
    if (Math.sin(haRad) > 0) azDeg = 360 - azDeg;

    // Softer Altitude Rule: altitude >= -6 degrees (allows horizon rise/set & atmospheric refraction)
    const isAboveHorizon = altDeg >= -6.0;
    const isSouthernHemisphere = lat < 0;

    // Approximate Moonrise & Moonset times
    const moonriseHour = Math.floor((18 + (ageDays * 0.8)) % 24);
    const moonsetHour = Math.floor((6 + (ageDays * 0.8)) % 24);
    const moonriseTime = `${String(moonriseHour).padStart(2, '0')}:15`;
    const moonsetTime = `${String(moonsetHour).padStart(2, '0')}:45`;

    return {
      phaseName,
      illumination: Number(illumination.toFixed(3)),
      ageDays: Number(ageDays.toFixed(1)),
      waxing,
      altitude: Number(altDeg.toFixed(1)),
      azimuth: Number(azDeg.toFixed(1)),
      moonriseTime,
      moonsetTime,
      isAboveHorizon,
      isSouthernHemisphere
    };
  },

  /**
   * Maps WMO Weather Interpretation Codes to normalized conditions.
   */
  mapWmoCodeToCondition(code, precip = 0, cloudCover = 0) {
    if ([95, 96, 99].includes(code)) return 'THUNDERSTORM';
    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code) || precip > 0.5) return 'RAIN';
    if ([71, 73, 75, 77, 85, 86].includes(code)) return 'SNOW';
    if ([45, 48].includes(code)) return 'FOG';
    if (code === 3 || cloudCover > 70) return 'CLOUDY';
    if (code === 1 || code === 2 || cloudCover > 25) return 'PARTLY_CLOUDY';
    return 'CLEAR';
  },

  /**
   * Calculates local solar phase (DAY, SUNRISE, SUNSET, TWILIGHT, NIGHT).
   */
  calculateSolarPhase(isDay, currentTimeIso, sunriseIso, sunsetIso) {
    const now = currentTimeIso ? new Date(currentTimeIso).getTime() : Date.now();
    const sunrise = sunriseIso ? new Date(sunriseIso).getTime() : null;
    const sunset = sunsetIso ? new Date(sunsetIso).getTime() : null;

    if (sunrise && sunset) {
      const windowMs = 45 * 60 * 1000; // 45 minute window
      if (Math.abs(now - sunrise) <= windowMs) return 'SUNRISE';
      if (Math.abs(now - sunset) <= windowMs) return 'SUNSET';
      if (now > sunset && now <= sunset + windowMs * 2) return 'TWILIGHT';
    }

    return isDay === 1 ? 'DAY' : 'NIGHT';
  },

  /**
   * Generates time-based fallback context when offline or location denied.
   */
  generateTimeBasedFallbackContext() {
    const now = new Date();
    const hour = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${String(hour).padStart(2, '0')}:${minutes}`;

    let solarPhase = 'NIGHT';
    let isDay = 0;
    if (hour >= 6 && hour < 7) solarPhase = 'SUNRISE';
    else if (hour >= 7 && hour < 17) { solarPhase = 'DAY'; isDay = 1; }
    else if (hour >= 17 && hour < 19) solarPhase = 'SUNSET';
    else if (hour >= 19 && hour < 20) solarPhase = 'TWILIGHT';

    const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone || 'LOCAL';
    const city = this.getCityNameFromTimezone(tzName);

    const lat = 17.38;
    const lon = 78.48;
    const moon = this.calculateLunarContext(now, lat, lon);
    // Generic placement fallback when location is denied so Moon is still visible!
    moon.altitude = 38.0;
    moon.azimuth = 125.0;
    moon.isAboveHorizon = true;

    return {
      locationName: city.toUpperCase(),
      lat,
      lon,
      temperature: 24,
      weatherCode: 0,
      weatherCondition: 'PARTLY_CLOUDY',
      cloudCoverage: 0.35,
      stormIntensity: 0.0,
      precipitation: 0.0,
      isDay,
      solarPhase,
      sunriseTime: '06:00',
      sunsetTime: '18:30',
      timezone: tzName,
      moon,
      timestamp: Date.now()
    };
  },

  /**
   * Maps timezones to city name for clean HUD rendering.
   */
  getCityNameFromTimezone(tz) {
    if (!tz) return 'ORBIT';
    const parts = tz.split('/');
    const raw = parts[parts.length - 1] || 'LOCAL';
    return raw.replace(/_/g, ' ');
  },

  /**
   * Approximate coordinates for common timezones when Geolocation is denied.
   */
  getApproxCoordsForTimezone(tz) {
    const map = {
      'Asia/Kolkata': { lat: 17.38, lon: 78.48, city: 'HYDERABAD' },
      'America/New_York': { lat: 40.71, lon: -74.00, city: 'NEW YORK' },
      'America/Los_Angeles': { lat: 34.05, lon: -118.24, city: 'LOS ANGELES' },
      'Europe/London': { lat: 51.50, lon: -0.12, city: 'LONDON' },
      'Europe/Paris': { lat: 48.85, lon: 2.35, city: 'PARIS' },
      'Asia/Tokyo': { lat: 35.67, lon: 139.65, city: 'TOKYO' },
      'Australia/Sydney': { lat: -33.86, lon: 151.20, city: 'SYDNEY' }
    };
    return map[tz] || { lat: 17.38, lon: 78.48, city: this.getCityNameFromTimezone(tz) };
  },

  /**
   * Caching helpers.
   */
  getCachedContext() {
    try {
      const raw = sessionStorage.getItem(this.CACHE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (Date.now() - (data.timestamp || 0) < this.CACHE_TTL_MS) {
        return data;
      }
    } catch {
      return null;
    }
    return null;
  },

  setCachedContext(ctx) {
    try {
      sessionStorage.setItem(this.CACHE_KEY, JSON.stringify(ctx));
    } catch {}
  },

  /**
   * Applies normalized environmental context and astronomical Moon to the DOM.
   */
  applyEnvironmentToDOM(ctx) {
    if (!ctx) return;
    const homeView = document.getElementById('arcade-home');
    const earthContainer = document.querySelector('.arcade-earth-container');
    if (!homeView || !earthContainer) return;

    // 1. Calculate CSS variables for smooth rendering
    let daylightFactor = ctx.solarPhase === 'DAY' ? 1.0 : ctx.solarPhase === 'SUNRISE' || ctx.solarPhase === 'SUNSET' ? 0.45 : 0.05;
    let sunriseFactor = ctx.solarPhase === 'SUNRISE' ? 1.0 : 0.0;
    let sunsetFactor = ctx.solarPhase === 'SUNSET' || ctx.solarPhase === 'TWILIGHT' ? 1.0 : 0.0;
    let cityLightOpacity = ctx.solarPhase === 'DAY' ? 0.15 : 0.88;
    let cloudCoverage = Math.max(0.2, Math.min(1.0, ctx.cloudCoverage));

    homeView.style.setProperty('--earth-daylight', daylightFactor);
    homeView.style.setProperty('--earth-sunrise-glow', sunriseFactor);
    homeView.style.setProperty('--earth-sunset-glow', sunsetFactor);
    homeView.style.setProperty('--earth-city-lights-opacity', cityLightOpacity);
    homeView.style.setProperty('--earth-cloud-coverage', cloudCoverage);
    homeView.style.setProperty('--earth-storm-intensity', ctx.stormIntensity);

    // Apply data attributes for CSS state hooks
    earthContainer.setAttribute('data-solar-phase', ctx.solarPhase);
    earthContainer.setAttribute('data-weather-condition', ctx.weatherCondition);

    // 2. Render / Update Astronomical Moon Component
    this.applyMoonToDOM(ctx);

    // 3. Render / Update Environmental HUD Overlay
    let hud = earthContainer.querySelector('.arcade-earth-env-hud');
    if (!hud) {
      hud = document.createElement('div');
      hud.className = 'arcade-earth-env-hud';
      earthContainer.appendChild(hud);
    }

    const weatherIconStr = this.getWeatherIcon(ctx.weatherCondition);
    const sunStr = ctx.solarPhase === 'DAY' ? `SUNSET ${ctx.sunsetTime}` : `SUNRISE ${ctx.sunriseTime}`;
    const moon = ctx.moon || this.calculateLunarContext();
    const moonHUDStr = `<span class="env-hud-moon">MOON // ${moon.phaseName.replace(/_/g, ' ')} ${Math.round(moon.illumination * 100)}%</span>`;
    
    hud.innerHTML = `
      <div class="env-hud-pill">
        <span class="env-hud-loc">LOCAL // ${ctx.locationName}</span>
        <span class="env-hud-temp">${ctx.temperature}°C</span>
        <span class="env-hud-cond">${weatherIconStr} ${ctx.weatherCondition}</span>
        <span class="env-hud-sun">${sunStr}</span>
        ${moonHUDStr}
      </div>
    `;

    // 4. Handle Safe Lightning in Storm Cloud Layer
    this.manageStormLightning(ctx.weatherCondition === 'THUNDERSTORM');
  },

  /**
   * Renders or updates the continuous SVG Moon in the space background.
   * Calculates continuous moonVisibility score (phaseVis * altVis * weatherVis * daylightVis).
   */
  applyMoonToDOM(ctx) {
    const universeBg = document.querySelector('.arcade-universe-bg');
    if (!universeBg) return;

    let moonElem = universeBg.querySelector('.arcade-moon-element');
    if (!moonElem) {
      moonElem = document.createElement('div');
      moonElem.className = 'arcade-moon-element';
      universeBg.appendChild(moonElem);
    }

    const debugMode = this.isDebugMode();
    const moon = (ctx && ctx.moon) ? { ...ctx.moon } : this.calculateLunarContext();

    // 1. Continuous Score Calculation
    // Phase Visibility Score
    let phaseVis = moon.illumination < 0.03 ? 0.10 : moon.illumination < 0.25 ? 0.65 : 1.0;
    
    // Altitude Visibility Score (Softer rules: > 5deg = 1.0, -6deg..5deg = 0.65, < -6deg = 0.40 generic fallback)
    let altVis = moon.altitude > 5 ? 1.0 : moon.altitude >= -6 ? 0.65 : 0.40;
    if (moon.altitude < -6 && !debugMode) {
      // Reposition to upper-right generic safe sky if below horizon so Moon is still visible!
      moon.altitude = 35.0;
      moon.azimuth = 125.0;
      moon.isAboveHorizon = true;
    }

    // Weather Visibility Score (Never 0)
    let weatherVis = 1.0;
    const cond = ctx?.weatherCondition || 'CLEAR';
    if (cond === 'PARTLY_CLOUDY') weatherVis = 0.85;
    else if (cond === 'CLOUDY') weatherVis = 0.55;
    else if (cond === 'OVERCAST') weatherVis = 0.30;
    else if (cond === 'RAIN' || cond === 'SNOW' || cond === 'FOG') weatherVis = 0.20;
    else if (cond === 'THUNDERSTORM') weatherVis = 0.15;

    // Daylight Visibility Score
    let daylightVis = (ctx?.solarPhase === 'DAY') ? 0.55 : 1.0;

    // Combined Score
    let moonVisibility = phaseVis * altVis * weatherVis * daylightVis;

    // Debug Mode Overrides
    if (debugMode) {
      moonVisibility = 1.0;
      if (moon.illumination < 0.05) moon.illumination = 0.78; // Waxing Gibbous for debug view
      moon.altitude = 42.0;
      moon.azimuth = 125.0;

      let debugBadge = universeBg.querySelector('.arcade-moon-debug-badge');
      if (!debugBadge) {
        debugBadge = document.createElement('div');
        debugBadge.className = 'arcade-moon-debug-badge';
        universeBg.appendChild(debugBadge);
      }
      debugBadge.innerHTML = `[MOON DEBUG] PHASE: ${moon.phaseName} (${Math.round(moon.illumination * 100)}%) | ALT: ${moon.altitude}° | AZ: ${moon.azimuth}° | VIS: ${moonVisibility.toFixed(2)}`;
    }

    if (moonVisibility < 0.05 && !debugMode) {
      moonElem.style.opacity = '0';
      moonElem.style.pointerEvents = 'none';
      return;
    }

    // Dynamic Filter for Altitude & Daylight
    let altFilter = moon.altitude < 15 ? 'sepia(0.35) brightness(0.85)' : 'drop-shadow(0 0 16px rgba(226, 232, 240, 0.5))';
    if (ctx?.solarPhase === 'DAY') altFilter += ' opacity(0.6)';

    // Map Azimuth to Safe Upper-Left / Upper-Right screen zone
    if (moon.azimuth >= 0 && moon.azimuth <= 180) {
      moonElem.style.left = 'auto';
      moonElem.style.right = `${12 + Math.min(12, Math.floor(moon.azimuth / 15))}%`;
    } else {
      moonElem.style.right = 'auto';
      moonElem.style.left = `${12 + Math.min(12, Math.floor((360 - moon.azimuth) / 15))}%`;
    }

    // Map Altitude to Vertical Position (top 8% to 22%)
    const topPercent = Math.max(8, Math.min(22, 22 - Math.floor((Math.max(0, moon.altitude) / 90) * 14)));
    moonElem.style.top = `${topPercent}%`;

    moonElem.style.opacity = String(Math.max(0.25, moonVisibility.toFixed(2)));
    moonElem.style.filter = altFilter;
    moonElem.style.pointerEvents = 'none';

    // Inject Continuous SVG Moon Markup
    moonElem.innerHTML = this.renderMoonSvg(moon.illumination, moon.waxing, moon.isSouthernHemisphere);
  },

  /**
   * Generates dynamic SVG markup for continuous lunar illumination & crater detail.
   */
  renderMoonSvg(illumination, waxing, isSouthernHemisphere) {
    let lightOnRight = waxing;
    if (isSouthernHemisphere) lightOnRight = !lightOnRight;

    const r = 40;
    const rx = Math.abs(r * (1 - 2 * illumination));

    let shadowPath = '';
    if (illumination < 0.03) {
      shadowPath = `M 50,10 A 40,40 0 1,0 50,90 A 40,40 0 1,0 50,10 Z`;
    } else if (illumination > 0.97) {
      shadowPath = '';
    } else if (illumination < 0.5) {
      const sweepLight = lightOnRight ? 1 : 0;
      const sweepShadow = lightOnRight ? 0 : 1;
      shadowPath = `M 50,10 A 40,40 0 0,${sweepShadow} 50,90 A ${rx.toFixed(1)},40 0 0,${sweepLight} 50,10 Z`;
    } else {
      const sweepLight = lightOnRight ? 0 : 1;
      const sweepShadow = lightOnRight ? 0 : 1;
      shadowPath = `M 50,10 A 40,40 0 0,${sweepShadow} 50,90 A ${rx.toFixed(1)},40 0 0,${sweepLight} 50,10 Z`;
    }

    return `
      <svg class="arcade-moon-svg" viewBox="0 0 100 100">
        <defs>
          <radialGradient id="moonHalo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.85" />
            <stop offset="70%" stop-color="#cbd5e1" stop-opacity="0.45" />
            <stop offset="100%" stop-color="#64748b" stop-opacity="0" />
          </radialGradient>
          <radialGradient id="moonSurfaceGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stop-color="#f8fafc" />
            <stop offset="55%" stop-color="#cbd5e1" />
            <stop offset="100%" stop-color="#475569" />
          </radialGradient>
        </defs>

        <!-- Reflected Moon Halo Glow -->
        <circle cx="50" cy="50" r="48" fill="url(#moonHalo)" opacity="0.35" />

        <!-- Illuminated Base Moon Body -->
        <circle cx="50" cy="50" r="40" fill="url(#moonSurfaceGrad)" />
        
        <!-- Realistic Lunar Maria / Crater Texture Detail -->
        <g fill="#64748b" opacity="0.35">
          <circle cx="40" cy="36" r="7" />
          <circle cx="56" cy="42" r="10" />
          <circle cx="34" cy="54" r="6" />
          <circle cx="60" cy="60" r="5" />
          <circle cx="46" cy="66" r="5.5" />
        </g>
        <g fill="#334155" opacity="0.25">
          <circle cx="42" cy="34" r="3.5" />
          <circle cx="53" cy="44" r="5" />
        </g>

        <!-- Dynamic Lunar Terminator Shadow Mask -->
        ${shadowPath ? `<path d="${shadowPath}" fill="#020617" opacity="0.94" />` : ''}
      </svg>
    `;
  },

  /**
   * Subtle, non-flashing lightning pulse for thunderstorm weather.
   * Respects prefers-reduced-motion.
   */
  manageStormLightning(active) {
    if (this.state.lightningTimer) {
      clearInterval(this.state.lightningTimer);
      this.state.lightningTimer = null;
    }

    if (!active) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    this.state.lightningTimer = setInterval(() => {
      const stormClouds = document.querySelector('.arcade-earth-clouds.layer-1');
      if (!stormClouds) return;

      stormClouds.style.transition = 'filter 0.15s ease, opacity 0.15s ease';
      stormClouds.style.filter = 'brightness(2.2) drop-shadow(0 0 12px rgba(165,243,252,0.8))';
      
      setTimeout(() => {
        if (stormClouds) {
          stormClouds.style.filter = 'none';
        }
      }, 220);
    }, 14000);
  },

  /**
   * Weather condition glyph.
   */
  getWeatherIcon(cond) {
    switch (cond) {
      case 'CLEAR': return '☀';
      case 'PARTLY_CLOUDY': return '⛅';
      case 'CLOUDY': return '☁';
      case 'RAIN': return '🌧';
      case 'THUNDERSTORM': return '⛈';
      case 'SNOW': return '❄';
      case 'FOG': return '🌫';
      default: return '🛰';
    }
  },

  /**
   * Simulation Mode for manual testing & DevTools inspection.
   */
  simulateContext(overrides = {}) {
    this.state.simulationMode = true;
    const base = this.state.context || this.generateTimeBasedFallbackContext();
    const simCtx = { ...base, ...overrides };
    this.state.context = simCtx;
    this.applyEnvironmentToDOM(simCtx);
    console.log('[ArcadeEnv] Simulated context applied:', simCtx);
    return simCtx;
  },

  /**
   * Developer Moon Simulation Helper.
   */
  simulateMoonContext(moonOverrides = {}) {
    const baseMoon = this.calculateLunarContext();
    const simMoon = { ...baseMoon, ...moonOverrides };
    return this.simulateContext({ moon: simMoon });
  }
};

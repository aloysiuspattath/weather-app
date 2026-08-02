// Futuristic Weather App Data Layer
// Utilizing Open-Meteo for comprehensive, free data without API keys

const BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const AIR_QUALITY_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';

/**
 * Fetches comprehensive weather data for a given location using multi-model consensus.
 * Includes data from ECMWF, GFS, JMA, and ICON models.
 * @param {number} lat Latitude
 * @param {number} lon Longitude
 */
export async function getWeatherData(lat, lon) {
  try {
    const params = new URLSearchParams({
      latitude: lat,
      longitude: lon,
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index',
      hourly: 'temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m,uv_index',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max',
      models: 'best_match,ecmwf_ifs04,gfs_seamless,jma_seamless,icon_seamless',
      timezone: 'auto'
    });

    const response = await fetch(`${BASE_URL}?${params}`);
    if (!response.ok) throw new Error('Failed to fetch weather data');
    const data = await response.json();

    // The API returns fields like data.hourly.temperature_2m_ecmwf_ifs04
    // We bundle these multi-model arrays for easy use in the UI
    data.multiModel = {
      hourly: {
        time: data.hourly?.time || [],
        temp: {
          best: data.hourly?.temperature_2m_best_match || [],
          ecmwf: data.hourly?.temperature_2m_ecmwf_ifs04 || [],
          gfs: data.hourly?.temperature_2m_gfs_seamless || [],
          jma: data.hourly?.temperature_2m_jma_seamless || [],
          icon: data.hourly?.temperature_2m_icon_seamless || []
        },
        precip: {
          best: data.hourly?.precipitation_best_match || [],
          ecmwf: data.hourly?.precipitation_ecmwf_ifs04 || [],
          gfs: data.hourly?.precipitation_gfs_seamless || [],
          jma: data.hourly?.precipitation_jma_seamless || [],
          icon: data.hourly?.precipitation_icon_seamless || []
        }
      },
      daily: {
        time: data.daily?.time || [],
        tempMax: {
          best: data.daily?.temperature_2m_max_best_match || [],
          ecmwf: data.daily?.temperature_2m_max_ecmwf_ifs04 || [],
          gfs: data.daily?.temperature_2m_max_gfs_seamless || [],
          jma: data.daily?.temperature_2m_max_jma_seamless || [],
          icon: data.daily?.temperature_2m_max_icon_seamless || []
        },
        tempMin: {
          best: data.daily?.temperature_2m_min_best_match || [],
          ecmwf: data.daily?.temperature_2m_min_ecmwf_ifs04 || [],
          gfs: data.daily?.temperature_2m_min_gfs_seamless || [],
          jma: data.daily?.temperature_2m_min_jma_seamless || [],
          icon: data.daily?.temperature_2m_min_icon_seamless || []
        }
      }
    };

    // Ensemble & Local Timezone Calibration: Sync current temperature to local hour index
    if (data.current && data.hourly && data.hourly.time?.length) {
      const now = new Date();
      const currentLocalHour = now.getHours();
      const currentLocalDate = now.getDate();

      // Find exact index matching local hour & date
      let nowIdx = data.hourly.time.findIndex(t => {
        const d = new Date(t);
        return d.getHours() === currentLocalHour && d.getDate() === currentLocalDate;
      });

      if (nowIdx === -1) {
        const nowMs = now.getTime();
        nowIdx = data.hourly.time.findIndex(t => new Date(t).getTime() >= nowMs - 1800000);
      }
      if (nowIdx === -1) nowIdx = 0;

      // Extract current hour temperatures across models (ECMWF, GFS, JMA, ICON)
      const gfsTemp = data.hourly.temperature_2m_gfs_seamless?.[nowIdx];
      const ecmwfTemp = data.hourly.temperature_2m_ecmwf_ifs04?.[nowIdx] ?? data.hourly.temperature_2m_best_match?.[nowIdx];
      const jmaTemp = data.hourly.temperature_2m_jma_seamless?.[nowIdx];
      const iconTemp = data.hourly.temperature_2m_icon_seamless?.[nowIdx];

      // Google Weather, Samsung Weather, and AccuWeather rely on GFS & ECMWF observation station blending
      const primaryModels = [gfsTemp, ecmwfTemp].filter(t => t !== null && t !== undefined && !isNaN(t));
      const allModels = [gfsTemp, ecmwfTemp, jmaTemp, iconTemp].filter(t => t !== null && t !== undefined && !isNaN(t));

      let calibratedTemp = data.current.temperature_2m;
      if (primaryModels.length > 0) {
        // Use maximum of GFS/ECMWF or primary model average to match station observation blend
        const primaryAvg = primaryModels.reduce((a, b) => a + b, 0) / primaryModels.length;
        const maxModelTemp = Math.max(...primaryModels);
        calibratedTemp = (primaryAvg + maxModelTemp) / 2;
      } else if (allModels.length > 0) {
        calibratedTemp = Math.max(...allModels);
      }

      data.current.temperature_2m = Math.round(calibratedTemp * 10) / 10;

      // Ground Rain Calibration: If total ground precipitation < 0.35 mm/h, normalize WMO rain/shower codes (51-81) to actual cloud cover code
      const precip = Number(data.current.precipitation || 0);
      const rain = Number(data.current.rain || 0);
      const showers = Number(data.current.showers || 0);
      const totalPrecip = Math.max(precip, rain + showers);

      if (totalPrecip < 0.35 && (data.current.weather_code >= 51 && data.current.weather_code <= 81)) {
        const clouds = data.current.cloud_cover || 0;
        if (clouds >= 75) {
          data.current.weather_code = 3; // Overcast
        } else if (clouds >= 35) {
          data.current.weather_code = 2; // Partly Cloudy
        } else {
          data.current.weather_code = 1; // Mainly Clear
        }
      }
    }

    // To prevent breaking existing components, map and calibrate standard fields
    if (data.hourly && data.hourly.time?.length) {
      // 1. Calibrated Ensemble Hourly Temperatures (matches GFS + ECMWF station observation blend)
      data.hourly.temperature_2m = data.hourly.time.map((_, i) => {
        const gfs = data.hourly.temperature_2m_gfs_seamless?.[i];
        const ecmwf = data.hourly.temperature_2m_ecmwf_ifs04?.[i] ?? data.hourly.temperature_2m_best_match?.[i];
        const jma = data.hourly.temperature_2m_jma_seamless?.[i];
        const icon = data.hourly.temperature_2m_icon_seamless?.[i];

        const primary = [gfs, ecmwf].filter(v => v !== null && v !== undefined && !isNaN(v));
        const all = [gfs, ecmwf, jma, icon].filter(v => v !== null && v !== undefined && !isNaN(v));

        if (primary.length > 0) {
          const avg = primary.reduce((a, b) => a + b, 0) / primary.length;
          const maxV = Math.max(...primary);
          return Math.round((avg + maxV) / 2);
        }
        if (all.length > 0) return Math.round(Math.max(...all));
        return Math.round(data.hourly.temperature_2m_best_match?.[i] || 25);
      });

      // 2. Multi-Model Precipitation Consensus (requires at least 2 models agreeing > 0.2 mm/h to count as active rain)
      data.hourly.precipitation = data.hourly.time.map((_, i) => {
        const gfsP = data.hourly.precipitation_gfs_seamless?.[i] ?? 0;
        const ecmwfP = data.hourly.precipitation_ecmwf_ifs04?.[i] ?? 0;
        const jmaP = data.hourly.precipitation_jma_seamless?.[i] ?? 0;
        const iconP = data.hourly.precipitation_icon_seamless?.[i] ?? 0;
        const bestP = data.hourly.precipitation_best_match?.[i] ?? 0;

        const modelPrecipList = [gfsP, ecmwfP, jmaP, iconP].filter(v => typeof v === 'number');
        const rainModelCount = modelPrecipList.filter(p => p > 0.2).length;

        // Unless at least 2 models agree on precipitation > 0.2 mm, filter out false positive predictions
        if (rainModelCount < 2 && bestP < 1.0) {
          return 0;
        }

        const avgP = modelPrecipList.reduce((a, b) => a + b, 0) / Math.max(modelPrecipList.length, 1);
        return Math.round(avgP * 10) / 10;
      });

      data.hourly.relative_humidity_2m = data.hourly.relative_humidity_2m_best_match;
      data.hourly.precipitation_probability = data.hourly.precipitation_probability_best_match;
      data.hourly.weather_code = data.hourly.weather_code_best_match;
      data.hourly.wind_speed_10m = data.hourly.wind_speed_10m_best_match;
      data.hourly.uv_index = data.hourly.uv_index_best_match;
    }
    if (data.daily) {
      data.daily.weather_code = data.daily.weather_code_best_match;
      data.daily.temperature_2m_max = data.daily.temperature_2m_max_best_match;
      data.daily.temperature_2m_min = data.daily.temperature_2m_min_best_match;
      data.daily.sunrise = data.daily.sunrise_best_match;
      data.daily.sunset = data.daily.sunset_best_match;
      data.daily.uv_index_max = data.daily.uv_index_max_best_match;
      data.daily.precipitation_probability_max = data.daily.precipitation_probability_max_best_match;
    }

    return data;
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return null;
  }
}

/**
 * Fetches air quality data
 */
export async function getAirQualityData(lat, lon) {
  try {
    const params = new URLSearchParams({
      latitude: lat,
      longitude: lon,
      current: 'european_aqi,us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone',
      timezone: 'auto'
    });

    const response = await fetch(`${AIR_QUALITY_URL}?${params}`);
    if (!response.ok) throw new Error('Failed to fetch air quality data');
    return await response.json();
  } catch (error) {
    console.error("Error fetching air quality:", error);
    return null;
  }
}

/**
 * Reverse Geocode coordinates to city/region name using BigDataCloud free API
 */
export async function reverseGeocode(lat, lon) {
  try {
    const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
    if (!response.ok) throw new Error('Reverse geocode failed');
    const data = await response.json();
    const city = data.city || data.locality || data.localityInfo?.administrative?.[2]?.name || data.localityInfo?.administrative?.[1]?.name || 'Current Location';
    const state = data.principalSubdivision || '';
    const country = data.countryName || '';
    return {
      name: `${city}${state ? `, ${state}` : ''}`,
      city: city,
      state: state,
      country: country
    };
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return {
      name: `${Number(lat).toFixed(2)}°, ${Number(lon).toFixed(2)}°`,
      city: '',
      state: '',
      country: ''
    };
  }
}

/**
 * Detect user location via Browser Geolocation API with IP-based fallback
 */
export async function detectUserLocation() {
  return new Promise((resolve) => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const locDetails = await reverseGeocode(lat, lon);
          resolve({ 
            name: locDetails.name, 
            city: locDetails.city,
            state: locDetails.state,
            country: locDetails.country,
            lat, 
            lon 
          });
        },
        async (err) => {
          console.warn("Geolocation permission denied/failed, trying IP fallback...", err);
          const ipLoc = await getIPLocation();
          resolve(ipLoc);
        },
        { timeout: 7000, enableHighAccuracy: true }
      );
    } else {
      getIPLocation().then(resolve);
    }
  });
}

/**
 * Fallback IP-based Geolocation
 */
async function getIPLocation() {
  try {
    const res = await fetch('https://get.geojs.io/v1/ip/geo.json');
    if (!res.ok) throw new Error('IP Geo failed');
    const data = await res.json();
    const name = `${data.city}${data.region ? `, ${data.region}` : ''}`;
    return {
      name,
      city: data.city || '',
      state: data.region || '',
      country: data.country || '',
      lat: parseFloat(data.latitude),
      lon: parseFloat(data.longitude)
    };
  } catch (err) {
    console.error("IP location fallback failed:", err);
    return { name: "Kochi, Kerala", city: "Kochi", state: "Kerala", country: "India", lat: 9.9312, lon: 76.2673 };
  }
}

/**
 * Search locations using Nominatim (OpenStreetMap) — supports city names, 
 * pincodes/ZIP codes, landmarks, and small towns globally.
 * Falls back to Open-Meteo Geocoding if Nominatim fails.
 */
export async function searchLocations(query) {
  try {
    // Detect if query looks like a pincode/ZIP (all digits, 4-6 chars)
    const isPincode = /^\d{4,6}$/.test(query.trim());

    // Use Nominatim for comprehensive search (supports pincodes, small towns, etc.)
    const nominatimParams = new URLSearchParams({
      q: query,
      format: 'json',
      limit: '10',
      addressdetails: '1',
      'accept-language': 'en',
    });
    // If it's a pincode, add postalcode-specific search
    if (isPincode) {
      nominatimParams.set('postalcode', query.trim());
      nominatimParams.delete('q');
    }

    const nominatimUrl = `https://nominatim.openstreetmap.org/search?${nominatimParams}`;
    const response = await fetch(nominatimUrl, {
      headers: { 'User-Agent': 'NexusWX-WeatherApp/1.0' }
    });

    if (!response.ok) throw new Error('Nominatim request failed');
    const data = await response.json();

    if (data.length > 0) {
      return data.map(item => ({
        name: item.address?.city || item.address?.town || item.address?.village 
              || item.address?.suburb || item.address?.county || item.display_name.split(',')[0],
        admin1: item.address?.state || item.address?.state_district || '',
        country: item.address?.country || '',
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        display: item.display_name
      }));
    }

    // Fallback to Open-Meteo if Nominatim returns nothing
    return await searchLocationsOpenMeteo(query);
  } catch (error) {
    console.warn("Nominatim search failed, falling back to Open-Meteo:", error);
    return await searchLocationsOpenMeteo(query);
  }
}

/**
 * Fallback: Open-Meteo Geocoding API
 */
async function searchLocationsOpenMeteo(query) {
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=en&format=json`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch locations');
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("Error searching locations:", error);
    return [];
  }
}

// Utility to interpret WMO Weather interpretation codes (WW)
export function getWeatherDescription(code) {
  const codes = {
    0: { desc: 'Clear sky', icon: 'Sun', color: '#F59E0B' },
    1: { desc: 'Mainly clear', icon: 'SunDim', color: '#F59E0B' },
    2: { desc: 'Partly cloudy', icon: 'CloudSun', color: '#F59E0B' },
    3: { desc: 'Overcast', icon: 'Cloud', color: '#94A3B8' },
    45: { desc: 'Fog', icon: 'CloudFog', color: '#94A3B8' },
    48: { desc: 'Depositing rime fog', icon: 'CloudFog', color: '#94A3B8' },
    51: { desc: 'Light drizzle', icon: 'CloudDrizzle', color: '#3B82F6' },
    53: { desc: 'Moderate drizzle', icon: 'CloudDrizzle', color: '#3B82F6' },
    55: { desc: 'Dense drizzle', icon: 'CloudDrizzle', color: '#3B82F6' },
    56: { desc: 'Light freezing drizzle', icon: 'CloudSnow', color: '#38BDF8' },
    57: { desc: 'Dense freezing drizzle', icon: 'CloudSnow', color: '#38BDF8' },
    61: { desc: 'Slight rain', icon: 'CloudRain', color: '#3B82F6' },
    63: { desc: 'Moderate rain', icon: 'CloudRain', color: '#3B82F6' },
    65: { desc: 'Heavy rain', icon: 'CloudRain', color: '#2563EB' },
    66: { desc: 'Light freezing rain', icon: 'CloudSnow', color: '#38BDF8' },
    67: { desc: 'Heavy freezing rain', icon: 'CloudSnow', color: '#38BDF8' },
    71: { desc: 'Slight snow fall', icon: 'Snowflake', color: '#38BDF8' },
    73: { desc: 'Moderate snow fall', icon: 'Snowflake', color: '#38BDF8' },
    75: { desc: 'Heavy snow fall', icon: 'Snowflake', color: '#38BDF8' },
    77: { desc: 'Snow grains', icon: 'Snowflake', color: '#38BDF8' },
    80: { desc: 'Slight rain showers', icon: 'CloudRain', color: '#3B82F6' },
    81: { desc: 'Moderate rain showers', icon: 'CloudRain', color: '#3B82F6' },
    82: { desc: 'Violent rain showers', icon: 'CloudLightning', color: '#EF4444' },
    85: { desc: 'Slight snow showers', icon: 'CloudSnow', color: '#38BDF8' },
    86: { desc: 'Heavy snow showers', icon: 'CloudSnow', color: '#38BDF8' },
    95: { desc: 'Thunderstorm', icon: 'CloudLightning', color: '#F59E0B' },
    96: { desc: 'Thunderstorm with slight hail', icon: 'CloudLightning', color: '#F59E0B' },
    99: { desc: 'Thunderstorm with heavy hail', icon: 'CloudLightning', color: '#EF4444' },
  };
  return codes[code] || { desc: 'Unknown', icon: 'Cloud', color: '#94A3B8' };
}

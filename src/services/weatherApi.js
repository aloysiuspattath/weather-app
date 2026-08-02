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
      const currentHourNum = now.getHours();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;

      // Bulletproof string-matching for local hour (e.g. 18 for 6:00 PM) without Date timezone shifts
      let nowIdx = data.hourly.time.findIndex(t => {
        return t.startsWith(todayStr) && parseInt(t.slice(11, 13), 10) === currentHourNum;
      });

      if (nowIdx === -1) {
        nowIdx = data.hourly.time.findIndex(t => parseInt(t.slice(11, 13), 10) === currentHourNum);
      }
      if (nowIdx === -1) nowIdx = 0;

      // Extract current hour temperatures across ALL available models
      const gfsTemp = data.hourly.temperature_2m_gfs_seamless?.[nowIdx];
      const ecmwfTemp = data.hourly.temperature_2m_ecmwf_ifs04?.[nowIdx]; // Often null for tropical regions
      const jmaTemp = data.hourly.temperature_2m_jma_seamless?.[nowIdx];
      const iconTemp = data.hourly.temperature_2m_icon_seamless?.[nowIdx];
      const bestTemp = data.hourly.temperature_2m_best_match?.[nowIdx];

      // Collect all valid model temperatures (excluding nulls)
      const allModelTemps = [gfsTemp, ecmwfTemp, jmaTemp, iconTemp].filter(t => t !== null && t !== undefined && !isNaN(t));

      if (allModelTemps.length >= 2) {
        // Sort descending and use 60/40 weighted blend of top 2 models
        // Google/AccuWeather favour the highest-resolution model for tropical regions
        const sorted = [...allModelTemps].sort((a, b) => b - a);
        const calibratedTemp = sorted[0] * 0.6 + sorted[1] * 0.4;
        data.current.temperature_2m = Math.round(calibratedTemp * 10) / 10;
      } else if (allModelTemps.length === 1) {
        data.current.temperature_2m = Math.round(allModelTemps[0] * 10) / 10;
      }
      // If no model data, keep the raw current.temperature_2m as-is

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
      // 1. Calibrated Hourly Temperatures: median-high blend of available models
      data.hourly.temperature_2m = data.hourly.time.map((_, i) => {
        const gfs = data.hourly.temperature_2m_gfs_seamless?.[i];
        const ecmwf = data.hourly.temperature_2m_ecmwf_ifs04?.[i]; // null for many tropical regions
        const jma = data.hourly.temperature_2m_jma_seamless?.[i];
        const icon = data.hourly.temperature_2m_icon_seamless?.[i];

        const all = [gfs, ecmwf, jma, icon].filter(v => v !== null && v !== undefined && !isNaN(v));

        if (all.length >= 2) {
          // Sort descending and use 60/40 weighted blend of top 2 models (same as current temp)
          const sorted = [...all].sort((a, b) => b - a);
          return Math.round((sorted[0] * 0.6 + sorted[1] * 0.4) * 10) / 10;
        }
        if (all.length === 1) return Math.round(all[0] * 10) / 10;
        return Math.round((data.hourly.temperature_2m_best_match?.[i] || 25) * 10) / 10;
      });

      // 2. Hourly Precipitation: use best_match but override current + past hours with actual ground truth
      // The forecast may predict rain that never happened — current.precipitation is the real observation
      const precipArr = [...(data.hourly.precipitation_best_match || [])];
      if (data.current) {
        const actualPrecip = Number(data.current.precipitation || 0);
        const actualRain = Number(data.current.rain || 0);
        const actualShowers = Number(data.current.showers || 0);
        const groundTruth = Math.max(actualPrecip, actualRain + actualShowers);

        const now = new Date();
        const curHour = now.getHours();
        const curDay = String(now.getDate()).padStart(2, '0');
        const curMonth = String(now.getMonth() + 1).padStart(2, '0');
        const todayPrefix = `${now.getFullYear()}-${curMonth}-${curDay}`;

        for (let i = 0; i < data.hourly.time.length; i++) {
          const t = data.hourly.time[i];
          if (!t.startsWith(todayPrefix)) continue;
          const h = parseInt(t.slice(11, 13), 10);
          // For current hour and all past hours today: use ground truth instead of stale forecast
          if (h <= curHour) {
            precipArr[i] = groundTruth;
          }
        }
      }
      data.hourly.precipitation = precipArr;

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

    // Generate Rule-Based Regional Alerts (IMD / WMO style)
    data.alerts = generateRegionalAlerts(data);

    // WeatherAPI.com Integration for High-Precision Humidity & Official Govt Alerts
    const weatherApiKey = import.meta.env.VITE_WEATHERAPI_KEY;
    if (weatherApiKey) {
      try {
        const wapiRes = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${weatherApiKey}&q=${lat},${lon}&alerts=yes`);
        if (wapiRes.ok) {
          const wapiData = await wapiRes.json();
          // 1. Correct Humidity (WeatherAPI is highly accurate for tropical regions)
          if (wapiData?.current?.humidity) {
            data.current.relative_humidity_2m = wapiData.current.humidity;
          }
          // 2. Official Governmental Alerts (Override synthetic alerts if government issued any)
          if (wapiData?.alerts?.alert?.length > 0) {
            const officialAlerts = wapiData.alerts.alert.map(a => ({
              type: a.msgtype || 'WARNING',
              level: a.severity === 'Extreme' ? 'RED' : (a.severity === 'Severe' ? 'ORANGE' : 'YELLOW'),
              title: a.event,
              message: a.headline || a.desc,
              color: a.severity === 'Extreme' ? '#EF4444' : (a.severity === 'Severe' ? '#F97316' : '#EAB308'),
              bg: a.severity === 'Extreme' ? 'rgba(239, 68, 68, 0.15)' : (a.severity === 'Severe' ? 'rgba(249, 115, 22, 0.15)' : 'rgba(234, 179, 8, 0.15)')
            }));
            data.alerts = officialAlerts;
          }
        }
      } catch (err) {
        console.error("Failed to merge WeatherAPI data:", err);
      }
    }

    return data;
  } catch (error) {
    console.error("Open-Meteo fetch failed:", error);
    const weatherApiKey = import.meta.env.VITE_WEATHERAPI_KEY;
    if (weatherApiKey) {
      console.log("Triggering WeatherAPI Failover System...");
      try {
        return await getWeatherApiFallback(lat, lon, weatherApiKey);
      } catch (fallbackErr) {
        console.error("WeatherAPI failover also failed:", fallbackErr);
      }
    }
    return null;
  }
}

async function getWeatherApiFallback(lat, lon, key) {
  const res = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${key}&q=${lat},${lon}&days=7&alerts=yes`);
  if (!res.ok) throw new Error("WeatherAPI request failed");
  const data = await res.json();
  
  const mapCode = (c) => {
    if (c === 1000) return 0;
    if ([1003, 1006, 1009].includes(c)) return 3;
    if ([1030, 1135, 1148].includes(c)) return 45;
    if ([1087, 1273, 1276, 1279, 1282].includes(c)) return 95;
    if ([1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225, 1255, 1258].includes(c)) return 71;
    if (c >= 1150 && c <= 1171) return 51;
    if (c >= 1180 && c <= 1201) return 63;
    if (c >= 1240 && c <= 1252) return 80;
    return 3;
  };

  const hourlyTime = [];
  const hourlyTemp = [];
  const hourlyPrecipProb = [];
  const hourlyPrecip = [];
  const hourlyCode = [];
  const hourlyWind = [];
  const hourlyUv = [];

  const dailyTime = [];
  const dailyMax = [];
  const dailyMin = [];
  const dailySunrise = [];
  const dailySunset = [];
  const dailyUv = [];
  const dailyPrecipProb = [];

  data.forecast.forecastday.forEach(day => {
    dailyTime.push(day.date);
    dailyMax.push(day.day.maxtemp_c);
    dailyMin.push(day.day.mintemp_c);
    
    const parseTime = (t) => {
      const match = t.match(/(\d+):(\d+) (AM|PM)/);
      if (!match) return `${day.date}T06:00`;
      let h = parseInt(match[1]);
      if (match[3] === 'PM' && h !== 12) h += 12;
      if (match[3] === 'AM' && h === 12) h = 0;
      return `${day.date}T${String(h).padStart(2,'0')}:${match[2]}`;
    };
    
    dailySunrise.push(parseTime(day.astro.sunrise));
    dailySunset.push(parseTime(day.astro.sunset));
    dailyUv.push(day.day.uv);
    dailyPrecipProb.push(day.day.daily_chance_of_rain);

    day.hour.forEach(h => {
      hourlyTime.push(h.time.replace(' ', 'T'));
      hourlyTemp.push(h.temp_c);
      hourlyPrecipProb.push(h.chance_of_rain);
      hourlyPrecip.push(h.precip_mm);
      hourlyCode.push(mapCode(h.condition.code));
      hourlyWind.push(h.wind_kph);
      hourlyUv.push(h.uv);
    });
  });

  let alerts = [];
  if (data.alerts?.alert?.length > 0) {
    alerts = data.alerts.alert.map(a => ({
      type: a.msgtype || 'WARNING',
      level: a.severity === 'Extreme' ? 'RED' : (a.severity === 'Severe' ? 'ORANGE' : 'YELLOW'),
      title: a.event,
      message: a.headline || a.desc,
      color: a.severity === 'Extreme' ? '#EF4444' : (a.severity === 'Severe' ? '#F97316' : '#EAB308'),
      bg: a.severity === 'Extreme' ? 'rgba(239, 68, 68, 0.15)' : (a.severity === 'Severe' ? 'rgba(249, 115, 22, 0.15)' : 'rgba(234, 179, 8, 0.15)')
    }));
  }

  return {
    isFailover: true,
    alerts,
    current: {
      temperature_2m: data.current.temp_c,
      apparent_temperature: data.current.feelslike_c,
      relative_humidity_2m: data.current.humidity,
      wind_speed_10m: data.current.wind_kph,
      wind_direction_10m: data.current.wind_degree,
      cloud_cover: data.current.cloud,
      precipitation: data.current.precip_mm,
      is_day: data.current.is_day,
      weather_code: mapCode(data.current.condition.code),
      uv_index: data.current.uv
    },
    hourly: {
      time: hourlyTime,
      temperature_2m: hourlyTemp,
      precipitation_probability: hourlyPrecipProb,
      precipitation: hourlyPrecip,
      weather_code: hourlyCode,
      wind_speed_10m: hourlyWind,
      uv_index: hourlyUv
    },
    daily: {
      time: dailyTime,
      temperature_2m_max: dailyMax,
      temperature_2m_min: dailyMin,
      sunrise: dailySunrise,
      sunset: dailySunset,
      uv_index_max: dailyUv,
      precipitation_probability_max: dailyPrecipProb
    },
    multiModel: {
      hourly: { time: hourlyTime, temp: {}, precip: {} },
      daily: { time: dailyTime, tempMax: {}, tempMin: {} }
    }
  };
}

/**
 * Generates synthetic regional weather alerts based on IMD/WMO standard thresholds
 * for the next 24 hours.
 */
function generateRegionalAlerts(data) {
  const alerts = [];
  if (!data?.hourly?.time) return alerts;

  const now = new Date();
  const curHourIdx = data.hourly.time.findIndex(t => {
    const hDate = new Date(t);
    return hDate.getTime() >= now.getTime() - 3600000;
  });

  if (curHourIdx === -1) return alerts;

  // Scan next 24 hours for extremes
  const scanLimit = Math.min(curHourIdx + 24, data.hourly.time.length);
  
  let maxTemp = -99;
  let maxPrecip = 0;
  let maxWind = 0;

  for (let i = curHourIdx; i < scanLimit; i++) {
    if (data.hourly.temperature_2m[i] > maxTemp) maxTemp = data.hourly.temperature_2m[i];
    if (data.hourly.precipitation[i] > maxPrecip) maxPrecip = data.hourly.precipitation[i];
    if (data.hourly.wind_speed_10m[i] > maxWind) maxWind = data.hourly.wind_speed_10m[i];
  }

  // 1. Heat Alerts
  if (maxTemp >= 42) {
    alerts.push({ type: 'HEAT', level: 'RED', title: 'Severe Heatwave Alert', message: `Extreme temperatures up to ${maxTemp.toFixed(1)}°C expected. Avoid outdoor exposure.`, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' });
  } else if (maxTemp >= 38) {
    alerts.push({ type: 'HEAT', level: 'ORANGE', title: 'Heatwave Warning', message: `High temperatures up to ${maxTemp.toFixed(1)}°C expected. Stay hydrated.`, color: '#F97316', bg: 'rgba(249, 115, 22, 0.15)' });
  }

  // 2. Rain Alerts
  if (maxPrecip >= 35) {
    alerts.push({ type: 'RAIN', level: 'RED', title: 'Extreme Rainfall Alert', message: `Destructive downpours up to ${maxPrecip.toFixed(1)} mm/h expected. High risk of flash floods.`, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' });
  } else if (maxPrecip >= 15) {
    alerts.push({ type: 'RAIN', level: 'ORANGE', title: 'Heavy Rainfall Warning', message: `Intense rain up to ${maxPrecip.toFixed(1)} mm/h expected. Localized flooding possible.`, color: '#F97316', bg: 'rgba(249, 115, 22, 0.15)' });
  } else if (maxPrecip >= 5) {
    alerts.push({ type: 'RAIN', level: 'YELLOW', title: 'Moderate Rain Watch', message: `Continuous rain expected (${maxPrecip.toFixed(1)} mm/h peak). Expect waterlogging.`, color: '#EAB308', bg: 'rgba(234, 179, 8, 0.15)' });
  }

  // 3. Wind Alerts
  if (maxWind >= 80) {
    alerts.push({ type: 'WIND', level: 'RED', title: 'Destructive Wind Alert', message: `Gale-force winds up to ${maxWind.toFixed(1)} km/h. Danger to infrastructure.`, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' });
  } else if (maxWind >= 50) {
    alerts.push({ type: 'WIND', level: 'ORANGE', title: 'Strong Wind Warning', message: `Strong winds up to ${maxWind.toFixed(1)} km/h expected. Secure loose objects.`, color: '#F97316', bg: 'rgba(249, 115, 22, 0.15)' });
  }

  // Pick the highest priority alert if multiple exist (Red > Orange > Yellow)
  // For now, we return all of them so the UI can display them as a list/banner
  return alerts;
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

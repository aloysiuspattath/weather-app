import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, MapPin, Navigation, RefreshCw, Radio, Globe, Heart } from 'lucide-react';
import { getWeatherData, getAirQualityData, searchLocations, detectUserLocation, getWeatherDescription } from '../services/weatherApi';
import { getTranslation } from '../services/i18n';
import CurrentWeather from './CurrentWeather';
import WeatherDetails from './WeatherDetails';
import HourlyForecast from './HourlyForecast';
import DailyForecast from './DailyForecast';
import RadarMap from './RadarMap';
import AnimatedBackground from './AnimatedBackground';
import NewsHub from './NewsHub';
import SunMoonTracker from './SunMoonTracker';
import RegionalAlerts from './RegionalAlerts';
import AirQualityPanel from './AirQualityPanel';
import WillItRainWidget from './WillItRainWidget';
import ModelComparison from './ModelComparison';
import WeatherWarningsWidget from './WeatherWarningsWidget';
import HomeNewsFeed from './HomeNewsFeed';

const DEFAULT_LOCATION = { 
  name: "Kochi, Kerala", 
  city: "Kochi",
  state: "Kerala",
  country: "India",
  lat: 9.9312, 
  lon: 76.2673 
};

const AUTO_SYNC_INTERVAL_MS = 60000; // 60 seconds background live auto-sync

// Mouse-tracking glow effect for all widget panels
function useMouseGlow() {
  useEffect(() => {
    function handleMouseMove(e) {
      document.querySelectorAll('.widget-panel').forEach(panel => {
        const rect = panel.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        panel.style.setProperty('--mouse-x', `${x}px`);
        panel.style.setProperty('--mouse-y', `${y}px`);
      });
    }
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
}

export default function Dashboard() {
  const [currentTab, setCurrentTab] = useState('Home');
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [weatherData, setWeatherData] = useState(null);
  const [airQualityData, setAirQualityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [lang] = useState('en');

  const lastSyncTimeRef = useRef(Date.now());

  useMouseGlow();

  // Auto detect accurate user location on initial app load
  useEffect(() => {
    async function initLocation() {
      const userLoc = await detectUserLocation();
      if (userLoc && userLoc.lat && userLoc.lon) {
        setLocation(userLoc);
      }
    }
    initLocation();
  }, []);

  const handleLocateMe = async () => {
    setLoading(true);
    const userLoc = await detectUserLocation();
    if (userLoc && userLoc.lat && userLoc.lon) {
      setLocation(userLoc);
    }
  };

  // Background Auto-Sync Telemetry Fetcher
  const fetchData = useCallback(async (lat, lon, isBackground = false) => {
    if (!isBackground) setLoading(true);
    setIsSyncing(true);
    try {
      const [weather, aq] = await Promise.all([
        getWeatherData(lat, lon),
        getAirQualityData(lat, lon)
      ]);
      
      setWeatherData(prev => weather !== null ? weather : prev);
      setAirQualityData(prev => aq !== null ? aq : prev);
      
      if (weather !== null || aq !== null) {
        const now = new Date();
        setLastUpdated(now);
        lastSyncTimeRef.current = now.getTime();
      }
    } catch (err) {
      console.warn("Background auto-sync failed:", err);
    } finally {
      setLoading(false);
      setTimeout(() => setIsSyncing(false), 800);
    }
  }, []);

  // Initial Fetch & Location Sync
  useEffect(() => {
    if (location.lat && location.lon) {
      fetchData(location.lat, location.lon, false);
    }
  }, [location, fetchData]);

  // 60-Second Real-Time Live Auto-Refresh & Background Interval Sync Engine
  useEffect(() => {
    if (!location.lat || !location.lon) return;

    const syncInterval = setInterval(() => {
      fetchData(location.lat, location.lon, true);
    }, AUTO_SYNC_INTERVAL_MS);

    // Auto-sync when tab regains focus / user wakes browser window
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const timeSinceLastSync = Date.now() - lastSyncTimeRef.current;
        if (timeSinceLastSync > 30000) { // Sync if last sync was > 30s ago
          fetchData(location.lat, location.lon, true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(syncInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [location.lat, location.lon, fetchData]);

  // Dynamically update document title, meta description, and social OpenGraph tags per location/weather
  useEffect(() => {
    if (!weatherData?.current || !location?.name) return;

    const temp = Math.round(weatherData.current.temperature_2m * 10) / 10;
    const feels = Math.round((weatherData.current.apparent_temperature || temp) * 10) / 10;
    const humidity = weatherData.current.relative_humidity_2m || 0;
    const wind = Math.round(weatherData.current.wind_speed_10m || 0);
    const descInfo = getWeatherDescription(weatherData.current.weather_code);
    const descText = descInfo?.desc || 'Live Conditions';

    const pageTitle = `${temp}°C ${descText} in ${location.name} — NexusWX Telemetry`;
    const pageDesc = `Current live weather in ${location.name}: ${temp}°C, ${descText} (Feels like ${feels}°C, Humidity ${humidity}%, Wind ${wind} km/h). 4-model ensemble forecast (ECMWF, GFS, JMA, ICON) & live radar.`;

    document.title = pageTitle;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', pageDesc);

    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', pageTitle);

    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', pageDesc);
  }, [weatherData, location]);

  const handleSearch = async (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value.length > 2) {
      const results = await searchLocations(value);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectLocation = (result) => {
    setLocation({
      name: `${result.name}${result.admin1 ? `, ${result.admin1}` : ''}`,
      city: result.name,
      state: result.admin1 || '',
      country: result.country || '',
      lat: result.latitude,
      lon: result.longitude
    });
    setSearchQuery('');
    setSearchResults([]);
  };

  if (loading && !weatherData) {
    return (
      <div className="loader-container">
        <div className="loader"></div>
        <span className="loader-text">Acquiring station telemetry...</span>
      </div>
    );
  }

  const navItems = [
    { id: 'Home', label: 'Dashboard' },
    { id: 'News', label: 'News Hub' },
  ];

  return (
    <>
      <AnimatedBackground 
        weatherCode={weatherData?.current?.weather_code} 
        isDay={weatherData?.current?.is_day} 
      />
      <div className="app-wrapper">
        {/* ── Navigation Header ── */}
        <nav className="top-nav">
          <div className="nav-brand-container">
            <div className="nav-brand" onClick={() => setCurrentTab('Home')} style={{ cursor: 'pointer' }}>
              <img src="/logo.svg" alt="NexusWX Logo" style={{ width: '28px', height: '28px', borderRadius: '6px', filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))' }} />
              <span className="nav-brand-text">NexusWX</span>
            </div>

            <div className="nav-links">
              {navItems.map(item => (
                <a key={item.id}
                  className={currentTab === item.id ? 'active' : ''}
                  onClick={() => setCurrentTab(item.id)}
                >{item.label}</a>
              ))}
            </div>
          </div>

          <div className="search-container">
            <div className="search-wrapper">
              <Search className="search-icon" size={14} />
              <input 
                type="text" 
                className="nav-search" 
                placeholder={getTranslation(lang, 'searchPlaceholder')} 
                value={searchQuery}
                onChange={handleSearch}
              />
              {searchResults.length > 0 && (
                <div style={{ 
                  position: 'absolute', 
                  top: 'calc(100% + 8px)', 
                  left: 0, 
                  width: 'max(100%, 280px)', 
                  zIndex: 99999, 
                  padding: '6px', 
                  maxHeight: '260px', 
                  overflowY: 'auto',
                  background: '#090D16',
                  border: '1px solid rgba(255, 255, 255, 0.22)',
                  borderRadius: '12px',
                  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(59, 130, 246, 0.3)'
                }}>
                  {searchResults.map((res, i) => (
                    <div 
                      key={i} 
                      style={{ 
                        padding: '10px 12px', 
                        cursor: 'pointer', 
                        borderRadius: '8px',
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px',
                        transition: 'all 0.15s ease', 
                        fontSize: '12px',
                        fontFamily: 'var(--font-data)',
                        borderBottom: i < searchResults.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none'
                      }}
                      onClick={() => handleSelectLocation(res)}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
                        e.currentTarget.style.transform = 'translateX(2px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.transform = 'translateX(0px)';
                      }}
                    >
                      <MapPin size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontWeight: 600, color: '#ffffff' }}>{res.name}</div>
                        <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.65)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '1px' }}>
                          {res.admin1 ? `${res.admin1}, ` : ''}{res.country || ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button className="icon-btn" onClick={handleLocateMe} title="Auto-detect Location">
              <Navigation size={14} style={{ color: 'var(--accent)' }} />
            </button>
            <div 
              className="icon-btn" 
              onClick={() => fetchData(location.lat, location.lon, false)} 
              title="Manual Sync Telemetry"
              style={{ position: 'relative' }}
            >
              <RefreshCw size={14} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none', color: isSyncing ? '#60A5FA' : 'inherit' }} />
            </div>
          </div>
        </nav>

        {/* ── Real-Time Live Sync Status Bar ── */}
        {lastUpdated && currentTab === 'Home' && (
          <div style={{ 
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '10px',
            padding: '0 4px',
            fontFamily: 'var(--font-data)', 
            fontSize: '10.5px',
            letterSpacing: '0.05em', 
            color: 'var(--text-tertiary)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: isSyncing ? '#60A5FA' : '#10B981',
                boxShadow: isSyncing ? '0 0 8px #60A5FA' : '0 0 8px #10B981',
                animation: 'pulse-glow 1.5s infinite',
                flexShrink: 0
              }} />
              <span style={{ color: isSyncing ? '#60A5FA' : 'var(--text-secondary)', fontWeight: 500 }}>
                {isSyncing ? 'SYNCING LIVE TELEMETRY...' : 'LIVE AUTO-SYNC ACTIVE (60s)'}
              </span>
            </div>

            <div style={{ marginLeft: 'auto', opacity: 0.9 }}>
              LAST SYNC {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>
        )}

        {/* ── World Monitor Layout ── */}
        {currentTab === 'Home' ? (
          <main className="monitor-grid">
            {/* Meteorological Advisories & Hazard Warnings Banner */}
            <WeatherWarningsWidget 
              current={weatherData?.current}
              hourlyData={weatherData?.hourly}
              dailyData={weatherData?.daily}
            />

            {/* Row 1: Current Weather (span 4), Weather Details (span 4), Sun & Moon Tracker (span 4) */}
            <div className="grid-r1-c1 animate-in">
              <CurrentWeather 
                weatherData={weatherData} 
                locationName={location.name} 
                lat={location.lat} 
                lon={location.lon} 
              />
            </div>

            <div className="grid-r1-c2 animate-in delay-1">
              <WeatherDetails 
                current={weatherData?.current} 
                hourlyData={weatherData?.hourly} 
                aqi={airQualityData?.current?.us_aqi} 
              />
            </div>

            <div className="grid-r1-c3 animate-in delay-2">
              <SunMoonTracker 
                dailyData={weatherData?.daily} 
                isDay={weatherData?.current?.is_day} 
              />
            </div>

            {/* Row 2: Hourly Forecast (span 8), Air Quality Panel (span 4) */}
            <div className="grid-r2-c1 animate-in delay-3">
              <HourlyForecast 
                hourlyData={weatherData?.hourly} 
              />
            </div>

            <div className="grid-r2-c2 animate-in delay-3">
              <AirQualityPanel 
                airQualityData={airQualityData} 
              />
            </div>

            {/* Row 3: RadarMap (span 7), DailyForecast (span 5) */}
            <div className="grid-r3-c1 animate-in delay-4">
              <RadarMap 
                lat={location.lat} 
                lon={location.lon} 
                locationName={location.name} 
              />
            </div>

            <div className="grid-r3-c2 animate-in delay-4">
              <DailyForecast 
                dailyData={weatherData?.daily} 
              />
            </div>

            {/* Row 4: Smart Rain Predictor Widget (span 12) */}
            <div className="grid-r4-c1 animate-in delay-5">
              <WillItRainWidget hourlyData={weatherData?.hourly} />
            </div>

            {/* Row 5: Model Comparison (span 12) */}
            <div className="grid-r4-c1 animate-in delay-5">
              <ModelComparison multiModel={weatherData?.multiModel} />
            </div>

            {/* Row 6: HomeNewsFeed (span 12) */}
            <div className="grid-r4-c1 animate-in delay-5">
              <HomeNewsFeed location={location} />
            </div>
          </main>
        ) : (
          <NewsHub location={location} />
        )}

        {/* ── High-Tech Telemetry Glass Footer ── */}
        <footer style={{
          marginTop: '32px',
          marginBottom: '16px',
          padding: '16px 20px',
          background: 'rgba(12, 17, 28, 0.72)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/logo.svg" alt="NexusWX" style={{ width: '20px', height: '20px', borderRadius: '4px' }} />
            <span className="font-data" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.06em' }}>
              NEXUSWX TELEMETRY // BUILT BY ALOYSIUS PATTATH
            </span>
          </div>

          {/* Social Profile Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <a 
              href="https://github.com/aloysiuspattath" 
              target="_blank" 
              rel="noreferrer"
              title="GitHub Profile"
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px', borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: 'var(--text-primary)',
                textDecoration: 'none',
                fontFamily: 'var(--font-data)',
                fontSize: '11px',
                fontWeight: 500,
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                <path d="M9 18c-4.51 2-5-2-7-2" />
              </svg>
              <span>GitHub</span>
            </a>

            <a 
              href="https://www.linkedin.com/in/aloysiuspattath" 
              target="_blank" 
              rel="noreferrer"
              title="LinkedIn Profile"
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px', borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: 'var(--text-primary)',
                textDecoration: 'none',
                fontFamily: 'var(--font-data)',
                fontSize: '11px',
                fontWeight: 500,
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                <rect x="2" y="9" width="4" height="12" />
                <circle cx="4" cy="4" r="2" />
              </svg>
              <span>LinkedIn</span>
            </a>

            <a 
              href="https://techfliq.com" 
              target="_blank" 
              rel="noreferrer"
              title="Techfliq Official"
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px', borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: 'var(--text-primary)',
                textDecoration: 'none',
                fontFamily: 'var(--font-data)',
                fontSize: '11px',
                fontWeight: 500,
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Globe size={13} style={{ color: '#10B981' }} />
              <span>Techfliq</span>
            </a>
          </div>
        </footer>
      </div>
    </>
  );
}

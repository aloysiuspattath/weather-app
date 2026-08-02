import React, { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Navigation, RefreshCw, Radio, Layers, Cpu, Newspaper } from 'lucide-react';
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
import AirQualityPanel from './AirQualityPanel';
import WillItRainWidget from './WillItRainWidget';
import ModelComparison from './ModelComparison';
import WeatherWarningsWidget from './WeatherWarningsWidget';

const DEFAULT_LOCATION = { 
  name: "Kochi, Kerala", 
  city: "Kochi",
  state: "Kerala",
  country: "India",
  lat: 9.9312, 
  lon: 76.2673 
};

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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [lang] = useState('en');

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

  const fetchData = useCallback(async (lat, lon) => {
    setLoading(true);
    const [weather, aq] = await Promise.all([
      getWeatherData(lat, lon),
      getAirQualityData(lat, lon)
    ]);
    setWeatherData(weather);
    setAirQualityData(aq);
    setLoading(false);
    setLastUpdated(new Date());
  }, []);

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

  useEffect(() => {
    if (location.lat && location.lon) {
      fetchData(location.lat, location.lon);
    }
  }, [location, fetchData]);

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
    { id: 'Home', label: 'OVERVIEW', icon: Radio },
    { id: 'Radar', label: 'LIVE RADAR', icon: Layers },
    { id: 'Models', label: 'MODELS', icon: Cpu },
    { id: 'News', label: 'NEWS HUB', icon: Newspaper },
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
          <div className="nav-brand-container" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div className="nav-brand" onClick={() => setCurrentTab('Home')} style={{ cursor: 'pointer' }}>
              <img src="/logo.svg" alt="NexusWX Logo" style={{ width: '28px', height: '28px', borderRadius: '6px', filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))' }} />
              <span className="nav-brand-text">NexusWX</span>
            </div>

            {/* Desktop Navigation Tabs */}
            <div className="nav-links" style={{ display: 'flex', gap: '16px' }}>
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <a key={item.id}
                    className={isActive ? 'active' : ''}
                    onClick={() => setCurrentTab(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '11px',
                      fontFamily: 'var(--font-data)',
                      fontWeight: isActive ? 600 : 400,
                      letterSpacing: '0.08em',
                      color: isActive ? '#60A5FA' : 'var(--text-secondary)'
                    }}
                  >
                    <Icon size={13} style={{ color: isActive ? '#60A5FA' : 'var(--text-tertiary)' }} />
                    {item.label}
                  </a>
                );
              })}
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
            <div className="icon-btn" onClick={() => fetchData(location.lat, location.lon)} title="Refresh">
              <RefreshCw size={14} />
            </div>
          </div>
        </nav>

        {/* Mobile Tab Pills Bar */}
        <div style={{
          display: 'flex',
          overflowX: 'auto',
          gap: '8px',
          padding: '8px 16px',
          background: 'rgba(9, 13, 22, 0.85)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)'
        }} className="mobile-only-tabs-bar">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '10.5px',
                  fontFamily: 'var(--font-data)',
                  fontWeight: isActive ? 600 : 400,
                  letterSpacing: '0.06em',
                  background: isActive ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                  color: isActive ? '#60A5FA' : 'var(--text-secondary)',
                  border: isActive ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer'
                }}
              >
                <Icon size={12} />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* ── Updated timestamp ── */}
        {lastUpdated && currentTab === 'Home' && (
          <div style={{ 
            textAlign: 'right', marginBottom: '8px',
            fontFamily: 'var(--font-data)', fontSize: '10px',
            letterSpacing: '0.05em', color: 'var(--text-tertiary)'
          }}>
            LAST SYNC {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        )}

        {/* ── Tab Views ── */}
        {currentTab === 'Home' && (
          /* Streamlined & Breathable Main Dashboard */
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
          </main>
        )}

        {/* Live Radar Tab View */}
        {currentTab === 'Radar' && (
          <div className="animate-in" style={{ width: '100%', height: 'calc(100vh - 160px)', minHeight: '550px' }}>
            <RadarMap 
              lat={location.lat} 
              lon={location.lon} 
              locationName={location.name} 
            />
          </div>
        )}

        {/* Model Consensus Tab View */}
        {currentTab === 'Models' && (
          <div className="animate-in" style={{ width: '100%' }}>
            <ModelComparison multiModel={weatherData?.multiModel} />
          </div>
        )}

        {/* News Hub Tab View */}
        {currentTab === 'News' && (
          <div className="animate-in" style={{ width: '100%' }}>
            <NewsHub location={location} />
          </div>
        )}
      </div>
    </>
  );
}

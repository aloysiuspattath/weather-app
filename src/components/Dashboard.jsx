import React, { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, CloudSun, RefreshCw, Navigation } from 'lucide-react';
import { getWeatherData, getAirQualityData, searchLocations, detectUserLocation, getWeatherDescription } from '../services/weatherApi';
import CurrentWeather from './CurrentWeather';
import WeatherDetails from './WeatherDetails';
import HourlyForecast from './HourlyForecast';
import DailyForecast from './DailyForecast';
import RadarMap from './RadarMap';
import AnimatedBackground from './AnimatedBackground';
import NewsHub from './NewsHub';
import SunMoonTracker from './SunMoonTracker';
import AirQualityPanel from './AirQualityPanel';
import HomeNewsFeed from './HomeNewsFeed';
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
  useMouseGlow();

  const [currentTab, setCurrentTab] = useState('Home');
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [weatherData, setWeatherData] = useState(null);
  const [airQualityData, setAirQualityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

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

    const updateMetaTag = (selector, attribute, value) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        const match = selector.match(/\[(.*?)="(.*?)"\]/);
        if (match) {
          element.setAttribute(match[1], match[2]);
        }
        document.head.appendChild(element);
      }
      element.setAttribute(attribute, value);
    };

    updateMetaTag('meta[name="description"]', 'content', pageDesc);
    updateMetaTag('meta[name="title"]', 'content', pageTitle);
    updateMetaTag('meta[property="og:title"]', 'content', pageTitle);
    updateMetaTag('meta[property="og:description"]', 'content', pageDesc);
    updateMetaTag('meta[name="twitter:title"]', 'content', pageTitle);
    updateMetaTag('meta[name="twitter:description"]', 'content', pageDesc);
  }, [weatherData, location]);

  useEffect(() => {
    fetchData(location.lat, location.lon);
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
    { id: 'Home', label: 'Dashboard' },
    { id: 'News', label: 'News' },
  ];

  return (
    <>
      <AnimatedBackground 
        weatherCode={weatherData?.current?.weather_code} 
        isDay={weatherData?.current?.is_day} 
      />
      <div className="app-wrapper">
        {/* ── Navigation ── */}
        <nav className="top-nav">
          <div className="nav-brand-container">
            <div className="nav-brand" onClick={() => setCurrentTab('Home')}>
              <CloudSun size={22} strokeWidth={1.5} style={{ color: 'var(--accent)' }} />
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

            {/* Mobile Tab Pill Toggle */}
            <div className="tab-bar mobile-only-tabs" style={{ display: 'none' }}>
              {navItems.map(item => (
                <button
                  key={item.id}
                  className={`tab-btn ${currentTab === item.id ? 'active' : ''}`}
                  onClick={() => setCurrentTab(item.id)}
                  style={{ fontSize: '10px', padding: '3px 10px' }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="search-container">
            <div className="search-wrapper">
              <Search className="search-icon" size={14} />
              <input 
                type="text" 
                className="nav-search" 
                placeholder="Search location..." 
                value={searchQuery}
                onChange={handleSearch}
              />
              {searchResults.length > 0 && (
                <div className="widget-panel" style={{ 
                  position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 50, 
                  padding: '4px', maxHeight: '220px', overflowY: 'auto'
                }}>
                  {searchResults.map((res, i) => (
                    <div 
                      key={i} 
                      style={{ 
                        padding: '8px 12px', cursor: 'pointer', borderRadius: '6px',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        transition: 'background 0.2s', fontSize: '12px',
                        fontFamily: 'var(--font-data)'
                      }}
                      onClick={() => handleSelectLocation(res)}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <MapPin size={12} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontWeight: 500 }}>{res.name}</div>
                        <div className="text-tertiary" style={{ fontSize: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {res.admin1 ? `${res.admin1}, ` : ''}{res.country || ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="icon-btn" onClick={handleLocateMe} title="Detect My Location">
              <Navigation size={14} style={{ color: 'var(--accent)' }} />
            </div>
            <div className="icon-btn" onClick={() => fetchData(location.lat, location.lon)} title="Refresh">
              <RefreshCw size={14} />
            </div>
          </div>
        </nav>

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

        {/* ── World Monitor Grid Content ── */}
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

            {/* Row 3: RadarMap (span 7, height 100%), DailyForecast (span 5) */}
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

            {/* Row 4: WillItRainWidget (span 12) */}
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
      </div>
    </>
  );
}

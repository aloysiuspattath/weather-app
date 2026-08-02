import React, { useState, useEffect } from 'react';
import { getWeatherDescription } from '../services/weatherApi';
import { Cloud, CloudLightning, CloudRain, CloudSnow, Sun, MapPin, Clock } from 'lucide-react';

function DynamicWeatherVisualizer({ code, isDay }) {
  const isRain = (code >= 51 && code <= 67) || (code >= 80 && code <= 81);
  const isSunny = (code === 0 || code === 1) && isDay !== 0;
  const isClearNight = (code === 0 || code === 1) && isDay === 0;
  const isCloudy = code === 2 || code === 3 || code === 45 || code === 48;
  const isSnow = (code >= 71 && code <= 77) || (code >= 85 && code <= 86);
  const isThunder = code === 82 || (code >= 95 && code <= 99);

  // Background Class
  let bgClass = 'weather-bg-overcast';
  if (isRain) bgClass = 'weather-bg-rain';
  else if (isThunder) bgClass = 'weather-bg-thunder';
  else if (isSunny) bgClass = 'weather-bg-sun-day';
  else if (isClearNight) bgClass = 'weather-bg-sun-night';
  else if (isSnow) bgClass = 'weather-bg-snow';

  // Rain Drops
  const rainDrops = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    left: `${(i * 4.2 + 1) % 96}%`,
    height: `${14 + (i % 6) * 3}px`,
    duration: `${0.45 + (i % 4) * 0.12}s`,
    delay: `${(i % 8) * 0.1}s`
  }));

  // Snow Particles
  const snowFlakes = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: `${(i * 4.8 + 2) % 96}%`,
    size: `${3 + (i % 4)}px`,
    duration: `${2.5 + (i % 5) * 0.4}s`,
    delay: `${(i % 7) * 0.25}s`
  }));

  // Twinkling Stars for Night
  const stars = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    top: `${(i * 7.3 + 5) % 75}%`,
    left: `${(i * 11.2 + 3) % 95}%`,
    size: `${1.5 + (i % 3)}px`,
    delay: `${(i % 5) * 0.6}s`
  }));

  return (
    <div className={`weather-overlay-container ${bgClass}`}>
      {/* Cloudy / Overcast Rolling Cloud Layers */}
      {(isCloudy || isRain || isThunder) && (
        <>
          <div className="rolling-cloud-layer-1" />
          <div className="rolling-cloud-layer-2" />
        </>
      )}

      {/* Sun Rays & Aura */}
      {isSunny && (
        <>
          <div className="sun-aura" />
          <div className="sun-rays" />
        </>
      )}

      {/* Night Sky Stars */}
      {isClearNight && (
        <>
          <div className="sun-aura" style={{ background: 'radial-gradient(circle, rgba(147, 197, 253, 0.2) 0%, rgba(99, 102, 241, 0.08) 60%, transparent 80%)' }} />
          {stars.map((star) => (
            <div
              key={star.id}
              className="star-particle"
              style={{
                top: star.top,
                left: star.left,
                width: star.size,
                height: star.size,
                animationDelay: star.delay
              }}
            />
          ))}
        </>
      )}

      {/* Rain Streaks */}
      {(isRain || isThunder) && (
        <div style={{ position: 'absolute', inset: 0 }}>
          {rainDrops.map((drop) => (
            <div
              key={drop.id}
              className="rain-drop"
              style={{
                left: drop.left,
                height: drop.height,
                animationDuration: drop.duration,
                animationDelay: drop.delay
              }}
            />
          ))}
        </div>
      )}

      {/* Snow Particles */}
      {isSnow && (
        <div style={{ position: 'absolute', inset: 0 }}>
          {snowFlakes.map((flake) => (
            <div
              key={flake.id}
              className="snow-flake"
              style={{
                left: flake.left,
                width: flake.size,
                height: flake.size,
                animationDuration: flake.duration,
                animationDelay: flake.delay
              }}
            />
          ))}
        </div>
      )}

      {/* Thunderstorm Lightning */}
      {isThunder && <div className="lightning-overlay" />}

      {/* Glass gradient overlay to ensure text contrast */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to top, rgba(10, 15, 25, 0.95) 0%, rgba(10, 15, 25, 0.5) 55%, rgba(10, 15, 25, 0.25) 100%)',
        pointerEvents: 'none'
      }} />
    </div>
  );
}

export default function CurrentWeather({ weatherData, locationName, lat, lon }) {
  const [timeString, setTimeString] = useState('');

  useEffect(() => {
    const updateTime = () => {
      setTimeString(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!weatherData || !weatherData.current) return null;

  const current = weatherData.current;
  const daily = weatherData.daily;
  
  const temp = Math.round(current.temperature_2m * 10) / 10;
  const feelsLike = Math.round((current.apparent_temperature || temp) * 10) / 10;
  const weatherCode = current.weather_code;
  const isDay = current.is_day;
  const weatherInfo = getWeatherDescription(weatherCode);
  const description = weatherInfo.desc;
  
  const highTemp = daily?.temperature_2m_max?.[0] !== undefined ? Math.round(daily.temperature_2m_max[0] * 10) / 10 : '--';
  const lowTemp = daily?.temperature_2m_min?.[0] !== undefined ? Math.round(daily.temperature_2m_min[0] * 10) / 10 : '--';

  // Determine an icon to use as a watermark based on description
  let WatermarkIcon = Cloud;
  const descLower = description.toLowerCase();
  if (descLower.includes('sun') || descLower.includes('clear')) WatermarkIcon = Sun;
  else if (descLower.includes('rain') || descLower.includes('drizzle')) WatermarkIcon = CloudRain;
  else if (descLower.includes('snow')) WatermarkIcon = CloudSnow;
  else if (descLower.includes('thunder') || descLower.includes('storm')) WatermarkIcon = CloudLightning;

  return (
    <div className="widget-panel animate-in delay-1" style={{ position: 'relative', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '300px' }}>
      {/* Live Dynamic Weather Visualizer Background */}
      <DynamicWeatherVisualizer code={weatherCode} isDay={isDay} />

      {/* Header Bar: Title + Live Clock */}
      <div className="widget-header" style={{ width: '100%', marginBottom: 'var(--sp-2)', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="widget-title" style={{ color: 'rgba(255,255,255,0.7)', textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>
          <Cloud size={14} style={{ color: weatherInfo.color || 'var(--text-tertiary)' }} />
          CURRENT CONDITIONS
        </div>
        <div className="font-data" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', letterSpacing: '0.05em', textShadow: '0 2px 4px rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={12} style={{ color: 'var(--accent)' }} />
          {timeString}
        </div>
      </div>
      
      {/* Center Readout */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', zIndex: 2, padding: '8px 0' }}>
        <div style={{ 
          fontFamily: 'var(--font-data)', 
          fontSize: 'clamp(56px, 7.5vw, 72px)', 
          fontWeight: '300', 
          lineHeight: '0.95',
          letterSpacing: '-0.04em',
          fontVariantNumeric: 'tabular-nums',
          marginBottom: '12px',
          color: '#ffffff',
          textShadow: '0 4px 16px rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'flex-start'
        }}>
          {temp}<span style={{ fontSize: '32px', color: 'rgba(255,255,255,0.7)', marginLeft: '2px', fontWeight: 300 }}>°C</span>
        </div>
        
        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: '#ffffff', letterSpacing: '-0.01em', textShadow: '0 2px 8px rgba(0,0,0,0.7)' }}>
          {description}
        </div>
        
        <div className="text-secondary font-data" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)', textShadow: '0 2px 6px rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span>Feels like {feelsLike}°C</span>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>•</span>
          <span style={{ color: 'var(--accent-warm)', fontWeight: 600 }}>H: {highTemp}°</span>
          <span style={{ color: '#60A5FA', fontWeight: 600 }}>L: {lowTemp}°</span>
        </div>
      </div>

      {/* Footer Location & Telemetry */}
      <div style={{ zIndex: 2, marginTop: 'auto', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '10px', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', fontSize: '14px', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.7)' }}>
          <MapPin size={13} style={{ color: 'var(--accent)' }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{locationName}</span>
        </div>
        <div className="font-data" style={{ fontSize: '10px', marginTop: '3px', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.06em', textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>
          LAT {Number(lat).toFixed(4)}° • LON {Number(lon).toFixed(4)}°
        </div>
      </div>

      {/* Subtly floating Watermark Icon */}
      <div style={{
        position: 'absolute',
        right: '-8%',
        bottom: '-8%',
        opacity: 0.06,
        pointerEvents: 'none',
        zIndex: 1,
        color: '#ffffff'
      }}>
        <WatermarkIcon size={240} />
      </div>
    </div>
  );
}

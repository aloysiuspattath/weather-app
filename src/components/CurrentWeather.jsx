import React, { useState, useEffect } from 'react';
import { getWeatherDescription } from '../services/weatherApi';
import { Cloud, CloudLightning, CloudRain, CloudSnow, Sun, MapPin, Clock, Droplets, Wind, Thermometer, ShieldAlert } from 'lucide-react';

function DynamicWeatherVisualizer({ code, isDay }) {
  const isRain = (code >= 51 && code <= 67) || (code >= 80 && code <= 81);
  const isSunny = (code === 0 || code === 1) && isDay !== 0;
  const isClearNight = (code === 0 || code === 1) && isDay === 0;
  const isCloudy = code === 2 || code === 3 || code === 45 || code === 48;
  const isSnow = (code >= 71 && code <= 77) || (code >= 85 && code <= 86);
  const isThunder = code === 82 || (code >= 95 && code <= 99);

  let bgClass = 'weather-bg-overcast';
  if (isRain) bgClass = 'weather-bg-rain';
  else if (isThunder) bgClass = 'weather-bg-thunder';
  else if (isSunny) bgClass = 'weather-bg-sun-day';
  else if (isClearNight) bgClass = 'weather-bg-sun-night';
  else if (isSnow) bgClass = 'weather-bg-snow';

  const rainDrops = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    left: `${(i * 4.2 + 1) % 96}%`,
    height: `${14 + (i % 6) * 3}px`,
    duration: `${0.45 + (i % 4) * 0.12}s`,
    delay: `${(i % 8) * 0.1}s`
  }));

  const snowFlakes = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: `${(i * 4.8 + 2) % 96}%`,
    size: `${3 + (i % 4)}px`,
    duration: `${2.5 + (i % 5) * 0.4}s`,
    delay: `${(i % 7) * 0.25}s`
  }));

  const stars = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    top: `${(i * 7.3 + 5) % 75}%`,
    left: `${(i * 11.2 + 3) % 95}%`,
    size: `${1.5 + (i % 3)}px`,
    delay: `${(i % 5) * 0.6}s`
  }));

  return (
    <div className={`weather-overlay-container ${bgClass}`}>
      {(isCloudy || isRain || isThunder) && (
        <>
          <div className="rolling-cloud-layer-1" />
          <div className="rolling-cloud-layer-2" />
        </>
      )}

      {isSunny && (
        <>
          <div className="sun-aura" />
          <div className="sun-rays" />
        </>
      )}

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

      {isThunder && <div className="lightning-overlay" />}

      {/* Dark gradient vignette */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg, rgba(8, 12, 22, 0.45) 0%, rgba(8, 12, 22, 0.75) 60%, rgba(8, 12, 22, 0.96) 100%)',
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
  const humidity = current.relative_humidity_2m || 0;
  const windSpeed = Math.round(current.wind_speed_10m || 0);
  const weatherCode = current.weather_code;
  const isDay = current.is_day;
  const weatherInfo = getWeatherDescription(weatherCode);
  const description = weatherInfo.desc;
  
  const highTemp = daily?.temperature_2m_max?.[0] !== undefined ? Math.round(daily.temperature_2m_max[0] * 10) / 10 : '--';
  const lowTemp = daily?.temperature_2m_min?.[0] !== undefined ? Math.round(daily.temperature_2m_min[0] * 10) / 10 : '--';

  // Dynamic Weather Icon & Accent Glow Color
  let WeatherIcon = Cloud;
  let accentGlow = 'rgba(148, 163, 184, 0.4)';
  let iconColor = '#94A3B8';

  const descLower = description.toLowerCase();
  if (descLower.includes('sun') || descLower.includes('clear')) {
    WeatherIcon = Sun;
    accentGlow = 'rgba(245, 158, 11, 0.45)';
    iconColor = '#F59E0B';
  } else if (descLower.includes('rain') || descLower.includes('drizzle')) {
    WeatherIcon = CloudRain;
    accentGlow = 'rgba(59, 130, 246, 0.45)';
    iconColor = '#3B82F6';
  } else if (descLower.includes('snow')) {
    WeatherIcon = CloudSnow;
    accentGlow = 'rgba(56, 189, 248, 0.45)';
    iconColor = '#38BDF8';
  } else if (descLower.includes('thunder') || descLower.includes('storm')) {
    WeatherIcon = CloudLightning;
    accentGlow = 'rgba(168, 85, 247, 0.5)';
    iconColor = '#A855F7';
  }

  return (
    <div className="widget-panel animate-in delay-1" style={{ 
      position: 'relative', 
      overflow: 'hidden', 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      justify: 'space-between', 
      minHeight: '340px',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      boxShadow: `0 12px 36px rgba(0, 0, 0, 0.6), inset 0 0 40px ${accentGlow}`
    }}>
      {/* Live Dynamic Weather Visualizer Background */}
      <DynamicWeatherVisualizer code={weatherCode} isDay={isDay} />

      {/* Header Bar: Title + Live Clock */}
      <div className="widget-header" style={{ width: '100%', marginBottom: '12px', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="widget-title" style={{ color: 'rgba(255,255,255,0.75)', textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>
          <Cloud size={14} style={{ color: iconColor }} />
          CURRENT CONDITIONS
        </div>
        <div className="font-data" style={{ 
          fontSize: '11px', 
          color: '#ffffff', 
          letterSpacing: '0.05em', 
          background: 'rgba(0, 0, 0, 0.4)', 
          backdropFilter: 'blur(8px)',
          padding: '3px 9px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex', 
          alignItems: 'center', 
          gap: '5px' 
        }}>
          <Clock size={12} style={{ color: 'var(--accent)' }} />
          {timeString}
        </div>
      </div>
      
      {/* Center Readout & Vibrant 3D Weather Icon Badge */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 2, padding: '4px 0' }}>
        <div style={{ flex: 1 }}>
          {/* Temperature Figure */}
          <div style={{ 
            fontFamily: 'var(--font-data)', 
            fontSize: 'clamp(58px, 7.5vw, 76px)', 
            fontWeight: '300', 
            lineHeight: '0.92',
            letterSpacing: '-0.04em',
            fontVariantNumeric: 'tabular-nums',
            marginBottom: '10px',
            color: '#ffffff',
            textShadow: '0 6px 20px rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'flex-start'
          }}>
            {temp}<span style={{ fontSize: '32px', color: 'rgba(255,255,255,0.7)', marginLeft: '2px', fontWeight: 300 }}>°C</span>
          </div>
          
          {/* Condition Title Badge */}
          <div style={{ 
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${iconColor}44`,
            padding: '4px 12px',
            borderRadius: '20px',
            marginBottom: '10px',
            boxShadow: `0 4px 14px ${accentGlow}`
          }}>
            <span style={{ fontSize: '15px', fontWeight: '600', color: '#ffffff', letterSpacing: '-0.01em' }}>
              {description}
            </span>
          </div>
          
          {/* High / Low & Feels Like */}
          <div className="text-secondary font-data" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)', textShadow: '0 2px 6px rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span>Feels like {feelsLike}°C</span>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>•</span>
            <span style={{ color: 'var(--accent-warm)', fontWeight: 600 }}>H: {highTemp}°</span>
            <span style={{ color: '#60A5FA', fontWeight: 600 }}>L: {lowTemp}°</span>
          </div>
        </div>

        {/* Vibrant Glowing Weather Icon Artwork */}
        <div style={{
          width: '90px',
          height: '90px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${iconColor}33 0%, rgba(10,15,25,0.4) 70%)`,
          border: `1px solid ${iconColor}55`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: `0 0 32px ${accentGlow}`,
          animation: 'pulse-glow 3s ease-in-out infinite'
        }}>
          <WeatherIcon size={46} style={{ color: iconColor, filter: `drop-shadow(0 0 10px ${iconColor})` }} />
        </div>
      </div>

      {/* Telemetry Strip: Humidity, Wind */}
      <div style={{
        zIndex: 2,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        margin: '12px 0 10px',
        background: 'rgba(0, 0, 0, 0.35)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '10px',
        padding: '8px 12px'
      }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Droplets size={13} style={{ color: '#60A5FA' }} />
          <span className="font-data text-tertiary" style={{ fontSize: '10px' }}>HUMIDITY</span>
          <span className="font-data" style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff', marginLeft: 'auto' }}>{humidity}%</span>
        </div>
        <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Wind size={13} style={{ color: '#10B981' }} />
          <span className="font-data text-tertiary" style={{ fontSize: '10px' }}>WIND</span>
          <span className="font-data" style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff', marginLeft: 'auto' }}>{windSpeed} <span style={{ fontSize: '9px', fontWeight: 400 }}>km/h</span></span>
        </div>
      </div>

      {/* Footer Location & Coordinates */}
      <div style={{ zIndex: 2, marginTop: 'auto', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', fontSize: '14px', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.7)' }}>
          <MapPin size={14} style={{ color: 'var(--accent)' }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{locationName}</span>
        </div>
        <div className="font-data" style={{ fontSize: '10px', marginTop: '2px', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.06em', textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>
          LAT {Number(lat).toFixed(4)}° • LON {Number(lon).toFixed(4)}°
        </div>
      </div>
    </div>
  );
}

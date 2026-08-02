import React, { useState, useEffect } from 'react';
import { getWeatherDescription } from '../services/weatherApi';
import { Cloud, CloudLightning, CloudRain, CloudSnow, Sun, MapPin, Clock, Droplets, Wind, Thermometer, Radio, CloudSun, CloudFog } from 'lucide-react';

function DynamicWeatherVisualizer({ code, isDay, isActivelyRaining }) {
  const isRain = ((code >= 51 && code <= 67) || (code >= 80 && code <= 81)) && isActivelyRaining;
  const isSunny = (code === 0 || code === 1) && isDay !== 0;
  const isClearNight = (code === 0 || code === 1) && isDay === 0;
  const isCloudy = (code === 2 || code === 3 || code === 45 || code === 48) || (((code >= 51 && code <= 67) || (code >= 80 && code <= 81)) && !isActivelyRaining);
  const isSnow = ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) && isActivelyRaining;
  const isThunder = (code === 82 || (code >= 95 && code <= 99)) && isActivelyRaining;

  let bgClass = 'weather-bg-overcast';
  if (isRain) bgClass = 'weather-bg-rain';
  else if (isThunder) bgClass = 'weather-bg-thunder';
  else if (isSunny) bgClass = 'weather-bg-sun-day';
  else if (isClearNight) bgClass = 'weather-bg-sun-night';
  else if (isSnow) bgClass = 'weather-bg-snow';

  const rainDrops = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    left: `${(i * 3.6 + 1) % 96}%`,
    height: `${14 + (i % 6) * 3}px`,
    duration: `${0.42 + (i % 4) * 0.12}s`,
    delay: `${(i % 8) * 0.08}s`
  }));

  const snowFlakes = Array.from({ length: 22 }, (_, i) => ({
    id: i,
    left: `${(i * 4.4 + 2) % 96}%`,
    size: `${3 + (i % 4)}px`,
    duration: `${2.4 + (i % 5) * 0.4}s`,
    delay: `${(i % 7) * 0.22}s`
  }));

  const stars = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    top: `${(i * 6.8 + 4) % 75}%`,
    left: `${(i * 10.5 + 3) % 95}%`,
    size: `${1.5 + (i % 3)}px`,
    delay: `${(i % 5) * 0.5}s`
  }));

  return (
    <div className={`weather-overlay-container ${bgClass}`}>
      {/* Rolling Cloud Layers */}
      {(isCloudy || isRain || isThunder) && (
        <>
          <div className="rolling-cloud-layer-1" />
          <div className="rolling-cloud-layer-2" />
        </>
      )}

      {/* Misty Atmospheric Fog */}
      {(isCloudy || isRain) && <div className="fog-mist-layer" />}

      {/* Sun Aura & Rotating Rays */}
      {isSunny && (
        <>
          <div className="sun-aura" />
          <div className="sun-rays" />
        </>
      )}

      {/* Night Sky Stars & Shooting Meteor */}
      {isClearNight && (
        <>
          <div className="sun-aura" style={{ background: 'radial-gradient(circle, rgba(147, 197, 253, 0.22) 0%, rgba(99, 102, 241, 0.08) 60%, transparent 80%)' }} />
          <div className="meteor-streak" />
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

      {/* Rain Streaks - ONLY render if isActivelyRaining is true */}
      {isRain && (
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

      {/* Vignette dark gradient overlay */}
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
  const cloudCover = current.cloud_cover || 0;
  const weatherCode = current.weather_code;
  const isDay = current.is_day;

  // Strict Real Ground Rain Threshold Check (> 0.35 mm/h required to count as active rain)
  const rawPrecip = Number(current.precipitation || 0);
  const rawRain = Number(current.rain || 0);
  const rawShowers = Number(current.showers || 0);
  const totalPrecip = Math.max(rawPrecip, rawRain + rawShowers);

  // Active ground rain is TRUE ONLY if precipitation exceeds 0.35 mm/h
  const isActivelyRaining = totalPrecip >= 0.35;

  const weatherInfo = getWeatherDescription(weatherCode);
  let description = weatherInfo.desc;

  // If WMO code says rain/showers but actual ground rainfall is < 0.35 mm, override description!
  if (!isActivelyRaining && (weatherCode >= 51 && weatherCode <= 81)) {
    if (cloudCover >= 80) {
      description = "Overcast";
    } else if (cloudCover >= 40) {
      description = "Partly Cloudy";
    } else {
      description = "Cloudy / Nearby Rain Risk";
    }
  }
  
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
  } else if (isActivelyRaining && (descLower.includes('rain') || descLower.includes('drizzle'))) {
    WeatherIcon = CloudRain;
    accentGlow = 'rgba(59, 130, 246, 0.45)';
    iconColor = '#3B82F6';
  } else if (descLower.includes('partly') || descLower.includes('cloud')) {
    WeatherIcon = isDay !== 0 ? CloudSun : Cloud;
    accentGlow = 'rgba(148, 163, 184, 0.45)';
    iconColor = '#94A3B8';
  } else if (descLower.includes('snow')) {
    WeatherIcon = CloudSnow;
    accentGlow = 'rgba(56, 189, 248, 0.45)';
    iconColor = '#38BDF8';
  } else if (isActivelyRaining && (descLower.includes('thunder') || descLower.includes('storm'))) {
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
      boxShadow: `0 12px 36px rgba(0, 0, 0, 0.6), inset 0 0 45px ${accentGlow}`
    }}>
      {/* Live Dynamic Weather Visualizer Background */}
      <DynamicWeatherVisualizer code={weatherCode} isDay={isDay} isActivelyRaining={isActivelyRaining} />

      {/* Header Bar: Title + Live Clock */}
      <div className="widget-header" style={{ width: '100%', marginBottom: '12px', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="widget-title" style={{ color: 'rgba(255,255,255,0.75)', textShadow: '0 2px 4px rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Radio size={12} style={{ color: '#10B981', animation: 'pulse-glow 1.5s infinite' }} />
          <span>CURRENT CONDITIONS</span>
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
          <Clock size={11} style={{ color: '#60A5FA' }} />
          <span>{timeString}</span>
        </div>
      </div>

      {/* Main Temperature & Weather Icon Section */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', margin: '4px 0 12px 0' }}>
        <div>
          {/* Main Temperature Display */}
          <div style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1 }}>
            <span className="font-data" style={{ fontSize: '72px', fontWeight: 300, color: '#ffffff', letterSpacing: '-0.04em', textShadow: '0 4px 16px rgba(0,0,0,0.5)' }}>
              {Math.floor(temp)}
            </span>
            <span className="font-data" style={{ fontSize: '32px', fontWeight: 300, color: 'rgba(255,255,255,0.7)', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
              .{String(temp.toFixed(1)).split('.')[1]}
            </span>
            <span className="font-data text-secondary" style={{ fontSize: '24px', fontWeight: 300, marginLeft: '2px', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
              °C
            </span>
          </div>

          {/* Description Badge */}
          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ 
              background: 'rgba(255, 255, 255, 0.1)', 
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              padding: '5px 14px', 
              borderRadius: '20px', 
              fontSize: '12.5px',
              fontFamily: 'var(--font-main)',
              fontWeight: 600,
              color: '#F8FAFC',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              letterSpacing: '0.01em'
            }}>
              {description}
            </span>
          </div>

          {/* Feels like & Daily High/Low */}
          <div style={{ marginTop: '12px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.78)', fontFamily: 'var(--font-main)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span>Feels like <strong className="font-data" style={{ color: '#ffffff' }}>{feelsLike}°C</strong></span>
            <span style={{ opacity: 0.4 }}>•</span>
            <span className="font-data" style={{ fontSize: '11.5px' }}>
              H: <strong style={{ color: '#F59E0B' }}>{highTemp}°</strong> L: <strong style={{ color: '#60A5FA' }}>{lowTemp}°</strong>
            </span>
          </div>
        </div>

        {/* Ambient Orb Weather Icon Container */}
        <div style={{ 
          position: 'relative', 
          width: '85px', 
          height: '85px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexShrink: 0
        }}>
          {/* Glowing Background Glass Sphere */}
          <div style={{ 
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.12) 0%, rgba(0,0,0,0.4) 100%)',
            border: '1px solid rgba(255,255,255,0.18)',
            boxShadow: `0 8px 24px rgba(0,0,0,0.5), 0 0 20px ${accentGlow}`,
            backdropFilter: 'blur(10px)'
          }} />
          
          <WeatherIcon size={42} style={{ color: iconColor, filter: `drop-shadow(0 0 10px ${accentGlow})`, position: 'relative', zIndex: 3 }} />
        </div>
      </div>

      {/* Telemetry Summary Bar */}
      <div style={{ 
        position: 'relative', 
        zIndex: 2, 
        marginTop: 'auto',
        background: 'rgba(0, 0, 0, 0.35)', 
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: '12px', 
        padding: '10px 14px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        justifyContent: 'center',
        gap: '16px',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Droplets size={13} style={{ color: '#60A5FA' }} />
          <span className="text-tertiary font-data" style={{ fontSize: '10px', letterSpacing: '0.06em' }}>HUMIDITY</span>
          <span className="font-data" style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff', marginLeft: '4px' }}>{humidity}%</span>
        </div>

        <div style={{ height: '14px', width: '1px', background: 'rgba(255,255,255,0.1)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Wind size={13} style={{ color: '#10B981' }} />
          <span className="text-tertiary font-data" style={{ fontSize: '10px', letterSpacing: '0.06em' }}>WIND</span>
          <span className="font-data" style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff', marginLeft: '4px' }}>{windSpeed} <span style={{ fontSize: '9px', fontWeight: 400 }}>km/h</span></span>
        </div>
      </div>

      {/* Footer Location Readout */}
      <div style={{ position: 'relative', zIndex: 2, marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
          <MapPin size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} />
          <span style={{ fontWeight: 600, fontSize: '13px', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {locationName}
          </span>
        </div>
        <div className="font-data text-tertiary" style={{ fontSize: '9px', flexShrink: 0, marginLeft: '8px' }}>
          LAT {Number(lat).toFixed(4)}° • LON {Number(lon).toFixed(4)}°
        </div>
      </div>
    </div>
  );
}

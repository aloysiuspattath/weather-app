import React from 'react';
import { getWeatherDescription } from '../services/weatherApi';
import { Cloud, CloudLightning, CloudRain, CloudSnow, Sun } from 'lucide-react';

function DynamicWeatherVisualizer({ code }) {
  const isRain = (code >= 51 && code <= 67) || (code >= 80 && code <= 82);
  const isSunny = code === 0 || code === 1;
  const isSnow = (code >= 71 && code <= 77) || (code >= 85 && code <= 86);
  const isThunder = code >= 95 && code <= 99;

  // Generate deterministic-like random values for drops/particles
  const rainDrops = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    left: `${(i * 5.8 + 2) % 96}%`,
    height: `${12 + (i % 5) * 3}px`,
    duration: `${0.5 + (i % 4) * 0.15}s`,
    delay: `${(i % 7) * 0.12}s`
  }));

  const snowFlakes = Array.from({ length: 16 }, (_, i) => ({
    id: i,
    left: `${(i * 6.2 + 3) % 96}%`,
    size: `${3 + (i % 4)}px`,
    duration: `${2.8 + (i % 5) * 0.4}s`,
    delay: `${(i % 6) * 0.3}s`
  }));

  return (
    <div className="weather-overlay-container">
      {isSunny && (
        <>
          <div className="sun-aura" />
          <div className="sun-rays" />
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
    </div>
  );
}

export default function CurrentWeather({ weatherData, locationName, lat, lon }) {
  if (!weatherData || !weatherData.current) return null;

  const current = weatherData.current;
  const daily = weatherData.daily;
  
  const temp = current.temperature_2m;
  const feelsLike = current.apparent_temperature;
  const weatherCode = current.weather_code;
  const weatherInfo = getWeatherDescription(weatherCode);
  const description = weatherInfo.desc;
  
  const highTemp = daily?.temperature_2m_max?.[0] !== undefined ? daily.temperature_2m_max[0] : '--';
  const lowTemp = daily?.temperature_2m_min?.[0] !== undefined ? daily.temperature_2m_min[0] : '--';

  // Determine an icon to use as a watermark based on description
  let WatermarkIcon = Cloud;
  const descLower = description.toLowerCase();
  if (descLower.includes('sun') || descLower.includes('clear')) WatermarkIcon = Sun;
  else if (descLower.includes('rain') || descLower.includes('drizzle')) WatermarkIcon = CloudRain;
  else if (descLower.includes('snow')) WatermarkIcon = CloudSnow;
  else if (descLower.includes('thunder') || descLower.includes('storm')) WatermarkIcon = CloudLightning;

  return (
    <div className="widget-panel animate-in delay-1" style={{ position: 'relative', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      {/* Live Dynamic Weather Visualizer Overlay */}
      <DynamicWeatherVisualizer code={weatherCode} />

      <div className="widget-header" style={{ width: '100%', marginBottom: 'var(--sp-2)', zIndex: 2 }}>
        <div className="widget-title">
          <Cloud size={14} className="text-tertiary" />
          CURRENT CONDITIONS
        </div>
      </div>
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', zIndex: 2, padding: '4px 0' }}>
        <div style={{ 
          fontFamily: 'var(--font-data)', 
          fontSize: 'clamp(52px, 7vw, 68px)', 
          fontWeight: '300', 
          lineHeight: '1',
          letterSpacing: '-0.04em',
          fontVariantNumeric: 'tabular-nums',
          marginBottom: 'var(--sp-2)',
          display: 'flex',
          alignItems: 'flex-start'
        }}>
          {temp}<span style={{ fontSize: '28px', color: 'var(--text-tertiary)', marginLeft: '2px', fontWeight: 400 }}>°C</span>
        </div>
        
        <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
          {description}
        </div>
        
        <div className="text-secondary font-data" style={{ fontSize: '12px', marginBottom: 'var(--sp-3)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span>Feels like {feelsLike}°C</span>
          <span style={{ color: 'var(--text-tertiary)' }}>•</span>
          <span style={{ color: 'var(--accent-warm)' }}>H: {highTemp}°</span>
          <span style={{ color: '#60A5FA' }}>L: {lowTemp}°</span>
        </div>
      </div>

      <div style={{ zIndex: 2, marginTop: 'auto', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '10px', width: '100%' }}>
        <div style={{ fontWeight: '500', fontSize: '14px', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{locationName}</div>
        <div className="text-tertiary font-data" style={{ fontSize: '10px', marginTop: '2px', letterSpacing: '0.06em' }}>
          LAT {Number(lat).toFixed(4)}° • LON {Number(lon).toFixed(4)}°
        </div>
      </div>

      <div style={{
        position: 'absolute',
        right: '-5%',
        bottom: '-5%',
        opacity: 0.04,
        pointerEvents: 'none',
        zIndex: 1
      }}>
        <WatermarkIcon size={220} />
      </div>
    </div>
  );
}


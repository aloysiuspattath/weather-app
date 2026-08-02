import React from 'react';
import * as LucideIcons from 'lucide-react';
import { getWeatherDescription } from '../services/weatherApi';

export default function HourlyForecast({ hourlyData }) {
  if (!hourlyData) return null;

  const now = new Date();
  const currentHour = now.getHours();

  // Find the index of the current hour, then take next 12 hours
  const startIdx = Math.max(0, hourlyData.time.findIndex(t => new Date(t).getHours() === currentHour));
  
  const hours = hourlyData.time.slice(startIdx, startIdx + 12).map((time, index) => {
    const idx = startIdx + index;
    const rainProb = hourlyData?.precipitation_probability?.[idx] !== undefined ? hourlyData.precipitation_probability[idx] : 0;
    return {
      time: new Date(time).toLocaleTimeString([], { hour: 'numeric', hour12: true }),
      temp: Math.round(hourlyData.temperature_2m[idx]),
      code: hourlyData.weather_code[idx],
      rainProb,
      isNow: index === 0
    };
  });

  const maxRainProb = Math.max(...hours.map(h => h.rainProb));

  return (
    <div className="widget-panel animate-in delay-2" style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
      {/* Header */}
      <div className="widget-header" style={{ marginBottom: '8px' }}>
        <div className="widget-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <LucideIcons.Clock size={14} className="text-tertiary" />
          <span>HOURLY FORECAST (NEXT 12H)</span>
        </div>
        <span className="font-data" style={{ fontSize: '10px', color: maxRainProb >= 50 ? '#60A5FA' : 'var(--text-tertiary)' }}>
          PEAK RAIN: {maxRainProb}%
        </span>
      </div>
      
      {/* Hourly Scroll Row */}
      <div style={{
        display: 'flex', 
        justifyContent: 'space-between', 
        overflowX: 'auto',
        gap: '6px', 
        padding: '6px 0',
        scrollbarWidth: 'thin'
      }}>
        {hours.map((hour, i) => {
          const wInfo = getWeatherDescription(hour.code);
          const IconComp = LucideIcons[wInfo.icon] || LucideIcons.Cloud;
          const iconColor = wInfo.color || '#3B82F6';
          
          return (
            <div key={i} className={`hourly-item ${hour.isNow ? 'is-now' : ''}`} style={{ flex: 1, minWidth: '58px', padding: '8px 4px', textAlign: 'center' }}>
              <span className="hourly-time" style={{ textTransform: 'uppercase', fontSize: '9.5px' }}>
                {hour.isNow ? 'NOW' : hour.time}
              </span>
              <IconComp size={20} strokeWidth={1.8} color={iconColor} style={{ margin: '4px auto', filter: `drop-shadow(0 0 6px ${iconColor}66)` }} />
              
              {/* Temperature */}
              <span className="hourly-temp" style={{ fontSize: '13px', fontWeight: 600 }}>{hour.temp}°</span>

              {/* Rain Chance Pill */}
              <div style={{ 
                marginTop: '4px', 
                fontSize: '9px', 
                fontFamily: 'var(--font-data)', 
                color: hour.rainProb > 40 ? '#60A5FA' : 'rgba(255, 255, 255, 0.4)',
                fontWeight: hour.rainProb > 40 ? 600 : 400,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px'
              }}>
                <LucideIcons.Droplets size={8} style={{ color: hour.rainProb > 40 ? '#60A5FA' : 'rgba(255, 255, 255, 0.3)' }} />
                <span>{hour.rainProb}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Summary Bar to fill card space 100% */}
      <div style={{
        marginTop: '10px',
        paddingTop: '8px',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '10px',
        fontFamily: 'var(--font-data)',
        color: 'var(--text-tertiary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <LucideIcons.TrendingUp size={12} style={{ color: 'var(--accent)' }} />
          <span>12-HOUR TREND: {hours[0]?.temp}°C ➔ {hours[hours.length - 1]?.temp}°C</span>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.6)' }}>PRECIPITATION & TEMP CONSENSUS</span>
      </div>
    </div>
  );
}

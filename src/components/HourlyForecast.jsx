import React from 'react';
import * as LucideIcons from 'lucide-react';
import { getWeatherDescription } from '../services/weatherApi';

export default function HourlyForecast({ hourlyData }) {
  if (!hourlyData) return null;

  const now = new Date();
  const currentHour = now.getHours();

  // Find the index of the current hour, then take next 12 hours for richer telemetry
  const startIdx = Math.max(0, hourlyData.time.findIndex(t => new Date(t).getHours() === currentHour));
  
  const hours = hourlyData.time.slice(startIdx, startIdx + 12).map((time, index) => ({
    time: new Date(time).toLocaleTimeString([], { hour: 'numeric', hour12: true }),
    temp: Math.round(hourlyData.temperature_2m[startIdx + index]),
    code: hourlyData.weather_code[startIdx + index],
    isNow: index === 0
  }));

  return (
    <div className="widget-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="widget-header">
        <div className="widget-title">
          <LucideIcons.Clock size={14} className="text-tertiary" />
          HOURLY FORECAST (NEXT 12H)
        </div>
      </div>
      
      <div style={{
        display: 'flex', 
        justify: 'space-between', 
        overflowX: 'auto',
        gap: '0.5rem', 
        paddingBottom: '0.4rem',
        paddingTop: '0.2rem',
        scrollbarWidth: 'thin'
      }}>
        {hours.map((hour, i) => {
          const wInfo = getWeatherDescription(hour.code);
          const IconComp = LucideIcons[wInfo.icon] || LucideIcons.Cloud;
          const iconColor = wInfo.color || '#3B82F6';
          
          return (
            <div key={i} className={`hourly-item ${hour.isNow ? 'is-now' : ''}`}>
              <span className="hourly-time" style={{ textTransform: 'uppercase' }}>
                {hour.isNow ? 'NOW' : hour.time}
              </span>
              <IconComp size={22} strokeWidth={1.8} color={iconColor} style={{ margin: 'var(--sp-1) 0', filter: `drop-shadow(0 0 6px ${iconColor}66)` }} />
              <span className="hourly-temp">{hour.temp}°</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

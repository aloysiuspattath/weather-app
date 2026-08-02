import React from 'react';
import * as LucideIcons from 'lucide-react';
import { getWeatherDescription } from '../services/weatherApi';

export default function DailyForecast({ dailyData }) {
  if (!dailyData) return null;

  // Compute global min/max for the temp range bar
  const allMax = dailyData.temperature_2m_max.slice(0, 7);
  const allMin = dailyData.temperature_2m_min.slice(0, 7);
  const globalMax = Math.max(...allMax);
  const globalMin = Math.min(...allMin);
  const range = globalMax - globalMin || 1;

  const days = dailyData.time.slice(0, 7).map((time, index) => {
    const date = new Date(time);
    const max = Math.round(dailyData.temperature_2m_max[index]);
    const min = Math.round(dailyData.temperature_2m_min[index]);
    const barLeft  = ((min - globalMin) / range) * 100;
    const barWidth = ((max - min) / range) * 100;

    return {
      day: date.toLocaleDateString([], { weekday: 'short' }).toUpperCase(),
      max, min, barLeft, barWidth,
      code: dailyData.weather_code[index]
    };
  });

  return (
    <div className="widget-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="widget-header">
        <div className="widget-title">
          <LucideIcons.Calendar size={14} className="text-tertiary" />
          7-DAY FORECAST
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, justifyContent: 'flex-start' }}>
        {days.map((d, i) => {
          const wInfo = getWeatherDescription(d.code);
          const IconComp = LucideIcons[wInfo.icon] || LucideIcons.Cloud;

          return (
            <div key={i} className="daily-row">
              <span className="daily-day">
                {i === 0 ? 'TODAY' : d.day}
              </span>
              <IconComp size={18} strokeWidth={1.8}
                color={wInfo.color || '#3B82F6'} 
                style={{ filter: `drop-shadow(0 0 4px ${(wInfo.color || '#3B82F6')}44)` }} />
              <div className="temp-range">
                <span className="temp-val lo">{d.min}°</span>
                <div className="temp-bar">
                  <div className="temp-bar-fill" style={{ left: `${d.barLeft}%`, width: `${Math.max(d.barWidth, 8)}%` }} />
                </div>
                <span className="temp-val hi">{d.max}°</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

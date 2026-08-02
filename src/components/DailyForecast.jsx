import React from 'react';
import * as LucideIcons from 'lucide-react';
import { getWeatherDescription } from '../services/weatherApi';

export default function DailyForecast({ dailyData }) {
  if (!dailyData || !dailyData.time?.length || !dailyData.temperature_2m_max?.length || !dailyData.temperature_2m_min?.length) return null;

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
    const code = dailyData.weather_code?.[index] ?? 0;
    const isRainDay = (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || (code >= 95);

    return {
      day: date.toLocaleDateString([], { weekday: 'short' }).toUpperCase(),
      max, min, barLeft, barWidth,
      code, isRainDay
    };
  });

  const rainDaysCount = days.filter(d => d.isRainDay).length;

  return (
    <div className="widget-panel animate-in delay-4" style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
      {/* Header */}
      <div className="widget-header" style={{ marginBottom: '8px' }}>
        <div className="widget-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <LucideIcons.Calendar size={14} className="text-tertiary" />
          <span>7-DAY FORECAST</span>
        </div>
        <span className="font-data" style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
          {globalMin}°C — {globalMax}°C
        </span>
      </div>

      {/* Rows evenly distributed to fill card 100% */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', padding: '4px 0' }}>
        {days.map((d, i) => {
          const wInfo = getWeatherDescription(d.code);
          const IconComp = LucideIcons[wInfo.icon] || LucideIcons.Cloud;

          return (
            <div key={i} className="daily-row" style={{ padding: '8px 4px' }}>
              <span className="daily-day" style={{ fontSize: '11px', fontWeight: 600 }}>
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

      {/* Bottom Telemetry Summary Bar */}
      <div style={{
        marginTop: '8px',
        paddingTop: '8px',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        fontSize: '10px',
        fontFamily: 'var(--font-data)',
        color: 'var(--text-tertiary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <LucideIcons.CloudRain size={12} style={{ color: '#60A5FA', flexShrink: 0 }} />
          <span>RAIN: {rainDaysCount} / 7 DAYS</span>
        </div>
        <span style={{ color: '#FBBF24', fontWeight: 600, marginLeft: 'auto' }}>MAX: {globalMax}°C</span>
      </div>
    </div>
  );
}

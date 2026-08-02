import React from 'react';
import * as LucideIcons from 'lucide-react';
import { getWeatherDescription } from '../services/weatherApi';

export default function HourlyForecast({ hourlyData }) {
  if (!hourlyData) return null;

  const now = new Date();
  const currentHourNum = now.getHours();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  // Find index of current local hour (e.g. 18 for 6:00 PM) without Date timezone shifts
  let startIdx = hourlyData.time.findIndex(t => t.startsWith(todayStr) && parseInt(t.slice(11, 13), 10) === currentHourNum);
  if (startIdx === -1) {
    startIdx = hourlyData.time.findIndex(t => parseInt(t.slice(11, 13), 10) === currentHourNum);
  }
  if (startIdx === -1) startIdx = 0;
  
  const hours = hourlyData.time.slice(startIdx, startIdx + 12).map((time, index) => {
    const idx = startIdx + index;
    const rainProb = hourlyData?.precipitation_probability?.[idx] !== undefined ? hourlyData.precipitation_probability[idx] : 0;
    const precipAmount = hourlyData?.precipitation?.[idx] !== undefined ? hourlyData.precipitation[idx] : 0;
    let code = hourlyData.weather_code[idx];

    // If precipitation is 0.0 mm (or < 0.35 mm) and WMO code is a rain shower code (51-81), normalize to Cloud/Overcast!
    if (precipAmount < 0.35 && (code >= 51 && code <= 81)) {
      code = rainProb > 60 ? 3 : 2;
    }

    // Timezone-safe time label: parse hour from ISO string directly
    const h = parseInt(time.slice(11, 13), 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const timeLabel = `${h12} ${ampm}`;

    return {
      time: timeLabel,
      temp: hourlyData.temperature_2m[idx],
      code,
      precipAmount,
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
          PEAK RAIN CHANCE: {maxRainProb}%
        </span>
      </div>
      
      {/* Hourly Scroll Row */}
      <div style={{
        display: 'flex', 
        justify: 'space-between', 
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
                fontSize: '10.5px', 
                fontFamily: 'var(--font-data)', 
                color: hour.rainProb > 40 && hour.precipAmount > 0.2 ? '#60A5FA' : 'var(--text-tertiary)',
                fontWeight: hour.rainProb > 40 && hour.precipAmount > 0.2 ? 600 : 400,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px'
              }}>
                <LucideIcons.Droplets size={8} style={{ color: hour.rainProb > 40 && hour.precipAmount > 0.2 ? '#60A5FA' : 'rgba(255, 255, 255, 0.3)' }} />
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
        justify: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        fontSize: '10px',
        fontFamily: 'var(--font-data)',
        color: 'var(--text-tertiary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <LucideIcons.TrendingUp size={12} style={{ color: 'var(--accent)', flexShrink: 0 }} />
          <span>TREND: {hours[0]?.temp}°C ➔ {hours[hours.length - 1]?.temp}°C</span>
        </div>

        <div style={{ opacity: 0.8, letterSpacing: '0.04em' }}>
          CONSENSUS TELEMETRY OK
        </div>
      </div>
    </div>
  );
}

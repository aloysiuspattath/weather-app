import React from 'react';
import { Droplets, Wind, Sun, Gauge } from 'lucide-react';

const getWindDirection = (degrees) => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
};

const getHumidityComfort = (humidity) => {
  if (humidity < 30) return 'Dry';
  if (humidity <= 60) return 'Comfortable';
  if (humidity <= 70) return 'Muggy';
  return 'Humid';
};

export default function WeatherDetails({ current, hourlyData, aqi }) {
  if (!current) return null;

  const humidity = current.relative_humidity_2m || 0;
  const windSpeed = current.wind_speed_10m || 0;
  const windDir = getWindDirection(current.wind_direction_10m || 0);
  const pressure = current.surface_pressure || 0;
  
  // Get current UV index from current object or match current hour in hourlyData
  const nowHour = new Date().getHours();
  const currentHourIdx = hourlyData?.time?.findIndex(t => new Date(t).getHours() === nowHour) ?? -1;
  const rawUv = current?.uv_index !== undefined ? current.uv_index : (currentHourIdx !== -1 ? hourlyData?.uv_index?.[currentHourIdx] : 0);
  const uvIndex = typeof rawUv === 'number' ? Math.round(rawUv * 10) / 10 : 0;

  const getUvLevel = (uv) => {
    if (uv <= 2) return 'Low';
    if (uv <= 5) return 'Moderate';
    if (uv <= 7) return 'High';
    if (uv <= 10) return 'Very High';
    return 'Extreme';
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--sp-2)', height: '100%' }}>
      {/* Humidity */}
      <div className="widget-panel detail-card animate-in delay-2" style={{ justifyContent: 'space-between' }}>
        <div className="detail-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Droplets size={14} style={{ color: '#60A5FA' }} /> HUMIDITY
        </div>
        <div>
          <div className="detail-value">
            {humidity}<span className="detail-unit">%</span>
          </div>
          <div className="detail-desc font-data">{getHumidityComfort(humidity)}</div>
        </div>
      </div>

      {/* Wind */}
      <div className="widget-panel detail-card animate-in delay-3" style={{ justifyContent: 'space-between' }}>
        <div className="detail-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Wind size={14} style={{ color: 'var(--accent)' }} /> WIND
        </div>
        <div>
          <div className="detail-value">
            {windSpeed}<span className="detail-unit">km/h</span>
          </div>
          <div className="detail-desc font-data">{windDir} Vector</div>
        </div>
      </div>

      {/* UV Index */}
      <div className="widget-panel detail-card animate-in delay-4" style={{ justifyContent: 'space-between' }}>
        <div className="detail-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sun size={14} style={{ color: 'var(--accent-warm)' }} /> UV INDEX
        </div>
        <div>
          <div className="detail-value">
            {uvIndex}
          </div>
          <div className="detail-desc font-data">{getUvLevel(uvIndex)} Solar Level</div>
        </div>
      </div>

      {/* Pressure */}
      <div className="widget-panel detail-card animate-in delay-5" style={{ justifyContent: 'space-between' }}>
        <div className="detail-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Gauge size={14} style={{ color: 'var(--accent-purple)' }} /> PRESSURE
        </div>
        <div>
          <div className="detail-value">
            {pressure}<span className="detail-unit">hPa</span>
          </div>
          <div className="detail-desc font-data">Surface Level</div>
        </div>
      </div>
    </div>
  );
}

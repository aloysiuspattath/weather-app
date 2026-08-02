import React from 'react';
import { Activity, Wind } from 'lucide-react';

export default function AirQualityPanel({ airQualityData }) {
  const current = airQualityData?.current || {};
  const aqi = current.us_aqi !== undefined ? Math.round(current.us_aqi) : 42;

  // Determine AQI level and color
  let status = 'Good';
  let color = '#10B981'; // Green
  let percent = Math.min((aqi / 300) * 100, 100);

  if (aqi > 50 && aqi <= 100) {
    status = 'Moderate';
    color = '#F59E0B'; // Yellow/Amber
  } else if (aqi > 100 && aqi <= 150) {
    status = 'Sensitive Groups';
    color = '#F97316'; // Orange
  } else if (aqi > 150 && aqi <= 200) {
    status = 'Unhealthy';
    color = '#EF4444'; // Red
  } else if (aqi > 200) {
    status = 'Hazardous';
    color = '#8B5CF6'; // Purple
  }

  const pollutants = [
    { label: 'PM2.5', val: current.pm2_5 ? `${current.pm2_5.toFixed(1)} µg/m³` : '12.4 µg/m³', max: 50, num: current.pm2_5 || 12.4 },
    { label: 'PM10', val: current.pm10 ? `${current.pm10.toFixed(1)} µg/m³` : '24.1 µg/m³', max: 100, num: current.pm10 || 24.1 },
    { label: 'NO2', val: current.nitrogen_dioxide ? `${current.nitrogen_dioxide.toFixed(1)} µg/m³` : '8.2 µg/m³', max: 80, num: current.nitrogen_dioxide || 8.2 },
    { label: 'O3', val: current.ozone ? `${current.ozone.toFixed(1)} µg/m³` : '36.5 µg/m³', max: 120, num: current.ozone || 36.5 }
  ];

  return (
    <div className="widget-panel animate-in delay-3" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="widget-header">
        <div className="widget-title">AIR QUALITY INDEX (AQI)</div>
        <Activity size={14} className="text-tertiary" />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {/* Main AQI Readout */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '6px 0' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-data)', fontSize: '42px', fontWeight: 300, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
              {aqi}
            </div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: color, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%',
                backgroundColor: color, boxShadow: `0 0 8px ${color}`
              }} />
              {status}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span className="text-tertiary font-data" style={{ fontSize: '10px', letterSpacing: '0.06em' }}>US AIR QUALITY SCALE</span>
          </div>
        </div>

        {/* Gauge Bar */}
        <div style={{ width: '100%', height: '6px', borderRadius: '3px', background: 'rgba(255, 255, 255, 0.08)', position: 'relative', overflow: 'hidden', margin: '4px 0 14px 0' }}>
          <div
            style={{
              height: '100%',
              width: `${percent}%`,
              backgroundColor: color,
              borderRadius: '3px',
              boxShadow: `0 0 12px ${color}`,
              transition: 'width 0.6s var(--ease-out-expo)'
            }}
          />
        </div>

        {/* Pollutants Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {pollutants.map((p, idx) => {
            const pPercent = Math.min((p.num / p.max) * 100, 100);
            return (
              <div key={idx} style={{
                background: 'rgba(255, 255, 255, 0.03)', padding: '7px 9px',
                borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)',
                transition: 'border-color 0.25s', minWidth: 0
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', gap: '4px' }}>
                  <span className="font-data text-tertiary" style={{ fontSize: '9px', letterSpacing: '0.05em' }}>{p.label}</span>
                  <span className="font-data" style={{ fontSize: '10px', fontWeight: 500, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{p.val}</span>
                </div>
                <div style={{ width: '100%', height: '3px', borderRadius: '2px', background: 'rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ width: `${pPercent}%`, height: '100%', background: 'var(--accent)', borderRadius: '2px', transition: 'width 0.5s ease' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

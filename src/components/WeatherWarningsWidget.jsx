import React from 'react';
import { AlertTriangle, ShieldCheck, Flame, Sun, CloudRain, Wind, AlertCircle, Waves } from 'lucide-react';

export default function WeatherWarningsWidget({ current, hourlyData, dailyData }) {
  if (!current) return null;

  const warnings = [];

  // 1. Heat Warning Analysis
  const maxTempToday = dailyData?.temperature_2m_max?.[0] || current?.temperature_2m || 0;
  const apparentTemp = current?.apparent_temperature || current?.temperature_2m || 0;
  
  if (apparentTemp >= 40 || maxTempToday >= 40) {
    warnings.push({
      id: 'heat-extreme',
      level: 'CRITICAL',
      type: 'EXTREME HEAT WARNING',
      icon: Flame,
      color: '#EF4444', // Red
      bg: 'rgba(239, 68, 68, 0.1)',
      border: 'rgba(239, 68, 68, 0.3)',
      message: `Extreme heat index detected (${Math.round(apparentTemp)}°C feels like). Stay indoors, hydrated, and avoid direct sun.`
    });
  } else if (apparentTemp >= 34 || maxTempToday >= 35) {
    warnings.push({
      id: 'heat-advisory',
      level: 'ADVISORY',
      type: 'HEAT ADVISORY',
      icon: Flame,
      color: '#F59E0B', // Amber
      bg: 'rgba(245, 158, 11, 0.1)',
      border: 'rgba(245, 158, 11, 0.3)',
      message: `High temperatures expected today (Max ${Math.round(maxTempToday)}°C). Drink plenty of water during peak afternoon hours.`
    });
  }

  // 2. UV Exposure Warning Analysis
  const currentUv = current?.uv_index !== undefined ? current.uv_index : (hourlyData?.uv_index?.[0] || 0);
  const maxUvToday = dailyData?.uv_index_max?.[0] || currentUv;

  if (currentUv >= 8 || maxUvToday >= 8) {
    warnings.push({
      id: 'uv-extreme',
      level: 'HIGH RISK',
      type: 'VERY HIGH UV WARNING',
      icon: Sun,
      color: '#EC4899', // Pink/Magenta
      bg: 'rgba(236, 72, 153, 0.1)',
      border: 'rgba(236, 72, 153, 0.3)',
      message: `Peak UV Index reaches ${Math.round(maxUvToday * 10) / 10} (Very High). SPF 50+ sunscreen and sunglasses mandatory.`
    });
  } else if (currentUv >= 6 || maxUvToday >= 6) {
    warnings.push({
      id: 'uv-moderate',
      level: 'MODERATE',
      type: 'UV EXPOSURE ADVISORY',
      icon: Sun,
      color: '#F59E0B', // Amber
      bg: 'rgba(245, 158, 11, 0.1)',
      border: 'rgba(245, 158, 11, 0.3)',
      message: `Moderate to high solar UV radiation (Max ${Math.round(maxUvToday * 10) / 10}). Seek shade between 11 AM and 3 PM.`
    });
  }

  // 3. Flood & Waterlogging Risk Analysis
  const hourlyPrecip = hourlyData?.precipitation || [];
  const next24hPrecipTotal = hourlyPrecip.slice(0, 24).reduce((sum, val) => sum + (val || 0), 0);
  const max1hPrecip = Math.max(...(hourlyPrecip.slice(0, 24) || [0]));

  if (next24hPrecipTotal >= 35 || max1hPrecip >= 12) {
    warnings.push({
      id: 'flood-warning',
      level: 'CRITICAL',
      type: 'FLASH FLOOD WARNING',
      icon: Waves,
      color: '#06B6D4', // Cyan / Deep Teal
      bg: 'rgba(6, 182, 212, 0.14)',
      border: 'rgba(6, 182, 212, 0.35)',
      message: `Critical flood risk! Expected cumulative 24h rainfall: ${next24hPrecipTotal.toFixed(1)} mm (Peak 1h: ${max1hPrecip.toFixed(1)} mm). Avoid low-lying riverbanks, flooded roads, and storm drains.`
    });
  } else if (next24hPrecipTotal >= 18 || max1hPrecip >= 6) {
    warnings.push({
      id: 'flood-advisory',
      level: 'ADVISORY',
      type: 'URBAN WATERLOGGING ADVISORY',
      icon: Waves,
      color: '#38BDF8', // Light Blue / Sky
      bg: 'rgba(56, 189, 248, 0.1)',
      border: 'rgba(56, 189, 248, 0.3)',
      message: `Moderate flood risk (24h rain forecast: ${next24hPrecipTotal.toFixed(1)} mm). Expect localized waterlogging in low-lying roads and poor drainage channels.`
    });
  }

  // 4. Rain & Thunderstorm Warning Analysis
  const code = current?.weather_code || 0;
  const isThunder = code >= 95 && code <= 99;
  const isHeavyRain = code === 65 || code === 82 || (hourlyData?.precipitation?.[0] || 0) > 4;
  const rainProb = Math.max(...(hourlyData?.precipitation_probability?.slice(0, 12) || [0]));

  if (isThunder) {
    warnings.push({
      id: 'thunderstorm',
      level: 'SEVERE',
      type: 'THUNDERSTORM WARNING',
      icon: AlertTriangle,
      color: '#A855F7', // Purple
      bg: 'rgba(168, 85, 247, 0.1)',
      border: 'rgba(168, 85, 247, 0.3)',
      message: 'Active thunderstorm telemetry in area. Risk of lightning strikes, flash flooding, and localized power outages.'
    });
  } else if (isHeavyRain) {
    warnings.push({
      id: 'heavy-rain',
      level: 'WARNING',
      type: 'HEAVY RAINFALL WARNING',
      icon: CloudRain,
      color: '#3B82F6', // Blue
      bg: 'rgba(59, 130, 246, 0.1)',
      border: 'rgba(59, 130, 246, 0.3)',
      message: 'Torrential rain active. Expect poor road visibility and urban waterlogging in low-lying sectors.'
    });
  } else if (rainProb >= 70) {
    warnings.push({
      id: 'rain-high-prob',
      level: 'ADVISORY',
      type: 'DOWNPOUR ADVISORY',
      icon: CloudRain,
      color: '#60A5FA', // Light Blue
      bg: 'rgba(96, 165, 250, 0.1)',
      border: 'rgba(96, 165, 250, 0.3)',
      message: `High precipitation probability (${rainProb}%) within the next 12 hours. Carry protective rain gear.`
    });
  }

  // 5. Wind Warning Analysis
  const windSpeed = current?.wind_speed_10m || 0;
  if (windSpeed >= 35) {
    warnings.push({
      id: 'wind-gale',
      level: 'WARNING',
      type: 'HIGH WIND WARNING',
      icon: Wind,
      color: '#10B981', // Emerald
      bg: 'rgba(16, 185, 129, 0.1)',
      border: 'rgba(16, 185, 129, 0.3)',
      message: `Strong wind gusts recorded (${Math.round(windSpeed)} km/h). Secure loose outdoor items and exercise travel caution.`
    });
  }

  return (
    <div className="widget-panel animate-in delay-2" style={{ gridColumn: 'span 12' }}>
      <div className="widget-header" style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} className={warnings.length > 0 ? 'text-accent-warm' : 'text-tertiary'} />
          <h2 className="widget-title">METEOROLOGICAL ADVISORIES & HAZARD WARNINGS</h2>
        </div>
        <span className="font-data" style={{ fontSize: '10px', color: warnings.length > 0 ? '#EF4444' : '#10B981', letterSpacing: '0.06em' }}>
          {warnings.length > 0 ? `${warnings.length} ACTIVE WARNINGS` : 'STATUS: NORMAL'}
        </span>
      </div>

      {warnings.length === 0 ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '14px 16px',
          background: 'rgba(16, 185, 129, 0.05)',
          border: '1px solid rgba(16, 185, 129, 0.15)',
          borderRadius: 'var(--radius-inner)'
        }}>
          <ShieldCheck size={20} style={{ color: '#10B981', flexShrink: 0 }} />
          <div>
            <div className="font-data" style={{ fontSize: '12px', fontWeight: 600, color: '#10B981', letterSpacing: '0.05em' }}>
              ALL CLEAR // NO SEVERE WEATHER HAZARDS
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Heat, UV, rainfall, and wind speeds are currently within safe baseline parameters for this sector.
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
          {warnings.map((w) => {
            const IconComponent = w.icon;
            return (
              <div
                key={w.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px 14px',
                  background: w.bg,
                  border: `1px solid ${w.border}`,
                  borderRadius: 'var(--radius-inner)',
                  boxShadow: `0 4px 12px ${w.bg}`
                }}
              >
                <IconComponent size={20} style={{ color: w.color, flexShrink: 0, marginTop: '2px' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span className="font-data" style={{ fontSize: '11px', fontWeight: 700, color: w.color, letterSpacing: '0.06em' }}>
                      {w.type}
                    </span>
                    <span className="font-data" style={{ 
                      fontSize: '9px', 
                      fontWeight: 600, 
                      padding: '1px 5px', 
                      background: 'rgba(0,0,0,0.4)', 
                      borderRadius: '4px', 
                      color: w.color,
                      border: `1px solid ${w.border}`
                    }}>
                      {w.level}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                    {w.message}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

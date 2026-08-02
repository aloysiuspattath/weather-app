import React, { useState } from 'react';
import { Wind, CloudRain, Thermometer, Gauge, Waves, Cloud, Map } from 'lucide-react';

const WINDY_LAYERS = [
  { id: 'wind', label: 'Wind', icon: Wind },
  { id: 'rain', label: 'Rain', icon: CloudRain },
  { id: 'temp', label: 'Temp', icon: Thermometer },
  { id: 'pressure', label: 'Pressure', icon: Gauge },
  { id: 'clouds', label: 'Clouds', icon: Cloud },
  { id: 'waves', label: 'Waves', icon: Waves },
];

export default function RadarMap({ lat, lon, locationName }) {
  const [activeLayer, setActiveLayer] = useState('wind');

  // Windy embed URL with dynamic layer, location, and dark theme
  const windyUrl = `https://embed.windy.com/embed.html`
    + `?type=map`
    + `&location=coordinates`
    + `&metricRain=mm`
    + `&metricTemp=°C`
    + `&metricWind=km/h`
    + `&zoom=7`
    + `&overlay=${activeLayer}`
    + `&product=ecmwf`
    + `&level=surface`
    + `&lat=${lat}`
    + `&lon=${lon}`
    + `&detailLat=${lat}`
    + `&detailLon=${lon}`
    + `&marker=true`
    + `&message=true`;

  return (
    <div className="widget-panel" style={{
      height: '100%', minHeight: '480px', padding: '0',
      overflow: 'hidden', position: 'relative',
      display: 'flex', flexDirection: 'column'
    }}>
      {/* Dedicated Clean Card Header Bar (outside the iframe container) */}
      <div style={{
        padding: '10px 14px',
        background: 'rgba(8, 12, 22, 0.95)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px',
        zIndex: 10
      }}>
        {/* Title badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Map size={14} style={{ color: 'var(--accent)' }} />
          <span className="font-data" style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-primary)' }}>
            LIVE RADAR TELEMETRY
          </span>
          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px' }}>|</span>
          <Wind size={11} style={{ color: '#FF6B6B' }} />
          <span className="font-data" style={{ fontSize: '9px', color: 'var(--text-tertiary)', letterSpacing: '0.06em' }}>
            ECMWF SATELLITE
          </span>
        </div>

        {/* Quick Layer Toggles */}
        <div className="radar-layer-toggles" style={{ position: 'static' }}>
          {WINDY_LAYERS.map(layer => {
            const Icon = layer.icon;
            return (
              <button
                key={layer.id}
                className={`radar-layer-btn ${activeLayer === layer.id ? 'active' : ''}`}
                onClick={() => setActiveLayer(layer.id)}
              >
                <Icon size={12} />
                <span>{layer.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 100% Clean Map Viewport — Zero absolute overlays blocking map controls! */}
      <div style={{ flex: 1, minHeight: '420px', position: 'relative', width: '100%' }}>
        <iframe
          key={`${activeLayer}-${lat}-${lon}`}
          title="Windy Weather Map"
          src={windyUrl}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block'
          }}
          allow="fullscreen"
        />
      </div>
    </div>
  );
}

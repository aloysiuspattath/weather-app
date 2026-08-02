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
      height: '100%', minHeight: '450px', padding: '0',
      overflow: 'hidden', position: 'relative',
      display: 'flex', flexDirection: 'column'
    }}>
      {/* Top Header & Layer Toggles Bar */}
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        right: '12px',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px',
        pointerEvents: 'none'
      }}>
        {/* Title & Provider Badge */}
        <div style={{
          pointerEvents: 'auto',
          background: 'rgba(10, 15, 25, 0.85)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          padding: '6px 12px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)'
        }}>
          <Map size={13} style={{ color: 'var(--accent)' }} />
          <span className="font-data" style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-primary)' }}>
            RADAR TELEMETRY
          </span>
          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px' }}>|</span>
          <Wind size={11} style={{ color: '#FF6B6B' }} />
          <span className="font-data" style={{ fontSize: '9px', color: 'var(--text-tertiary)', letterSpacing: '0.06em' }}>
            WINDY.COM • ECMWF
          </span>
        </div>

        {/* Layer Toggles */}
        <div className="radar-layer-toggles" style={{ position: 'static', pointerEvents: 'auto' }}>
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

      {/* Windy Embedded Map — Absolute 100% height fill */}
      <div style={{ flex: 1, minHeight: '450px', position: 'relative', width: '100%' }}>
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

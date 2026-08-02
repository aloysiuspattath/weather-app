import React from 'react';
import { Sunrise, Sunset, Moon, Sun } from 'lucide-react';

export default function SunMoonTracker({ dailyData }) {
  const sunriseRaw = dailyData?.sunrise?.[0];
  const sunsetRaw = dailyData?.sunset?.[0];

  const formatTime = (timeStr) => {
    if (!timeStr) return '--:--';
    const date = new Date(timeStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const sunriseTime = formatTime(sunriseRaw);
  const sunsetTime = formatTime(sunsetRaw);

  // Calculate sun progress % across daylight hours
  let sunProgress = 50;
  if (sunriseRaw && sunsetRaw) {
    const now = new Date().getTime();
    const rise = new Date(sunriseRaw).getTime();
    const set = new Date(sunsetRaw).getTime();
    if (now <= rise) sunProgress = 0;
    else if (now >= set) sunProgress = 100;
    else sunProgress = Math.round(((now - rise) / (set - rise)) * 100);
  }

  // Calculate position along arc
  const angleRad = (sunProgress / 100) * Math.PI;
  const sunX = 100 - 80 * Math.cos(angleRad);
  const sunY = 90 - 70 * Math.sin(angleRad);

  return (
    <div className="widget-panel animate-in delay-2" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="widget-header">
        <div className="widget-title">SUN & MOON TRACKER</div>
        <Sun size={14} className="text-tertiary" />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', marginTop: 'var(--sp-1)' }}>
        {/* Arc Visualizer */}
        <div style={{ position: 'relative', width: '100%', height: '100px', margin: '10px 0' }}>
          <svg viewBox="0 0 200 100" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
            <defs>
              <linearGradient id="sunArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#FBBF24" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#EF4444" stopOpacity="0.3" />
              </linearGradient>
            </defs>

            {/* Dotted Base Arc */}
            <path
              d="M 20 90 A 80 70 0 0 1 180 90"
              fill="none"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="2"
              strokeDasharray="4 4"
            />

            {/* Active Sun Progress Arc */}
            <path
              d="M 20 90 A 80 70 0 0 1 180 90"
              fill="none"
              stroke="url(#sunArcGrad)"
              strokeWidth="3"
              strokeDasharray="250"
              strokeDashoffset={250 - (250 * sunProgress) / 100}
            />

            {/* Sun Marker Point */}
            <circle
              cx={sunX}
              cy={sunY}
              r="6"
              fill="#FBBF24"
              style={{
                filter: 'drop-shadow(0 0 8px #FBBF24)',
                transition: 'all 0.5s ease'
              }}
            />
          </svg>
        </div>

        {/* Sunrise / Sunset Readouts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(255, 255, 255, 0.03)', padding: '8px 10px',
            borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)',
            transition: 'border-color 0.25s, background 0.25s', minWidth: 0
          }}>
            <Sunrise size={16} style={{ color: '#F59E0B', flexShrink: 0 }} />
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <div className="text-tertiary font-data" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sunrise</div>
              <div className="font-data" style={{ fontSize: '12px', fontWeight: 600, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{sunriseTime}</div>
            </div>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(255, 255, 255, 0.03)', padding: '8px 10px',
            borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)',
            transition: 'border-color 0.25s, background 0.25s', minWidth: 0
          }}>
            <Sunset size={16} style={{ color: '#EF4444', flexShrink: 0 }} />
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <div className="text-tertiary font-data" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sunset</div>
              <div className="font-data" style={{ fontSize: '12px', fontWeight: 600, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{sunsetTime}</div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-data)' }}>
          <span style={{ letterSpacing: '0.06em' }}>DAYLIGHT ELEVATION</span>
          <span style={{ color: '#FBBF24', fontWeight: 600, letterSpacing: '0.05em' }}>{sunProgress}% COMPLETE</span>
        </div>
      </div>
    </div>
  );
}

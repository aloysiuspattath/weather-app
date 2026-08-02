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
  let isNight = false;

  if (sunriseRaw && sunsetRaw) {
    const now = new Date().getTime();
    const rise = new Date(sunriseRaw).getTime();
    const set = new Date(sunsetRaw).getTime();
    if (now <= rise) {
      sunProgress = 0;
      isNight = true;
    } else if (now >= set) {
      sunProgress = 100;
      isNight = true;
    } else {
      sunProgress = Math.round(((now - rise) / (set - rise)) * 100);
      isNight = false;
    }
  }

  // Calculate position along arc
  const angleRad = (sunProgress / 100) * Math.PI;
  const sunX = 100 - 80 * Math.cos(angleRad);
  const sunY = 90 - 70 * Math.sin(angleRad);

  const markerColor = isNight ? '#93C5FD' : '#FBBF24';
  const glowColor = isNight ? 'rgba(147, 197, 253, 0.6)' : 'rgba(251, 191, 36, 0.7)';

  return (
    <div className="widget-panel animate-in delay-2" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="widget-header" style={{ marginBottom: '8px' }}>
        <div className="widget-title">SUN & MOON TRACKER</div>
        {isNight ? (
          <Moon size={14} style={{ color: '#93C5FD', animation: 'pulse-glow 2s infinite' }} />
        ) : (
          <Sun size={14} style={{ color: '#F59E0B', animation: 'sunRaysRotate 12s linear infinite' }} />
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {/* Arc Visualizer */}
        <div style={{ position: 'relative', width: '100%', height: '90px', margin: '4px 0' }}>
          <svg viewBox="0 0 200 100" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
            <defs>
              <linearGradient id="sunArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.4" />
                <stop offset="50%" stopColor={markerColor} stopOpacity="1" />
                <stop offset="100%" stopColor="#EF4444" stopOpacity="0.4" />
              </linearGradient>
              <filter id="orb-glow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Dotted Base Arc */}
            <path
              d="M 20 90 A 80 70 0 0 1 180 90"
              fill="none"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="2.5"
              strokeDasharray="4 4"
            />

            {/* Active Progress Arc */}
            <path
              d="M 20 90 A 80 70 0 0 1 180 90"
              fill="none"
              stroke="url(#sunArcGrad)"
              strokeWidth="3.5"
              strokeDasharray="250"
              strokeDashoffset={250 - (250 * sunProgress) / 100}
              style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
            />

            {/* Animated Expanding Pulse Outer Ring */}
            <circle
              cx={sunX}
              cy={sunY}
              r="12"
              fill="none"
              stroke={markerColor}
              strokeWidth="1.5"
              opacity="0.5"
              style={{
                animation: 'sunPulse 2s ease-in-out infinite',
                transition: 'cx 1.2s ease, cy 1.2s ease'
              }}
            />

            {/* Core Sun / Moon Marker Orb */}
            <circle
              cx={sunX}
              cy={sunY}
              r="6.5"
              fill={markerColor}
              filter="url(#orb-glow)"
              style={{
                boxShadow: `0 0 16px ${glowColor}`,
                transition: 'cx 1.2s ease, cy 1.2s ease'
              }}
            />
          </svg>
        </div>

        {/* Sunrise / Sunset Readouts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(0, 0, 0, 0.3)', padding: '6px 10px',
            borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)',
            transition: 'border-color 0.25s, background 0.25s', minWidth: 0
          }}>
            <Sunrise size={15} style={{ color: '#F59E0B', flexShrink: 0 }} />
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <div className="text-tertiary font-data" style={{ fontSize: '8.5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sunrise</div>
              <div className="font-data" style={{ fontSize: '11px', fontWeight: 600, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{sunriseTime}</div>
            </div>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(0, 0, 0, 0.3)', padding: '6px 10px',
            borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)',
            transition: 'border-color 0.25s, background 0.25s', minWidth: 0
          }}>
            <Sunset size={15} style={{ color: '#EF4444', flexShrink: 0 }} />
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <div className="text-tertiary font-data" style={{ fontSize: '8.5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sunset</div>
              <div className="font-data" style={{ fontSize: '11px', fontWeight: 600, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{sunsetTime}</div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9.5px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-data)' }}>
          <span style={{ letterSpacing: '0.06em' }}>{isNight ? 'NIGHT ELEVATION' : 'DAYLIGHT ELEVATION'}</span>
          <span style={{ color: markerColor, fontWeight: 600, letterSpacing: '0.05em' }}>{sunProgress}% COMPLETE</span>
        </div>
      </div>
    </div>
  );
}

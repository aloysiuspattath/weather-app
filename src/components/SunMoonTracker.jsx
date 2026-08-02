import React from 'react';
import { Sunrise, Sunset, Moon, Sun } from 'lucide-react';

// Calculate moon phase (0-1) using astronomical approximation
function getMoonPhase(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // Conway's moon phase algorithm
  let r = year % 100;
  r %= 19;
  if (r > 9) r -= 19;
  r = ((r * 11) % 30) + month + day;
  if (month < 3) r += 2;
  r -= ((year < 2000) ? 4 : 8.3);
  r = Math.floor(r + 0.5) % 30;
  if (r < 0) r += 30;
  return r / 29.53; // 0 = new moon, 0.5 = full moon, 1 = new moon again
}

function getMoonPhaseName(phase) {
  if (phase < 0.03 || phase >= 0.97) return { name: 'New Moon', emoji: '🌑' };
  if (phase < 0.22) return { name: 'Waxing Crescent', emoji: '🌒' };
  if (phase < 0.28) return { name: 'First Quarter', emoji: '🌓' };
  if (phase < 0.47) return { name: 'Waxing Gibbous', emoji: '🌔' };
  if (phase < 0.53) return { name: 'Full Moon', emoji: '🌕' };
  if (phase < 0.72) return { name: 'Waning Gibbous', emoji: '🌖' };
  if (phase < 0.78) return { name: 'Last Quarter', emoji: '🌗' };
  return { name: 'Waning Crescent', emoji: '🌘' };
}

// SVG Moon Phase Visualizer
function MoonPhaseIcon({ phase, size = 36 }) {
  const r = size / 2 - 2;
  const cx = size / 2;
  const cy = size / 2;

  // Calculate the terminator curve
  // phase: 0 = new, 0.25 = first quarter, 0.5 = full, 0.75 = last quarter
  let illumination;
  if (phase <= 0.5) {
    illumination = phase * 2; // 0 to 1 (new to full)
  } else {
    illumination = (1 - phase) * 2; // 1 to 0 (full to new)
  }

  // The terminator is an ellipse whose x-radius varies with illumination
  const terminatorRx = r * Math.abs(1 - illumination * 2);
  const isWaxing = phase <= 0.5;
  const isMoreThanHalf = illumination > 0.5;

  // Build the lit side path
  let litPath;
  if (phase < 0.03 || phase >= 0.97) {
    // New moon - no lit area
    litPath = '';
  } else if (phase >= 0.47 && phase <= 0.53) {
    // Full moon - entire circle lit
    litPath = `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r} A ${r} ${r} 0 1 1 ${cx} ${cy - r}`;
  } else {
    // Partial illumination
    const sweepOuter = 1; // Always go around the lit edge
    const sweepTerminator = (isWaxing && !isMoreThanHalf) || (!isWaxing && isMoreThanHalf) ? 1 : 0;

    if (isWaxing) {
      // Waxing: lit on the right
      litPath = `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} A ${terminatorRx} ${r} 0 0 ${sweepTerminator} ${cx} ${cy - r}`;
    } else {
      // Waning: lit on the left
      litPath = `M ${cx} ${cy - r} A ${r} ${r} 0 0 0 ${cx} ${cy + r} A ${terminatorRx} ${r} 0 0 ${1 - sweepTerminator} ${cx} ${cy - r}`;
    }
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Moon base (dark side) */}
      <circle cx={cx} cy={cy} r={r} fill="#1E293B" stroke="rgba(148, 163, 184, 0.3)" strokeWidth="1" />
      {/* Lit side */}
      {litPath && (
        <path d={litPath} fill="#E2E8F0" style={{ filter: 'drop-shadow(0 0 4px rgba(226, 232, 240, 0.5))' }} />
      )}
      {/* Subtle crater details */}
      <circle cx={cx - r * 0.25} cy={cy - r * 0.15} r={r * 0.12} fill="rgba(148, 163, 184, 0.15)" />
      <circle cx={cx + r * 0.3} cy={cy + r * 0.25} r={r * 0.08} fill="rgba(148, 163, 184, 0.12)" />
      <circle cx={cx - r * 0.1} cy={cy + r * 0.4} r={r * 0.1} fill="rgba(148, 163, 184, 0.1)" />
    </svg>
  );
}

export default function SunMoonTracker({ dailyData }) {
  const sunriseRaw = dailyData?.sunrise?.[0];
  const sunsetRaw = dailyData?.sunset?.[0];

  const formatTime = (timeStr) => {
    if (!timeStr) return '--:--';
    // Timezone-safe: parse from ISO string directly
    const h = parseInt(timeStr.slice(11, 13), 10);
    const m = timeStr.slice(14, 16);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${m} ${ampm}`;
  };

  const sunriseTime = formatTime(sunriseRaw);
  const sunsetTime = formatTime(sunsetRaw);

  // Calculate sun progress % across daylight hours
  let sunProgress = 50;
  let isNight = false;

  if (sunriseRaw && sunsetRaw) {
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const riseH = parseInt(sunriseRaw.slice(11, 13), 10);
    const riseM = parseInt(sunriseRaw.slice(14, 16), 10);
    const setH = parseInt(sunsetRaw.slice(11, 13), 10);
    const setM = parseInt(sunsetRaw.slice(14, 16), 10);
    const riseMinutes = riseH * 60 + riseM;
    const setMinutes = setH * 60 + setM;

    if (nowMinutes <= riseMinutes) {
      sunProgress = 0;
      isNight = true;
    } else if (nowMinutes >= setMinutes) {
      sunProgress = 100;
      isNight = true;
    } else {
      sunProgress = Math.round(((nowMinutes - riseMinutes) / (setMinutes - riseMinutes)) * 100);
      isNight = false;
    }
  }

  // Moon Phase Calculation
  const moonPhase = getMoonPhase(new Date());
  const moonInfo = getMoonPhaseName(moonPhase);
  const moonIllumination = Math.round(
    (moonPhase <= 0.5 ? moonPhase * 2 : (1 - moonPhase) * 2) * 100
  );

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
        <div style={{ position: 'relative', width: '100%', height: '105px', margin: '2px 0' }}>
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
              stroke="rgba(255, 255, 255, 0.12)"
              strokeWidth="3"
              strokeDasharray="4 6"
              strokeLinecap="round"
            />

            {/* Active Progress Arc */}
            <path
              d="M 20 90 A 80 70 0 0 1 180 90"
              fill="none"
              stroke="url(#sunArcGrad)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="242"
              strokeDashoffset={242 - (242 * sunProgress) / 100}
              style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)' }}
            />

            {/* Glowing Sun / Moon Core Orb */}
            <circle
              cx={sunX}
              cy={sunY}
              r="7"
              fill={markerColor}
              style={{
                filter: `drop-shadow(0 0 8px ${markerColor}) drop-shadow(0 0 14px ${glowColor})`,
                transition: 'cx 1s ease, cy 1s ease'
              }}
            />
            
            {/* Sun Core Highlight Dot */}
            <circle
              cx={sunX}
              cy={sunY}
              r="3"
              fill="#FFFFFF"
              style={{
                transition: 'cx 1s ease, cy 1s ease'
              }}
            />
          </svg>
        </div>

        {/* Sunrise / Sunset Readouts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', margin: '4px 0' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(0, 0, 0, 0.3)', padding: '8px 10px',
            borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)',
            transition: 'border-color 0.25s, background 0.25s', minWidth: 0
          }}>
            <Sunrise size={15} style={{ color: '#F59E0B', flexShrink: 0 }} />
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <div className="text-tertiary font-data" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sunrise</div>
              <div className="font-data" style={{ fontSize: '12px', fontWeight: 600, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{sunriseTime}</div>
            </div>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(0, 0, 0, 0.3)', padding: '8px 10px',
            borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)',
            transition: 'border-color 0.25s, background 0.25s', minWidth: 0
          }}>
            <Sunset size={15} style={{ color: '#EF4444', flexShrink: 0 }} />
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <div className="text-tertiary font-data" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sunset</div>
              <div className="font-data" style={{ fontSize: '12px', fontWeight: 600, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{sunsetTime}</div>
            </div>
          </div>
        </div>

        {/* Moon Phase Section */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          background: 'rgba(0, 0, 0, 0.3)', padding: '10px 12px',
          borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)',
          margin: '4px 0'
        }}>
          <MoonPhaseIcon phase={moonPhase} size={38} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#E2E8F0', fontFamily: 'var(--font-main)' }}>
                {moonInfo.emoji} {moonInfo.name}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ flex: 1, height: '3px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: `${moonIllumination}%`, height: '100%', background: 'linear-gradient(90deg, #475569, #E2E8F0)', borderRadius: '2px', transition: 'width 0.5s ease' }} />
              </div>
              <span className="font-data" style={{ fontSize: '10px', color: '#93C5FD', fontWeight: 600, flexShrink: 0 }}>
                {moonIllumination}% lit
              </span>
            </div>
          </div>
        </div>

        {/* Progress Telemetry Bar & Label */}
        <div style={{
          paddingTop: '8px',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          {/* Linear Progress Bar fill */}
          <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${sunProgress}%`, height: '100%', background: markerColor, borderRadius: '2px', transition: 'width 1s ease' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-data)' }}>
            <span style={{ letterSpacing: '0.06em' }}>{isNight ? 'NIGHT ELEVATION' : 'DAYLIGHT ELEVATION'}</span>
            <span style={{ color: markerColor, fontWeight: 600, letterSpacing: '0.05em' }}>{sunProgress}% COMPLETE</span>
          </div>
        </div>
      </div>
    </div>
  );
}

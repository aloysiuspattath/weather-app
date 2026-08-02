import React, { useState, useEffect, useMemo } from 'react';
import { Umbrella, CloudRain, Clock, Sparkles, Droplets } from 'lucide-react';

export default function WillItRainWidget({ hourlyData }) {
  const [selectedHourIndex, setSelectedHourIndex] = useState(() => {
    if (!hourlyData?.time?.length) return 0;
    const now = new Date();
    const currentHour = now.getHours();
    const today = now.getDate();

    const matchIdx = hourlyData.time.findIndex(t => {
      const d = new Date(t);
      return d.getHours() === currentHour && d.getDate() === today;
    });

    if (matchIdx !== -1) return matchIdx;
    const hourIdx = hourlyData.time.findIndex(t => new Date(t).getHours() === currentHour);
    return hourIdx !== -1 ? hourIdx : 0;
  });

  useEffect(() => {
    if (hourlyData?.time?.length) {
      const now = new Date();
      const currentHour = now.getHours();
      const today = now.getDate();

      const matchIdx = hourlyData.time.findIndex(t => {
        const d = new Date(t);
        return d.getHours() === currentHour && d.getDate() === today;
      });

      if (matchIdx !== -1) {
        setSelectedHourIndex(matchIdx);
      } else {
        const hourIdx = hourlyData.time.findIndex(t => new Date(t).getHours() === currentHour);
        setSelectedHourIndex(hourIdx !== -1 ? hourIdx : 0);
      }
    }
  }, [hourlyData]);

  // Extract 24-hour list for today or starting from current forecast
  const hoursList = useMemo(() => {
    if (!hourlyData?.time) return [];

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    let startIdx = hourlyData.time.findIndex(t => t.startsWith(todayStr));
    if (startIdx === -1) startIdx = 0;

    return hourlyData.time.slice(startIdx, startIdx + 24).map((time, offset) => {
      const globalIdx = startIdx + offset;
      const date = new Date(time);
      const hour = date.getHours();
      const timeLabel = date.toLocaleTimeString([], { hour: 'numeric', hour12: true });

      const prob = hourlyData.precipitation_probability?.[globalIdx] ?? 0;
      const precip = hourlyData.precipitation?.[globalIdx] ?? hourlyData.rain?.[globalIdx] ?? 0;

      return {
        globalIdx,
        time,
        hour,
        timeLabel,
        prob,
        precip,
        isNow: hour === now.getHours() && date.getDate() === now.getDate()
      };
    });
  }, [hourlyData]);

  // Extract metrics for currently selected hour index
  const prob = hourlyData?.precipitation_probability?.[selectedHourIndex] ?? 0;
  const precip = hourlyData?.precipitation?.[selectedHourIndex] ?? hourlyData?.rain?.[selectedHourIndex] ?? 0;

  // Format time for selected index
  const selectedTimeStr = hourlyData?.time?.[selectedHourIndex];
  const selectedTimeFormatted = selectedTimeStr
    ? new Date(selectedTimeStr).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
    : 'Selected Hour';

  // Calculate status badge, color bar theme, and advisory
  let statusBadgeText = 'CLEAR SKIES';
  let badgeColor = 'var(--accent-green)';
  let badgeBg = 'rgba(16, 185, 129, 0.15)';
  let badgeBorder = 'rgba(16, 185, 129, 0.3)';
  let gaugeFillColor = 'var(--accent-green)';

  if (prob > 50) {
    statusBadgeText = 'HIGH RAIN RISK';
    badgeColor = '#EF4444';
    badgeBg = 'rgba(239, 68, 68, 0.18)';
    badgeBorder = 'rgba(239, 68, 68, 0.4)';
    gaugeFillColor = 'linear-gradient(90deg, #3B82F6 0%, #EF4444 100%)';
  } else if (prob >= 20) {
    statusBadgeText = 'MODERATE CHANCE';
    badgeColor = '#F59E0B';
    badgeBg = 'rgba(245, 158, 11, 0.18)';
    badgeBorder = 'rgba(245, 158, 11, 0.4)';
    gaugeFillColor = '#F59E0B';
  }

  // Smart Advisory message logic
  let advisoryMessage = '';
  if (prob > 50) {
    advisoryMessage = `${prob}% Chance of Rain — High probability of downpour around ${selectedTimeFormatted}. Carry an umbrella!`;
  } else if (prob >= 20) {
    advisoryMessage = `${prob}% Chance of Rain — Moderate chance of rainfall around ${selectedTimeFormatted}. Consider carrying a light jacket or umbrella!`;
  } else {
    advisoryMessage = `${prob}% Chance of Rain — Clear skies and dry weather expected around ${selectedTimeFormatted}. Enjoy your day!`;
  }

  return (
    <div className="widget-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Widget Header */}
      <div className="widget-header" style={{ marginBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Umbrella size={18} style={{ color: 'var(--accent)' }} />
          <span className="widget-title">SMART RAIN PREDICTOR</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={12} className="text-tertiary" />
          <span className="font-data" style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
            HOURLY RISK
          </span>
        </div>
      </div>

      {/* Main Gauge & Status Badge Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: 'var(--radius-inner)',
        padding: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: prob > 50 ? 'rgba(239, 68, 68, 0.15)' : prob >= 20 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            border: `1px solid ${badgeBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: `0 0 16px ${prob > 50 ? 'rgba(239, 68, 68, 0.2)' : prob >= 20 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`
          }}>
            <CloudRain size={24} style={{ color: badgeColor }} />
          </div>

          <div>
            <div className="font-data text-tertiary" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              RAIN PROBABILITY
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span className="font-data" style={{ fontSize: '32px', fontWeight: '600', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                {prob}%
              </span>
              <span className="font-data text-tertiary" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '3px', fontVariantNumeric: 'tabular-nums' }}>
                <Droplets size={12} style={{ color: '#60A5FA' }} />
                {precip > 0 ? `${precip.toFixed(1)} mm` : '0 mm'}
              </span>
            </div>
          </div>
        </div>

        <div style={{
          background: badgeBg,
          border: `1px solid ${badgeBorder}`,
          color: badgeColor,
          padding: '6px 14px',
          borderRadius: 'var(--radius-pill)',
          fontSize: '11px',
          fontWeight: '600',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          boxShadow: `0 0 14px ${badgeBg}`
        }}>
          {statusBadgeText}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: 'var(--font-data)' }} className="text-tertiary">
          <span style={{ letterSpacing: '0.05em' }}>0% DRY</span>
          <span style={{ letterSpacing: '0.05em' }}>50% MODERATE</span>
          <span style={{ letterSpacing: '0.05em' }}>100% HEAVY</span>
        </div>
        <div style={{
          height: '8px',
          width: '100%',
          borderRadius: '4px',
          background: 'rgba(255, 255, 255, 0.06)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${Math.min(Math.max(prob, 0), 100)}%`,
            background: gaugeFillColor,
            borderRadius: '4px',
            transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: `0 0 12px ${prob > 50 ? 'rgba(239, 68, 68, 0.5)' : prob >= 20 ? 'rgba(245, 158, 11, 0.5)' : 'rgba(16, 185, 129, 0.5)'}`
          }} />
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        background: 'rgba(59, 130, 246, 0.06)',
        border: '1px solid rgba(59, 130, 246, 0.18)',
        borderRadius: 'var(--radius-inner)',
        padding: '12px 14px'
      }}>
        <Sparkles size={16} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: '1.45' }}>
          <strong style={{ color: badgeColor }}>Smart Advisory: </strong>
          {advisoryMessage}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="widget-title" style={{ fontSize: '10px' }}>SELECT HOUR TELEMETRY</span>
          <span className="font-data text-tertiary" style={{ fontSize: '11px', fontVariantNumeric: 'tabular-nums' }}>
            {selectedTimeFormatted}
          </span>
        </div>

        <div style={{
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          paddingBottom: '6px',
          scrollbarWidth: 'thin'
        }}>
          {hoursList.length > 0 ? (
            hoursList.map((h) => {
              const isSelected = h.globalIdx === selectedHourIndex;
              return (
                <button
                  key={h.globalIdx}
                  onClick={() => setSelectedHourIndex(h.globalIdx)}
                  style={{
                    background: isSelected ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                    border: isSelected ? '1px solid var(--accent)' : '1px solid rgba(255, 255, 255, 0.06)',
                    color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                    borderRadius: 'var(--radius-inner)',
                    padding: '6px 10px',
                    fontSize: '11px',
                    fontFamily: 'var(--font-data)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    transition: 'all 0.2s ease',
                    minWidth: '56px',
                    boxShadow: isSelected ? '0 0 10px rgba(59, 130, 246, 0.2)' : 'none'
                  }}
                >
                  <span style={{ fontSize: '10px', color: h.isNow ? 'var(--accent)' : 'inherit', fontWeight: h.isNow ? '600' : 'normal' }}>
                    {h.isNow ? 'NOW' : h.timeLabel}
                  </span>
                  <span style={{
                    fontSize: '9px',
                    fontVariantNumeric: 'tabular-nums',
                    color: h.prob > 50 ? '#EF4444' : h.prob >= 20 ? '#F59E0B' : 'var(--text-tertiary)'
                  }}>
                    {h.prob}%
                  </span>
                </button>
              );
            })
          ) : (
            Array.from({ length: 24 }).map((_, i) => {
              const hLabel = i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`;
              const isSelected = i === selectedHourIndex;
              return (
                <button
                  key={i}
                  onClick={() => setSelectedHourIndex(i)}
                  style={{
                    background: isSelected ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                    border: isSelected ? '1px solid var(--accent)' : '1px solid rgba(255, 255, 255, 0.06)',
                    color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                    borderRadius: 'var(--radius-inner)',
                    padding: '6px 10px',
                    fontSize: '11px',
                    fontFamily: 'var(--font-data)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease',
                    minWidth: '56px'
                  }}
                >
                  {hLabel}
                </button>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}

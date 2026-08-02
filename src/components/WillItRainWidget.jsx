import React, { useState, useEffect, useMemo } from 'react';
import { Umbrella, CloudRain, Clock, Sparkles, Droplets, Sun, Cloud } from 'lucide-react';

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

  // Format time for selected index (timezone-safe: parse ISO string directly)
  const selectedTimeStr = hourlyData?.time?.[selectedHourIndex];
  let selectedTimeFormatted = 'Selected Hour';
  if (selectedTimeStr) {
    const h = parseInt(selectedTimeStr.slice(11, 13), 10);
    const ampm = h >= 12 ? 'pm' : 'am';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    selectedTimeFormatted = `${h12}:00 ${ampm}`;
  }

  // Strict ground rain check: Requires precip >= 0.35 mm/h AND prob >= 45% for active rain risk
  const isDownpourRisk = prob >= 45 && precip >= 0.35;
  const isPassingShowerRisk = (prob >= 35 || precip > 0.1) && precip < 0.35;

  // Calculate status badge, color bar theme, and advisory
  let statusBadgeText = 'CLEAR / NO RAIN';
  let badgeColor = '#10B981';
  let badgeBg = 'rgba(16, 185, 129, 0.15)';
  let badgeBorder = 'rgba(16, 185, 129, 0.3)';
  let gaugeFillColor = '#10B981';

  if (isDownpourRisk) {
    statusBadgeText = 'ACTIVE DOWNPOUR RISK';
    badgeColor = '#EF4444';
    badgeBg = 'rgba(239, 68, 68, 0.18)';
    badgeBorder = 'rgba(239, 68, 68, 0.4)';
    gaugeFillColor = 'linear-gradient(90deg, #3B82F6 0%, #EF4444 100%)';
  } else if (isPassingShowerRisk) {
    statusBadgeText = 'LIGHT DRIZZLE / OVERCAST';
    badgeColor = '#F59E0B';
    badgeBg = 'rgba(245, 158, 11, 0.18)';
    badgeBorder = 'rgba(245, 158, 11, 0.4)';
    gaugeFillColor = '#F59E0B';
  }

  // Smart Advisory message logic taking into account precipitation rate (mm)
  let advisoryMessage = '';
  if (isDownpourRisk) {
    advisoryMessage = `${prob}% Rain Probability (${precip.toFixed(1)} mm/h expected) — Active downpour expected around ${selectedTimeFormatted}. Carry an umbrella!`;
  } else if (isPassingShowerRisk) {
    if (precip > 0.1) {
      advisoryMessage = `${prob}% Rain Probability (${precip.toFixed(1)} mm/h expected) — Passing drizzle around ${selectedTimeFormatted}.`;
    } else {
      advisoryMessage = `${prob}% Rain Cloud Probability (0.0 mm rainfall expected) — Overcast skies around ${selectedTimeFormatted}, but ground rainfall is 0.0 mm. No umbrella needed.`;
    }
  } else {
    advisoryMessage = `${prob}% Rain Probability (0.0 mm rainfall expected) — Dry weather and clear/overcast conditions around ${selectedTimeFormatted}. Enjoy your day!`;
  }

  return (
    <div className="widget-panel animate-in delay-4" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Header */}
      <div className="widget-header" style={{ marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Umbrella size={16} style={{ color: '#60A5FA' }} />
          <h2 className="widget-title">SMART RAIN PREDICTOR</h2>
        </div>

        {/* Dynamic Status Badge */}
        <div style={{ 
          background: badgeBg,
          border: `1px solid ${badgeBorder}`,
          color: badgeColor,
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '11px',
          fontFamily: 'var(--font-data)',
          fontWeight: 700,
          letterSpacing: '0.08em',
          boxShadow: `0 0 12px ${badgeColor}33`
        }}>
          {statusBadgeText}
        </div>
      </div>

      {/* Main Gauge & Metrics Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '20px',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        {/* Left: Gauge & Percentages */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
            <span className="text-secondary font-data" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              RAIN CLOUD PROBABILITY ({selectedTimeFormatted})
            </span>
            <span className="font-data" style={{ fontSize: '28px', fontWeight: 700, color: '#ffffff' }}>
              {prob}<span style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>%</span>
            </span>
          </div>

          {/* Color Progress Bar Gauge */}
          <div style={{ 
            width: '100%', 
            height: '10px', 
            background: 'rgba(255, 255, 255, 0.08)', 
            borderRadius: '6px', 
            overflow: 'hidden',
            marginBottom: '8px',
            position: 'relative'
          }}>
            <div style={{ 
              width: `${Math.max(prob, 4)}%`, 
              height: '100%', 
              background: gaugeFillColor,
              borderRadius: '6px',
              transition: 'width 0.4s ease-out'
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-data)' }}>
            <span>0% CLEAR</span>
            <span>50% MODERATE</span>
            <span>100% HEAVY</span>
          </div>
        </div>

        {/* Right: Rainfall Rate Readout */}
        <div style={{ 
          background: 'rgba(0, 0, 0, 0.3)', 
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{ minWidth: 0 }}>
            <div className="text-tertiary font-data" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
              EXPECTED PRECIPITATION RATE
            </div>
            <div className="font-data" style={{ fontSize: '22px', fontWeight: 700, color: precip > 0.35 ? '#60A5FA' : 'var(--text-primary)' }}>
              {precip.toFixed(1)} <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 400 }}>mm/h</span>
            </div>
          </div>

          <div style={{ 
            width: '42px', height: '42px', borderRadius: '50%', 
            flexShrink: 0,
            background: precip > 0.35 ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            border: precip > 0.35 ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {precip > 0.35 ? <CloudRain size={20} style={{ color: '#60A5FA' }} /> : <Cloud size={20} style={{ color: 'var(--text-tertiary)' }} />}
          </div>
        </div>
      </div>

      {/* Advisory Alert Banner */}
      <div style={{
        background: 'rgba(59, 130, 246, 0.08)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        borderRadius: '10px',
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '20px'
      }}>
        <Sparkles size={16} style={{ color: '#60A5FA', flexShrink: 0 }} />
        <span style={{ fontSize: '12px', color: '#E2E8F0', fontFamily: 'var(--font-main)' }}>
          {advisoryMessage}
        </span>
      </div>

      {/* 24-Hour Selector Scroll Row */}
      <div>
        <div className="text-tertiary font-data" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
          SELECT HOUR TO INSPECT PRECIPITATION TELEMETRY
        </div>

        <div style={{
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          paddingBottom: '4px',
          scrollbarWidth: 'thin'
        }}>
          {hoursList.map((item) => {
            const isSelected = item.globalIdx === selectedHourIndex;

            return (
              <button
                key={item.globalIdx}
                onClick={() => setSelectedHourIndex(item.globalIdx)}
                style={{
                  flex: '0 0 auto',
                  minWidth: '55px',
                  padding: '8px 6px',
                  borderRadius: '10px',
                  border: isSelected ? '1px solid #60A5FA' : '1px solid rgba(255, 255, 255, 0.06)',
                  background: isSelected ? 'rgba(59, 130, 246, 0.22)' : 'rgba(0, 0, 0, 0.25)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                <div className="font-data" style={{ fontSize: '9px', color: isSelected ? '#ffffff' : 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                  {item.isNow ? 'NOW' : item.timeLabel}
                </div>
                <div className="font-data" style={{ 
                  fontSize: '11px', 
                  fontWeight: 600, 
                  color: item.prob > 45 && item.precip > 0.2 ? '#60A5FA' : 'var(--text-primary)',
                  marginTop: '2px' 
                }}>
                  {item.prob}%
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

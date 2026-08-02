import React, { useState } from 'react';
import { Activity, CloudRain, Thermometer } from 'lucide-react';

export default function ModelComparison({ multiModel }) {
  const [metric, setMetric] = useState('temp'); // 'temp' or 'precip'

  if (!multiModel || !multiModel.hourly) return null;

  // Extract next 24 hours of data
  const now = new Date();
  const currentHourString = now.toISOString().slice(0, 14) + '00';
  
  // Find index of current hour
  let startIndex = multiModel.hourly.time.findIndex(t => t >= currentHourString);
  if (startIndex === -1) startIndex = 0;
  
  const endIndex = Math.min(startIndex + 24, multiModel.hourly.time.length);
  
  const models = [
    { id: 'ecmwf', label: 'ECMWF', color: '#3B82F6', abbr: 'EC' },
    { id: 'gfs', label: 'GFS', color: '#EF4444', abbr: 'GFS' },
    { id: 'jma', label: 'JMA', color: '#10B981', abbr: 'JMA' },
    { id: 'icon', label: 'ICON', color: '#F59E0B', abbr: 'ICN' }
  ];

  // Helper to safely slice and map data
  const getSlice = (modelId, metricKey) => {
    const dataArray = multiModel.hourly[metricKey][modelId];
    if (!dataArray || dataArray.length === 0) return Array(endIndex - startIndex).fill(0);
    return dataArray.slice(startIndex, endIndex);
  };

  const timeLabels = multiModel.hourly.time.slice(startIndex, endIndex).map(t => {
    const d = new Date(t);
    return d.getHours() % 12 || 12; // 12-hour format
  });

  // Filter out models that have no valid data in this slice
  const validModels = models.map(m => ({
    ...m,
    values: getSlice(m.id, metric)
  })).filter(m => m.values.some(v => v !== null && v !== undefined));

  // Find min and max for scaling
  const allValues = validModels.flatMap(m => m.values).filter(v => v !== null && v !== undefined);
  let min = allValues.length > 0 ? Math.min(...allValues) : 0;
  let max = allValues.length > 0 ? Math.max(...allValues) : 1;

  if (metric === 'precip') {
    min = 0;
    max = Math.max(max, 1); // at least 1mm for scaling
  } else {
    // Add some padding to temp bounds
    min = Math.floor(min) - 1;
    max = Math.ceil(max) + 1;
  }
  
  if(min === max) max = min + 1;

  // SVG Chart dimensions
  const width = 800;
  const height = 140;
  const paddingX = 30;
  const paddingY = 20;
  
  const scaleX = (index) => paddingX + (index * ((width - paddingX * 2) / (timeLabels.length - 1)));
  const scaleY = (val) => {
    if (val === null || val === undefined) return height - paddingY; // fallback
    return height - paddingY - (((val - min) / (max - min)) * (height - paddingY * 2));
  };

  // Calculate consensus/divergence score for the current hour
  const currentVals = validModels.map(m => m.values[0]).filter(v => v !== null && v !== undefined);
  let confidence = 0;
  
  if (currentVals.length > 0) {
    const avg = currentVals.reduce((a, b) => a + b, 0) / currentVals.length;
    const variance = currentVals.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / currentVals.length;
    const stdDev = Math.sqrt(variance);
    
    if (metric === 'temp') {
      confidence = Math.max(0, 100 - (stdDev * 30));
    } else {
      confidence = Math.max(0, 100 - (stdDev * 50));
    }
  }

  return (
    <div className="widget-panel" style={{ gridColumn: 'span 12' }}>
      <div className="widget-header" style={{ marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={16} className="text-tertiary" />
          <h2 className="widget-title">MULTI-MODEL CONSENSUS (24H METRICS)</h2>
        </div>
        
        {/* Toggle Temp/Precip */}
        <div className="radar-layer-toggles" style={{ position: 'static' }}>
          <button 
            className={`radar-layer-btn ${metric === 'temp' ? 'active' : ''}`}
            onClick={() => setMetric('temp')}
          >
            <Thermometer size={12} />
            <span>Temperature</span>
          </button>
          <button 
            className={`radar-layer-btn ${metric === 'precip' ? 'active' : ''}`}
            onClick={() => setMetric('precip')}
          >
            <CloudRain size={12} />
            <span>Precipitation</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
        {/* Confidence Gauge */}
        <div style={{ 
          width: '120px', textAlign: 'center', padding: '8px 12px', 
          background: 'rgba(0,0,0,0.25)', borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0
        }}>
          <div className="text-tertiary font-data" style={{ fontSize: '10px', marginBottom: '4px', letterSpacing: '0.08em' }}>AGREEMENT</div>
          <div className="font-data" style={{ 
            fontSize: '22px', 
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
            color: confidence > 80 ? '#10B981' : confidence > 50 ? '#F59E0B' : '#EF4444' 
          }}>
            {currentVals.length > 0 ? `${Math.round(confidence)}%` : '--'}
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {validModels.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 255, 255, 0.03)', padding: '5px 10px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <div style={{ width: '8px', height: '8px', background: m.color, borderRadius: '50%', boxShadow: `0 0 8px ${m.color}` }}></div>
              <span className="font-data" style={{ fontSize: '11px', color: 'var(--text-primary)', fontWeight: 500 }}>{m.label}</span>
            </div>
          ))}
          {validModels.length < models.length && (
            <span className="text-tertiary font-data" style={{ fontSize: '10px', marginLeft: 'auto', alignSelf: 'center' }}>
              *(Some models unavailable)
            </span>
          )}
        </div>
      </div>

      {/* Line Chart */}
      <div style={{ width: '100%', overflowX: 'auto', overflowY: 'hidden' }}>
        <div style={{ minWidth: '320px', height: `${height + 25}px`, position: 'relative' }}>
          <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
            
            {/* Grid Lines */}
            <line x1={0} y1={scaleY(min)} x2={width} y2={scaleY(min)} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
            <line x1={0} y1={scaleY((min+max)/2)} x2={width} y2={scaleY((min+max)/2)} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
            <line x1={0} y1={scaleY(max)} x2={width} y2={scaleY(max)} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />

            {/* Model Lines */}
            {validModels.map((m) => {
              const points = m.values.map((v, i) => {
                if (v === null || v === undefined) return ''; // Skip nulls
                return `${scaleX(i)},${scaleY(v)}`;
              }).filter(p => p !== '').join(' ');
              
              const firstValidIdx = m.values.findIndex(v => v !== null && v !== undefined);
              const firstValidVal = firstValidIdx !== -1 ? m.values[firstValidIdx] : null;

              return (
                <g key={m.id}>
                  <polyline 
                    fill="none" 
                    stroke={m.color} 
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.8"
                    points={points} 
                  />
                  {/* Current point dot */}
                  {firstValidVal !== null && (
                    <circle cx={scaleX(firstValidIdx)} cy={scaleY(firstValidVal)} r="3" fill={m.color} />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Time Labels */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', padding: `0 ${paddingX}px` }}>
            {timeLabels.map((t, i) => (
              <div key={i} className="font-data text-tertiary" style={{ fontSize: '9px', textAlign: 'center', width: '20px', transform: 'translateX(-10px)' }}>
                {i % 3 === 0 ? t : ''}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Activity, CloudRain, Thermometer, Cpu } from 'lucide-react';

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
    { id: 'ecmwf', label: 'ECMWF HRES', origin: 'European 9km', color: '#3B82F6', abbr: 'ECMWF' },
    { id: 'gfs', label: 'GFS (NOAA)', origin: 'US NCEP 13km', color: '#EF4444', abbr: 'GFS' },
    { id: 'icon', label: 'ICON (DWD)', origin: 'German 13km', color: '#F59E0B', abbr: 'ICON' },
    { id: 'jma', label: 'JMA', origin: 'Japan 20km', color: '#10B981', abbr: 'JMA' }
  ];

  // Helper to safely slice and map data
  const getSlice = (modelId, metricKey) => {
    const dataArray = multiModel.hourly?.[metricKey]?.[modelId];
    if (!dataArray || dataArray.length === 0) return Array(endIndex - startIndex).fill(null);
    return dataArray.slice(startIndex, endIndex);
  };

  const timeLabels = multiModel.hourly.time.slice(startIndex, endIndex).map(t => {
    const d = new Date(t);
    return d.getHours() % 12 || 12; // 12-hour format
  });

  // Filter out models that have data
  const validModels = models.map(m => {
    const tempSlice = getSlice(m.id, 'temp');
    const precipSlice = getSlice(m.id, 'precip');
    const currentTemp = tempSlice[0] !== null && tempSlice[0] !== undefined ? Math.round(tempSlice[0] * 10) / 10 : null;
    const currentPrecip = precipSlice[0] !== null && precipSlice[0] !== undefined ? Math.round(precipSlice[0] * 10) / 10 : null;
    return {
      ...m,
      values: metric === 'temp' ? tempSlice : precipSlice,
      currentTemp,
      currentPrecip
    };
  }).filter(m => m.values.some(v => v !== null && v !== undefined));

  // Find min and max for scaling line chart
  const allValues = validModels.flatMap(m => m.values).filter(v => v !== null && v !== undefined);
  let min = allValues.length > 0 ? Math.min(...allValues) : 0;
  let max = allValues.length > 0 ? Math.max(...allValues) : 1;

  if (metric === 'precip') {
    min = 0;
    max = Math.max(max, 1);
  } else {
    min = Math.floor(min) - 1;
    max = Math.ceil(max) + 1;
  }
  
  if (min === max) max = min + 1;

  // SVG Chart dimensions
  const width = 800;
  const height = 130;
  const paddingX = 30;
  const paddingY = 16;
  
  const scaleX = (index) => paddingX + (index * ((width - paddingX * 2) / Math.max(timeLabels.length - 1, 1)));
  const scaleY = (val) => {
    if (val === null || val === undefined) return height - paddingY;
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
      {/* Header */}
      <div className="widget-header" style={{ marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cpu size={16} style={{ color: 'var(--accent)' }} />
          <h2 className="widget-title">SIDE-BY-SIDE 4-MODEL ENSEMBLE CONSENSUS</h2>
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

      {/* Side-by-Side 4-Model Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '10px',
        marginBottom: '16px'
      }}>
        {models.map((m) => {
          const validM = validModels.find(vm => vm.id === m.id);
          const tempVal = validM?.currentTemp !== null && validM?.currentTemp !== undefined ? `${validM.currentTemp}°C` : '--';
          const precipVal = validM?.currentPrecip !== null && validM?.currentPrecip !== undefined ? `${validM.currentPrecip} mm` : '--';

          return (
            <div key={m.id} style={{
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '10px',
              border: `1px solid ${m.color}33`,
              padding: '12px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: m.color
              }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="font-data" style={{ fontSize: '11px', fontWeight: 700, color: m.color }}>{m.label}</span>
                <span className="font-data text-tertiary" style={{ fontSize: '9px' }}>{m.origin}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <div className="text-tertiary font-data" style={{ fontSize: '9px', textTransform: 'uppercase' }}>Current Temp</div>
                  <div className="font-data" style={{ fontSize: '18px', fontWeight: 600, color: '#F8FAFC' }}>{tempVal}</div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div className="text-tertiary font-data" style={{ fontSize: '9px', textTransform: 'uppercase' }}>Precip Rate</div>
                  <div className="font-data" style={{ fontSize: '13px', fontWeight: 500, color: '#60A5FA' }}>{precipVal}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Model Consensus Bar & Legend */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: '10px',
          background: 'rgba(0,0,0,0.25)', padding: '6px 14px', borderRadius: '10px',
          border: '1px solid rgba(255,255,255,0.06)'
        }}>
          <span className="text-tertiary font-data" style={{ fontSize: '10px', letterSpacing: '0.08em' }}>MODEL AGREEMENT CONSENSUS:</span>
          <span className="font-data" style={{ 
            fontSize: '14px', 
            fontWeight: 700,
            color: confidence > 80 ? '#10B981' : confidence > 50 ? '#F59E0B' : '#EF4444' 
          }}>
            {currentVals.length > 0 ? `${Math.round(confidence)}%` : '--'}
          </span>
        </div>
      </div>

      {/* 24-Hour Trend Overlay Line Chart */}
      <div style={{ width: '100%', overflowX: 'auto', overflowY: 'hidden' }}>
        <div style={{ minWidth: '320px', height: `${height + 20}px`, position: 'relative' }}>
          <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
            {/* Grid Lines */}
            <line x1={0} y1={scaleY(min)} x2={width} y2={scaleY(min)} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
            <line x1={0} y1={scaleY((min+max)/2)} x2={width} y2={scaleY((min+max)/2)} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
            <line x1={0} y1={scaleY(max)} x2={width} y2={scaleY(max)} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />

            {/* Model Lines */}
            {validModels.map((m) => {
              const points = m.values.map((v, i) => {
                if (v === null || v === undefined) return '';
                return `${scaleX(i)},${scaleY(v)}`;
              }).filter(p => p !== '').join(' ');
              
              const firstValidIdx = m.values.findIndex(v => v !== null && v !== undefined);
              const firstValidVal = firstValidIdx !== -1 ? m.values[firstValidIdx] : null;

              return (
                <g key={m.id}>
                  <polyline 
                    fill="none" 
                    stroke={m.color} 
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.85"
                    points={points} 
                  />
                  {firstValidVal !== null && (
                    <circle cx={scaleX(firstValidIdx)} cy={scaleY(firstValidVal)} r="3.5" fill={m.color} />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Time Labels */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px', padding: `0 ${paddingX}px` }}>
            {timeLabels.map((t, i) => (
              <div key={i} className="font-data text-tertiary" style={{ fontSize: '9px', textAlign: 'center', width: '20px', transform: 'translateX(-10px)' }}>
                {i % 3 === 0 ? `${t}:00` : ''}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

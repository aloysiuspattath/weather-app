import React from 'react';
import { AlertTriangle, AlertOctagon } from 'lucide-react';

export default function RegionalAlerts({ alerts }) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
      {alerts.map((alert, idx) => {
        const Icon = alert.level === 'RED' ? AlertOctagon : AlertTriangle;
        return (
          <div 
            key={idx} 
            className="widget-panel animate-in" 
            style={{ 
              animationDelay: `${idx * 0.1}s`,
              background: alert.bg,
              border: `1px solid ${alert.color}55`,
              borderLeft: `4px solid ${alert.color}`,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              borderRadius: '8px',
              boxShadow: `0 4px 12px ${alert.color}22`
            }}
          >
            <div style={{ marginTop: '2px' }}>
              <Icon size={20} color={alert.color} />
            </div>
            <div>
              <div style={{ 
                fontFamily: 'var(--font-data)', 
                color: alert.color, 
                fontWeight: 700, 
                fontSize: '11px', 
                letterSpacing: '0.05em',
                marginBottom: '4px',
                textTransform: 'uppercase'
              }}>
                {alert.level} WARNING • {alert.type}
              </div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 600, color: '#fff' }}>
                {alert.title}
              </h4>
              <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.4 }}>
                {alert.message}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

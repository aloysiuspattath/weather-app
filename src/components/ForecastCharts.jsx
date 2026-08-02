import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ForecastCharts({ hourlyData }) {
  if (!hourlyData) return null;

  // Process data for the next 24 hours
  const chartData = hourlyData.time.slice(0, 24).map((time, index) => ({
    time: new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    temp: hourlyData.temperature_2m[index],
    precip: hourlyData.precipitation_probability[index]
  }));

  return (
    <div className="glass-panel" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>24-Hour Forecast</h3>
      
      <div style={{ flex: 1, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent-color)" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
            <XAxis dataKey="time" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip />
            <Area 
              type="monotone" 
              dataKey="temp" 
              stroke="var(--accent-color)" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorTemp)" 
              name="Temperature (°C)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

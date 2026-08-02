import React from 'react';

export default function AnimatedBackground({ weatherCode, isDay }) {
  // Determine color tint based on weatherCode
  let tintColor = 'rgba(59, 130, 246, 0.15)'; // Default blue tint
  
  if (weatherCode !== undefined) {
    if (weatherCode <= 3) {
      // Sunny / Clear / Partly Cloudy
      tintColor = isDay ? 'rgba(245, 158, 11, 0.15)' : 'rgba(139, 92, 246, 0.1)';
    } else if (weatherCode >= 51 && weatherCode <= 67) {
      // Rain / Drizzle
      tintColor = 'rgba(14, 165, 233, 0.15)';
    } else if (weatherCode >= 71 && weatherCode <= 86) {
      // Snow
      tintColor = 'rgba(255, 255, 255, 0.1)';
    } else if (weatherCode >= 95) {
      // Thunderstorm
      tintColor = 'rgba(139, 92, 246, 0.2)'; // Purple tint
    }
  }

  return (
    <>
      <style>
        {`
          @keyframes ambient-drift {
            0% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(3vw, 3vh) scale(1.05); }
            66% { transform: translate(-2vw, 4vh) scale(0.95); }
            100% { transform: translate(0, 0) scale(1); }
          }
          @keyframes ambient-drift-alt {
            0% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(-4vw, -2vh) scale(0.95); }
            66% { transform: translate(2vw, -4vh) scale(1.05); }
            100% { transform: translate(0, 0) scale(1); }
          }
        `}
      </style>
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--bg-void)',
        overflow: 'hidden',
        zIndex: 0,
        pointerEvents: 'none'
      }}>
        {/* Base dark gradient */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 0%, var(--bg-deep) 0%, var(--bg-void) 100%)',
        }} />
        
        {/* Animated Radial Gradients */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          left: '-10%',
          width: '70vw',
          height: '70vw',
          background: `radial-gradient(circle, ${tintColor} 0%, transparent 70%)`,
          filter: 'blur(60px)',
          animation: 'ambient-drift 20s ease-in-out infinite',
          opacity: 0.8
        }} />
        
        <div style={{
          position: 'absolute',
          bottom: '-30%',
          right: '-20%',
          width: '80vw',
          height: '80vw',
          background: `radial-gradient(circle, ${tintColor} 0%, transparent 60%)`,
          filter: 'blur(80px)',
          animation: 'ambient-drift-alt 25s ease-in-out infinite',
          opacity: 0.6
        }} />

        {/* Faint terminal grid pattern */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
          backgroundPosition: 'center center',
          opacity: 0.7
        }} />
      </div>
    </>
  );
}

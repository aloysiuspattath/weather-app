import React from 'react';

export default function AnimatedBackground({ weatherCode, isDay }) {
  // Determine rich multi-color atmospheric palette based on live weather code
  let primaryColor = 'rgba(59, 130, 246, 0.24)';   // Electric Blue
  let secondaryColor = 'rgba(14, 165, 233, 0.2)';  // Cyan Glow
  let tertiaryColor = 'rgba(99, 102, 241, 0.15)';  // Indigo Aura
  let topHighlight = 'rgba(59, 130, 246, 0.12)';

  if (weatherCode !== undefined) {
    if (weatherCode <= 1 && isDay !== 0) {
      // Sunny / Clear Day
      primaryColor = 'rgba(245, 158, 11, 0.28)';   // Golden Sun
      secondaryColor = 'rgba(239, 68, 68, 0.18)';  // Warm Coral
      tertiaryColor = 'rgba(59, 130, 246, 0.18)';   // Sky Blue
      topHighlight = 'rgba(245, 158, 11, 0.15)';
    } else if (weatherCode <= 1 && isDay === 0) {
      // Clear Night
      primaryColor = 'rgba(99, 102, 241, 0.28)';   // Starry Indigo
      secondaryColor = 'rgba(139, 92, 246, 0.22)'; // Deep Violet
      tertiaryColor = 'rgba(14, 165, 233, 0.15)';  // Cosmic Blue
      topHighlight = 'rgba(99, 102, 241, 0.14)';
    } else if (weatherCode === 2 || weatherCode === 3 || weatherCode === 45 || weatherCode === 48) {
      // Overcast / Cloudy
      primaryColor = 'rgba(148, 163, 184, 0.25)';  // Silver Slate
      secondaryColor = 'rgba(51, 65, 85, 0.35)';    // Dark Slate
      tertiaryColor = 'rgba(59, 130, 246, 0.16)';   // Cool Tint
      topHighlight = 'rgba(148, 163, 184, 0.12)';
    } else if (weatherCode >= 51 && weatherCode <= 67) {
      // Rain / Drizzle
      primaryColor = 'rgba(37, 99, 235, 0.32)';    // Deep Ocean Blue
      secondaryColor = 'rgba(6, 182, 212, 0.24)';   // Electric Cyan
      tertiaryColor = 'rgba(15, 23, 42, 0.4)';     // Void Blue
      topHighlight = 'rgba(6, 182, 212, 0.15)';
    } else if (weatherCode >= 71 && weatherCode <= 86) {
      // Snow
      primaryColor = 'rgba(56, 189, 248, 0.28)';   // Ice Blue
      secondaryColor = 'rgba(255, 255, 255, 0.18)'; // Frost White
      tertiaryColor = 'rgba(30, 41, 59, 0.3)';     // Dark Ice
      topHighlight = 'rgba(56, 189, 248, 0.15)';
    } else if (weatherCode >= 95) {
      // Thunderstorm
      primaryColor = 'rgba(168, 85, 247, 0.38)';   // Electric Purple
      secondaryColor = 'rgba(126, 34, 206, 0.28)'; // Midnight Violet
      tertiaryColor = 'rgba(239, 68, 68, 0.16)';   // Hazard Red
      topHighlight = 'rgba(168, 85, 247, 0.18)';
    }
  }

  // Floating background stardust particles
  const dustParticles = Array.from({ length: 16 }, (_, i) => ({
    id: i,
    top: `${(i * 6.3 + 3) % 94}%`,
    left: `${(i * 11.7 + 2) % 96}%`,
    size: `${2 + (i % 3)}px`,
    duration: `${14 + (i % 5) * 4}s`,
    delay: `${(i % 7) * 1.2}s`
  }));

  return (
    <>
      <style>
        {`
          @keyframes ambient-mesh-1 {
            0% { transform: translate(0, 0) scale(1) rotate(0deg); }
            33% { transform: translate(4vw, 5vh) scale(1.08) rotate(120deg); }
            66% { transform: translate(-3vw, 2vh) scale(0.92) rotate(240deg); }
            100% { transform: translate(0, 0) scale(1) rotate(360deg); }
          }
          @keyframes ambient-mesh-2 {
            0% { transform: translate(0, 0) scale(1) rotate(0deg); }
            33% { transform: translate(-5vw, -3vh) scale(0.92) rotate(-120deg); }
            66% { transform: translate(3vw, -5vh) scale(1.1) rotate(-240deg); }
            100% { transform: translate(0, 0) scale(1) rotate(-360deg); }
          }
          @keyframes dust-float {
            0%, 100% { transform: translateY(0px) opacity(0.3); }
            50% { transform: translateY(-25px) opacity(0.8); }
          }
        `}
      </style>
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#090D16',
        overflow: 'hidden',
        zIndex: 0,
        pointerEvents: 'none'
      }}>
        {/* Base Void Dark Radial Gradient */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 0%, #0F172A 0%, #090D16 70%, #030712 100%)',
        }} />

        {/* Top Aurora Highlight Beam */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '350px',
          background: `linear-gradient(180deg, ${topHighlight} 0%, transparent 100%)`,
          pointerEvents: 'none'
        }} />
        
        {/* Animated Primary Mesh Orb (Top Left) */}
        <div style={{
          position: 'absolute',
          top: '-15%',
          left: '-10%',
          width: '65vw',
          height: '65vw',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${primaryColor} 0%, transparent 68%)`,
          filter: 'blur(75px)',
          animation: 'ambient-mesh-1 25s ease-in-out infinite',
          opacity: 0.9
        }} />

        {/* Animated Secondary Mesh Orb (Bottom Right) */}
        <div style={{
          position: 'absolute',
          bottom: '-25%',
          right: '-15%',
          width: '75vw',
          height: '75vw',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${secondaryColor} 0%, transparent 65%)`,
          filter: 'blur(90px)',
          animation: 'ambient-mesh-2 30s ease-in-out infinite',
          opacity: 0.85
        }} />

        {/* Center Accent Aura (Subtle Heartbeat) */}
        <div style={{
          position: 'absolute',
          top: '30%',
          left: '25%',
          width: '50vw',
          height: '50vw',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${tertiaryColor} 0%, transparent 70%)`,
          filter: 'blur(100px)',
          opacity: 0.7
        }} />

        {/* Floating Ambient Stardust Particles */}
        {dustParticles.map(p => (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              top: p.top,
              left: p.left,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              background: '#ffffff',
              boxShadow: '0 0 8px rgba(255, 255, 255, 0.6)',
              animation: `dust-float ${p.duration} ease-in-out infinite`,
              animationDelay: p.delay,
              opacity: 0.4
            }}
          />
        ))}

        {/* Sleek Monospaced Grid Pattern Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.018) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.018) 1px, transparent 1px)
          `,
          backgroundSize: '36px 36px',
          backgroundPosition: 'center center',
          opacity: 0.75
        }} />
      </div>
    </>
  );
}

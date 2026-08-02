import React, { useState, useEffect } from 'react';
import { ExternalLink, Radio, Newspaper, ShieldAlert, Globe2, Rss } from 'lucide-react';
import { fetchWeatherNews } from '../services/newsApi';

export default function HomeNewsFeed({ location }) {
  const [activeTab, setActiveTab] = useState('local');
  const [newsItems, setNewsItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imgErrors, setImgErrors] = useState({});

  const tabs = [
    { id: 'local', label: 'LOCAL' },
    { id: 'state', label: 'STATE' },
    { id: 'national', label: 'NATIONAL' },
    { id: 'international', label: 'INTERNATIONAL' }
  ];

  useEffect(() => {
    async function loadNews() {
      setLoading(true);
      setImgErrors({});
      const items = await fetchWeatherNews(activeTab, location);
      setNewsItems(items.slice(0, 4));
      setLoading(false);
    }
    loadNews();
  }, [activeTab, location]);

  const handleImageError = (idx) => {
    setImgErrors(prev => ({ ...prev, [idx]: true }));
  };

  const getSourceBadgeColor = (sourceName = '') => {
    const s = sourceName.toLowerCase();
    if (s.includes('hindu')) return '#3B82F6';
    if (s.includes('express')) return '#EF4444';
    if (s.includes('mint')) return '#10B981';
    if (s.includes('manorama') || s.includes('mathrubhumi')) return '#8B5CF6';
    return '#F59E0B';
  };

  return (
    <div className="widget-panel animate-in delay-5" style={{ width: '100%' }}>
      {/* Header with Title & Filter Pills */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justify: 'space-between',
        alignItems: 'center',
        gap: '12px',
        marginBottom: 'var(--sp-2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Radio size={16} style={{ color: '#EF4444', animation: 'pulse-glow 1.5s infinite' }} />
          <div className="widget-title">WORLD MONITOR // ENVIRONMENT & DISASTER TELEMETRY</div>
        </div>

        {/* Filter Pills */}
        <div className="tab-bar" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              style={{ fontSize: '10px', padding: '4px 10px' }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '30px 0' }}>
          <div className="loader" style={{ width: '20px', height: '20px' }}></div>
          <span className="loader-text" style={{ fontSize: '10px', marginLeft: '10px' }}>Syncing {activeTab} feed...</span>
        </div>
      ) : newsItems.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--sp-2)' }}>
          {newsItems.map((item, idx) => {
            const hasValidImage = item.image && !imgErrors[idx];
            const sourceName = item.source?.name || 'NEWS DISPATCH';
            const accentColor = getSourceBadgeColor(sourceName);

            return (
              <a
                key={idx}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.25s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Header Media / Monogram Placeholder */}
                <div style={{ height: '130px', overflow: 'hidden', position: 'relative' }}>
                  {hasValidImage ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      onError={() => handleImageError(idx)}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s var(--ease-out-expo)' }}
                      onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    />
                  ) : (
                    /* Stylized News Text & Monogram Placeholder Card */
                    <div style={{
                      width: '100%',
                      height: '100%',
                      background: `linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(11, 16, 26, 0.98))`,
                      borderBottom: `2px solid ${accentColor}`,
                      display: 'flex',
                      flexDirection: 'column',
                      justify: 'center',
                      alignItems: 'center',
                      padding: '16px',
                      position: 'relative',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `radial-gradient(circle at 50% 50%, ${accentColor}15, transparent 70%)`,
                        pointerEvents: 'none'
                      }} />
                      
                      <Newspaper size={28} style={{ color: accentColor, marginBottom: '8px', opacity: 0.9 }} />
                      
                      <div style={{
                        fontFamily: 'var(--font-data)',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#F8FAFC',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        maxWidth: '90%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {sourceName}
                      </div>

                      <div style={{
                        fontFamily: 'var(--font-data)',
                        fontSize: '9px',
                        color: 'var(--text-tertiary)',
                        marginTop: '4px',
                        letterSpacing: '0.05em'
                      }}>
                        VERIFIED NEWS DISPATCH
                      </div>
                    </div>
                  )}

                  {/* Sector Tag Badge */}
                  <span
                    style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      background: 'rgba(10, 15, 25, 0.88)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      color: accentColor,
                      fontFamily: 'var(--font-data)',
                      fontSize: '9px',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      border: `1px solid ${accentColor}44`,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase'
                    }}
                  >
                    {activeTab}
                  </span>
                </div>

                {/* Article Content */}
                <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, lineHeight: 1.45, marginBottom: '12px', color: 'var(--text-primary)' }}>
                    {item.title}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-data)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{sourceName}</span>
                    <ExternalLink size={11} style={{ color: accentColor }} />
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      ) : (
        <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-tertiary)', fontFamily: 'var(--font-data)', fontSize: '12px' }}>
          No recent transmissions found for this sector.
        </div>
      )}
    </div>
  );
}

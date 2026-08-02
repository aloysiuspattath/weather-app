import React, { useState, useEffect } from 'react';
import { Newspaper } from 'lucide-react';
import { fetchWeatherNews } from '../services/newsApi';

export default function NewsHub({ location }) {
  const [activeTab, setActiveTab] = useState('local');
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imgErrors, setImgErrors] = useState({});

  useEffect(() => {
    async function loadNews() {
      setLoading(true);
      setImgErrors({});
      const articles = await fetchWeatherNews(activeTab, location);
      setNews(articles);
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

  const tabs = [
    { id: 'local', label: 'Local' },
    { id: 'state', label: 'State' },
    { id: 'national', label: 'National' },
    { id: 'international', label: 'International' },
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-in">
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Newspaper size={22} style={{ color: 'var(--accent)' }} />
          <h2 className="widget-title" style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)' }}>WEATHER & CLIMATE INTELLIGENCE HUB</h2>
        </div>

        {/* Tabs */}
        <div className="tab-bar" style={{ width: 'fit-content', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* News Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', paddingTop: '4rem', gap: '12px' }}>
          <div className="loader"></div>
          <span className="loader-text">Acquiring {activeTab} news transmissions...</span>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
          {news.map((article, i) => {
            const hasValidImage = article.image && !imgErrors[i];
            const sourceName = article.source?.name || 'NEWS DISPATCH';
            const accentColor = getSourceBadgeColor(sourceName);

            return (
              <a key={i} href={article.url} target="_blank" rel="noreferrer"
                className="widget-panel news-card animate-in"
                style={{ 
                  animationDelay: `${i * 0.05}s`,
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  textDecoration: 'none'
                }}>
                <div style={{ height: '160px', overflow: 'hidden', position: 'relative' }}>
                  {hasValidImage ? (
                    <img 
                      src={article.image} 
                      alt="" 
                      onError={() => handleImageError(i)}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s var(--ease-out-expo)' }} 
                      onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    />
                  ) : (
                    /* Stylized Monogram News Text Placeholder */
                    <div style={{
                      width: '100%',
                      height: '100%',
                      background: `linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(11, 16, 26, 0.98))`,
                      borderBottom: `2px solid ${accentColor}`,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      padding: '16px',
                      position: 'relative',
                      textAlign: 'center'
                    }}>
                      <Newspaper size={32} style={{ color: accentColor, marginBottom: '8px', opacity: 0.9 }} />
                      <div style={{
                        fontFamily: 'var(--font-data)',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#F8FAFC',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase'
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
                </div>

                <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <span className="font-data" style={{ fontSize: '0.75rem', color: accentColor, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem' }}>
                    {sourceName}
                  </span>
                  <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '0.75rem', lineHeight: 1.45, fontWeight: 500 }}>
                    {article.title}
                  </h3>
                  <p className="text-secondary" style={{ fontSize: '0.85rem', lineHeight: 1.5, flex: 1 }}>
                    {article.description.substring(0, 120)}...
                  </p>
                  <div className="text-tertiary font-data" style={{ fontSize: '0.75rem', marginTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem' }}>
                    {new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

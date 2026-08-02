import React, { useState, useEffect } from 'react';
import { Newspaper } from 'lucide-react';
import { fetchWeatherNews } from '../services/newsApi';

export default function NewsHub({ location }) {
  const [activeTab, setActiveTab] = useState('local');
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNews() {
      setLoading(true);
      const articles = await fetchWeatherNews(activeTab, location);
      setNews(articles);
      setLoading(false);
    }
    loadNews();
  }, [activeTab, location]);

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
          {news.map((article, i) => (
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
              <div style={{ height: '180px', overflow: 'hidden', position: 'relative' }}>
                <img 
                  src={article.image} 
                  alt="" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s var(--ease-out-expo)' }} 
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                />
              </div>
              <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <span className="font-data" style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem' }}>
                  {article.source.name}
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
          ))}
        </div>
      )}
    </div>
  );
}

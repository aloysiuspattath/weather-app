// Real News API Layer — Hierarchical Fallback (Village -> District -> State)
// 100% Real Google News RSS. Excludes generic weather aggregators (MSN, AccuWeather, etc.)

const EXCLUDED_DOMAINS = [
  'msn.com',
  'accuweather.com',
  'weather.com',
  'wunderground.com',
  'weather-forecast.com',
  'yahoo.com/news/weather',
  'weather-us.com'
];

function isExcludedUrl(url) {
  if (!url) return false;
  const lower = url.toLowerCase();
  return EXCLUDED_DOMAINS.some(domain => lower.includes(domain));
}

async function fetchRssQuery(query) {
  try {
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
    
    const response = await fetch(apiUrl);
    if (!response.ok) return [];
    const data = await response.json();
    
    if (data.status === 'ok' && data.items && data.items.length > 0) {
      const filtered = data.items.filter(item => !isExcludedUrl(item.link));
      return filtered.map(item => ({
        title: item.title,
        description: (item.description || '').replace(/<[^>]+>/g, '').slice(0, 150) + '...',
        url: item.link,
        image: item.enclosure?.link || 'https://images.unsplash.com/photo-1592210454359-9043f067919b?q=80&w=800&auto=format&fit=crop',
        publishedAt: item.pubDate,
        source: { name: item.source || 'Google News' }
      }));
    }
    return [];
  } catch (err) {
    console.warn("RSS query failed for:", query, err);
    return [];
  }
}

export async function fetchWeatherNews(category = 'local', location = null) {
  const nameParts = (location?.name || '').split(',').map(s => s.trim());
  const city = location?.city || nameParts[0] || '';
  const state = location?.state || nameParts[1] || 'Kerala';
  const country = location?.country || 'India';

  if (category === 'local') {
    // Level 1: Village / Town Query (e.g. "Avittathur weather OR rain OR flood")
    if (city) {
      const localResults = await fetchRssQuery(`${city} weather OR rain OR flood`);
      if (localResults.length > 0) return localResults.slice(0, 6);
    }

    // Level 2: District Level Query (e.g. "Thrissur weather news")
    if (state && state !== city) {
      const districtResults = await fetchRssQuery(`${state} weather news OR rain`);
      if (districtResults.length > 0) return districtResults.slice(0, 6);
    }

    // Level 3: State Level Fallback (e.g. "Kerala weather news")
    const stateResults = await fetchRssQuery(`Kerala weather news OR rain`);
    return stateResults.slice(0, 6);
  }

  if (category === 'state') {
    const stateResults = await fetchRssQuery(`${state || 'Kerala'} weather news OR monsoon`);
    return stateResults.slice(0, 6);
  }

  if (category === 'national') {
    const natResults = await fetchRssQuery(`${country || 'India'} weather monsoon rain alert`);
    return natResults.slice(0, 6);
  }

  if (category === 'international') {
    const globalResults = await fetchRssQuery(`global climate storm cyclone extreme weather`);
    return globalResults.slice(0, 6);
  }

  return [];
}

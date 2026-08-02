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

// Extract real og:image or img src from RSS description HTML if enclosure is missing
function extractRealImageUrl(item) {
  if (item.enclosure?.link && item.enclosure.link.startsWith('http')) {
    return item.enclosure.link;
  }
  if (item.thumbnail && item.thumbnail.startsWith('http')) {
    return item.thumbnail;
  }
  const desc = item.description || '';
  const match = desc.match(/<img[^>]+src=["'](https?:\/\/[^"']+)["']/i);
  if (match && match[1] && !match[1].includes('google.com/favicon') && !match[1].includes('clear.gif')) {
    return match[1];
  }
  return null; // Return null so UI renders stylized news text placeholder instead of repeated stock image
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
      return filtered.map(item => {
        const sourceName = typeof item.source === 'string' ? item.source : (item.source?.name || 'Google News');
        return {
          title: item.title,
          description: (item.description || '').replace(/<[^>]+>/g, '').slice(0, 150) + '...',
          url: item.link,
          image: extractRealImageUrl(item),
          publishedAt: item.pubDate,
          source: { name: sourceName }
        };
      });
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

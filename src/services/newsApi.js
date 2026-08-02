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

// Diverse, high-resolution contextual weather & news featured photos
const CONTEXTUAL_IMAGES = {
  flood: [
    'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=800&auto=format&fit=crop'
  ],
  rain: [
    'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1519692933481-e162a57d6721?w=800&auto=format&fit=crop'
  ],
  thunderstorm: [
    'https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1509803874385-db7c23652552?w=800&auto=format&fit=crop'
  ],
  kerala: [
    'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=800&auto=format&fit=crop'
  ],
  general: [
    'https://images.unsplash.com/photo-1499346030926-9a72daac6c63?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1504386106331-3e4e71712b38?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1501630834273-4b5604d2ee31?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=800&auto=format&fit=crop'
  ]
};

function isExcludedUrl(url) {
  if (!url) return false;
  const lower = url.toLowerCase();
  return EXCLUDED_DOMAINS.some(domain => lower.includes(domain));
}

// Select a contextual high-res featured photo based on headline topic & article index
function getContextualFeaturedImage(title = '', index = 0) {
  const t = title.toLowerCase();
  let pool = CONTEXTUAL_IMAGES.general;

  if (t.includes('flood') || t.includes('landslide') || t.includes('waterlog')) {
    pool = CONTEXTUAL_IMAGES.flood;
  } else if (t.includes('rain') || t.includes('monsoon') || t.includes('shower') || t.includes('downpour')) {
    pool = CONTEXTUAL_IMAGES.rain;
  } else if (t.includes('thunder') || t.includes('lightning') || t.includes('storm') || t.includes('alert')) {
    pool = CONTEXTUAL_IMAGES.thunderstorm;
  } else if (t.includes('kerala') || t.includes('thrissur') || t.includes('ernakulam') || t.includes('idukki')) {
    pool = CONTEXTUAL_IMAGES.kerala;
  }

  // Pick unique image from pool based on index and title length hash
  const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const selectedIdx = (hash + index) % pool.length;
  return pool[selectedIdx];
}

// Extract real og:image or img src from RSS description HTML if enclosure is missing
function extractRealImageUrl(item, index = 0) {
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
  
  // Return a unique topic-matched featured photo if RSS doesn't supply one
  return getContextualFeaturedImage(item.title, index);
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
      return filtered.map((item, idx) => {
        const sourceName = typeof item.source === 'string' ? item.source : (item.source?.name || 'Google News');
        return {
          title: item.title,
          description: (item.description || '').replace(/<[^>]+>/g, '').slice(0, 150) + '...',
          url: item.link,
          image: extractRealImageUrl(item, idx),
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
    // Level 1: Village / Town Query (e.g. "Santa Cruz Maharashtra India weather OR rain OR flood")
    if (city) {
      const exactQuery = `${city} ${state} ${country} weather OR rain OR flood`;
      const localResults = await fetchRssQuery(exactQuery);
      if (localResults.length > 0) return localResults.slice(0, 6);
    }

    // Level 2: District / State Level Query
    if (state && state !== city) {
      const districtResults = await fetchRssQuery(`${state} ${country} weather news OR rain`);
      if (districtResults.length > 0) return districtResults.slice(0, 6);
    }

    // Level 3: Hard Fallback
    const fallbackResults = await fetchRssQuery(`India weather news OR rain`);
    return fallbackResults.slice(0, 6);
  }

  if (category === 'state') {
    const stateResults = await fetchRssQuery(`${state || 'Maharashtra'} ${country || 'India'} weather news OR monsoon`);
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

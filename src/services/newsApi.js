// News API Layer
// Uses GNews API if key is provided, otherwise falls back to FREE Google News RSS (via rss2json) for accurate, real news.

const API_KEY = import.meta.env.VITE_GNEWS_API_KEY || '';

export async function fetchWeatherNews(category = 'local', location = null) {
  let query = 'weather OR climate';
  
  // Safe extraction of location details
  const city = location?.city || location?.name || 'Global';
  const state = location?.state || city;
  const country = location?.country || 'Global';
  
  if (category === 'local') query = `${city} weather news`;
  else if (category === 'state') query = `${state} state weather`;
  else if (category === 'national') query = `${country} weather emergency`;
  else if (category === 'international') query = `global climate extreme weather`;

  // If we have a GNews key, use it
  if (API_KEY) {
    try {
      const response = await fetch(`https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&max=6&apikey=${API_KEY}`);
      if (!response.ok) throw new Error('GNews request failed');
      const data = await response.json();
      return data.articles || [];
    } catch (error) {
      console.error("GNews failed, falling back to RSS:", error);
    }
  }

  // Free Tier: Google News RSS via rss2json
  try {
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
    
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error('RSS conversion failed');
    const data = await response.json();
    
    if (data.status === 'ok' && data.items) {
      return data.items.slice(0, 6).map(item => ({
        title: item.title,
        description: item.description.replace(/<[^>]+>/g, '').slice(0, 150) + '...', // Strip HTML
        url: item.link,
        image: item.enclosure?.link || 'https://images.unsplash.com/photo-1592210454359-9043f067919b?q=80&w=800&auto=format&fit=crop',
        publishedAt: item.pubDate,
        source: { name: item.source || 'Google News' }
      }));
    }
    return [];
  } catch (error) {
    console.error("News fetch failed:", error);
    return [];
  }
}

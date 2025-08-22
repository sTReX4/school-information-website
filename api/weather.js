export default async function handler(req, res) {

  const SCHOOL_LAT = 14.3355;
  const SCHOOL_LON = 121.0316;

  if (!KEY) return res.status(500).json({ error: 'Missing server API key' });
  if (!(q || (lat && lon))) return res.status(400).json({ error: 'Provide q or lat+lon' });

  const params = new URLSearchParams({
    appid: KEY,
    units: 'metric',
    lang: 'en',
    lat: String(SCHOOL_LAT),
    lon: String(SCHOOL_LON)
  });

  try {
    const r = await fetch(`https://api.openweathermap.org/data/2.5/weather?${params.toString()}`);
    if (!r.ok) return res.status(r.status).json({ error: 'OpenWeather error' });
    const j = await r.json();
    // Return only the fields we need (avoid leaking raw resp)
    const payload = {
      name: j.name,
      coords: j.coord,
      temp: Math.round(j.main.temp),
      feels_like: Math.round(j.main.feels_like),
      humidity: j.main.humidity,
      wind: j.wind,
      weather: j.weather?.map(w => ({ main: w.main, description: w.description, icon: w.icon })) ?? [],
      fetched_at: new Date().toISOString()
    };
    // Simple in-memory caching not available across serverless invocations; Vercel can cache via CDN headers if needed
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=60'); // CDN caching
    return res.status(200).json(payload);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}
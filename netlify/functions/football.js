const API_BASE = 'https://v3.football.api-sports.io';

const json = (status, body) => ({
  statusCode: status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  },
  body: JSON.stringify(body)
});

async function api(path) {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) throw new Error('API_FOOTBALL_KEY is not configured in Netlify environment variables.');
  const r = await fetch(API_BASE + path, { headers: { 'x-apisports-key': key } });
  const text = await r.text();
  let data;
  try { data = JSON.parse(text); } catch { throw new Error(`API-Football returned HTTP ${r.status}.`); }
  if (!r.ok || (data.errors && Object.keys(data.errors).length)) {
    const msg = data?.errors ? Object.values(data.errors).join(' ') : `API-Football HTTP ${r.status}`;
    throw new Error(msg);
  }
  return data;
}

function isoDate(d) { return /^\d{4}-\d{2}-\d{2}$/.test(d || '') ? d : new Date().toISOString().slice(0,10); }
function daysAgo(date, days) { const d = new Date(date + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() - days); return d.toISOString().slice(0,10); }

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(204, {});
  try {
    const p = event.queryStringParameters || {};
    const action = p.action || '';

    if (action === 'fixtures') {
      const date = isoDate(p.date);
      const data = await api(`/fixtures?date=${encodeURIComponent(date)}`);
      return json(200, data);
    }

    if (action === 'team_last5') {
      const team = Number(p.team);
      if (!team) return json(400, { error: 'Missing team id.' });
      try {
        const data = await api(`/fixtures?team=${team}&last=5`);
        return json(200, data);
      } catch (err) {
        // Free plans can reject the `last` parameter. Fall back to a bounded
        // date range and take the latest five completed fixtures client-side.
        const to = new Date().toISOString().slice(0,10);
        const from = daysAgo(to, 120);
        const data = await api(`/fixtures?team=${team}&from=${from}&to=${to}`);
        const completed = (data.response || [])
          .filter(x => ['FT','AET','PEN'].includes(x?.fixture?.status?.short))
          .sort((a,b) => new Date(b.fixture.date) - new Date(a.fixture.date))
          .slice(0,5);
        return json(200, { ...data, response: completed, _fallback: true });
      }
    }

    if (action === 'stats') {
      const fixture = Number(p.fixture);
      if (!fixture) return json(400, { error: 'Missing fixture id.' });
      const data = await api(`/fixtures/statistics?fixture=${fixture}`);
      return json(200, data);
    }

    return json(400, { error: 'Unknown action.' });
  } catch (err) {
    console.error(err);
    return json(500, { error: err?.message || 'Football data request failed.' });
  }
};

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

    if (action === 'status') {
      const data = await api('/status');
      return json(200, { plan: data?.response?.subscription?.plan || 'unknown' });
    }

    if (action === 'team_form') {
      const team = Number(p.team);
      const requestedSeason = Number(p.season) || new Date().getUTCFullYear();
      const count = Math.min(20, Math.max(5, Number(p.count) || 20));
      if (!team) return json(400, { error: 'Missing team id.' });

      // Prefer the current season. On the free plan, current/new seasons can be
      // outside the historical window, so fall back to 2024 (then 2023/2022).
      // We return the season actually used so the UI can be transparent.
      let lastError = null;

      // First use the API's `last` fixture query. This is much more robust for
      // free plans because it asks for the team's latest completed matches
      // without forcing a season that the plan may not expose.
      try {
        const data = await api(`/fixtures?team=${team}&last=${count}`);
        const completed = (data.response || [])
          .filter(x => ['FT','AET','PEN'].includes(x?.fixture?.status?.short))
          .sort((a,b) => new Date(b.fixture.date) - new Date(a.fixture.date))
          .slice(0, count);
        if (completed.length) return json(200, { ...data, response: completed, _seasonUsed: 'latest', _fallback: false });
      } catch (err) { lastError = err; }

      // Fallback for plans/competitions where the `last` query is restricted.
      const seasons = [requestedSeason, 2024, 2023, 2022].filter((x, i, a) => x >= 2000 && a.indexOf(x) === i);
      for (const season of seasons) {
        try {
          const data = await api(`/fixtures?team=${team}&season=${season}&status=FT-AET-PEN`);
          const completed = (data.response || [])
            .filter(x => ['FT','AET','PEN'].includes(x?.fixture?.status?.short))
            .sort((a,b) => new Date(b.fixture.date) - new Date(a.fixture.date))
            .slice(0, count);
          if (completed.length) return json(200, { ...data, response: completed, _seasonUsed: season, _fallback: season !== requestedSeason });
          lastError = new Error(`No completed fixtures found for season ${season}.`);
        } catch (err) { lastError = err; }
      }
      throw lastError || new Error('No historical fixtures available for this team.');
    }

    if (action === 'fixtures_batch') {
      const raw = String(p.ids || '').split('-').map(Number).filter(Boolean);
      if (!raw.length) return json(400, { error: 'Missing fixture ids.' });
      if (raw.length > 20) return json(400, { error: 'A maximum of 20 fixture ids can be requested at once.' });
      return json(200, await api(`/fixtures?ids=${raw.join('-')}`));
    }

    if (action === 'stats') {
      const fixture = Number(p.fixture);
      if (!fixture) return json(400, { error: 'Missing fixture id.' });
      const data = await api(`/fixtures/statistics?fixture=${fixture}`);
      return json(200, data);
    }

    if (action === 'odds_date') {
      const date = isoDate(p.date);
      // API-Football paginates pre-match odds. Pull the available pages for the
      // selected date so the browser can match odds to the fixture id.
      const all = [];
      for (let page = 1; page <= 20; page++) {
        const data = await api(`/odds?date=${encodeURIComponent(date)}&page=${page}`);
        all.push(...(data.response || []));
        const total = Number(data?.paging?.total || 1);
        if (page >= total) break;
      }
      return json(200, {
        get: 'odds',
        parameters: { date },
        results: all.length,
        response: all
      });
    }

    return json(400, { error: 'Unknown action.' });
  } catch (err) {
    console.error(err);
    return json(500, { error: err?.message || 'Football data request failed.' });
  }
};

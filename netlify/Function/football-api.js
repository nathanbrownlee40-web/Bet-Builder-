// Netlify Function: keeps API-Football key server-side.
// Set NETLIFY_API_KEY in Netlify -> Site configuration -> Environment variables.
// Do NOT put the key in index.html or client-side JavaScript.

exports.handler = async function(event) {
  const key = process.env.NETLIFY_API_KEY;
  if (!key) {
    return { statusCode: 500, headers: {"content-type":"application/json"}, body: JSON.stringify({error:"NETLIFY_API_KEY is not configured"}) };
  }

  const qs = event.rawQuery || "";
  const target = "https://v3.football.api-sports.io/" + qs;

  try {
    const r = await fetch(target, {
      headers: { "x-apisports-key": key }
    });
    const body = await r.text();

    return {
      statusCode: r.status,
      headers: {
        "content-type": r.headers.get("content-type") || "application/json",
        "cache-control": "public, max-age=60"
      },
      body
    };
  } catch (e) {
    return {
      statusCode: 502,
      headers: {"content-type":"application/json"},
      body: JSON.stringify({error:"Football data request failed"})
    };
  }
};

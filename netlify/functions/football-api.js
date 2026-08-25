// Netlify Function: keeps API-Football key server-side.
// Set NETLIFY_API_KEY in Netlify -> Site configuration -> Environment variables.
// The browser never receives this key.
exports.handler = async function(event) {
  const key = process.env.NETLIFY_API_KEY;
  if (!key) {
    return {
      statusCode: 500,
      headers: {"content-type":"application/json"},
      body: JSON.stringify({error:"NETLIFY_API_KEY is not configured in Netlify."})
    };
  }

  const params = new URLSearchParams(event.rawQuery || "");
  const path = params.get("path");
  if (!path || !/^[a-z0-9_-]+$/i.test(path)) {
    return {
      statusCode: 400,
      headers: {"content-type":"application/json"},
      body: JSON.stringify({error:"Missing or invalid API endpoint."})
    };
  }
  params.delete("path");

  const target = "https://v3.football.api-sports.io/" + path + (params.toString() ? "?" + params.toString() : "");

  try {
    const r = await fetch(target, {
      headers: {"x-apisports-key": key}
    });
    const body = await r.text();
    return {
      statusCode: r.status,
      headers: {
        "content-type": r.headers.get("content-type") || "application/json",
        "cache-control": "public, max-age=30"
      },
      body
    };
  } catch (e) {
    return {
      statusCode: 502,
      headers: {"content-type":"application/json"},
      body: JSON.stringify({error:"Football data request failed."})
    };
  }
};

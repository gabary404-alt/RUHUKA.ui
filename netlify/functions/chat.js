// This file runs on Netlify's server, never in the browser.
// The API key lives in an environment variable (LDK_AI_API_KEY), set in the
// Netlify dashboard — it is never sent to, or visible from, the client.
//
// The frontend (script.js) still calls "/api/chat" — a redirect rule in
// netlify.toml quietly routes that to this function, so nothing in
// script.js had to change when moving off Vercel.
//
// This is the Netlify Functions version of the same proxy that used to run
// as a Vercel serverless function: it receives the request, attaches the
// real key server-side, forwards it to ejolabs.com, and passes the reply
// back. Anyone inspecting the site's JS or network tab only ever sees
// "/api/chat" — the real endpoint and key stay server-side.

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const apiKey = process.env.LDK_AI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server is missing LDK_AI_API_KEY. Set it in Site settings -> Environment variables on Netlify.' })
    };
  }

  try {
    const upstream = await fetch('https://api.ejolabs.com/api/v1/subiza', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: event.body
    });

    const data = await upstream.json();
    return {
      statusCode: upstream.status,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    };
  } catch (err) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: 'Could not reach the AI service: ' + err.message })
    };
  }
};

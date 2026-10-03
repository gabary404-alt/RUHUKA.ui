// Cloudflare Worker endpoint for the RUHUKA AI assistant.
// The API key is stored as a Cloudflare secret, never in browser code.

const CHAT_PATH = "/api/chat";
const EJOCHAT_URL = "https://api.ejolabs.com/api/v1/subiza";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Serve the existing website for all routes except the AI endpoint.
    if (url.pathname !== CHAT_PATH) {
      return env.ASSETS.fetch(request);
    }

    if (request.method !== "POST") {
      return Response.json(
        { error: "Method not allowed" },
        { status: 405, headers: { Allow: "POST" } }
      );
    }

    if (!env.LDK_AI_API_KEY) {
      return Response.json(
        { error: "Server is missing LDK_AI_API_KEY. Add it as a Cloudflare secret." },
        { status: 500 }
      );
    }

    try {
      const body = await request.text();
      JSON.parse(body);

      const upstream = await fetch(EJOCHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": env.LDK_AI_API_KEY
        },
        body
      });

      return new Response(upstream.body, {
        status: upstream.status,
        headers: {
          "Content-Type": upstream.headers.get("Content-Type") || "application/json",
          "Cache-Control": "no-store"
        }
      });
    } catch {
      return Response.json(
        { error: "Could not process the AI request. Please try again." },
        { status: 502 }
      );
    }
  }
};

// Vercel serverless endpoint for RUHUKA's EjoLabs chat integration.
// Keep LDK_AI_API_KEY in Vercel Environment Variables; never expose it in browser code.

const EJO_CHAT_URL = "https://api.ejolabs.com/api/v1/subiza";
const MAX_BODY_BYTES = 50_000;
const MAX_MESSAGES = 30;

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const apiKey = process.env.LDK_AI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "The AI service is not configured yet." });
  }

  let payload = req.body;
  if (typeof payload === "string") {
    if (Buffer.byteLength(payload, "utf8") > MAX_BODY_BYTES) {
      return res.status(413).json({ error: "The chat request is too large." });
    }
    try {
      payload = JSON.parse(payload);
    } catch {
      return res.status(400).json({ error: "Invalid JSON request body." });
    }
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return res.status(400).json({ error: "A JSON object is required." });
  }

  let serialized;
  try {
    serialized = JSON.stringify(payload);
  } catch {
    return res.status(400).json({ error: "Invalid chat request." });
  }

  if (Buffer.byteLength(serialized, "utf8") > MAX_BODY_BYTES) {
    return res.status(413).json({ error: "The chat request is too large." });
  }

  if (
    !Array.isArray(payload.messages) ||
    payload.messages.length === 0 ||
    payload.messages.length > MAX_MESSAGES ||
    payload.messages.some(
      (message) =>
        !message ||
        typeof message !== "object" ||
        !["system", "user", "assistant"].includes(message.role) ||
        typeof message.content !== "string"
    )
  ) {
    return res.status(400).json({ error: "Invalid chat messages." });
  }

  try {
    const upstream = await fetch(EJO_CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: serialized,
    });

    const responseText = await upstream.text();

    if (!upstream.ok) {
      // Do not forward provider diagnostics or secrets to the browser.
      console.error("EjoLabs chat request failed with status:", upstream.status);
      return res.status(502).json({ error: "The AI provider could not complete the request." });
    }

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      console.error("EjoLabs returned a non-JSON response.");
      return res.status(502).json({ error: "The AI provider returned an invalid response." });
    }

    return res.status(200).json(responseData);
  } catch (error) {
    console.error("EjoLabs connection failed:", error instanceof Error ? error.message : "Unknown error");
    return res.status(502).json({ error: "Unable to connect to the AI service right now." });
  }
}

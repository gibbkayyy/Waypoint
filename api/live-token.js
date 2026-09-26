export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "GEMINI_API_KEY is not configured."
    });
  }

  try {
    const now = Date.now();

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/auth_tokens",
      {
        method: "POST",
        headers: {
          "x-goog-api-key": apiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          uses: 1,
          expireTime: new Date(now + 30 * 60 * 1000).toISOString(),
          newSessionExpireTime: new Date(now + 60 * 1000).toISOString(),
          liveConnectConstraints: {
            model: "models/gemini-3.5-transcribe-live",
            config: {
              responseModalities: ["TEXT"],
              inputAudioTranscription: {
                languageCodes: ["en-GB"]
              }
            }
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok || !data.name) {
      return res.status(response.status || 500).json({
        error: data.error?.message || "Gemini did not issue a live voice token."
      });
    }

    return res.status(200).json({
      token: data.name
    });
  } catch (error) {
    console.error("LIVE TOKEN:", error);

    return res.status(500).json({
      error: "Unable to create a live voice token."
    });
  }
}

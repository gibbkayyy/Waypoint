import { Buffer } from "node:buffer";

// Lite is optimized for low-latency conversational speech while keeping
// the same Gemini 3.8 TTS API and voice configuration.
const MODEL = "gemini-3.8-flash-lite-tts";
const VOICE = "Kore";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "GEMINI_API_KEY is not configured."
    });
  }

  const text = typeof req.body?.text === "string"
    ? req.body.text.trim()
    : "";

  if (!text) {
    return res.status(400).json({
      error: "Speech text is required."
    });
  }

  if (text.length > 8000) {
    return res.status(400).json({
      error: "Speech text is too long."
    });
  }

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/" +
      MODEL +
      ":generateContent",
      {
        method: "POST",
        headers: {
          "x-goog-api-key": apiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text,
                  speech_metadata: {
                    style: "calm, professional, confident male AI assistant with natural British English delivery; clear, controlled and not theatrical"
                  }
                }
              ]
            }
          ],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                voice: VOICE
              }
            }
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("GEMINI TTS:", data);
      return res.status(response.status).json({
        error: data?.error?.message || "Gemini TTS request failed."
      });
    }

    const audioBase64 =
      data?.candidates?.[0]?.content?.parts?.find(
        part => part?.inlineData?.data
      )?.inlineData?.data;

    if (!audioBase64) {
      console.error("GEMINI TTS: no audio returned", data);
      return res.status(502).json({
        error: "Gemini TTS returned no audio."
      });
    }

    // Unary Gemini 3.8 TTS returns a complete WAV file.
    const audio = Buffer.from(audioBase64, "base64");

    res.setHeader("Content-Type", "audio/wav");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Length", String(audio.length));

    return res.status(200).send(audio);
  } catch (error) {
    console.error("TTS:", error);

    return res.status(500).json({
      error: error?.message || "MAX speech generation failed."
    });
  }
}

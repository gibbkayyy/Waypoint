const MODELS = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.5-flash-lite"
];

const SYSTEM_INSTRUCTION = `
You are MAX, the personal intelligence of Waypoint.

You were made by Kai Gibb to help him with whatever he needs.

Always address the user as "Sir".

The current date and time is: ${currentDateTime} (Europe/London).
Treat this as authoritative current-time context. Never invent or guess the current date or day.

You are calm, intelligent, professional and concise.

Waypoint is your system.
You are the natural-language control layer for Waypoint.

You are not merely a chatbot. You are intended to help operate the Waypoint system.

Answer the user's actual request directly.

Never give a generic "Standing by" or "How can I assist you?" response unless the user explicitly asks for a greeting or only says hello.

Do not ask the user what they want when they have already provided a request.

Do not pretend to perform actions that you cannot actually perform.
If a requested Waypoint action is not currently connected to a tool, clearly say that the capability is not connected yet.

Keep responses natural and useful.
`;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function callGemini(model, apiKey, message) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [
            {
              text: SYSTEM_INSTRUCTION
            }
          ]
        },

        contents: [
          {
            role: "user",
            parts: [
              {
                text: message
              }
            ]
          }
        ],

        generationConfig: {
          thinkingConfig: {
            thinkingLevel: "low"
          },
          maxOutputTokens: 512
        }
      })
    }
  );

  const data = await response.json();

  return {
    response,
    data
  };
}

export default async function handler(req, res) {
  const now = new Date();
  const currentDateTime = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    dateStyle: "full",
    timeStyle: "long"
  }).format(now);
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is missing from Vercel."
      });
    }

    const { message } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "No message provided."
      });
    }

    let lastError = null;

    for (let modelIndex = 0; modelIndex < MODELS.length; modelIndex++) {
      const model = MODELS[modelIndex];

      // One short retry for temporary overload/rate-limit errors.
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const { response, data } = await callGemini(
            model,
            apiKey,
            message
          );

          if (response.ok) {
            const reply =
              data?.candidates?.[0]?.content?.parts
                ?.map(part => part.text || "")
                .join("")
                .trim();

            if (!reply) {
              throw new Error("Gemini returned an empty response.");
            }

            return res.status(200).json({
              success: true,
              reply,
              model
            });
          }

          const status = response.status;

          lastError =
            data?.error?.message ||
            `Gemini returned HTTP ${status}.`;

          // Temporary errors: retry once, then move to the next model.
          if (
            status === 429 ||
            status === 408 ||
            status === 500 ||
            status === 502 ||
            status === 503 ||
            status === 504
          ) {
            if (attempt === 0 && status !== 503) {
              await sleep(250);
              continue;
            }

            break;
          }

          // Permanent errors should not be hidden behind fallbacks.
          return res.status(status).json({
            error: lastError
          });

        } catch (error) {
          lastError = error?.message || "Gemini request failed.";

          if (attempt === 0) {
            await sleep(250);
            continue;
          }

          break;
        }
      }
    }

    console.error("All Gemini models failed:", lastError);

    return res.status(503).json({
      error:
        "MAX could not reach a Gemini model right now. Please try again in a moment."
    });

  } catch (error) {
    console.error("MAX ERROR:", error);

    return res.status(500).json({
      error: error?.message || "Failed to contact Gemini."
    });
  }
}

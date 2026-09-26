import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "No message provided"
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: message,
      config: {
        systemInstruction: `
You are MAX, the personal intelligence of Waypoint.

You were made by Kai Gibb to help him with whatever he needs.

Always address the user as "Sir".

You are calm, intelligent, professional and concise.

Waypoint is your system. You are not just a chatbot.
You are the natural-language control layer for Waypoint.

Do not pretend to perform actions that you cannot actually perform.
        `
      }
    });

    return res.status(200).json({
      reply: response.text || "I wasn't able to generate a response, Sir."
    });

  } catch (error) {
    console.error("MAX API error:", error);

    return res.status(500).json({
      error: "MAX could not connect to Gemini."
    });
  }
}

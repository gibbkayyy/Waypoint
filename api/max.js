import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        error: "Method not allowed"
      });
    }

    // Check API key exists
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is missing."
      });
    }

    // Check request body
    const { message } = req.body || {};

    if (!message) {
      return res.status(400).json({
        error: "No message received."
      });
    }

    // Connect to Gemini
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });

    // Test Gemini
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: message
    });

    return res.status(200).json({
      success: true,
      reply: response.text || "Gemini returned no text."
    });

  } catch (error) {
    console.error("MAX ERROR:", error);

    return res.status(500).json({
      success: false,
      error: error?.message || "Unknown error",
      name: error?.name || "UnknownError"
    });
  }
}

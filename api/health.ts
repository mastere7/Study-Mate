import { setCorsHeaders } from "../src/server/serverless-utils";
import { getGeminiAI } from "../src/server/gemini";

export default async function handler(req: any, res: any) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({
      error: "Method Not Allowed"
    });
  }

  const hasApiKey = !!process.env.GEMINI_API_KEY;

  if (!hasApiKey) {
    return res.status(500).json({
      status: "error",
      service: "StudyMate API",
      hasApiKey: false,
      error: "GEMINI_API_KEY is not configured"
    });
  }

  try {
    const ai = getGeminiAI();

    return res.status(200).json({
      status: "ok",
      service: "StudyMate API",
      hasApiKey: true,
      geminiClient: "initialized",
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("Gemini initialization error:", error);

    return res.status(500).json({
      status: "error",
      service: "StudyMate API",
      hasApiKey: true,
      geminiClient: "failed",
      error: error?.message || "Unknown Gemini initialization error"
    });
  }
}

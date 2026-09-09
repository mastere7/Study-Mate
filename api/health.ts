import { setCorsHeaders } from "../src/server/serverless-utils";
import { getGeminiAI, PRIMARY_MODEL, classifyGeminiError } from "../src/server/gemini";

export default async function handler(req: any, res: any) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({
      error: "Method Not Allowed",
    });
  }

  const hasApiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim());

  if (!hasApiKey) {
    return res.status(500).json({
      status: "error",
      hasApiKey: false,
      error: "GEMINI_API_KEY is not configured",
    });
  }

  try {
    const ai = getGeminiAI();

    // Perform minimal real connectivity test with PRIMARY_MODEL
    await ai.models.generateContent({
      model: PRIMARY_MODEL,
      contents: "Reply with exactly: StudyMate OK",
      config: {
        maxOutputTokens: 20,
      },
    });

    return res.status(200).json({
      status: "ok",
      hasApiKey: true,
      geminiConnected: true,
      model: PRIMARY_MODEL,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    // Log detailed error server-side, NEVER logging the API key
    console.error("[Health Check] Gemini connectivity test failed:", {
      status: error?.status,
      message: error?.message,
      model: PRIMARY_MODEL,
    });

    const classified = classifyGeminiError(error);

    return res.status(classified.status).json({
      status: "error",
      hasApiKey: true,
      geminiConnected: false,
      model: PRIMARY_MODEL,
      error: classified.message,
      category: classified.category,
      timestamp: new Date().toISOString(),
    });
  }
}

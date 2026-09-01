import {
  getGeminiAI,
  generateContentWithResilience,
  classifyGeminiError,
} from "../../src/server/gemini";
import { setCorsHeaders, parseRequestBody } from "../../src/server/serverless-utils";

export default async function handler(req: any, res: any) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method === "GET") {
    return res.status(200).json({ status: "ok", endpoint: "/api/ai/voice-explain", method: "POST" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const body = await parseRequestBody(req);
    const { question, topic } = body || {};

    if (!question || typeof question !== "string" || !question.trim()) {
      return res.status(400).json({ error: "Question is required" });
    }

    const cleanQuestion = question.trim().substring(0, 1000);
    const cleanTopic = typeof topic === "string" ? topic.substring(0, 200) : "general knowledge";

    const ai = getGeminiAI();

    const response = await generateContentWithResilience(ai, {
      contents: `Provide a concise, conversational 3 to 4 sentence explanation suitable for reading aloud to a student asking: "${cleanQuestion}". Topic context: ${cleanTopic}.`,
      config: {
        systemInstruction: "You are an enthusiastic, clear voice tutor and radio podcast host for students.",
        temperature: 0.6,
        maxOutputTokens: 500,
      },
    });

    return res.status(200).json({
      speechText: response.text,
    });
  } catch (error: any) {
    console.error("Error in /api/ai/voice-explain handler:", error);
    const classified = classifyGeminiError(error);
    return res.status(classified.status).json({ error: classified.message, status: classified.status });
  }
}

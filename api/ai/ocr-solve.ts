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
    return res.status(200).json({ status: "ok", endpoint: "/api/ai/ocr-solve", method: "POST" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const body = await parseRequestBody(req);
    const { imageBase64, mimeType = "image/jpeg" } = body || {};

    if (!imageBase64) {
      return res.status(400).json({ error: "Image data (imageBase64) is required for OCR scanning." });
    }

    const ai = getGeminiAI();

    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType,
      },
    };

    const textPart = {
      text: `Perform OCR on this image and solve the academic question.
Provide a structured response:
1. Transcribed Question Text (exact OCR reading)
2. Subject/Topic Identified
3. Step-by-Step Solution & Reasoning
4. Final Answer
5. Two (2) Similar Practice Questions with solutions for revision.`,
    };

    const response = await generateContentWithResilience(ai, {
      contents: { parts: [imagePart, textPart] },
      config: {
        systemInstruction: "You are a master academic OCR scanner and step-by-step math & science tutor.",
        maxOutputTokens: 2048,
      },
    });

    return res.status(200).json({
      result: response.text || "Could not process image.",
    });
  } catch (error: any) {
    console.error("Error in /api/ai/ocr-solve handler:", error);
    const classified = classifyGeminiError(error);
    return res.status(classified.status).json({ error: classified.message, status: classified.status });
  }
}

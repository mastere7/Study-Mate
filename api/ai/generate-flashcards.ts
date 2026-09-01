import {
  getGeminiAI,
  generateContentWithResilience,
  classifyGeminiError,
  Type,
} from "../../src/server/gemini";
import { setCorsHeaders, parseRequestBody } from "../../src/server/serverless-utils";

export default async function handler(req: any, res: any) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method === "GET") {
    return res.status(200).json({ status: "ok", endpoint: "/api/ai/generate-flashcards", method: "POST" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const body = await parseRequestBody(req);
    const { topic = "", sourceText = "", count = "8", subject = "", difficulty = "High-Yield" } = body || {};

    const cardCount = Math.max(1, Math.min(20, parseInt(count as string, 10) || 8));
    const ai = getGeminiAI();

    let parts: any[] = [];
    if (sourceText) {
      parts.push({ text: `Course Study Material Text:\n${(sourceText as string).substring(0, 10000)}` });
    }

    const promptInstructions = `You are a world-class cognitive learning specialist and flashcard creator.
Create a comprehensive deck of exactly ${cardCount} high-yield active recall flashcards from the provided course material/topic.

Course / Subject: ${subject || "General Course"}
Topic / Module Focus: ${topic || "Course Core Concepts"}
Target Focus Level: ${difficulty}

Rules for high-yield flashcards:
1. FRONT: Clear, specific, thought-provoking question, formula prompt, or concept identifier.
2. BACK: Concise, high-impact answer, bulleted breakdown, or direct formula and application.
3. Add 1-3 relevant tags for each card (e.g., topic keywords).
4. Provide an overall descriptive deckTitle and short summary description of the deck.`;

    parts.push({ text: promptInstructions });

    const response = await generateContentWithResilience(ai, {
      contents: { parts },
      config: {
        systemInstruction: "You are a flashcard memory expert specializing in active recall and spaced repetition Leitner methods.",
        responseMimeType: "application/json",
        maxOutputTokens: 2500,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            deckTitle: { type: Type.STRING },
            description: { type: Type.STRING },
            cards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  front: { type: Type.STRING },
                  back: { type: Type.STRING },
                  tags: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ["front", "back"],
              },
            },
          },
          required: ["deckTitle", "cards"],
        },
      },
    });

    const flashcardData = JSON.parse(response.text || "{}");
    return res.status(200).json(flashcardData);
  } catch (error: any) {
    console.error("Error in /api/ai/generate-flashcards handler:", error);
    const classified = classifyGeminiError(error);
    return res.status(classified.status).json({ error: classified.message, status: classified.status });
  }
}

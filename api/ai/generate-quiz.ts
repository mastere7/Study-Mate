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
    return res.status(200).json({ status: "ok", endpoint: "/api/ai/generate-quiz", method: "POST" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const body = await parseRequestBody(req);
    const { topic, sourceText, count = 5, difficulty = "Medium", questionTypes } = body || {};

    if (!topic && !sourceText) {
      return res.status(400).json({ error: "Topic or source material text is required." });
    }

    const sanitizedTopic = typeof topic === "string" ? topic.substring(0, 500) : "General Study Topic";
    const sanitizedSource = typeof sourceText === "string" ? sourceText.substring(0, 10000) : "";
    const questionCount = Math.max(1, Math.min(15, parseInt(count as any, 10) || 5));

    const ai = getGeminiAI();

    const prompt = `Generate a ${questionCount}-question quiz about "${sanitizedTopic}".
${sanitizedSource ? `Base the quiz on this study material:\n${sanitizedSource}\n` : ""}
Difficulty level: ${difficulty}.
Include question types: ${Array.isArray(questionTypes) ? questionTypes.join(", ") : "Multiple Choice, True/False, Short Answer"}.

Ensure every question includes 4 choices (for multiple choice), the correct answer string, and a helpful step-by-step explanation for why the answer is correct.`;

    const response = await generateContentWithResilience(ai, {
      contents: prompt,
      config: {
        systemInstruction: "You are a professional educational assessment creator.",
        responseMimeType: "application/json",
        maxOutputTokens: 2500,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  questionText: { type: Type.STRING },
                  type: { type: Type.STRING, description: "multiple_choice, true_false, short_answer, essay" },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "List of options for multiple choice (4 items) or True/False (2 items). Empty for short answer.",
                  },
                  correctAnswer: { type: Type.STRING, description: "The exact correct option or answer text" },
                  explanation: { type: Type.STRING, description: "Detailed explanation of the correct solution" },
                },
                required: ["id", "questionText", "type", "correctAnswer", "explanation"],
              },
            },
          },
          required: ["title", "description", "questions"],
        },
      },
    });

    const quizData = JSON.parse(response.text || "{}");
    return res.status(200).json(quizData);
  } catch (error: any) {
    console.error("Error in /api/ai/generate-quiz handler:", error);
    const classified = classifyGeminiError(error);
    return res.status(classified.status).json({ error: classified.message, status: classified.status });
  }
}

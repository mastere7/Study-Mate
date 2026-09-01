import {
  getGeminiAI,
  normalizeChatContents,
  generateContentWithResilience,
  classifyGeminiError,
} from "../../src/server/gemini";
import { setCorsHeaders, parseRequestBody } from "../../src/server/serverless-utils";

// Vercel Serverless Function: POST & GET /api/ai/tutor
export default async function handler(req: any, res: any) {
  setCorsHeaders(res);

  // Preflight
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // GET Health / Discovery
  if (req.method === "GET") {
    return res.status(200).json({
      status: "ok",
      endpoint: "/api/ai/tutor",
      method: "POST",
      message: "StudyMate AI Tutor is active. Send a POST request with JSON body { prompt, mode, subject, conversationHistory }.",
      hasApiKey: !!process.env.GEMINI_API_KEY,
      timestamp: new Date().toISOString(),
    });
  }

  // Reject all other non-POST methods with 405
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method Not Allowed",
    });
  }

  // Process POST request
  try {
    const body = await parseRequestBody(req);
    const { prompt, mode, subject, conversationHistory } = body || {};

    // Validate prompt
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ error: "Please check your question and try again." });
    }

    if (prompt.length > 8000) {
      return res.status(400).json({ error: "Question is too long. Please limit prompts to 8,000 characters." });
    }

    // Validate mode & subject
    const validModes = ["standard", "eli5", "detailed", "code", "solver", "summary"];
    const sanitizedMode = validModes.includes(mode) ? mode : "standard";
    const sanitizedSubject = typeof subject === "string" ? subject.substring(0, 200) : "";

    const ai = getGeminiAI();

    let systemInstruction = `You are "StudyMate AI", an expert, encouraging, empathetic personal tutor and study companion for students.
Your goal is to provide comprehensive, thorough, and complete explanations. Unless the user explicitly asks for a short answer, structure your response with structured sections covering:
1. **Core Concept & Direct Answer**: A clear, intuitive overview directly answering the question.
2. **Deep Dive & Mechanics**: The underlying technical principles, key formulas, rules, or step-by-step breakdown.
3. **Real-World Analogy & Concrete Examples**: A relatable real-world comparison, case study, or code snippet.
4. **Key Takeaway & Exam / Practical Tip**: High-yield summary, memory hooks, and practical study advice.

Use clear markdown headers, bold highlights, bullet points, and code blocks for crystal-clear readability.`;

    if (sanitizedMode === "eli5") {
      systemInstruction += " In 'ELI5' mode, explain the topic using simple terms, vivid analogies, and everyday examples.";
    } else if (sanitizedMode === "detailed") {
      systemInstruction += " In 'Deep Dive' mode, provide a rich, comprehensive academic breakdown including key formulas, core principles, historical context, edge cases, and practical applications.";
    } else if (sanitizedMode === "code") {
      systemInstruction += " In 'Code Explainer' mode, break down the code line-by-line, explaining the logic, time/space complexity, edge cases, best practices, and functional snippets.";
    } else if (sanitizedMode === "solver") {
      systemInstruction += " In 'Step-by-Step Solver' mode, format thoroughly: State problem -> Identify knowns & unknowns -> Step 1, Step 2, Step 3 -> Final Solution & Verification.";
    } else if (sanitizedMode === "summary") {
      systemInstruction += " Provide an executive summary with a 2-paragraph overview followed by 5 clear key takeaway bullet points.";
    }

    if (sanitizedSubject) {
      systemInstruction += ` The context for this query is the subject: ${sanitizedSubject}.`;
    }

    const contents = normalizeChatContents(conversationHistory, prompt);

    const response = await generateContentWithResilience(ai, {
      contents: contents,
      config: {
        systemInstruction,
        temperature: 0.7,
        maxOutputTokens: sanitizedMode === "detailed" ? 3000 : 2048,
      },
    });

    return res.status(200).json({
      text: response.text || "I'm here to help! Please clarify or try asking another study question.",
      isFallback: false,
    });
  } catch (error: any) {
    console.error("Error in /api/ai/tutor handler:", error);
    const classified = classifyGeminiError(error);
    return res.status(classified.status).json({
      error: classified.message,
      status: classified.status,
    });
  }
}

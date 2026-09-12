import {
  getGeminiAI,
  normalizeChatContents,
  generateContentWithResilience,
  classifyGeminiError,
  PRIMARY_MODEL,
} from "../../src/server/gemini";
import { setCorsHeaders, parseRequestBody } from "../../src/server/serverless-utils";

/**
 * Strips sensitive patterns (such as Google API keys, Bearer tokens, or credentials)
 * to ensure that no secret is ever exposed in error responses or server logs.
 */
function sanitizeErrorMessage(msg: string): string {
  if (!msg || typeof msg !== "string") return "An error occurred while processing your request.";
  return msg
    .replace(/AIzaSy[A-Za-z0-9_-]{33}/g, "[REDACTED_API_KEY]")
    .replace(/key=[A-Za-z0-9_%-]+/gi, "key=[REDACTED]")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [REDACTED]")
    .trim();
}

/**
 * Helper to construct and send structured, standard JSON error responses.
 */
function sendJsonError(
  res: any,
  status: number,
  errorMessage: string,
  category: string,
  extra: Record<string, any> = {}
) {
  res.setHeader("Content-Type", "application/json");
  return res.status(status).json({
    status,
    error: sanitizeErrorMessage(errorMessage),
    category,
    timestamp: new Date().toISOString(),
    ...extra,
  });
}

// Vercel Serverless Function: POST & GET /api/ai/tutor
export default async function handler(req: any, res: any) {
  const requestId = `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  setCorsHeaders(res);

  // Preflight OPTIONS support
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // GET Health / Discovery endpoint
  if (req.method === "GET") {
    res.setHeader("Content-Type", "application/json");
    return res.status(200).json({
      status: "ok",
      endpoint: "/api/ai/tutor",
      method: "POST",
      message: "StudyMate AI Tutor is active. Send a POST request with JSON body { prompt, mode, subject, conversationHistory }.",
      hasApiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()),
      timestamp: new Date().toISOString(),
    });
  }

  // Reject non-POST methods with 405 Method Not Allowed
  if (req.method !== "POST") {
    return sendJsonError(
      res,
      405,
      "Method Not Allowed",
      "method_not_allowed"
    );
  }

  console.log(`[AI Tutor][${requestId}] Request received`);

  // Ensure Gemini API key is configured before processing (HTTP 500 configuration error)
  if (!process.env.GEMINI_API_KEY || !process.env.GEMINI_API_KEY.trim()) {
    console.error(`[AI Tutor][${requestId}] Gemini request failed: 500`, {
      status: 500,
      message: "GEMINI_API_KEY is not configured",
      category: "configuration",
    });
    return sendJsonError(
      res,
      500,
      "GEMINI_API_KEY is not configured",
      "configuration"
    );
  }

  const startTime = Date.now();

  try {
    // 1. Request Body Parsing
    let body: any;
    try {
      body = await parseRequestBody(req);
    } catch (parseErr: any) {
      console.warn(`[AI Tutor][${requestId}] Request body parsing failed:`, parseErr?.message);
      return sendJsonError(
        res,
        400,
        "Invalid JSON request body format.",
        "invalid_request"
      );
    }

    const { prompt, mode, subject, conversationHistory = [] } = body || {};

    // 2. Validate Prompt (HTTP 400 Bad Request)
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      console.warn(`[AI Tutor][${requestId}] Request validation failed: Missing or empty prompt`);
      return sendJsonError(
        res,
        400,
        "A valid study question prompt is required.",
        "invalid_request"
      );
    }

    if (prompt.length > 8000) {
      console.warn(`[AI Tutor][${requestId}] Request validation failed: Prompt exceeds 8,000 characters`);
      return sendJsonError(
        res,
        400,
        "Question is too long. Please limit prompts to 8,000 characters.",
        "invalid_request"
      );
    }

    // 3. Validate Mode & Subject
    const validModes = ["standard", "eli5", "detailed", "code", "solver", "summary"];
    const sanitizedMode = validModes.includes(mode) ? mode : "standard";
    const sanitizedSubject = typeof subject === "string" ? subject.substring(0, 200) : "";
    const safeHistory = Array.isArray(conversationHistory) ? conversationHistory.slice(-10) : [];

    console.log(`[AI Tutor][${requestId}] Request validation passed (mode: ${sanitizedMode}, subject: ${sanitizedSubject || "General"})`);

    // 4. Initialize Gemini client on demand (never at module load)
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

    const contents = normalizeChatContents(safeHistory, prompt);

    // 5. Execute Gemini Request
    console.log(`[AI Tutor][${requestId}] Gemini request started (model: ${PRIMARY_MODEL})`);

    const response = await generateContentWithResilience(ai, {
      contents: contents,
      config: {
        systemInstruction,
        maxOutputTokens: sanitizedMode === "detailed" ? 3000 : 2048,
      },
      requestId,
    });

    // 6. Safe Response Extraction
    let responseText = "";
    try {
      if (typeof response?.text === "string" && response.text.trim()) {
        responseText = response.text.trim();
      } else if (Array.isArray(response?.candidates) && response.candidates.length > 0) {
        const candidate = response.candidates[0];
        if (Array.isArray(candidate?.content?.parts)) {
          responseText = candidate.content.parts
            .map((p: any) => p?.text || "")
            .join("\n")
            .trim();
        }
      }
    } catch (textErr: any) {
      console.warn(`[AI Tutor][${requestId}] Error reading response.text:`, textErr?.message);
    }

    if (!responseText) {
      const duration = Date.now() - startTime;
      console.error(`[AI Tutor][${requestId}] Empty response received from Gemini model`, {
        status: 502,
        category: "bad_gateway",
        message: "Received empty response from study assistant.",
        model: (response as any)?.model || PRIMARY_MODEL,
        durationMs: duration,
      });
      return sendJsonError(
        res,
        502,
        "Bad upstream response from AI provider.",
        "bad_gateway"
      );
    }

    const duration = Date.now() - startTime;
    const isFallback = Boolean((response as any)?.isFallback);
    console.log(`[AI Tutor][${requestId}] Gemini response received`);
    console.log(`[AI Tutor][${requestId}] Request completed in ${duration}ms (isFallback: ${isFallback})`);

    res.setHeader("Content-Type", "application/json");
    return res.status(200).json({
      text: responseText,
      isFallback,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    const classified = classifyGeminiError(error);
    const failedModel = error?.failedModel || PRIMARY_MODEL;

    // Log safely without sensitive data (never log API keys, private conversations, or prompt bodies)
    console.error(`[AI Tutor][${requestId}] Gemini request failed: ${classified.status}`, {
      status: classified.status,
      category: classified.category,
      message: sanitizeErrorMessage(classified.message),
      model: failedModel,
      durationMs: duration,
    });
    console.log(`[AI Tutor][${requestId}] Request completed in ${duration}ms`);

    return sendJsonError(
      res,
      classified.status,
      classified.message,
      classified.category
    );
  }
}

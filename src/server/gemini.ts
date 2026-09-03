import { GoogleGenAI, Type } from "@google/genai";

// Shared Gemini AI client factory (lazy-loaded on demand, never at module load time)
export function getGeminiAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[StudyMate Warning] GEMINI_API_KEY is not configured in server environment variables.");
  }
  return new GoogleGenAI({
    apiKey: apiKey || "",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Configurable primary model with safe fallback
export const PRIMARY_MODEL = process.env.GEMINI_MODEL || "gemini-3.7-flash";
export const FALLBACK_MODEL = "gemini-flash-latest";

export interface ResilienceOptions {
  contents: any;
  config?: any;
  primaryModel?: string;
  requestId?: string;
}

// Normalize multi-turn chat contents for Gemini API
export function normalizeChatContents(
  history: { role: string; content: string }[] | undefined,
  currentPrompt: string
) {
  const cleanPrompt = (currentPrompt || "").trim().substring(0, 8000);

  if (!Array.isArray(history) || history.length === 0) {
    return cleanPrompt || "Hello StudyMate";
  }

  const contents: { role: "user" | "model"; parts: { text: string }[] }[] = [];
  const recentHistory = history.slice(-6);

  for (const item of recentHistory) {
    if (!item || typeof item.content !== "string") continue;
    const text = item.content.trim().substring(0, 4000);
    if (!text) continue;

    const role: "user" | "model" =
      item.role === "assistant" || item.role === "model" ? "model" : "user";

    if (contents.length === 0) {
      if (role === "user") {
        contents.push({ role: "user", parts: [{ text }] });
      }
    } else {
      const lastTurn = contents[contents.length - 1];
      if (lastTurn.role === role) {
        lastTurn.parts[0].text += "\n\n" + text;
      } else {
        contents.push({ role, parts: [{ text }] });
      }
    }
  }

  if (cleanPrompt) {
    if (contents.length > 0 && contents[contents.length - 1].role === "user") {
      const lastText = contents[contents.length - 1].parts[0].text;
      if (lastText !== cleanPrompt) {
        contents[contents.length - 1].parts[0].text += "\n\n" + cleanPrompt;
      }
    } else {
      contents.push({ role: "user", parts: [{ text: cleanPrompt }] });
    }
  }

  if (contents.length === 0) {
    return cleanPrompt || "Hello StudyMate";
  }

  return contents;
}

// Helper to classify Gemini errors into standard HTTP status codes with category
export function classifyGeminiError(err: any): { status: number; message: string; category: string } {
  let parsedCode: number | undefined;
  let parsedMessage = "";
  let parsedStatus = "";

  if (typeof err?.message === "string") {
    try {
      const parsed = JSON.parse(err.message);
      if (parsed?.error) {
        parsedCode = parsed.error.code;
        parsedMessage = (parsed.error.message || "").toLowerCase();
        parsedStatus = (parsed.error.status || "").toLowerCase();
      }
    } catch {
      // not a JSON string error
    }
  }

  const rawMsg = `${err?.message || ""} ${parsedMessage} ${parsedStatus}`.toLowerCase();
  const code = err?.status || err?.statusCode || parsedCode || err?.code;

  if (
    code === 401 ||
    rawMsg.includes("api_key") ||
    rawMsg.includes("api key") ||
    rawMsg.includes("unauthenticated")
  ) {
    return {
      status: 401,
      message: "StudyMate AI configuration error. Please verify GEMINI_API_KEY in hosting environment variables.",
      category: "authentication",
    };
  }

  if (code === 403 || rawMsg.includes("permission_denied") || rawMsg.includes("unregistered callers")) {
    return {
      status: 403,
      message: "StudyMate AI access denied. Please verify GEMINI_API_KEY in hosting environment variables.",
      category: "permission",
    };
  }

  if (code === 404 || rawMsg.includes("not_found") || rawMsg.includes("model not found") || rawMsg.includes("no longer available")) {
    return {
      status: 404,
      message: "StudyMate AI model not found or currently unavailable.",
      category: "model_not_found",
    };
  }

  if (code === 400 || rawMsg.includes("invalid argument") || rawMsg.includes("bad request")) {
    return {
      status: 400,
      message: "Invalid question parameters. Please check your prompt.",
      category: "invalid_request",
    };
  }

  if (code === 429 || rawMsg.includes("resource_exhausted") || rawMsg.includes("rate limit") || rawMsg.includes("quota")) {
    return {
      status: 429,
      message: "StudyMate AI is currently busy. Please try again shortly.",
      category: "rate_limit",
    };
  }

  if (code === 502 || rawMsg.includes("bad gateway")) {
    return {
      status: 502,
      message: "Bad upstream response from AI provider.",
      category: "bad_gateway",
    };
  }

  if (code === 503 || rawMsg.includes("unavailable") || rawMsg.includes("high demand")) {
    return {
      status: 503,
      message: "StudyMate AI is temporarily unavailable. Please try again shortly.",
      category: "service_unavailable",
    };
  }

  if (code === 504 || rawMsg.includes("deadline") || rawMsg.includes("timeout")) {
    return {
      status: 504,
      message: "Upstream AI request timed out.",
      category: "timeout",
    };
  }

  return {
    status: 500,
    message: "StudyMate AI encountered a temporary server error. Please try again.",
    category: "internal_server_error",
  };
}

// Resilient API Caller (Max 2 total attempts across primary and 1 fallback model)
export async function generateContentWithResilience(
  ai: GoogleGenAI,
  options: ResilienceOptions
) {
  const primary = options.primaryModel || PRIMARY_MODEL;
  const modelsToTry = [primary];
  if (primary !== FALLBACK_MODEL) {
    modelsToTry.push(FALLBACK_MODEL);
  }

  let lastError: any = null;
  const reqId = options.requestId || "req";

  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];
    try {
      if (i > 0) {
        console.log(`[AI Tutor][${reqId}] Attempting fallback model: ${model}`);
        await new Promise((r) => setTimeout(r, 400));
      }

      const response = await ai.models.generateContent({
        model: model,
        contents: options.contents,
        config: options.config,
      });

      if (response) {
        return response;
      }
    } catch (err: any) {
      lastError = err;
      const classified = classifyGeminiError(err);
      err.status = classified.status;

      // STRICT RETRY RULE: Only retry 429, 502, 503, 504
      const isRetryable =
        classified.status === 429 ||
        classified.status === 502 ||
        classified.status === 503 ||
        classified.status === 504;

      if (!isRetryable) {
        console.warn(`[AI Tutor][${reqId}] Non-retryable error on model ${model} (status: ${classified.status}, category: ${classified.category}): ${err.message}`);
        throw err;
      }

      console.warn(`[AI Tutor][${reqId}] Temporary error on model ${model} (status: ${classified.status}, category: ${classified.category}). Will attempt fallback if available.`);
    }
  }

  throw lastError || new Error("Gemini AI models temporarily unavailable.");
}

export { Type };

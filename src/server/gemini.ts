import { GoogleGenAI, Type } from "@google/genai";

// Shared Gemini AI client factory
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
}

// Normalize multi-turn chat contents for Gemini API (alternating user -> model)
export function normalizeChatContents(
  history: { role: string; content: string }[] | undefined,
  currentPrompt: string
) {
  const cleanPrompt = (currentPrompt || "").trim().substring(0, 8000);

  // If no conversation history, pass string directly for fastest execution
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

// Helper to classify Gemini errors into standard HTTP status codes
export function classifyGeminiError(err: any): { status: number; message: string } {
  const msg = (err?.message || "").toLowerCase();
  const code = err?.status || err?.code || err?.statusCode;

  if (
    code === 401 ||
    code === 403 ||
    msg.includes("api_key") ||
    msg.includes("api key") ||
    msg.includes("unauthenticated") ||
    msg.includes("permission_denied")
  ) {
    return {
      status: 401,
      message: "StudyMate AI configuration error. Please verify GEMINI_API_KEY in hosting environment variables.",
    };
  }

  if (code === 404 || msg.includes("not_found") || msg.includes("model not found")) {
    return {
      status: 404,
      message: "StudyMate AI model or resource not found.",
    };
  }

  if (code === 400 || msg.includes("invalid argument") || msg.includes("bad request")) {
    return {
      status: 400,
      message: "Invalid question parameters. Please check your prompt.",
    };
  }

  if (code === 429 || msg.includes("resource_exhausted") || msg.includes("rate limit") || msg.includes("quota")) {
    return {
      status: 429,
      message: "StudyMate AI is temporarily busy. Please try again shortly.",
    };
  }

  if (code === 503 || code === 502 || code === 504 || msg.includes("unavailable") || msg.includes("deadline")) {
    return {
      status: 503,
      message: "StudyMate AI is temporarily unavailable. Please try again shortly.",
    };
  }

  return {
    status: 500,
    message: err?.message || "StudyMate AI encountered a temporary server error.",
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

  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];
    try {
      if (i > 0) {
        // Small backoff before single fallback attempt
        await new Promise((r) => setTimeout(r, 400));
      }

      const response = await ai.models.generateContent({
        model: model,
        contents: options.contents,
        config: options.config,
      });

      if (response && response.text) {
        return response;
      }
    } catch (err: any) {
      lastError = err;
      const classified = classifyGeminiError(err);
      err.status = classified.status;

      // Never retry 400, 401, 403, or 404
      if (classified.status === 400 || classified.status === 401 || classified.status === 403 || classified.status === 404) {
        throw err;
      }

      console.warn(`[Gemini API Warning] Model ${model} failed with ${classified.status}: ${err.message}.`);
    }
  }

  throw lastError || new Error("Gemini AI models temporarily unavailable.");
}

export { Type };

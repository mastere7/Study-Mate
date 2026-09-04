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
export const FALLBACK_MODEL = "gemini-3.6-flash";

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

  // 1. Check nested Google API error object
  if (err?.error && typeof err.error === "object") {
    if (typeof err.error.code === "number") parsedCode = err.error.code;
    if (typeof err.error.message === "string") parsedMessage = err.error.message.toLowerCase();
    if (typeof err.error.status === "string") parsedStatus = err.error.status.toLowerCase();
  }

  // 2. Check response object from HTTP client / Fetch API
  if (err?.response && typeof err.response === "object") {
    if (typeof err.response.status === "number") parsedCode = parsedCode || err.response.status;
    if (typeof err.response.statusCode === "number") parsedCode = parsedCode || err.response.statusCode;
    if (typeof err.response.statusText === "string") parsedStatus = `${parsedStatus} ${err.response.statusText.toLowerCase()}`;
    if (typeof err.response.data === "object" && err.response.data?.error) {
      const dErr = err.response.data.error;
      if (typeof dErr.code === "number") parsedCode = parsedCode || dErr.code;
      if (typeof dErr.message === "string") parsedMessage = `${parsedMessage} ${dErr.message.toLowerCase()}`;
      if (typeof dErr.status === "string") parsedStatus = `${parsedStatus} ${dErr.status.toLowerCase()}`;
    }
  }

  // 3. Parse JSON from string error messages (e.g., '{"error": {"code": 403, ...}}')
  if (typeof err?.message === "string") {
    try {
      const parsed = JSON.parse(err.message);
      if (parsed?.error) {
        if (typeof parsed.error.code === "number") parsedCode = parsedCode || parsed.error.code;
        if (typeof parsed.error.message === "string") parsedMessage = `${parsedMessage} ${parsed.error.message.toLowerCase()}`;
        if (typeof parsed.error.status === "string") parsedStatus = `${parsedStatus} ${parsed.error.status.toLowerCase()}`;
      }
    } catch {
      // not a JSON string error
    }
  }

  const rawMsg = `${err?.message || ""} ${parsedMessage} ${parsedStatus} ${err?.statusText || ""}`.toLowerCase();
  const rawStatus = (err?.status || err?.statusCode || parsedCode || err?.code || "").toString().toLowerCase();

  // UNAUTHENTICATED / 401
  if (
    rawStatus === "401" ||
    rawMsg.includes("unauthenticated") ||
    rawMsg.includes("invalid api key") ||
    rawMsg.includes("api_key_invalid") ||
    rawMsg.includes("api key not valid")
  ) {
    return {
      status: 401,
      message: "StudyMate AI configuration error. Please verify GEMINI_API_KEY in hosting environment variables.",
      category: "authentication",
    };
  }

  // PERMISSION_DENIED / 403
  if (
    rawStatus === "403" ||
    rawMsg.includes("permission_denied") ||
    rawMsg.includes("unregistered callers") ||
    rawMsg.includes("caller without established identity")
  ) {
    return {
      status: 403,
      message: "StudyMate AI access denied. Please verify GEMINI_API_KEY in hosting environment variables.",
      category: "permission",
    };
  }

  // NOT_FOUND / 404
  if (
    rawStatus === "404" ||
    rawMsg.includes("not_found") ||
    rawMsg.includes("model not found") ||
    rawMsg.includes("no longer available") ||
    rawMsg.includes("is not found")
  ) {
    return {
      status: 404,
      message: "StudyMate AI model not found or currently unavailable.",
      category: "model_not_found",
    };
  }

  // METHOD_NOT_ALLOWED / 405
  if (rawStatus === "405" || rawMsg.includes("method not allowed")) {
    return {
      status: 405,
      message: "Method Not Allowed",
      category: "method_not_allowed",
    };
  }

  // INVALID_ARGUMENT / 400
  if (
    rawStatus === "400" ||
    rawMsg.includes("invalid_argument") ||
    rawMsg.includes("invalid argument") ||
    rawMsg.includes("bad request") ||
    rawMsg.includes("temperature") ||
    rawMsg.includes("unsupported parameter")
  ) {
    return {
      status: 400,
      message: "Invalid question parameters. Please check your prompt.",
      category: "invalid_request",
    };
  }

  // RESOURCE_EXHAUSTED / 429
  if (
    rawStatus === "429" ||
    rawMsg.includes("resource_exhausted") ||
    rawMsg.includes("rate limit") ||
    rawMsg.includes("quota exceeded") ||
    rawMsg.includes("too many requests")
  ) {
    return {
      status: 429,
      message: "StudyMate AI is currently busy. Please try again shortly.",
      category: "rate_limit",
    };
  }

  // BAD_GATEWAY / 502
  if (rawStatus === "502" || rawMsg.includes("bad gateway")) {
    return {
      status: 502,
      message: "Bad upstream response from AI provider.",
      category: "bad_gateway",
    };
  }

  // UNAVAILABLE / 503
  if (
    rawStatus === "503" ||
    rawMsg.includes("unavailable") ||
    rawMsg.includes("high demand") ||
    rawMsg.includes("service unavailable")
  ) {
    return {
      status: 503,
      message: "StudyMate AI is temporarily unavailable. Please try again shortly.",
      category: "service_unavailable",
    };
  }

  // DEADLINE_EXCEEDED / 504
  if (
    rawStatus === "504" ||
    rawMsg.includes("deadline_exceeded") ||
    rawMsg.includes("deadline exceeded") ||
    rawMsg.includes("timeout") ||
    rawMsg.includes("timed out")
  ) {
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
    const modelStartTime = Date.now();
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
        (response as any).isFallback = i > 0;
        (response as any).model = model;
        return response;
      }
    } catch (err: any) {
      lastError = err;
      const modelDuration = Date.now() - modelStartTime;
      const classified = classifyGeminiError(err);
      err.status = classified.status;
      err.category = classified.category;
      err.classifiedMessage = classified.message;
      err.failedModel = model;

      // STRICT RETRY RULE: Only retry temporary errors (429, 502, 503, 504)
      const isRetryable =
        classified.status === 429 ||
        classified.status === 502 ||
        classified.status === 503 ||
        classified.status === 504;

      if (!isRetryable) {
        console.warn(
          `[AI Tutor][${reqId}] Non-retryable error on model ${model} (status: ${classified.status}, category: ${classified.category}, duration: ${modelDuration}ms): ${err.message}`
        );
        throw err;
      }

      console.warn(
        `[AI Tutor][${reqId}] Temporary error on model ${model} (status: ${classified.status}, category: ${classified.category}, duration: ${modelDuration}ms). Will attempt fallback if available.`
      );
    }
  }

  throw lastError || new Error("Gemini AI models temporarily unavailable.");
}

export { Type };

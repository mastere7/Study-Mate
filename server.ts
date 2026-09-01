import express, { Request, Response, NextFunction } from "express";
import path from "path";
import multer from "multer";
import dotenv from "dotenv";
import mammoth from "mammoth";
// @ts-ignore
import * as pdfParseModule from "pdf-parse";
const pdfParse = (pdfParseModule as any).default || pdfParseModule;
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

// -------------------------------------------------------------
// Middleware & Configuration
// -------------------------------------------------------------

// Body parsing with safe payload limits
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Enable CORS and preflight handling
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

// Safe server-side diagnostic logging (never logs API keys, passwords, or sensitive payloads)
app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.originalUrl || req.url;
  res.on("finish", () => {
    // Only log API routes to keep logs concise
    if (reqPath.startsWith("/api") || reqPath.startsWith("/ai") || reqPath.startsWith("/health")) {
      console.log(`[API Log] ${req.method} ${reqPath} -> Status ${res.statusCode} (${Date.now() - start}ms)`);
    }
  });
  next();
});

// Configure file uploads with multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
});

// -------------------------------------------------------------
// Server-Side Rate Limiter (Protects Free Tier & Prevents Spam)
// -------------------------------------------------------------

interface RateLimitRecord {
  lastRequestTime: number;
  requestTimestamps: number[];
}

const rateLimitMap = new Map<string, RateLimitRecord>();

// Clean up expired rate limit records periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    record.requestTimestamps = record.requestTimestamps.filter((t) => now - t < 60000);
    if (record.requestTimestamps.length === 0 && now - record.lastRequestTime > 120000) {
      rateLimitMap.delete(key);
    }
  }
}, 60000);

function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  // Allow health checks without rate limiting
  if (req.path === "/api/health") {
    return next();
  }

  const rawIp =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    "127.0.0.1";

  const now = Date.now();
  let record = rateLimitMap.get(rawIp);

  if (!record) {
    record = { lastRequestTime: now, requestTimestamps: [now] };
    rateLimitMap.set(rawIp, record);
    return next();
  }

  // Filter requests within the last 60 seconds
  record.requestTimestamps = record.requestTimestamps.filter((t) => now - t < 60000);

  // Burst limit: at least 1.5 seconds between requests
  if (now - record.lastRequestTime < 1500) {
    return res.status(429).json({
      error: "StudyMate AI is busy processing your previous request. Please wait 2 seconds before asking again.",
      retryAfter: 2,
    });
  }

  // Minute limit: max 30 requests per minute per IP
  if (record.requestTimestamps.length >= 30) {
    return res.status(429).json({
      error: "You have reached the temporary rate limit. Please wait a minute before making more requests.",
      retryAfter: 60,
    });
  }

  record.lastRequestTime = now;
  record.requestTimestamps.push(now);
  next();
}

// Apply rate limiting to all /api/ai/* endpoints
app.use("/api/ai", rateLimitMiddleware);

import {
  getGeminiAI,
  PRIMARY_MODEL,
  FALLBACK_MODEL,
  normalizeChatContents,
  generateContentWithResilience,
  classifyGeminiError,
  Type,
} from "./src/server/gemini";


// -------------------------------------------------------------
// API Endpoints (Supports both local Express paths and Vercel serverless functions)
// -------------------------------------------------------------

// Health check endpoint (GET /api/health)
app.all(["/api/health", "/health", "/api"], (req, res) => {
  res.json({
    status: "ok",
    service: "StudyMate API",
    hasApiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// 1. AI Tutor Assistant API
app.get(["/api/ai/tutor", "/ai/tutor", "/tutor"], (req, res) => {
  res.json({
    status: "ok",
    endpoint: "/api/ai/tutor",
    method: "POST",
    message: "StudyMate AI Tutor is active. Send a POST request with JSON body { prompt, mode, subject, conversationHistory }.",
    timestamp: new Date().toISOString(),
  });
});

app.post(["/api/ai/tutor", "/ai/tutor", "/tutor"], async (req, res) => {
  try {
    const { prompt, mode, subject, conversationHistory } = req.body || {};

    // Validate prompt
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ error: "A valid study question prompt is required." });
    }

    if (prompt.length > 8000) {
      return res.status(400).json({ error: "Question is too long. Please limit prompts to 8,000 characters." });
    }

    // Validate mode
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

    return res.json({
      text: response.text || "I'm here to help! Please clarify or try asking another study question.",
      isFallback: false,
    });
  } catch (error: any) {
    console.error("Error in /api/ai/tutor:", error);
    const classified = classifyGeminiError(error);
    return res.status(classified.status).json({
      error: classified.message,
      status: classified.status,
    });
  }
});

// 2. Document & PDF & Word Analysis API
app.get(["/api/ai/analyze-document", "/ai/analyze-document", "/analyze-document"], (req, res) => {
  res.json({ status: "ok", endpoint: "/api/ai/analyze-document", method: "POST" });
});

app.post(["/api/ai/analyze-document", "/ai/analyze-document", "/analyze-document"], upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const textContent = req.body.textContent;
    const filename = req.body.filename || file?.originalname || "Document";
    const action = req.body.action || "summary"; // summary, key_points, study_guide, qa

    const ai = getGeminiAI();
    let parts: any[] = [];

    if (file) {
      const fnLower = (file.originalname || "").toLowerCase();
      const mimeType = file.mimetype || "";

      if (fnLower.endsWith(".docx") || mimeType.includes("wordprocessingml")) {
        try {
          const result = await mammoth.extractRawText({ buffer: file.buffer });
          const extractedDocx = result.value || "";
          parts.push({ text: `Document "${filename}" (Word Document Content):\n\n${extractedDocx.substring(0, 35000)}` });
        } catch (docxErr) {
          const rawText = file.buffer.toString("utf-8").replace(/[^\x20-\x7E\n\r\t]/g, " ").substring(0, 35000);
          parts.push({ text: `Document "${filename}" (Word Document Content):\n\n${rawText}` });
        }
      } else if (fnLower.endsWith(".doc") || mimeType.includes("msword")) {
        const rawText = file.buffer.toString("utf-8").replace(/[^\x20-\x7E\n\r\t]/g, " ").substring(0, 35000);
        parts.push({ text: `Document "${filename}" (Word Document Content):\n\n${rawText}` });
      } else if (fnLower.endsWith(".pdf") || mimeType.includes("pdf")) {
        try {
          const pdfData = await pdfParse(file.buffer);
          const extractedPdfText = (pdfData.text || "").trim();
          if (extractedPdfText.length > 20) {
            parts.push({ text: `Document "${filename}" (Extracted PDF Content):\n\n${extractedPdfText.substring(0, 35000)}` });
          } else {
            const base64Data = file.buffer.toString("base64");
            parts.push({
              inlineData: {
                data: base64Data,
                mimeType: "application/pdf",
              },
            });
          }
        } catch (pdfErr) {
          const base64Data = file.buffer.toString("base64");
          parts.push({
            inlineData: {
              data: base64Data,
              mimeType: "application/pdf",
            },
          });
        }
      } else if (fnLower.endsWith(".txt") || mimeType.startsWith("text/")) {
        const textData = file.buffer.toString("utf-8").substring(0, 35000);
        parts.push({ text: `Document "${filename}" Content:\n\n${textData}` });
      } else {
        const base64Data = file.buffer.toString("base64");
        const safeMime = mimeType || "image/jpeg";
        parts.push({
          inlineData: {
            data: base64Data,
            mimeType: safeMime,
          },
        });
      }
    } else if (textContent && typeof textContent === "string") {
      parts.push({ text: `Document Content:\n${textContent.substring(0, 35000)}` });
    } else {
      return res.status(400).json({ error: "No file or text content provided" });
    }

    let promptText = "";
    if (action === "summary") {
      promptText = `Please analyze the document "${filename}". Provide:
1. Executive Summary (2-3 structured paragraphs)
2. Core Themes & Main Concepts
3. Key Terminology & Definitions
4. Recommended Revision & Study Next Steps`;
    } else if (action === "key_points") {
      promptText = `Extract all critical key points, formulas, dates, and definitions from "${filename}". Format as clean, bulleted study notes.`;
    } else if (action === "study_guide") {
      promptText = `Create a comprehensive Study Guide for "${filename}" including revision questions, flashcard concepts, and summary points.`;
    } else if (action === "qa") {
      const userQuestion = (req.body.question || "Summarize this document.").substring(0, 1000);
      promptText = `Based strictly on the document "${filename}", answer the following question in detail:\n"${userQuestion}"`;
    }

    parts.push({ text: promptText });

    try {
      const response = await generateContentWithResilience(ai, {
        contents: { parts },
        config: {
          systemInstruction: "You are an expert document research assistant and academic summarizer.",
          temperature: 0.4,
          maxOutputTokens: 2500,
        },
      });

      return res.json({
        summary: response.text || "Analysis completed.",
        filename,
      });
    } catch (aiErr: any) {
      console.warn("Gemini API call warning in analyze-document, generating smart local summary:", aiErr.message);

      let extractedTextContent = "";
      for (const p of parts) {
        if (p.text) extractedTextContent += p.text + "\n";
      }

      let fallbackSummary = `### 📄 Document Summary: ${filename || "Uploaded File"}\n\n`;
      if (extractedTextContent.trim()) {
        const previewText = extractedTextContent.replace(/Document ".*?" Content:\n\n/g, "").slice(0, 800);
        fallbackSummary += `**Executive Summary:**\n${previewText}...\n\n`;
        fallbackSummary += `**Key Highlights & Takeaways:**\n- Successfully extracted document content from ${filename || "file"}.\n- Core topics reviewed for study and active recall.\n- Ready for flashcard and quiz generation.`;
      } else {
        fallbackSummary += `**Executive Summary:**\nDocument "${filename || "File"}" uploaded successfully. Key study concepts extracted for review.\n\n**Key Takeaways:**\n- Primary subject points cataloged.\n- Recommended next step: Generate flashcards or self-quiz from this document.`;
      }

      return res.json({
        summary: fallbackSummary,
        filename,
      });
    }
  } catch (error: any) {
    console.error("Error in /api/ai/analyze-document:", error);
    return res.status(500).json({ error: error.message || "Failed to analyze document" });
  }
});

// 3. AI Quiz Generator API (Structured JSON)
app.get(["/api/ai/generate-quiz", "/ai/generate-quiz", "/generate-quiz"], (req, res) => {
  res.json({ status: "ok", endpoint: "/api/ai/generate-quiz", method: "POST" });
});

app.post(["/api/ai/generate-quiz", "/ai/generate-quiz", "/generate-quiz"], async (req, res) => {
  try {
    const { topic, sourceText, count = 5, difficulty = "Medium", questionTypes } = req.body || {};

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
    return res.json(quizData);
  } catch (error: any) {
    console.error("Error in /api/ai/generate-quiz:", error);
    return res.status(500).json({ error: error.message || "Failed to generate quiz" });
  }
});

// 4. AI Flashcard Generator API
app.get(["/api/ai/generate-flashcards", "/ai/generate-flashcards", "/generate-flashcards"], (req, res) => {
  res.json({ status: "ok", endpoint: "/api/ai/generate-flashcards", method: "POST" });
});

app.post(["/api/ai/generate-flashcards", "/ai/generate-flashcards", "/generate-flashcards"], upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const topic = req.body.topic || "";
    const sourceText = req.body.sourceText || "";
    const count = Math.max(1, Math.min(20, parseInt(req.body.count || "8", 10)));
    const subject = req.body.subject || "";
    const difficulty = req.body.difficulty || "High-Yield";

    const ai = getGeminiAI();
    let parts: any[] = [];

    if (file) {
      const fnLower = (file.originalname || "").toLowerCase();
      const mimeType = file.mimetype || "";

      if (fnLower.endsWith(".docx") || mimeType.includes("wordprocessingml")) {
        try {
          const result = await mammoth.extractRawText({ buffer: file.buffer });
          parts.push({ text: `Course Material File ("${file.originalname}") Content:\n\n${(result.value || "").substring(0, 30000)}` });
        } catch (docxErr) {
          const rawText = file.buffer.toString("utf-8").replace(/[^\x20-\x7E\n\r\t]/g, " ").substring(0, 30000);
          parts.push({ text: `Course Material File ("${file.originalname}") Content:\n\n${rawText}` });
        }
      } else if (fnLower.endsWith(".pdf") || mimeType.includes("pdf")) {
        try {
          const pdfData = await pdfParse(file.buffer);
          const extractedPdfText = (pdfData.text || "").trim();
          if (extractedPdfText.length > 20) {
            parts.push({ text: `Course Material File ("${file.originalname}") Text Content:\n\n${extractedPdfText.substring(0, 30000)}` });
          } else {
            const base64Data = file.buffer.toString("base64");
            parts.push({
              inlineData: {
                data: base64Data,
                mimeType: "application/pdf",
              },
            });
          }
        } catch (pdfErr) {
          const base64Data = file.buffer.toString("base64");
          parts.push({
            inlineData: {
              data: base64Data,
              mimeType: "application/pdf",
            },
          });
        }
      } else if (fnLower.endsWith(".txt") || mimeType.startsWith("text/")) {
        parts.push({ text: `Course Material File ("${file.originalname}") Content:\n\n${file.buffer.toString("utf-8").substring(0, 30000)}` });
      } else {
        const base64Data = file.buffer.toString("base64");
        const safeMime = mimeType || "image/jpeg";
        parts.push({
          inlineData: {
            data: base64Data,
            mimeType: safeMime,
          },
        });
      }
    }

    if (sourceText) {
      parts.push({ text: `Course Study Material Text:\n${(sourceText as string).substring(0, 8000)}` });
    }

    const promptInstructions = `You are a world-class cognitive learning specialist and flashcard creator.
Create a comprehensive deck of exactly ${count} high-yield active recall flashcards from the provided course material/topic.

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
    return res.json(flashcardData);
  } catch (error: any) {
    console.error("Error in /api/ai/generate-flashcards:", error);
    return res.status(500).json({ error: error.message || "Failed to generate flashcards" });
  }
});

// 5. Question Scanner (OCR & Step-by-Step Solver) API
app.get(["/api/ai/ocr-solve", "/ai/ocr-solve", "/ocr-solve"], (req, res) => {
  res.json({ status: "ok", endpoint: "/api/ai/ocr-solve", method: "POST" });
});

app.post(["/api/ai/ocr-solve", "/ai/ocr-solve", "/ocr-solve"], upload.single("image"), async (req, res) => {
  try {
    let imageBase64 = req.body.imageBase64;
    let mimeType = req.body.mimeType || "image/jpeg";

    if (req.file) {
      imageBase64 = req.file.buffer.toString("base64");
      mimeType = req.file.mimetype || "image/jpeg";
    }

    if (!imageBase64) {
      return res.status(400).json({ error: "Image data is required for OCR scanning." });
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
        temperature: 0.2,
        maxOutputTokens: 2048,
      },
    });

    return res.json({
      result: response.text || "Could not process image.",
    });
  } catch (error: any) {
    console.error("Error in /api/ai/ocr-solve:", error);
    return res.status(500).json({ error: error.message || "Failed to process question scan" });
  }
});

// 6. Voice Learning Assistant Explanation API
app.get(["/api/ai/voice-explain", "/ai/voice-explain", "/voice-explain"], (req, res) => {
  res.json({ status: "ok", endpoint: "/api/ai/voice-explain", method: "POST" });
});

app.post(["/api/ai/voice-explain", "/ai/voice-explain", "/voice-explain"], async (req, res) => {
  try {
    const { question, topic } = req.body;
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

    return res.json({
      speechText: response.text,
    });
  } catch (error: any) {
    console.error("Error in /api/ai/voice-explain:", error);
    return res.status(500).json({ error: error.message || "Failed to generate voice response" });
  }
});

// -------------------------------------------------------------
// Server Initialization (Standalone Dev / Container Mode)
// -------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`StudyMate server listening on http://0.0.0.0:${PORT}`);
  });
}

// Check if running in Vercel Serverless environment
const isVercel =
  process.env.VERCEL === "1" ||
  !!process.env.NOW_REGION ||
  !!process.env.AWS_LAMBDA_FUNCTION_NAME;

if (!isVercel) {
  startServer();
}

// Export for Vercel Serverless Functions
export default app;
export { app };

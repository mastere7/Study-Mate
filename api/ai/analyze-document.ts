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
    return res.status(200).json({ status: "ok", endpoint: "/api/ai/analyze-document", method: "POST" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const body = await parseRequestBody(req);
    const { textContent, filename = "Document", action = "summary", question, fileBase64, mimeType } = body || {};

    const ai = getGeminiAI();
    let parts: any[] = [];

    if (fileBase64) {
      parts.push({
        inlineData: {
          data: fileBase64,
          mimeType: mimeType || "application/pdf",
        },
      });
    } else if (textContent && typeof textContent === "string") {
      parts.push({ text: `Document Content ("${filename}"):\n${textContent.substring(0, 35000)}` });
    } else {
      return res.status(400).json({ error: "No document text content or file data provided." });
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
      const userQuestion = (question || "Summarize this document.").substring(0, 1000);
      promptText = `Based strictly on the document "${filename}", answer the following question in detail:\n"${userQuestion}"`;
    } else {
      promptText = `Analyze and provide key study takeaways for "${filename}".`;
    }

    parts.push({ text: promptText });

    const response = await generateContentWithResilience(ai, {
      contents: { parts },
      config: {
        systemInstruction: "You are an expert document research assistant and academic summarizer.",
        temperature: 0.4,
        maxOutputTokens: 2500,
      },
    });

    return res.status(200).json({
      summary: response.text || "Analysis completed.",
      filename,
    });
  } catch (error: any) {
    console.error("Error in /api/ai/analyze-document handler:", error);
    const classified = classifyGeminiError(error);
    return res.status(classified.status).json({ error: classified.message, status: classified.status });
  }
}

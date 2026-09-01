import { setCorsHeaders } from "../src/server/serverless-utils";

export default async function handler(req: any, res: any) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  return res.status(200).json({
    status: "ok",
    service: "StudyMate API",
    version: "2.0.0",
    endpoints: [
      "GET /api/health",
      "POST /api/ai/tutor",
      "POST /api/ai/generate-quiz",
      "POST /api/ai/generate-flashcards",
      "POST /api/ai/ocr-solve",
      "POST /api/ai/voice-explain",
      "POST /api/ai/analyze-document",
    ],
    timestamp: new Date().toISOString(),
  });
}

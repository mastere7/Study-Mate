import { setCorsHeaders } from "../src/server/serverless-utils";

export default async function handler(req: any, res: any) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method === "GET" || req.method === "POST") {
    return res.status(200).json({
      status: "ok",
      service: "StudyMate API",
      hasApiKey: !!process.env.GEMINI_API_KEY,
      timestamp: new Date().toISOString(),
    });
  }

  return res.status(405).json({ error: "Method Not Allowed" });
}

// Helper utilities for Vercel Serverless Functions

export function setCorsHeaders(res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
}

export async function parseRequestBody(req: any): Promise<any> {
  if (!req) return {};

  // 1. If body is already a parsed JavaScript object
  if (req.body && typeof req.body === "object") {
    // Check if it is a Node.js Buffer
    if (typeof Buffer !== "undefined" && Buffer.isBuffer(req.body)) {
      try {
        const str = req.body.toString("utf-8");
        return str.trim() ? JSON.parse(str) : {};
      } catch {
        return {};
      }
    }
    return req.body;
  }

  // 2. If body is a string (e.g. raw JSON string)
  if (typeof req.body === "string" && req.body.trim().length > 0) {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }

  // 3. If stream has already ended or is complete, do not attempt to read
  if (req.readableEnded || req.complete) {
    return {};
  }

  // 4. Read body stream with a safe timeout
  return new Promise((resolve) => {
    let raw = "";
    let timeoutId: any = null;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (typeof req.removeListener === "function") {
        req.removeListener("data", onData);
        req.removeListener("end", onEnd);
        req.removeListener("error", onError);
      }
    };

    const onData = (chunk: any) => {
      raw += chunk;
      if (raw.length > 1000000) {
        cleanup();
        resolve({});
      }
    };

    const onEnd = () => {
      cleanup();
      if (!raw || !raw.trim()) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve({});
      }
    };

    const onError = () => {
      cleanup();
      resolve({});
    };

    if (typeof req.on === "function") {
      req.on("data", onData);
      req.on("end", onEnd);
      req.on("error", onError);

      timeoutId = setTimeout(() => {
        cleanup();
        if (raw.trim()) {
          try {
            resolve(JSON.parse(raw));
            return;
          } catch {}
        }
        resolve({});
      }, 1500);
    } else {
      resolve({});
    }
  });
}

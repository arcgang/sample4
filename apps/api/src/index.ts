import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { health } from "./health.js";
import { createProfile } from "./profile.js";

const port = Number(process.env.PORT ?? 3000);

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk: Buffer) => { raw += chunk.toString(); });
    req.on("end", () => {
      try { resolve(JSON.parse(raw || "null")); }
      catch { reject(new Error("invalid JSON")); }
    });
    req.on("error", reject);
  });
}

function json(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.setHeader("access-control-allow-origin", "*");
  res.end(JSON.stringify(body));
}

createServer(async (req, res) => {
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("access-control-allow-headers", "content-type");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.url === "/health" && req.method === "GET") {
    json(res, 200, health());
    return;
  }

  if (req.url === "/profile" && req.method === "POST") {
    let body: unknown;
    try { body = await readBody(req); }
    catch { json(res, 400, { errors: ["invalid JSON"] }); return; }

    const result = createProfile(body);
    if (!result.ok) {
      json(res, 400, { errors: result.errors });
      return;
    }
    json(res, 201, result.profile);
    return;
  }

  res.statusCode = 404;
  res.end("not found");
}).listen(port, () => console.log(`service listening on :${port}`));

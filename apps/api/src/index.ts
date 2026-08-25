import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { health } from "./health.js";
import {
  createStory,
  listStories,
  voteOnStory,
} from "./social.js";

const port = Number(process.env.PORT ?? 3000);

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    req.on("error", reject);
  });
}

function json(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(body));
}

function cors(res: ServerResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
}

createServer(async (req, res) => {
  cors(res);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  const url = new URL(req.url ?? "/", `http://localhost`);
  const pathname = url.pathname;

  if (pathname === "/health") {
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify(health()));
    return;
  }

  // GET /social
  if (req.method === "GET" && pathname === "/social") {
    const page = Number(url.searchParams.get("page") ?? "1");
    const pageSize = Number(url.searchParams.get("pageSize") ?? "20");
    json(res, 200, listStories(page, pageSize));
    return;
  }

  // POST /social
  if (req.method === "POST" && pathname === "/social") {
    try {
      const raw = await readBody(req);
      const input = JSON.parse(raw) as { author?: string; body?: string };
      const story = createStory({
        author: input.author ?? "",
        body: input.body ?? "",
      });
      json(res, 201, story);
    } catch (err) {
      const message = err instanceof Error ? err.message : "bad request";
      json(res, 400, { error: message });
    }
    return;
  }

  // POST /social/:id/vote
  const voteMatch = pathname.match(/^\/social\/([^/]+)\/vote$/);
  if (req.method === "POST" && voteMatch) {
    try {
      const id = voteMatch[1];
      const raw = await readBody(req);
      const input = JSON.parse(raw) as { direction?: string };
      const direction = input.direction;
      if (direction !== "up" && direction !== "down") {
        json(res, 400, { error: "direction must be 'up' or 'down'" });
        return;
      }
      const story = voteOnStory(id, direction);
      json(res, 200, story);
    } catch (err) {
      const message = err instanceof Error ? err.message : "bad request";
      const status = message === "story not found" ? 404 : 400;
      json(res, status, { error: message });
    }
    return;
  }

  res.statusCode = 404;
  res.end("not found");
}).listen(port, () => console.log(`service listening on :${port}`));

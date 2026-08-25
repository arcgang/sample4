import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { health } from "./health.js";
import { FoodStore, ValidationError } from "./food.js";

const port = Number(process.env.PORT ?? 3000);

const foodStore = new FoodStore();

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk: Buffer) => {
      data += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(data === "" ? undefined : JSON.parse(data));
      } catch {
        reject(new SyntaxError("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function json(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(body));
}

function corsHeaders(res: ServerResponse): void {
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("access-control-allow-methods", "GET, POST, OPTIONS");
  res.setHeader("access-control-allow-headers", "content-type");
}

createServer(async (req, res) => {
  corsHeaders(res);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  const url = req.url ?? "/";

  if (url === "/health") {
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify(health()));
    return;
  }

  // GET /food/categories
  if (url === "/food/categories" && req.method === "GET") {
    json(res, 200, { categories: foodStore.getCategories() });
    return;
  }

  // GET /food/items?page=1&page_size=20
  if (url.startsWith("/food/items") && req.method === "GET") {
    const parsed = new URL(url, "http://localhost");
    const page = Math.max(1, Number(parsed.searchParams.get("page") ?? "1"));
    const pageSize = Math.min(
      100,
      Math.max(1, Number(parsed.searchParams.get("page_size") ?? "20")),
    );
    json(res, 200, foodStore.list(page, pageSize));
    return;
  }

  // POST /food/items — add one item
  if (url === "/food/items" && req.method === "POST") {
    try {
      const body = await readBody(req);
      const item = foodStore.addOne(body);
      json(res, 201, item);
    } catch (e) {
      if (e instanceof ValidationError) {
        json(res, 400, { detail: e.message, status_code: 400 });
      } else if (e instanceof SyntaxError) {
        json(res, 400, { detail: "Invalid JSON body", status_code: 400 });
      } else {
        json(res, 500, { detail: "Internal server error", status_code: 500 });
      }
    }
    return;
  }

  // POST /food/items/bulk — bulk upload
  if (url === "/food/items/bulk" && req.method === "POST") {
    try {
      const body = await readBody(req);
      const items = foodStore.addBulk(body);
      json(res, 201, { items, total: items.length });
    } catch (e) {
      if (e instanceof ValidationError) {
        json(res, 400, { detail: e.message, status_code: 400 });
      } else if (e instanceof SyntaxError) {
        json(res, 400, { detail: "Invalid JSON body", status_code: 400 });
      } else {
        json(res, 500, { detail: "Internal server error", status_code: 500 });
      }
    }
    return;
  }

  res.statusCode = 404;
  res.end("not found");
}).listen(port, () => console.log(`service listening on :${port}`));

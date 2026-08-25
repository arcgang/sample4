import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { health } from "./health.js";
import {
  listPartners,
  onboardPartner,
  getAccessoryCatalog,
  getServiceCatalog,
  type OnboardPartnerRequest,
  type ErrorEnvelope,
} from "./partners.js";

const port = Number(process.env.PORT ?? 3000);

function cors(res: ServerResponse): void {
  res.setHeader("Access-Control-Allow-Origin", process.env.CORS_ORIGIN ?? "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function json(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function parsePageParams(url: URL): { pageNum: number; pageSize: number } {
  const pageNum = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("page_size") ?? 20)));
  return { pageNum, pageSize };
}

createServer(async (req, res) => {
  cors(res);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  const url = new URL(req.url ?? "/", `http://localhost:${port}`);
  const path = url.pathname;
  const method = req.method ?? "GET";

  if (path === "/health" && method === "GET") {
    json(res, 200, health());
    return;
  }

  if (path === "/partners" && method === "GET") {
    const { pageNum, pageSize } = parsePageParams(url);
    json(res, 200, listPartners(pageNum, pageSize));
    return;
  }

  if (path === "/partners" && method === "POST") {
    let body: OnboardPartnerRequest;
    try {
      body = JSON.parse(await readBody(req)) as OnboardPartnerRequest;
    } catch {
      const err: ErrorEnvelope = { detail: "invalid JSON body", status_code: 400 };
      json(res, 400, err);
      return;
    }
    const result = onboardPartner(body);
    if ("status_code" in result) {
      json(res, result.status_code, result);
    } else {
      json(res, 201, result);
    }
    return;
  }

  if (path === "/catalog/accessories" && method === "GET") {
    const { pageNum, pageSize } = parsePageParams(url);
    json(res, 200, getAccessoryCatalog(pageNum, pageSize));
    return;
  }

  if (path === "/catalog/services" && method === "GET") {
    const { pageNum, pageSize } = parsePageParams(url);
    json(res, 200, getServiceCatalog(pageNum, pageSize));
    return;
  }

  const notFound: ErrorEnvelope = { detail: "not found", status_code: 404 };
  json(res, 404, notFound);
}).listen(port, () => console.log(`service listening on :${port}`));

import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { health } from "./health.js";
import { getCatalogItems, getTrainerServices, Category, TrainerLevel, TrainerSpecialty } from "./catalog.js";

const port = Number(process.env.PORT ?? 3000);

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(body));
}

function parseQuery(url: string): Record<string, string> {
  const idx = url.indexOf("?");
  if (idx === -1) return {};
  return Object.fromEntries(new URLSearchParams(url.slice(idx + 1)));
}

function handleCatalog(req: IncomingMessage, res: ServerResponse): void {
  const query = parseQuery(req.url ?? "");
  const page = Math.max(1, Number(query["page"] ?? 1));
  const page_size = Math.min(100, Math.max(1, Number(query["page_size"] ?? 20)));
  const category = query["category"] as Category | undefined;

  if (category !== undefined && category !== "accessory" && category !== "equipment") {
    sendJson(res, 400, { detail: "category must be 'accessory' or 'equipment'", status_code: 400 });
    return;
  }

  sendJson(res, 200, getCatalogItems({ category, page, page_size }));
}

function handleServices(req: IncomingMessage, res: ServerResponse): void {
  const query = parseQuery(req.url ?? "");
  const page = Math.max(1, Number(query["page"] ?? 1));
  const page_size = Math.min(100, Math.max(1, Number(query["page_size"] ?? 20)));
  const level = query["level"] as TrainerLevel | undefined;
  const specialty = query["specialty"] as TrainerSpecialty | undefined;

  const validLevels = ["beginner", "intermediate", "advanced", "elite"];
  const validSpecialties = ["strength", "cardio", "yoga", "pilates", "crossfit", "rehabilitation", "nutrition"];

  if (level !== undefined && !validLevels.includes(level)) {
    sendJson(res, 400, { detail: `level must be one of: ${validLevels.join(", ")}`, status_code: 400 });
    return;
  }
  if (specialty !== undefined && !validSpecialties.includes(specialty)) {
    sendJson(res, 400, { detail: `specialty must be one of: ${validSpecialties.join(", ")}`, status_code: 400 });
    return;
  }

  sendJson(res, 200, getTrainerServices({ level, specialty, page, page_size }));
}

createServer((req, res) => {
  res.setHeader("access-control-allow-origin", "*");

  const pathname = (req.url ?? "").split("?")[0];

  if (pathname === "/health") {
    sendJson(res, 200, health());
    return;
  }

  if (pathname === "/catalog") {
    handleCatalog(req, res);
    return;
  }

  if (pathname === "/services") {
    handleServices(req, res);
    return;
  }

  res.statusCode = 404;
  res.end("not found");
}).listen(port, () => console.log(`service listening on :${port}`));

import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { health } from "./health.js";
import { listMerchandise, placeOrder } from "./merchandise.js";
import { listGames, getGame, createGroup, joinGroup, listGroups } from "./games.js";

const port = Number(process.env.PORT ?? 3000);

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk: Buffer) => { body += chunk.toString(); });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function send(res: ServerResponse, status: number, payload: unknown): void {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(payload));
}

createServer(async (req, res) => {
  const url = req.url ?? "";
  const method = req.method ?? "GET";

  // Health
  if (url === "/health") {
    return send(res, 200, health());
  }

  // Merchandise — browse
  if (url === "/merchandise" && method === "GET") {
    return send(res, 200, listMerchandise());
  }

  // Merchandise — purchase
  if (url === "/merchandise/orders" && method === "POST") {
    let body: unknown;
    try {
      body = await readBody(req);
    } catch {
      return send(res, 400, { error: "invalid JSON body" });
    }
    const result = placeOrder(body as Parameters<typeof placeOrder>[0]);
    if ("error" in result) return send(res, 400, result);
    return send(res, 201, result);
  }

  // Games — catalog
  if (url === "/games" && method === "GET") {
    return send(res, 200, listGames());
  }

  // Game groups — list (must come before single-game regex)
  if (url === "/games/groups" && method === "GET") {
    return send(res, 200, listGroups());
  }

  // Game groups — create (must come before single-game regex)
  if (url === "/games/groups" && method === "POST") {
    let body: unknown;
    try {
      body = await readBody(req);
    } catch {
      return send(res, 400, { error: "invalid JSON body" });
    }
    const result = createGroup(body as Parameters<typeof createGroup>[0]);
    if ("error" in result) return send(res, 400, result);
    return send(res, 201, result);
  }

  // Game groups — join
  const groupJoinMatch = url.match(/^\/games\/groups\/([\w-]+)\/join$/);
  if (groupJoinMatch && method === "POST") {
    let body: unknown;
    try {
      body = await readBody(req);
    } catch {
      return send(res, 400, { error: "invalid JSON body" });
    }
    const result = joinGroup({
      groupId: groupJoinMatch[1],
      ...(body as { playerName: string }),
    });
    if ("error" in result) return send(res, 400, result);
    return send(res, 200, result);
  }

  // Games — single game (after group routes to avoid capturing "groups" as an id)
  const gameMatch = url.match(/^\/games\/([\w-]+)$/);
  if (gameMatch && method === "GET") {
    const game = getGame(gameMatch[1]);
    if (!game) return send(res, 404, { error: "game not found" });
    return send(res, 200, game);
  }

  res.statusCode = 404;
  res.end("not found");
}).listen(port, () => console.log(`service listening on :${port}`));

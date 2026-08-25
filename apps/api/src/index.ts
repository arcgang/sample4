import { createServer } from "node:http";
import { addInventoryItem, listInventory } from "./inventory.js";
import { health } from "./health.js";

interface InventoryRequestBody {
  name: string;
  quantity: number;
}

const port = Number(process.env.PORT ?? 3000);

createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify(health()));
    return;
  }

  if (req.method === "GET" && req.url === "/inventory") {
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ items: listInventory() }));
    return;
  }

  if (req.method === "POST" && req.url === "/inventory") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      const parsedBody = JSON.parse(body) as InventoryRequestBody;
      const item = addInventoryItem(parsedBody);

      res.statusCode = 201;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify(item));
    });
    return;
  }

  res.statusCode = 404;
  res.end("not found");
}).listen(port, () => console.log(`service listening on :${port}`));

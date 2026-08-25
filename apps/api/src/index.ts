import { createServer } from "node:http";
import { health } from "./health.js";
import { getDashboard } from "./dashboard.js";

const port = Number(process.env.PORT ?? 3000);

createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.url === "/health") {
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify(health()));
    return;
  }

  if (req.url === "/dashboard" && req.method === "GET") {
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify(getDashboard("default")));
    return;
  }

  res.statusCode = 404;
  res.end("not found");
}).listen(port, () => console.log(`service listening on :${port}`));

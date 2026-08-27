import { createServer } from "node:http";
import { health } from "./health.js";
import { listQuotes, listPrograms, signupForProgram } from "./motivation.js";

const port = Number(process.env.PORT ?? 3000);

createServer((req, res) => {
  const url = req.url ?? "/";

  if (url === "/health") {
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify(health()));
    return;
  }

  if (url === "/quotes" && req.method === "GET") {
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify(listQuotes()));
    return;
  }

  if (url === "/programs" && req.method === "GET") {
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify(listPrograms()));
    return;
  }

  if (url === "/programs/signup" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk: Buffer) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(body);
      } catch {
        res.statusCode = 400;
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify({ error: "Invalid JSON body", status: 400 }));
        return;
      }

      if (
        typeof parsed !== "object" ||
        parsed === null ||
        typeof (parsed as Record<string, unknown>).programId !== "number" ||
        typeof (parsed as Record<string, unknown>).userEmail !== "string"
      ) {
        res.statusCode = 400;
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify({ error: "programId (number) and userEmail (string) are required", status: 400 }));
        return;
      }

      const { programId, userEmail } = parsed as { programId: number; userEmail: string };
      const result = signupForProgram(programId, userEmail);

      if ("error" in result) {
        res.statusCode = result.status;
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify(result));
        return;
      }

      res.statusCode = 201;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify(result));
    });
    return;
  }

  res.statusCode = 404;
  res.end("not found");
}).listen(port, () => console.log(`service listening on :${port}`));

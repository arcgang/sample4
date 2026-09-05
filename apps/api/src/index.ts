import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { health } from "./health.js";
import {
  validateCreateCheckoutInput,
  createCheckoutSession,
  getCheckoutSession,
} from "./payment.js";
import {
  getLoginInstructions,
  validateGoogleAuthInput,
  authenticateWithGoogle,
} from "./auth.js";

const port = Number(process.env.PORT ?? 3000);
const stripeSecretKey = process.env.STRIPE_SECRET_KEY ?? "";

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk: Buffer) => { raw += chunk.toString(); });
    req.on("end", () => {
      try {
        resolve(raw.length > 0 ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("Invalid JSON"));
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

createServer(async (req, res) => {
  const url = req.url ?? "";

  if (url === "/health") {
    json(res, 200, health());
    return;
  }

  // GET /auth/instructions — get instructions on how to login
  if (url === "/auth/instructions" && req.method === "GET") {
    json(res, 200, getLoginInstructions());
    return;
  }

  // POST /auth/google — authenticate with Google
  if (url === "/auth/google" && req.method === "POST") {
    let body: unknown;
    try {
      body = await readBody(req);
    } catch {
      json(res, 400, { error: "Invalid JSON" });
      return;
    }
    const validation = validateGoogleAuthInput(body);
    if (!validation.valid) {
      json(res, 400, { errors: validation.errors });
      return;
    }
    const session = authenticateWithGoogle(validation.data);
    json(res, 200, session);
    return;
  }

  // POST /checkout/session — create a Stripe Checkout Session
  if (url === "/checkout/session" && req.method === "POST") {
    if (!stripeSecretKey) {
      json(res, 500, { error: "Payment gateway not configured" });
      return;
    }
    let body: unknown;
    try {
      body = await readBody(req);
    } catch {
      json(res, 400, { error: "Invalid JSON" });
      return;
    }
    const validation = validateCreateCheckoutInput(body);
    if (!validation.valid) {
      json(res, 400, { errors: validation.errors });
      return;
    }
    try {
      const result = await createCheckoutSession(validation.data, stripeSecretKey);
      json(res, 201, result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Stripe error";
      json(res, 502, { error: message });
    }
    return;
  }

  // GET /checkout/session/:sessionId — retrieve session status
  const sessionMatch = url.match(/^\/checkout\/session\/([^/?]+)$/);
  if (sessionMatch && req.method === "GET") {
    if (!stripeSecretKey) {
      json(res, 500, { error: "Payment gateway not configured" });
      return;
    }
    const sessionId = sessionMatch[1];
    try {
      const result = await getCheckoutSession(sessionId, stripeSecretKey);
      json(res, 200, result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Stripe error";
      json(res, 502, { error: message });
    }
    return;
  }

  res.statusCode = 404;
  res.end("not found");
}).listen(port, () => console.log(`service listening on :${port}`));

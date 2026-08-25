import Stripe from "stripe";

/** Supported currencies for multi-country regional launch. */
export const SUPPORTED_CURRENCIES = ["usd", "eur", "gbp", "cad", "aud"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

/** The two kinds of purchase the platform supports. */
export type PurchaseMode = "subscription" | "payment";

export interface CheckoutLineItem {
  name: string;
  /** Amount in the smallest currency unit (cents, pence, etc.). */
  unitAmount: number;
  quantity: number;
}

export interface CreateCheckoutInput {
  mode: PurchaseMode;
  currency: SupportedCurrency;
  lineItems: CheckoutLineItem[];
  successUrl: string;
  cancelUrl: string;
}

export interface CreateCheckoutResult {
  sessionId: string;
  url: string;
}

export interface CheckoutSessionStatus {
  sessionId: string;
  status: Stripe.Checkout.Session["status"];
  paymentStatus: Stripe.Checkout.Session["payment_status"];
  currency: string | null;
  amountTotal: number | null;
}

export interface ValidationError {
  field: string;
  message: string;
}

export function validateCreateCheckoutInput(
  input: unknown,
): { valid: true; data: CreateCheckoutInput } | { valid: false; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  const raw = input as Record<string, unknown>;

  if (!raw || typeof raw !== "object") {
    return { valid: false, errors: [{ field: "body", message: "Request body must be an object" }] };
  }

  if (raw.mode !== "subscription" && raw.mode !== "payment") {
    errors.push({ field: "mode", message: 'mode must be "subscription" or "payment"' });
  }

  if (typeof raw.currency !== "string" || !SUPPORTED_CURRENCIES.includes(raw.currency as SupportedCurrency)) {
    errors.push({
      field: "currency",
      message: `currency must be one of: ${SUPPORTED_CURRENCIES.join(", ")}`,
    });
  }

  if (!Array.isArray(raw.lineItems) || raw.lineItems.length === 0) {
    errors.push({ field: "lineItems", message: "lineItems must be a non-empty array" });
  } else {
    (raw.lineItems as unknown[]).forEach((item, i) => {
      const li = item as Record<string, unknown>;
      if (typeof li.name !== "string" || li.name.trim() === "") {
        errors.push({ field: `lineItems[${i}].name`, message: "name must be a non-empty string" });
      }
      if (typeof li.unitAmount !== "number" || !Number.isInteger(li.unitAmount) || li.unitAmount < 1) {
        errors.push({ field: `lineItems[${i}].unitAmount`, message: "unitAmount must be a positive integer" });
      }
      if (typeof li.quantity !== "number" || !Number.isInteger(li.quantity) || li.quantity < 1) {
        errors.push({ field: `lineItems[${i}].quantity`, message: "quantity must be a positive integer" });
      }
    });
  }

  if (typeof raw.successUrl !== "string" || raw.successUrl.trim() === "") {
    errors.push({ field: "successUrl", message: "successUrl must be a non-empty string" });
  }

  if (typeof raw.cancelUrl !== "string" || raw.cancelUrl.trim() === "") {
    errors.push({ field: "cancelUrl", message: "cancelUrl must be a non-empty string" });
  }

  if (errors.length > 0) return { valid: false, errors };

  return {
    valid: true,
    data: {
      mode: raw.mode as PurchaseMode,
      currency: raw.currency as SupportedCurrency,
      lineItems: (raw.lineItems as Array<Record<string, unknown>>).map((li) => ({
        name: li.name as string,
        unitAmount: li.unitAmount as number,
        quantity: li.quantity as number,
      })),
      successUrl: raw.successUrl as string,
      cancelUrl: raw.cancelUrl as string,
    },
  };
}

function buildStripe(secretKey: string): Stripe {
  return new Stripe(secretKey);
}

export async function createCheckoutSession(
  input: CreateCheckoutInput,
  secretKey: string,
): Promise<CreateCheckoutResult> {
  const stripe = buildStripe(secretKey);

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = input.lineItems.map((li) => ({
    price_data: {
      currency: input.currency,
      unit_amount: li.unitAmount,
      product_data: { name: li.name },
      ...(input.mode === "subscription" ? { recurring: { interval: "month" as const } } : {}),
    },
    quantity: li.quantity,
  }));

  const session = await stripe.checkout.sessions.create({
    mode: input.mode,
    currency: input.currency,
    line_items: lineItems,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
  });

  return { sessionId: session.id, url: session.url ?? "" };
}

export async function getCheckoutSession(
  sessionId: string,
  secretKey: string,
): Promise<CheckoutSessionStatus> {
  const stripe = buildStripe(secretKey);
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  return {
    sessionId: session.id,
    status: session.status,
    paymentStatus: session.payment_status,
    currency: session.currency,
    amountTotal: session.amount_total,
  };
}

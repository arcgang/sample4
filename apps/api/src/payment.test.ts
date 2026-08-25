import { describe, it, expect, vi, beforeEach, type MockInstance } from "vitest";
import Stripe from "stripe";
import {
  validateCreateCheckoutInput,
  createCheckoutSession,
  getCheckoutSession,
  SUPPORTED_CURRENCIES,
} from "./payment.js";

// ---------------------------------------------------------------------------
// Stripe SDK mock
// ---------------------------------------------------------------------------

const mockSessionCreate = vi.fn();
const mockSessionRetrieve = vi.fn();

vi.mock("stripe", () => {
  const StripeClass = vi.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: mockSessionCreate,
        retrieve: mockSessionRetrieve,
      },
    },
  }));
  return { default: StripeClass };
});

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// validateCreateCheckoutInput
// ---------------------------------------------------------------------------

describe("validateCreateCheckoutInput", () => {
  const validInput = {
    mode: "payment",
    currency: "usd",
    lineItems: [{ name: "Premium Plan", unitAmount: 2999, quantity: 1 }],
    successUrl: "https://example.com/success",
    cancelUrl: "https://example.com/cancel",
  };

  it("accepts a valid payment input", () => {
    const result = validateCreateCheckoutInput(validInput);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.mode).toBe("payment");
      expect(result.data.currency).toBe("usd");
      expect(result.data.lineItems).toHaveLength(1);
      expect(result.data.lineItems[0].name).toBe("Premium Plan");
      expect(result.data.lineItems[0].unitAmount).toBe(2999);
    }
  });

  it("accepts a valid subscription input with eur currency", () => {
    const result = validateCreateCheckoutInput({ ...validInput, mode: "subscription", currency: "eur" });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.mode).toBe("subscription");
      expect(result.data.currency).toBe("eur");
    }
  });

  it("rejects a null body", () => {
    const result = validateCreateCheckoutInput(null);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors[0].field).toBe("body");
    }
  });

  it("rejects an unknown mode value", () => {
    const result = validateCreateCheckoutInput({ ...validInput, mode: "invoice" });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.field === "mode")).toBe(true);
    }
  });

  it("rejects an unsupported currency", () => {
    const result = validateCreateCheckoutInput({ ...validInput, currency: "xyz" });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.field === "currency")).toBe(true);
    }
  });

  it("accepts all supported currencies", () => {
    for (const currency of SUPPORTED_CURRENCIES) {
      const result = validateCreateCheckoutInput({ ...validInput, currency });
      expect(result.valid, `currency ${currency} should be valid`).toBe(true);
    }
  });

  it("rejects empty lineItems array", () => {
    const result = validateCreateCheckoutInput({ ...validInput, lineItems: [] });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.field === "lineItems")).toBe(true);
    }
  });

  it("rejects a line item with a zero unitAmount", () => {
    const result = validateCreateCheckoutInput({
      ...validInput,
      lineItems: [{ name: "Item", unitAmount: 0, quantity: 1 }],
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.field === "lineItems[0].unitAmount")).toBe(true);
    }
  });

  it("rejects a line item with an empty name", () => {
    const result = validateCreateCheckoutInput({
      ...validInput,
      lineItems: [{ name: "  ", unitAmount: 500, quantity: 1 }],
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.field === "lineItems[0].name")).toBe(true);
    }
  });

  it("rejects missing successUrl", () => {
    const result = validateCreateCheckoutInput({ ...validInput, successUrl: "" });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.field === "successUrl")).toBe(true);
    }
  });

  it("rejects missing cancelUrl", () => {
    const result = validateCreateCheckoutInput({ ...validInput, cancelUrl: "" });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.field === "cancelUrl")).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// createCheckoutSession
// ---------------------------------------------------------------------------

describe("createCheckoutSession", () => {
  it("calls stripe.checkout.sessions.create with correct params and returns session id and url", async () => {
    mockSessionCreate.mockResolvedValueOnce({
      id: "cs_test_abc123",
      url: "https://checkout.stripe.com/pay/cs_test_abc123",
    });

    const result = await createCheckoutSession(
      {
        mode: "payment",
        currency: "usd",
        lineItems: [{ name: "Foam Roller", unitAmount: 1500, quantity: 2 }],
        successUrl: "https://example.com/success",
        cancelUrl: "https://example.com/cancel",
      },
      "sk_test_dummy",
    );

    expect(result.sessionId).toBe("cs_test_abc123");
    expect(result.url).toBe("https://checkout.stripe.com/pay/cs_test_abc123");
    expect(mockSessionCreate).toHaveBeenCalledTimes(1);

    const callArgs = mockSessionCreate.mock.calls[0][0] as Record<string, unknown>;
    expect(callArgs.mode).toBe("payment");
    expect(callArgs.currency).toBe("usd");
  });

  it("passes recurring interval for subscription mode", async () => {
    mockSessionCreate.mockResolvedValueOnce({
      id: "cs_test_sub_xyz",
      url: "https://checkout.stripe.com/pay/cs_test_sub_xyz",
    });

    await createCheckoutSession(
      {
        mode: "subscription",
        currency: "eur",
        lineItems: [{ name: "Monthly Membership", unitAmount: 4999, quantity: 1 }],
        successUrl: "https://example.com/success",
        cancelUrl: "https://example.com/cancel",
      },
      "sk_test_dummy",
    );

    const callArgs = mockSessionCreate.mock.calls[0][0] as {
      mode: string;
      currency: string;
      line_items: Array<{ price_data: { recurring?: { interval: string } } }>;
    };
    expect(callArgs.mode).toBe("subscription");
    expect(callArgs.currency).toBe("eur");
    expect(callArgs.line_items[0].price_data.recurring?.interval).toBe("month");
  });

  it("uses a blank string for url when session url is null", async () => {
    mockSessionCreate.mockResolvedValueOnce({ id: "cs_test_null_url", url: null });
    const result = await createCheckoutSession(
      {
        mode: "payment",
        currency: "gbp",
        lineItems: [{ name: "Yoga Mat", unitAmount: 2000, quantity: 1 }],
        successUrl: "https://example.com/success",
        cancelUrl: "https://example.com/cancel",
      },
      "sk_test_dummy",
    );
    expect(result.url).toBe("");
  });
});

// ---------------------------------------------------------------------------
// getCheckoutSession
// ---------------------------------------------------------------------------

describe("getCheckoutSession", () => {
  it("retrieves a session and returns its status fields", async () => {
    mockSessionRetrieve.mockResolvedValueOnce({
      id: "cs_test_abc123",
      status: "complete",
      payment_status: "paid",
      currency: "usd",
      amount_total: 1500,
    });

    const result = await getCheckoutSession("cs_test_abc123", "sk_test_dummy");

    expect(result.sessionId).toBe("cs_test_abc123");
    expect(result.status).toBe("complete");
    expect(result.paymentStatus).toBe("paid");
    expect(result.currency).toBe("usd");
    expect(result.amountTotal).toBe(1500);
    expect(mockSessionRetrieve).toHaveBeenCalledWith("cs_test_abc123");
  });

  it("returns null currency and amountTotal when session has not been paid", async () => {
    mockSessionRetrieve.mockResolvedValueOnce({
      id: "cs_test_open",
      status: "open",
      payment_status: "unpaid",
      currency: null,
      amount_total: null,
    });

    const result = await getCheckoutSession("cs_test_open", "sk_test_dummy");
    expect(result.status).toBe("open");
    expect(result.currency).toBeNull();
    expect(result.amountTotal).toBeNull();
  });
});

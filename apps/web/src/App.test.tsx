import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, beforeEach } from "vitest";
import { App } from "./App";

// ---------------------------------------------------------------------------
// fetch mock
// ---------------------------------------------------------------------------

const mockFetch = vi.fn();
globalThis.fetch = mockFetch as typeof globalThis.fetch;

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockImplementation(async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.includes("/auth/instructions")) {
      return {
        ok: true,
        json: async () => ({
          title: "Sign in to Fitness App",
          steps: [
            "Click the 'Sign in with Google' button below.",
            "Select your Google account and authorize access.",
            "You will be redirected automatically to your fitness dashboard.",
          ],
          supportedProviders: ["google"],
        }),
        text: async () => "",
      };
    }
    return {
      ok: true,
      json: async () => ({}),
      text: async () => "",
    };
  });
});

// ---------------------------------------------------------------------------
// App shell
// ---------------------------------------------------------------------------

test("renders the app header and login section", async () => {
  render(<App />);
  await waitFor(() => {
    expect(screen.getByRole("heading", { name: "Fitness Hub" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Fitness Login" })).toBeTruthy();
  });
});

test("renders the checkout page heading", async () => {
  render(<App />);
  await waitFor(() => {
    expect(screen.getByRole("heading", { name: "Fitness Store Checkout" })).toBeTruthy();
  });
});

test("renders the Purchase section heading", async () => {
  render(<App />);
  await waitFor(() => {
    expect(screen.getByRole("heading", { name: "Purchase" })).toBeTruthy();
  });
});

test("renders the Check Payment Status section heading", async () => {
  render(<App />);
  await waitFor(() => {
    expect(screen.getByRole("heading", { name: "Check Payment Status" })).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Checkout form — initial state
// ---------------------------------------------------------------------------

test("renders the product selector with Monthly Membership as the default", async () => {
  render(<App />);
  await waitFor(() => {
    const select = screen.getByRole("combobox", { name: "Select product" }) as HTMLSelectElement;
    expect(select.value).toBe("sub-monthly");
  });
});

test("renders five currency options", async () => {
  render(<App />);
  await waitFor(() => {
    const currencySelect = screen.getByRole("combobox", { name: "Currency" }) as HTMLSelectElement;
    expect(currencySelect.options.length).toBe(5);
  });
});

test("renders the Proceed to Checkout button", async () => {
  render(<App />);
  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Proceed to Checkout" })).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Checkout form — successful checkout
// ---------------------------------------------------------------------------

test("shows the Stripe checkout link after a successful POST /checkout/session", async () => {
  mockFetch.mockImplementation(async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.includes("/checkout/session")) {
      return {
        ok: true,
        json: async () => ({
          sessionId: "cs_test_abc",
          url: "https://checkout.stripe.com/pay/cs_test_abc",
        }),
        text: async () => "",
      };
    }
    return {
      ok: true,
      json: async () => ({
        title: "Sign in to Fitness App",
        steps: ["Step 1"],
        supportedProviders: ["google"],
      }),
      text: async () => "",
    };
  });

  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Proceed to Checkout" }));

  await waitFor(() => {
    const link = screen.getByTestId("stripe-checkout-link") as HTMLAnchorElement;
    expect(link.href).toBe("https://checkout.stripe.com/pay/cs_test_abc");
  });
});

test("calls POST /checkout/session with mode subscription for Monthly Membership", async () => {
  let checkoutCall: [string, RequestInit] | undefined;
  mockFetch.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.includes("/checkout/session")) {
      checkoutCall = [url, init as RequestInit];
      return {
        ok: true,
        json: async () => ({ sessionId: "cs_test_xyz", url: "https://checkout.stripe.com/pay/cs_test_xyz" }),
        text: async () => "",
      };
    }
    return {
      ok: true,
      json: async () => ({
        title: "Sign in to Fitness App",
        steps: ["Step 1"],
        supportedProviders: ["google"],
      }),
      text: async () => "",
    };
  });

  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Proceed to Checkout" }));

  await waitFor(() => expect(checkoutCall).toBeDefined());
  const [, init] = checkoutCall!;
  const body = JSON.parse(init.body as string) as { mode: string; currency: string };
  expect(body.mode).toBe("subscription");
  expect(body.currency).toBe("usd");
});

// ---------------------------------------------------------------------------
// Checkout form — error state
// ---------------------------------------------------------------------------

test("shows an error alert when POST /checkout/session fails", async () => {
  mockFetch.mockImplementation(async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.includes("/checkout/session")) {
      return {
        ok: false,
        text: async () => "Payment gateway not configured",
      };
    }
    return {
      ok: true,
      json: async () => ({
        title: "Sign in to Fitness App",
        steps: ["Step 1"],
        supportedProviders: ["google"],
      }),
      text: async () => "",
    };
  });

  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Proceed to Checkout" }));

  await waitFor(() => {
    expect(screen.getByText("Payment gateway not configured")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Session status lookup
// ---------------------------------------------------------------------------

test("shows session status after a successful GET /checkout/session/:id", async () => {
  mockFetch.mockImplementation(async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.includes("/checkout/session/cs_test_abc")) {
      return {
        ok: true,
        json: async () => ({
          sessionId: "cs_test_abc",
          status: "complete",
          paymentStatus: "paid",
          currency: "usd",
          amountTotal: 2999,
        }),
        text: async () => "",
      };
    }
    return {
      ok: true,
      json: async () => ({
        title: "Sign in to Fitness App",
        steps: ["Step 1"],
        supportedProviders: ["google"],
      }),
      text: async () => "",
    };
  });

  render(<App />);
  const input = screen.getByPlaceholderText("cs_test_…");
  fireEvent.change(input, { target: { value: "cs_test_abc" } });
  fireEvent.click(screen.getByRole("button", { name: "Check Status" }));

  await waitFor(() => {
    expect(screen.getByText("complete")).toBeTruthy();
    expect(screen.getByText("paid")).toBeTruthy();
  });
});

test("shows an error alert when session lookup fails", async () => {
  mockFetch.mockImplementation(async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.includes("/checkout/session/cs_bad_id")) {
      return {
        ok: false,
        text: async () => "Lookup failed",
      };
    }
    return {
      ok: true,
      json: async () => ({
        title: "Sign in to Fitness App",
        steps: ["Step 1"],
        supportedProviders: ["google"],
      }),
      text: async () => "",
    };
  });

  render(<App />);
  const input = screen.getByPlaceholderText("cs_test_…");
  fireEvent.change(input, { target: { value: "cs_bad_id" } });
  fireEvent.click(screen.getByRole("button", { name: "Check Status" }));

  await waitFor(() => {
    expect(screen.getByText("Lookup failed")).toBeTruthy();
  });
});

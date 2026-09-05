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
});

// ---------------------------------------------------------------------------
// App shell
// ---------------------------------------------------------------------------

test("renders the checkout page heading", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: "Fitness Store Checkout" })).toBeTruthy();
});

test("renders the Purchase section heading", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: "Purchase" })).toBeTruthy();
});

test("renders the Check Payment Status section heading", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: "Check Payment Status" })).toBeTruthy();
});

// ---------------------------------------------------------------------------
// Checkout form — initial state
// ---------------------------------------------------------------------------

test("renders the product selector with Monthly Membership as the default", () => {
  render(<App />);
  const select = screen.getByRole("combobox", { name: "Select product" }) as HTMLSelectElement;
  expect(select.value).toBe("sub-monthly");
});

test("renders five currency options", () => {
  render(<App />);
  const currencySelect = screen.getByRole("combobox", { name: "Currency" }) as HTMLSelectElement;
  expect(currencySelect.options.length).toBe(5);
});

test("renders the Proceed to Checkout button", () => {
  render(<App />);
  expect(screen.getByRole("button", { name: "Proceed to Checkout" })).toBeTruthy();
});

// ---------------------------------------------------------------------------
// Checkout form — successful checkout
// ---------------------------------------------------------------------------

test("shows the Stripe checkout link after a successful POST /checkout/session", async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      sessionId: "cs_test_abc",
      url: "https://checkout.stripe.com/pay/cs_test_abc",
    }),
  });

  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Proceed to Checkout" }));

  await waitFor(() => {
    const link = screen.getByTestId("stripe-checkout-link") as HTMLAnchorElement;
    expect(link.href).toBe("https://checkout.stripe.com/pay/cs_test_abc");
  });
});

test("calls POST /checkout/session with mode subscription for Monthly Membership", async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ sessionId: "cs_test_xyz", url: "https://checkout.stripe.com/pay/cs_test_xyz" }),
  });

  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Proceed to Checkout" }));

  await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
  const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
  const body = JSON.parse(init.body as string) as { mode: string; currency: string };
  expect(body.mode).toBe("subscription");
  expect(body.currency).toBe("usd");
});

// ---------------------------------------------------------------------------
// Checkout form — error state
// ---------------------------------------------------------------------------

test("shows an error alert when POST /checkout/session fails", async () => {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    text: async () => "Payment gateway not configured",
  });

  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Proceed to Checkout" }));

  await waitFor(() => {
    expect(screen.getByRole("alert").textContent).toBe("Payment gateway not configured");
  });
});

// ---------------------------------------------------------------------------
// Session status lookup
// ---------------------------------------------------------------------------

test("shows session status after a successful GET /checkout/session/:id", async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      sessionId: "cs_test_abc",
      status: "complete",
      paymentStatus: "paid",
      currency: "usd",
      amountTotal: 2999,
    }),
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
  mockFetch.mockResolvedValueOnce({
    ok: false,
    text: async () => "Lookup failed",
  });

  render(<App />);
  const input = screen.getByPlaceholderText("cs_test_…");
  fireEvent.change(input, { target: { value: "cs_bad_id" } });
  fireEvent.click(screen.getByRole("button", { name: "Check Status" }));

  await waitFor(() => {
    expect(screen.getByRole("alert").textContent).toBe("Lookup failed");
  });
});

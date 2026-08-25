import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

type Currency = "usd" | "eur" | "gbp" | "cad" | "aud";
type PurchaseMode = "subscription" | "payment";

interface CheckoutResult {
  sessionId: string;
  url: string;
}

interface CheckoutStatus {
  sessionId: string;
  status: string | null;
  paymentStatus: string;
  currency: string | null;
  amountTotal: number | null;
}

const CURRENCIES: { value: Currency; label: string }[] = [
  { value: "usd", label: "USD – US Dollar" },
  { value: "eur", label: "EUR – Euro" },
  { value: "gbp", label: "GBP – British Pound" },
  { value: "cad", label: "CAD – Canadian Dollar" },
  { value: "aud", label: "AUD – Australian Dollar" },
];

const CATALOG: { id: string; name: string; mode: PurchaseMode; unitAmount: number; currency: Currency; description: string }[] = [
  { id: "sub-monthly", name: "Monthly Membership", mode: "subscription", unitAmount: 2999, currency: "usd", description: "Unlimited access to all fitness features, renewed monthly." },
  { id: "sub-annual", name: "Annual Membership", mode: "subscription", unitAmount: 24999, currency: "usd", description: "Full-year membership at a discounted rate." },
  { id: "item-foam-roller", name: "Foam Roller", mode: "payment", unitAmount: 1500, currency: "usd", description: "High-density foam roller for muscle recovery." },
  { id: "item-resistance-bands", name: "Resistance Bands Set", mode: "payment", unitAmount: 2500, currency: "usd", description: "Set of 5 resistance bands for strength training." },
];

function formatAmount(amount: number | null, currency: string | null): string {
  if (amount === null || currency === null) return "—";
  return new Intl.NumberFormat("en", { style: "currency", currency: currency.toUpperCase() }).format(amount / 100);
}

function CheckoutForm() {
  const [selectedId, setSelectedId] = useState(CATALOG[0].id);
  const [currency, setCurrency] = useState<Currency>("usd");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  const selected = CATALOG.find((p) => p.id === selectedId) ?? CATALOG[0];

  async function handleCheckout() {
    setLoading(true);
    setError(null);
    setCheckoutUrl(null);
    try {
      const res = await fetch(`${API_URL}/checkout/session`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode: selected.mode,
          currency,
          lineItems: [{ name: selected.name, unitAmount: selected.unitAmount, quantity: 1 }],
          successUrl: `${window.location.origin}/?payment=success`,
          cancelUrl: `${window.location.origin}/?payment=cancel`,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Checkout failed");
      }
      const data = (await res.json()) as CheckoutResult;
      setCheckoutUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section aria-label="Checkout">
      <h2>Purchase</h2>

      <div>
        <label htmlFor="product-select">Select product</label>
        <select
          id="product-select"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          disabled={loading}
        >
          {CATALOG.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {p.mode === "subscription" ? "Subscription" : "One-time"}
            </option>
          ))}
        </select>
      </div>

      <p>{selected.description}</p>

      <div>
        <label htmlFor="currency-select">Currency</label>
        <select
          id="currency-select"
          value={currency}
          onChange={(e) => setCurrency(e.target.value as Currency)}
          disabled={loading}
        >
          {CURRENCIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <p>
        Price:{" "}
        <strong>
          {formatAmount(selected.unitAmount, currency)}
          {selected.mode === "subscription" ? " / month" : ""}
        </strong>
      </p>

      <button type="button" onClick={handleCheckout} disabled={loading}>
        {loading ? "Redirecting to Stripe…" : "Proceed to Checkout"}
      </button>

      {error && <p role="alert">{error}</p>}

      {checkoutUrl && (
        <p>
          <a href={checkoutUrl} data-testid="stripe-checkout-link">
            Continue to Stripe Checkout
          </a>
        </p>
      )}
    </section>
  );
}

function SessionStatus() {
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<CheckoutStatus | null>(null);

  async function handleLookup() {
    if (!sessionId.trim()) return;
    setLoading(true);
    setError(null);
    setStatus(null);
    try {
      const res = await fetch(`${API_URL}/checkout/session/${encodeURIComponent(sessionId.trim())}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Lookup failed");
      }
      const data = (await res.json()) as CheckoutStatus;
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lookup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section aria-label="Session status">
      <h2>Check Payment Status</h2>
      <div>
        <label htmlFor="session-id-input">Stripe session ID</label>
        <input
          id="session-id-input"
          type="text"
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
          placeholder="cs_test_…"
          disabled={loading}
        />
        <button type="button" onClick={handleLookup} disabled={loading || !sessionId.trim()}>
          {loading ? "Looking up…" : "Check Status"}
        </button>
      </div>

      {error && <p role="alert">{error}</p>}

      {status && (
        <dl>
          <dt>Session</dt>
          <dd>{status.sessionId}</dd>
          <dt>Status</dt>
          <dd>{status.status ?? "—"}</dd>
          <dt>Payment</dt>
          <dd>{status.paymentStatus}</dd>
          <dt>Amount</dt>
          <dd>{formatAmount(status.amountTotal, status.currency)}</dd>
        </dl>
      )}
    </section>
  );
}

export function App() {
  return (
    <main>
      <h1>Fitness Store Checkout</h1>
      <CheckoutForm />
      <SessionStatus />
    </main>
  );
}

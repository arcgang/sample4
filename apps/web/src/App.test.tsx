import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { App } from "./App";

const catalogAll = {
  items: [
    { id: "cat-001", name: "Resistance Bands Set", category: "accessory", description: "Set of 5 bands", price: 29.99 },
    { id: "cat-004", name: "Treadmill Pro 3000", category: "equipment", description: "Commercial treadmill", price: 1299.0 },
  ],
  total: 2,
  page: 1,
  page_size: 100,
};

const catalogAccessories = {
  items: [
    { id: "cat-001", name: "Resistance Bands Set", category: "accessory", description: "Set of 5 bands", price: 29.99 },
  ],
  total: 1,
  page: 1,
  page_size: 100,
};

const servicesAll = {
  items: [
    { id: "svc-001", name: "Alex Chen", level: "elite", specialty: "strength", description: "15 years coaching", hourlyRate: 120 },
    { id: "svc-004", name: "Taylor Brooks", level: "beginner", specialty: "cardio", description: "Great for beginners", hourlyRate: 45 },
  ],
  total: 2,
  page: 1,
  page_size: 100,
};

function mockFetch(url: string): Promise<Response> {
  const [base, qs = ""] = url.split("?");
  const pathname = base.replace("http://localhost:3000", "");
  const params = new URLSearchParams(qs);

  if (pathname === "/catalog") {
    const cat = params.get("category");
    const body = cat === "accessory" ? catalogAccessories : catalogAll;
    return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
  }

  if (pathname === "/services") {
    return Promise.resolve(new Response(JSON.stringify(servicesAll), { status: 200 }));
  }

  return Promise.resolve(new Response("not found", { status: 404 }));
}

beforeEach(() => {
  globalThis.fetch = mockFetch as typeof fetch;
});

test("renders the partner onboarding heading", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: "Fitness Partner Onboarding" })).toBeTruthy();
});

test("renders catalog section heading", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: /Accessories.*Equipment Catalog/i })).toBeTruthy();
});

test("renders trainer services section heading", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: /Trainer Services/i })).toBeTruthy();
});

test("shows catalog items once loaded", async () => {
  render(<App />);
  await waitFor(() => {
    expect(screen.getByText("Resistance Bands Set")).toBeTruthy();
    expect(screen.getByText("Treadmill Pro 3000")).toBeTruthy();
  });
});

test("shows trainer service names once loaded", async () => {
  render(<App />);
  await waitFor(() => {
    expect(screen.getByText("Alex Chen")).toBeTruthy();
    expect(screen.getByText("Taylor Brooks")).toBeTruthy();
  });
});

test("shows trainer hourly rate formatted with dollar sign", async () => {
  render(<App />);
  await waitFor(() => {
    expect(screen.getByText("$120/hr")).toBeTruthy();
  });
});

test("shows item price formatted to 2 decimal places", async () => {
  render(<App />);
  await waitFor(() => {
    expect(screen.getByText("$29.99")).toBeTruthy();
  });
});

test("filter buttons are rendered for All, Accessory, and Equipment", () => {
  render(<App />);
  expect(screen.getByRole("button", { name: "All" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Accessory" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Equipment" })).toBeTruthy();
});

test("clicking Accessory filter re-fetches and shows only accessories", async () => {
  render(<App />);
  await waitFor(() => screen.getByText("Resistance Bands Set"));

  fireEvent.click(screen.getByRole("button", { name: "Accessory" }));
  await waitFor(() => {
    expect(screen.getByText("Resistance Bands Set")).toBeTruthy();
    expect(screen.queryByText("Treadmill Pro 3000")).toBeNull();
  });
});

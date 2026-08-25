import { render, screen, fireEvent, act } from "@testing-library/react";
import { vi, beforeEach } from "vitest";
import { App } from "./App";

const merchandiseItems = [
  {
    id: "merch-1",
    name: "FitHub Training T-Shirt",
    description: "Lightweight moisture-wicking training tee",
    priceUsd: 29.99,
    category: "apparel",
    stock: 100,
  },
];

const games = [
  {
    id: "game-1",
    name: "Step Champions",
    description: "Compete with friends on daily steps",
    type: "step_competition",
    minPlayers: 2,
    maxPlayers: 10,
    durationDays: 7,
  },
];

const emptyGroups: unknown[] = [];

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      if (url.includes("/merchandise") && !url.includes("/orders")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(merchandiseItems),
        });
      }
      if (url.includes("/merchandise/orders")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              id: "order-1",
              itemName: "FitHub Training T-Shirt",
              quantity: 1,
              totalUsd: 29.99,
              status: "pending_fulfillment",
            }),
        });
      }
      if (url.includes("/games/groups") && !url.includes("/join")) {
        if ((fetch as ReturnType<typeof vi.fn>).mock.calls.length <= 2) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(emptyGroups),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(emptyGroups),
        });
      }
      if (url.includes("/games")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(games),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      });
    }),
  );
});

test("renders the platform heading", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: "FitHub Engagement Platform" })).toBeTruthy();
});

test("shows Merchandise and Games navigation tabs", () => {
  render(<App />);
  expect(screen.getByRole("button", { name: "Merchandise" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Games" })).toBeTruthy();
});

test("merchandise tab is active by default and shows loading state then items", async () => {
  render(<App />);
  expect(screen.getByText("Loading merchandise…")).toBeTruthy();
  await screen.findByText("FitHub Training T-Shirt");
  expect(screen.getByText("FitHub Training T-Shirt")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Buy" })).toBeTruthy();
});

test("merchandise tab shows item price", async () => {
  render(<App />);
  await screen.findByText(/29\.99/);
  expect(screen.getByText(/29\.99/)).toBeTruthy();
});

test("switching to games tab shows games catalog heading", async () => {
  render(<App />);
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Games" }));
  });
  expect(screen.getByRole("heading", { name: "Games Catalog" })).toBeTruthy();
});

test("games tab loads and displays Step Champions", async () => {
  render(<App />);
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Games" }));
  });
  await screen.findByText("Step Champions");
  expect(screen.getByText("Step Champions")).toBeTruthy();
});

test("games tab shows players range and duration for each game", async () => {
  render(<App />);
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Games" }));
  });
  await screen.findByText(/2–10/);
  expect(screen.getByText(/7 days/)).toBeTruthy();
});

test("games tab shows empty groups message when no groups exist", async () => {
  render(<App />);
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Games" }));
  });
  await screen.findByText("No groups yet. Start one above!");
  expect(screen.getByText("No groups yet. Start one above!")).toBeTruthy();
});

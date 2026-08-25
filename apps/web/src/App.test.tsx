import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, beforeEach } from "vitest";
import { App } from "./App";
import * as api from "./api.js";

const PARTNER_LIST = {
  items: [
    {
      id: "p-1",
      name: "FitZone Pro",
      category: "Gym",
      description: "Full-service gym",
      accessoryCatalog: [],
      serviceCatalog: [],
      onboardedAt: "2025-01-15T09:00:00Z",
    },
  ],
  total: 1,
  page: 1,
  page_size: 20,
};

const ACCESSORY_LIST = {
  items: [{ id: "acc-1", name: "Resistance Bands Set", description: "Set of 5 bands", price: 29.99 }],
  total: 1,
  page: 1,
  page_size: 20,
};

const SERVICE_LIST = {
  items: [{ id: "svc-1", name: "Personal Training Session", description: "One-on-one coaching", durationMinutes: 60 }],
  total: 1,
  page: 1,
  page_size: 20,
};

beforeEach(() => {
  vi.spyOn(api, "fetchPartners").mockResolvedValue(PARTNER_LIST);
  vi.spyOn(api, "fetchAccessories").mockResolvedValue(ACCESSORY_LIST);
  vi.spyOn(api, "fetchServices").mockResolvedValue(SERVICE_LIST);
  vi.spyOn(api, "onboardPartner").mockResolvedValue({
    id: "p-99",
    name: "New Gym",
    category: "Gym",
    description: "desc",
    accessoryCatalog: [],
    serviceCatalog: [],
    onboardedAt: "2026-01-01T00:00:00Z",
  });
});

test("renders the app heading", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: "Fitness Partner Onboarding" })).toBeTruthy();
});

test("shows all four navigation tabs", () => {
  render(<App />);
  expect(screen.getByRole("button", { name: "Partner Catalog" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Accessory Catalog" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Service Catalog" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Onboard Partner" })).toBeTruthy();
});

test("partner catalog tab renders partner names after loading", async () => {
  render(<App />);
  await waitFor(() => expect(screen.getByText("FitZone Pro")).toBeTruthy());
  expect(screen.getByText("1 partner registered")).toBeTruthy();
});

test("accessory catalog tab renders accessory table", async () => {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Accessory Catalog" }));
  await waitFor(() => expect(screen.getByText("Resistance Bands Set")).toBeTruthy());
  expect(screen.getByText("$29.99")).toBeTruthy();
});

test("service catalog tab renders service table", async () => {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Service Catalog" }));
  await waitFor(() => expect(screen.getByText("Personal Training Session")).toBeTruthy());
  expect(screen.getByText("60 min")).toBeTruthy();
});

test("onboard tab submits form and shows success message", async () => {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Onboard Partner" }));

  fireEvent.change(screen.getByLabelText(/partner name/i), { target: { value: "New Gym" } });
  fireEvent.change(screen.getByLabelText(/category/i), { target: { value: "Gym" } });
  fireEvent.change(screen.getByLabelText(/description/i), { target: { value: "desc" } });
  fireEvent.click(screen.getByRole("button", { name: "Submit Onboarding" }));

  await waitFor(() => expect(screen.getByText(/onboarded successfully/i)).toBeTruthy());
  expect(api.onboardPartner).toHaveBeenCalledWith({ name: "New Gym", category: "Gym", description: "desc" });
});

test("onboard tab shows error message on API failure", async () => {
  vi.spyOn(api, "onboardPartner").mockRejectedValue(new Error("server error"));
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Onboard Partner" }));

  fireEvent.change(screen.getByLabelText(/partner name/i), { target: { value: "Bad Gym" } });
  fireEvent.change(screen.getByLabelText(/category/i), { target: { value: "Gym" } });
  fireEvent.change(screen.getByLabelText(/description/i), { target: { value: "desc" } });
  fireEvent.click(screen.getByRole("button", { name: "Submit Onboarding" }));

  await waitFor(() => expect(screen.getByText("server error")).toBeTruthy());
});

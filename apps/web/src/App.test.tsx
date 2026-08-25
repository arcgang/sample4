import { render, screen, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { App } from "./App";

vi.mock("./api.js", () => ({
  fetchDashboard: vi.fn(),
}));

import { fetchDashboard } from "./api.js";

const mockFetchDashboard = fetchDashboard as ReturnType<typeof vi.fn>;

const stubDashboard = {
  userId: "default",
  metrics: {
    weightKg: 75,
    bmi: 24.2,
    coachingSessions: 12,
    kmRun: 320,
    points: 5800,
  },
  level: 2 as const,
};

describe("App — gamification dashboard", () => {
  beforeEach(() => {
    mockFetchDashboard.mockReset();
  });

  it("shows a loading state while data is being fetched", () => {
    mockFetchDashboard.mockReturnValue(new Promise(() => {}));
    render(<App />);
    expect(screen.getByText("Loading dashboard…")).toBeTruthy();
  });

  it("renders the dashboard heading after data loads", async () => {
    mockFetchDashboard.mockResolvedValue(stubDashboard);
    render(<App />);
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Gamification Dashboard" })).toBeTruthy()
    );
  });

  it("renders the user level", async () => {
    mockFetchDashboard.mockResolvedValue(stubDashboard);
    render(<App />);
    await waitFor(() =>
      expect(screen.getByText("Level 2")).toBeTruthy()
    );
  });

  it("renders weight metric", async () => {
    mockFetchDashboard.mockResolvedValue(stubDashboard);
    render(<App />);
    await waitFor(() =>
      expect(screen.getByText("Weight: 75 kg")).toBeTruthy()
    );
  });

  it("renders BMI metric", async () => {
    mockFetchDashboard.mockResolvedValue(stubDashboard);
    render(<App />);
    await waitFor(() =>
      expect(screen.getByText("BMI: 24.2")).toBeTruthy()
    );
  });

  it("renders coaching sessions metric", async () => {
    mockFetchDashboard.mockResolvedValue(stubDashboard);
    render(<App />);
    await waitFor(() =>
      expect(screen.getByText("Coaching sessions: 12")).toBeTruthy()
    );
  });

  it("renders km run metric", async () => {
    mockFetchDashboard.mockResolvedValue(stubDashboard);
    render(<App />);
    await waitFor(() =>
      expect(screen.getByText("Distance run: 320 km")).toBeTruthy()
    );
  });

  it("shows an error message when the fetch fails", async () => {
    mockFetchDashboard.mockRejectedValue(new Error("network error"));
    render(<App />);
    await waitFor(() =>
      expect(screen.getByRole("alert")).toBeTruthy()
    );
    expect(screen.getByRole("alert").textContent).toBe("Error: network error");
  });

  it("renders level 3 label when level is 3", async () => {
    mockFetchDashboard.mockResolvedValue({
      ...stubDashboard,
      metrics: { ...stubDashboard.metrics, points: 10500 },
      level: 3 as const,
    });
    render(<App />);
    await waitFor(() =>
      expect(screen.getByText("Level 3")).toBeTruthy()
    );
  });
});

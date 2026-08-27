import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { MotivationPage } from "./MotivationPage";

const quotesResponse = {
  items: [
    { id: 1, text: "The only bad workout is the one that didn't happen.", author: "Unknown" },
    { id: 2, text: "Take care of your body.", author: "Jim Rohn" },
  ],
  total: 2,
};

const programsResponse = {
  items: [
    { id: 1, name: "Beginner Strength", description: "Build foundational strength." },
    { id: 2, name: "Cardio Blast", description: "Boost endurance." },
  ],
  total: 2,
};

function mockFetch(handlers: Record<string, unknown>) {
  return vi.fn().mockImplementation((url: string) => {
    const path = url.replace("http://localhost:3000", "");
    const body = handlers[path];
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(body),
      text: () => Promise.resolve(""),
    });
  });
}

describe("MotivationPage", () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = mockFetch({
      "/quotes": quotesResponse,
      "/programs": programsResponse,
    });
    vi.stubGlobal("fetch", fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the Inspirational Quotes heading", async () => {
    render(<MotivationPage />);
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Inspirational Quotes" })).toBeTruthy()
    );
  });

  it("renders the Sign Up for a Program heading", async () => {
    render(<MotivationPage />);
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Sign Up for a Program" })).toBeTruthy()
    );
  });

  it("shows loading text for quotes initially", async () => {
    // Delay fetch resolution so loading state is visible during the assertion
    const delayedFetch = vi.fn().mockImplementation(() => new Promise(() => undefined));
    vi.stubGlobal("fetch", delayedFetch);
    render(<MotivationPage />);
    expect(screen.getByText("Loading quotes…")).toBeTruthy();
  });

  it("displays fitness quotes after loading", async () => {
    render(<MotivationPage />);
    await waitFor(() =>
      expect(screen.getByText("The only bad workout is the one that didn't happen.")).toBeTruthy()
    );
    expect(screen.getByText("Take care of your body.")).toBeTruthy();
  });

  it("displays program names after loading", async () => {
    render(<MotivationPage />);
    await waitFor(() =>
      expect(screen.getByRole("option", { name: "Beginner Strength" })).toBeTruthy()
    );
    expect(screen.getByRole("option", { name: "Cardio Blast" })).toBeTruthy();
  });

  it("shows success message after a valid signup", async () => {
    const signupResult = { signup: { id: 1, programId: 1, userEmail: "user@example.com", createdAt: "2030-01-01T00:00:00.000Z" } };
    fetchSpy.mockImplementation((url: string, opts?: RequestInit) => {
      const path = (url as string).replace("http://localhost:3000", "");
      if (path === "/programs/signup" && opts?.method === "POST") {
        return Promise.resolve({
          ok: true,
          status: 201,
          json: () => Promise.resolve(signupResult),
          text: () => Promise.resolve(""),
        });
      }
      const body = { "/quotes": quotesResponse, "/programs": programsResponse }[path];
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(body),
        text: () => Promise.resolve(""),
      });
    });

    render(<MotivationPage />);

    // Wait for programs to load
    await waitFor(() =>
      expect(screen.getByRole("option", { name: "Beginner Strength" })).toBeTruthy()
    );

    // Select a program and enter email
    fireEvent.change(screen.getByLabelText("Choose a program"), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "user@example.com" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Sign Up" }));

    await waitFor(() =>
      expect(screen.getByText("Successfully signed up! Check your email for details.")).toBeTruthy()
    );
  });
});

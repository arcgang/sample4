import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, beforeEach, describe, it, expect } from "vitest";
import { LoginPage } from "./LoginPage";

const mockFetch = vi.fn();
globalThis.fetch = mockFetch as typeof globalThis.fetch;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("LoginPage", () => {
  it("renders the login instructions fetched from API", async () => {
    mockFetch.mockResolvedValueOnce({
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
    });

    render(<LoginPage />);

    expect(screen.getByText("Loading instructions…")).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByText("Sign in to Fitness App")).toBeTruthy();
      expect(
        screen.getByText("Click the 'Sign in with Google' button below."),
      ).toBeTruthy();
      expect(
        screen.getByText("Select your Google account and authorize access."),
      ).toBeTruthy();
      expect(
        screen.getByText("You will be redirected automatically to your fitness dashboard."),
      ).toBeTruthy();
    });
  });

  it("handles instructions load error gracefully", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      text: async () => "Failed to load instructions",
    });

    render(<LoginPage />);

    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toBe("Failed to load instructions");
    });
  });

  it("allows user to sign in with Google and shows authenticated state", async () => {
    mockFetch
      // GET /auth/instructions
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          title: "Sign in to Fitness App",
          steps: ["Click the 'Sign in with Google' button below."],
          supportedProviders: ["google"],
        }),
      })
      // POST /auth/google
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: {
            id: "google-user-123",
            email: "athlete@fitness.com",
            name: "Athlete Alex",
            provider: "google",
          },
          token: "fit_tok_xyz",
          expiresIn: 86400,
        }),
      });

    const onLoginSuccess = vi.fn();
    render(<LoginPage onLoginSuccess={onLoginSuccess} />);

    const emailInput = screen.getByLabelText("Google Email (optional custom test email)");
    fireEvent.change(emailInput, { target: { value: "athlete@fitness.com" } });

    const nameInput = screen.getByLabelText("Display Name (optional)");
    fireEvent.change(nameInput, { target: { value: "Athlete Alex" } });

    const button = screen.getByTestId("google-signin-btn");
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Welcome back,/)).toBeTruthy();
      expect(screen.getByText("Athlete Alex")).toBeTruthy();
      expect(screen.getByText("Signed in successfully via Google.")).toBeTruthy();
    });

    expect(onLoginSuccess).toHaveBeenCalledTimes(1);
    expect(onLoginSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.objectContaining({
          email: "athlete@fitness.com",
          name: "Athlete Alex",
        }),
      }),
    );

    // Logout
    const logoutBtn = screen.getByRole("button", { name: "Sign Out" });
    fireEvent.click(logoutBtn);

    expect(screen.getByTestId("google-signin-btn")).toBeTruthy();
  });

  it("displays an error alert when Google sign-in fails", async () => {
    mockFetch
      // GET /auth/instructions
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          title: "Sign in to Fitness App",
          steps: ["Click the 'Sign in with Google' button below."],
          supportedProviders: ["google"],
        }),
      })
      // POST /auth/google failure
      .mockResolvedValueOnce({
        ok: false,
        text: async () => "Google authentication service unavailable",
      });

    render(<LoginPage />);

    const button = screen.getByTestId("google-signin-btn");
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toBe(
        "Google authentication service unavailable",
      );
    });
  });
});

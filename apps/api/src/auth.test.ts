import { describe, it, expect } from "vitest";
import {
  getLoginInstructions,
  validateGoogleAuthInput,
  authenticateWithGoogle,
} from "./auth.js";

describe("getLoginInstructions", () => {
  it("returns login instructions with title, steps, and supported providers", () => {
    const instructions = getLoginInstructions();
    expect(instructions.title).toBe("Sign in to Fitness App");
    expect(instructions.steps.length).toBe(3);
    expect(instructions.steps[0]).toBe("Click the 'Sign in with Google' button below.");
    expect(instructions.steps[1]).toBe("Select your Google account and authorize access.");
    expect(instructions.steps[2]).toBe("You will be redirected automatically to your fitness dashboard.");
    expect(instructions.supportedProviders).toEqual(["google"]);
  });
});

describe("validateGoogleAuthInput", () => {
  it("accepts valid input with idToken", () => {
    const result = validateGoogleAuthInput({
      idToken: "google_id_token_12345",
      email: "jane.doe@example.com",
      name: "Jane Doe",
      picture: "https://example.com/photo.jpg",
    });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.idToken).toBe("google_id_token_12345");
      expect(result.data.email).toBe("jane.doe@example.com");
      expect(result.data.name).toBe("Jane Doe");
      expect(result.data.picture).toBe("https://example.com/photo.jpg");
    }
  });

  it("accepts valid input with code only", () => {
    const result = validateGoogleAuthInput({
      code: "oauth_code_xyz",
    });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.code).toBe("oauth_code_xyz");
    }
  });

  it("accepts valid input with email only", () => {
    const result = validateGoogleAuthInput({
      email: "athlete@fitness.com",
    });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.email).toBe("athlete@fitness.com");
    }
  });

  it("rejects non-object body", () => {
    const result = validateGoogleAuthInput(null);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors[0].field).toBe("body");
      expect(result.errors[0].message).toBe("Request body must be an object");
    }
  });

  it("rejects body with no credentials provided", () => {
    const result = validateGoogleAuthInput({});
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors[0].field).toBe("credential");
      expect(result.errors[0].message).toBe(
        "At least one credential field (idToken, code, or email) is required for Google sign-in",
      );
    }
  });

  it("rejects invalid types for email and name", () => {
    const result = validateGoogleAuthInput({
      idToken: "token_123",
      email: 12345,
      name: true,
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.field === "email")).toBe(true);
      expect(result.errors.some((e) => e.field === "name")).toBe(true);
    }
  });
});

describe("authenticateWithGoogle", () => {
  it("generates an auth session and user object for a given email and name", () => {
    const session = authenticateWithGoogle({
      idToken: "token_abc",
      email: "runner@test.com",
      name: "Runner Test",
      picture: "https://example.com/pic.png",
    });
    expect(session.user.email).toBe("runner@test.com");
    expect(session.user.name).toBe("Runner Test");
    expect(session.user.picture).toBe("https://example.com/pic.png");
    expect(session.user.provider).toBe("google");
    expect(session.user.id).toBe("google-user-72756e6e");
    expect(session.token).toMatch(/^fit_tok_/);
    expect(session.expiresIn).toBe(86400);
  });

  it("defaults email and name when not provided", () => {
    const session = authenticateWithGoogle({
      code: "some_oauth_code",
    });
    expect(session.user.email).toBe("user@gmail.com");
    expect(session.user.name).toBe("user");
    expect(session.user.provider).toBe("google");
  });
});

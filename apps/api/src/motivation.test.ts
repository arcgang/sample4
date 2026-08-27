import { describe, it, expect } from "vitest";
import { listQuotes, listPrograms, signupForProgram } from "./motivation.js";

describe("listQuotes", () => {
  it("returns all 5 fitness quotes", () => {
    const result = listQuotes();
    expect(result.total).toBe(5);
    expect(result.items.length).toBe(5);
  });

  it("each quote has id, text, and author", () => {
    const { items } = listQuotes();
    const first = items[0];
    expect(first.id).toBe(1);
    expect(first.text).toBe("The only bad workout is the one that didn't happen.");
    expect(first.author).toBe("Unknown");
  });
});

describe("listPrograms", () => {
  it("returns all 3 programs", () => {
    const result = listPrograms();
    expect(result.total).toBe(3);
    expect(result.items.length).toBe(3);
  });

  it("first program is Beginner Strength", () => {
    const { items } = listPrograms();
    expect(items[0].id).toBe(1);
    expect(items[0].name).toBe("Beginner Strength");
  });
});

describe("signupForProgram", () => {
  it("returns a signup record for a valid program and email", () => {
    const result = signupForProgram(1, "athlete@example.com");
    expect("signup" in result).toBe(true);
    if ("signup" in result) {
      expect(result.signup.programId).toBe(1);
      expect(result.signup.userEmail).toBe("athlete@example.com");
      expect(typeof result.signup.id).toBe("number");
      expect(typeof result.signup.createdAt).toBe("string");
    }
  });

  it("returns a 404 error for an unknown program id", () => {
    const result = signupForProgram(999, "user@example.com");
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.status).toBe(404);
      expect(result.error).toBe("Program with id 999 not found");
    }
  });

  it("returns a 400 error when email is missing the @ sign", () => {
    const result = signupForProgram(2, "notanemail");
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.status).toBe(400);
      expect(result.error).toBe("A valid email address is required");
    }
  });

  it("returns a 400 error when email is empty", () => {
    const result = signupForProgram(2, "");
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.status).toBe(400);
    }
  });
});

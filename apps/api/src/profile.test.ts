import { describe, it, expect, beforeEach } from "vitest";
import { createProfile } from "./profile.js";

describe("createProfile", () => {
  beforeEach(() => {
    // Reset module-level ID counter between tests by re-importing wouldn't help directly,
    // but since we only assert shape/fields not exact id values, this is fine.
  });

  it("returns a profile with all fields when given valid input", () => {
    const result = createProfile({
      name: "Alice",
      age: 30,
      habits: ["running", "meditation"],
      goals: ["lose 5kg", "run a marathon"],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.profile.name).toBe("Alice");
    expect(result.profile.age).toBe(30);
    expect(result.profile.habits).toEqual(["running", "meditation"]);
    expect(result.profile.goals).toEqual(["lose 5kg", "run a marathon"]);
    expect(typeof result.profile.id).toBe("string");
    expect(typeof result.profile.createdAt).toBe("string");
  });

  it("trims leading/trailing whitespace from name", () => {
    const result = createProfile({
      name: "  Bob  ",
      age: 25,
      habits: [],
      goals: [],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.profile.name).toBe("Bob");
  });

  it("returns error when name is empty string", () => {
    const result = createProfile({ name: "", age: 25, habits: [], goals: [] });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.errors).toContain("name is required");
  });

  it("returns error when name is missing", () => {
    const result = createProfile({ age: 25, habits: [], goals: [] });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.errors).toContain("name is required");
  });

  it("returns error when age is not a number", () => {
    const result = createProfile({ name: "Carol", age: "thirty", habits: [], goals: [] });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.errors).toContain("age must be a non-negative integer up to 150");
  });

  it("returns error when age is negative", () => {
    const result = createProfile({ name: "Carol", age: -1, habits: [], goals: [] });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.errors).toContain("age must be a non-negative integer up to 150");
  });

  it("returns error when habits is not an array", () => {
    const result = createProfile({ name: "Dave", age: 40, habits: "running", goals: [] });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.errors).toContain("habits must be an array of strings");
  });

  it("returns error when goals is not an array", () => {
    const result = createProfile({ name: "Dave", age: 40, habits: [], goals: "run more" });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.errors).toContain("goals must be an array of strings");
  });

  it("returns error when input is not an object", () => {
    const result = createProfile(null);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.errors).toEqual(["Request body must be an object"]);
  });

  it("collects multiple validation errors at once", () => {
    const result = createProfile({ name: "", age: -5, habits: "bad", goals: 123 });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.errors.length).toBe(4);
  });

  it("accepts empty arrays for habits and goals", () => {
    const result = createProfile({ name: "Eve", age: 20, habits: [], goals: [] });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.profile.habits).toEqual([]);
    expect(result.profile.goals).toEqual([]);
  });
});

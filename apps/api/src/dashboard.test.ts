import { describe, it, expect } from "vitest";
import { computeLevel, getDashboard } from "./dashboard.js";

describe("computeLevel", () => {
  it("returns level 1 for points below 1000", () => {
    expect(computeLevel(0)).toBe(1);
  });

  it("returns level 1 for exactly 999 points", () => {
    expect(computeLevel(999)).toBe(1);
  });

  it("returns level 1 for exactly 1000 points", () => {
    expect(computeLevel(1000)).toBe(1);
  });

  it("returns level 2 for exactly 5000 points", () => {
    expect(computeLevel(5000)).toBe(2);
  });

  it("returns level 2 for 7500 points", () => {
    expect(computeLevel(7500)).toBe(2);
  });

  it("returns level 3 for exactly 10000 points", () => {
    expect(computeLevel(10000)).toBe(3);
  });

  it("returns level 3 for points above 10000", () => {
    expect(computeLevel(15000)).toBe(3);
  });
});

describe("getDashboard", () => {
  it("returns metrics with the correct shape for a known user", () => {
    const data = getDashboard("default");
    expect(data.userId).toBe("default");
    expect(typeof data.metrics.weightKg).toBe("number");
    expect(typeof data.metrics.bmi).toBe("number");
    expect(typeof data.metrics.coachingSessions).toBe("number");
    expect(typeof data.metrics.kmRun).toBe("number");
    expect(typeof data.metrics.points).toBe("number");
  });

  it("returns seeded weight of 75 kg for the default user", () => {
    const data = getDashboard("default");
    expect(data.metrics.weightKg).toBe(75);
  });

  it("returns seeded coaching sessions of 12 for the default user", () => {
    const data = getDashboard("default");
    expect(data.metrics.coachingSessions).toBe(12);
  });

  it("returns level 2 for the default user with 5800 points", () => {
    const data = getDashboard("default");
    expect(data.level).toBe(2);
  });

  it("falls back to default seed for an unknown userId", () => {
    const data = getDashboard("unknown-user");
    expect(data.metrics.weightKg).toBe(75);
    expect(data.level).toBe(2);
  });
});

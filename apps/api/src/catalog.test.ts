import { describe, it, expect } from "vitest";
import {
  getCatalogItems,
  getTrainerServices,
} from "./catalog.js";

describe("getCatalogItems", () => {
  it("returns all items when no category filter is applied", () => {
    const result = getCatalogItems({ page: 1, page_size: 20 });
    expect(result.total).toBe(8);
    expect(result.items.length).toBe(8);
    expect(result.page).toBe(1);
    expect(result.page_size).toBe(20);
  });

  it("filters by category 'accessory' and returns only accessories", () => {
    const result = getCatalogItems({ category: "accessory", page: 1, page_size: 20 });
    expect(result.items.every((i) => i.category === "accessory")).toBe(true);
    expect(result.total).toBe(4);
  });

  it("filters by category 'equipment' and returns only equipment", () => {
    const result = getCatalogItems({ category: "equipment", page: 1, page_size: 20 });
    expect(result.items.every((i) => i.category === "equipment")).toBe(true);
    expect(result.total).toBe(4);
  });

  it("paginates correctly — page 1 of size 3 returns 3 items out of 8 total", () => {
    const result = getCatalogItems({ page: 1, page_size: 3 });
    expect(result.items.length).toBe(3);
    expect(result.total).toBe(8);
    expect(result.page).toBe(1);
    expect(result.page_size).toBe(3);
  });

  it("paginates correctly — page 3 of size 3 returns the remaining 2 items", () => {
    const result = getCatalogItems({ page: 3, page_size: 3 });
    expect(result.items.length).toBe(2);
    expect(result.total).toBe(8);
  });

  it("each item has id, name, category, description and price", () => {
    const result = getCatalogItems({ page: 1, page_size: 1 });
    const item = result.items[0];
    expect(typeof item.id).toBe("string");
    expect(typeof item.name).toBe("string");
    expect(typeof item.description).toBe("string");
    expect(typeof item.price).toBe("number");
    expect(["accessory", "equipment"]).toContain(item.category);
  });
});

describe("getTrainerServices", () => {
  it("returns all trainers when no filters are applied", () => {
    const result = getTrainerServices({ page: 1, page_size: 20 });
    expect(result.total).toBe(8);
    expect(result.items.length).toBe(8);
    expect(result.page).toBe(1);
    expect(result.page_size).toBe(20);
  });

  it("filters by level 'elite' and returns only elite trainers", () => {
    const result = getTrainerServices({ level: "elite", page: 1, page_size: 20 });
    expect(result.items.every((s) => s.level === "elite")).toBe(true);
    expect(result.total).toBe(2);
  });

  it("filters by specialty 'cardio' and returns only cardio trainers", () => {
    const result = getTrainerServices({ specialty: "cardio", page: 1, page_size: 20 });
    expect(result.items.every((s) => s.specialty === "cardio")).toBe(true);
    expect(result.total).toBe(2);
  });

  it("combines level and specialty filters", () => {
    const result = getTrainerServices({
      level: "advanced",
      specialty: "crossfit",
      page: 1,
      page_size: 20,
    });
    expect(result.total).toBe(1);
    expect(result.items[0].name).toBe("Sam Rivera");
  });

  it("paginates correctly — page 1 of size 3 returns 3 out of 8 total", () => {
    const result = getTrainerServices({ page: 1, page_size: 3 });
    expect(result.items.length).toBe(3);
    expect(result.total).toBe(8);
  });

  it("each trainer has id, name, level, specialty, description and hourlyRate", () => {
    const result = getTrainerServices({ page: 1, page_size: 1 });
    const svc = result.items[0];
    expect(typeof svc.id).toBe("string");
    expect(typeof svc.name).toBe("string");
    expect(typeof svc.description).toBe("string");
    expect(typeof svc.hourlyRate).toBe("number");
    expect(["beginner", "intermediate", "advanced", "elite"]).toContain(svc.level);
    expect(["strength", "cardio", "yoga", "pilates", "crossfit", "rehabilitation", "nutrition"]).toContain(
      svc.specialty
    );
  });
});

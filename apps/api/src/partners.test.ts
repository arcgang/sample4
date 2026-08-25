import { describe, it, expect, beforeEach } from "vitest";
import { listPartners, onboardPartner, getAccessoryCatalog, getServiceCatalog } from "./partners.js";

describe("listPartners", () => {
  it("returns a paginated list with seeded partners", () => {
    const result = listPartners(1, 20);
    expect(result.items.length).toBe(2);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.page_size).toBe(20);
  });

  it("returns partners with accessory and service catalogs", () => {
    const result = listPartners(1, 20);
    const partner = result.items[0];
    expect(partner.accessoryCatalog.length).toBeGreaterThan(0);
    expect(partner.serviceCatalog.length).toBeGreaterThan(0);
  });
});

describe("onboardPartner", () => {
  it("creates a new partner with valid input", () => {
    const before = listPartners(1, 20).total;
    const result = onboardPartner({ name: "Test Gym", category: "Gym", description: "A test gym" });
    expect("id" in result).toBe(true);
    if ("id" in result) {
      expect(result.name).toBe("Test Gym");
      expect(result.category).toBe("Gym");
      expect(result.description).toBe("A test gym");
      expect(typeof result.onboardedAt).toBe("string");
      expect(result.accessoryCatalog.length).toBeGreaterThan(0);
      expect(result.serviceCatalog.length).toBeGreaterThan(0);
    }
    expect(listPartners(1, 20).total).toBe(before + 1);
  });

  it("returns 400 when name is missing", () => {
    const result = onboardPartner({ name: "", category: "Gym", description: "desc" });
    expect("detail" in result).toBe(true);
    if ("detail" in result) {
      expect(result.status_code).toBe(400);
      expect(result.detail).toBe("name is required");
    }
  });

  it("returns 400 when category is missing", () => {
    const result = onboardPartner({ name: "Gym", category: "", description: "desc" });
    expect("detail" in result).toBe(true);
    if ("detail" in result) {
      expect(result.status_code).toBe(400);
      expect(result.detail).toBe("category is required");
    }
  });

  it("returns 400 when description is missing", () => {
    const result = onboardPartner({ name: "Gym", category: "Gym", description: "" });
    expect("detail" in result).toBe(true);
    if ("detail" in result) {
      expect(result.status_code).toBe(400);
      expect(result.detail).toBe("description is required");
    }
  });
});

describe("getAccessoryCatalog", () => {
  it("returns a non-empty paginated accessory list", () => {
    const result = getAccessoryCatalog(1, 20);
    expect(result.items.length).toBe(5);
    expect(result.total).toBe(5);
    expect(result.page).toBe(1);
    expect(result.page_size).toBe(20);
    expect(result.items[0].name).toBe("Resistance Bands Set");
    expect(result.items[0].price).toBe(29.99);
  });
});

describe("getServiceCatalog", () => {
  it("returns a non-empty paginated service list", () => {
    const result = getServiceCatalog(1, 20);
    expect(result.items.length).toBe(5);
    expect(result.total).toBe(5);
    expect(result.page).toBe(1);
    expect(result.page_size).toBe(20);
    expect(result.items[0].name).toBe("Personal Training Session");
    expect(result.items[0].durationMinutes).toBe(60);
  });
});

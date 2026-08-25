import { describe, it, expect, beforeEach } from "vitest";
import {
  FoodStore,
  ValidationError,
  FOOD_CATEGORIES,
} from "./food.js";

describe("FoodStore", () => {
  let store: FoodStore;

  beforeEach(() => {
    store = new FoodStore();
  });

  describe("getCategories", () => {
    it("returns all 7 food categories", () => {
      expect(store.getCategories()).toEqual(FOOD_CATEGORIES);
      expect(store.getCategories().length).toBe(7);
    });
  });

  describe("addOne", () => {
    it("adds a valid item and returns it with id 1", () => {
      const item = store.addOne({
        name: "Chicken Breast",
        category: "Proteins",
        priceCents: 1299,
      });
      expect(item.id).toBe(1);
      expect(item.name).toBe("Chicken Breast");
      expect(item.category).toBe("Proteins");
      expect(item.priceCents).toBe(1299);
    });

    it("assigns sequential ids across two items", () => {
      store.addOne({ name: "Apple", category: "Fruits", priceCents: 99 });
      const second = store.addOne({
        name: "Banana",
        category: "Fruits",
        priceCents: 49,
      });
      expect(second.id).toBe(2);
    });

    it("stores optional description when provided", () => {
      const item = store.addOne({
        name: "Whey Protein",
        category: "Snacks & Supplements",
        priceCents: 4999,
        description: "30g protein per serving",
      });
      expect(item.description).toBe("30g protein per serving");
    });

    it("throws ValidationError for empty name", () => {
      expect(() =>
        store.addOne({ name: "", category: "Fruits", priceCents: 100 }),
      ).toThrowError(ValidationError);
    });

    it("throws ValidationError for invalid category 'Candy'", () => {
      expect(() =>
        store.addOne({ name: "Gummy", category: "Candy", priceCents: 100 }),
      ).toThrowError(ValidationError);
    });

    it("throws ValidationError for negative priceCents -1", () => {
      expect(() =>
        store.addOne({ name: "Item", category: "Fruits", priceCents: -1 }),
      ).toThrowError(ValidationError);
    });

    it("throws ValidationError for fractional priceCents 9.99", () => {
      expect(() =>
        store.addOne({ name: "Item", category: "Fruits", priceCents: 9.99 }),
      ).toThrowError(ValidationError);
    });

    it("throws ValidationError for non-object input", () => {
      expect(() => store.addOne("not an object")).toThrowError(ValidationError);
    });
  });

  describe("addBulk", () => {
    it("adds two items and returns both with sequential ids starting from 1", () => {
      const items = store.addBulk([
        { name: "Oats", category: "Grains & Cereals", priceCents: 399 },
        { name: "Brown Rice", category: "Grains & Cereals", priceCents: 299 },
      ]);
      expect(items.length).toBe(2);
      expect(items[0].id).toBe(1);
      expect(items[0].name).toBe("Oats");
      expect(items[1].id).toBe(2);
      expect(items[1].name).toBe("Brown Rice");
    });

    it("throws ValidationError for non-array input", () => {
      expect(() => store.addBulk({ name: "X" })).toThrowError(ValidationError);
    });

    it("throws ValidationError for empty array", () => {
      expect(() => store.addBulk([])).toThrowError(ValidationError);
    });

    it("throws ValidationError with item index when third item has invalid category", () => {
      expect(() =>
        store.addBulk([
          { name: "Oats", category: "Grains & Cereals", priceCents: 399 },
          { name: "Apple", category: "Fruits", priceCents: 99 },
          { name: "Bad", category: "Junk", priceCents: 100 },
        ]),
      ).toThrowError(/item\[2\]/);
    });

    it("persists no items when bulk validation fails (all-or-nothing)", () => {
      try {
        store.addBulk([
          { name: "Good", category: "Fruits", priceCents: 100 },
          { name: "Bad", category: "Junk", priceCents: 100 },
        ]);
      } catch (_) {
        // expected
      }
      expect(store.list(1, 100).total).toBe(0);
    });
  });

  describe("list", () => {
    it("returns an empty list when no items exist", () => {
      const result = store.list(1, 20);
      expect(result.items.length).toBe(0);
      expect(result.total).toBe(0);
      expect(result.page).toBe(1);
      expect(result.page_size).toBe(20);
    });

    it("returns first page of 2 items when 3 items exist and page_size is 2", () => {
      store.addBulk([
        { name: "A", category: "Fruits", priceCents: 100 },
        { name: "B", category: "Fruits", priceCents: 200 },
        { name: "C", category: "Fruits", priceCents: 300 },
      ]);
      const result = store.list(1, 2);
      expect(result.items.length).toBe(2);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.page_size).toBe(2);
      expect(result.items[0].name).toBe("A");
    });

    it("returns second page with 1 item when 3 items exist and page_size is 2", () => {
      store.addBulk([
        { name: "A", category: "Fruits", priceCents: 100 },
        { name: "B", category: "Fruits", priceCents: 200 },
        { name: "C", category: "Fruits", priceCents: 300 },
      ]);
      const result = store.list(2, 2);
      expect(result.items.length).toBe(1);
      expect(result.items[0].name).toBe("C");
    });
  });

  describe("instance isolation", () => {
    it("ids restart from 1 on a new FoodStore instance", () => {
      const store1 = new FoodStore();
      store1.addOne({ name: "A", category: "Fruits", priceCents: 100 });
      store1.addOne({ name: "B", category: "Fruits", priceCents: 100 });

      const store2 = new FoodStore();
      const item = store2.addOne({
        name: "C",
        category: "Fruits",
        priceCents: 100,
      });
      expect(item.id).toBe(1);
    });
  });
});

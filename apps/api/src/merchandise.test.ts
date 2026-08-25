import { describe, it, expect } from "vitest";
import { listMerchandise, placeOrder } from "./merchandise.js";

describe("listMerchandise", () => {
  it("returns a non-empty catalog of merchandise items", () => {
    const items = listMerchandise();
    expect(items.length).toBeGreaterThan(0);
  });

  it("every item has id, name, priceUsd, and stock fields", () => {
    const items = listMerchandise();
    for (const item of items) {
      expect(typeof item.id).toBe("string");
      expect(typeof item.name).toBe("string");
      expect(typeof item.priceUsd).toBe("number");
      expect(typeof item.stock).toBe("number");
    }
  });

  it("includes at least one apparel item", () => {
    const items = listMerchandise();
    const apparel = items.filter((i) => i.category === "apparel");
    expect(apparel.length).toBeGreaterThan(0);
  });
});

describe("placeOrder", () => {
  it("returns an order with status pending_fulfillment for a valid request", () => {
    const result = placeOrder({
      itemId: "merch-3",
      quantity: 1,
      customerName: "Jane Doe",
      shippingAddress: "123 Fitness St",
    });
    expect("error" in result).toBe(false);
    if (!("error" in result)) {
      expect(result.status).toBe("pending_fulfillment");
      expect(result.itemId).toBe("merch-3");
      expect(result.quantity).toBe(1);
      expect(result.customerName).toBe("Jane Doe");
    }
  });

  it("computes totalUsd as priceUsd * quantity", () => {
    const result = placeOrder({
      itemId: "merch-1",
      quantity: 2,
      customerName: "Bob Smith",
      shippingAddress: "456 Gym Ave",
    });
    expect("error" in result).toBe(false);
    if (!("error" in result)) {
      expect(result.totalUsd).toBe(59.98);
    }
  });

  it("returns an error for an unknown itemId", () => {
    const result = placeOrder({
      itemId: "merch-999",
      quantity: 1,
      customerName: "Alice",
      shippingAddress: "789 Run Rd",
    });
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toBe("item not found: merch-999");
    }
  });

  it("returns an error when quantity is 0", () => {
    const result = placeOrder({
      itemId: "merch-1",
      quantity: 0,
      customerName: "Carol",
      shippingAddress: "321 Lift Ln",
    });
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toBe("quantity must be a positive integer");
    }
  });

  it("returns an error when customerName is missing", () => {
    const result = placeOrder({
      itemId: "merch-1",
      quantity: 1,
      customerName: "",
      shippingAddress: "555 Cardio Ct",
    });
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toBe(
        "itemId, customerName, and shippingAddress are required",
      );
    }
  });
});

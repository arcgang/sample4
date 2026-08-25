import { afterEach, describe, expect, it } from "vitest";
import { addInventoryItem, listInventory, resetInventory } from "./inventory.js";

afterEach(() => {
  resetInventory();
});

describe("inventory", () => {
  it("lists the seeded inventory items", () => {
    expect(listInventory()).toEqual([
      { id: 1, name: "Treadmill", quantity: 4 },
      { id: 2, name: "Yoga Mat", quantity: 25 },
      { id: 3, name: "Kettlebell", quantity: 18 },
    ]);
  });

  it("adds inventory item Spin Bike with quantity 6", () => {
    const item = addInventoryItem({ name: "Spin Bike", quantity: 6 });

    expect(item).toEqual({ id: 4, name: "Spin Bike", quantity: 6 });
    expect(listInventory()).toEqual([
      { id: 1, name: "Treadmill", quantity: 4 },
      { id: 2, name: "Yoga Mat", quantity: 25 },
      { id: 3, name: "Kettlebell", quantity: 18 },
      { id: 4, name: "Spin Bike", quantity: 6 },
    ]);
  });
});

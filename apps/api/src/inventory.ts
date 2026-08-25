export interface InventoryItem {
  id: number;
  name: string;
  quantity: number;
}

export interface NewInventoryItem {
  name: string;
  quantity: number;
}

const seedInventory = [
  { id: 1, name: "Treadmill", quantity: 4 },
  { id: 2, name: "Yoga Mat", quantity: 25 },
  { id: 3, name: "Kettlebell", quantity: 18 },
] satisfies InventoryItem[];

let inventory: InventoryItem[] = seedInventory.map((item) => ({ ...item }));
let nextInventoryId = 4;

export function listInventory(): InventoryItem[] {
  return inventory.map((item) => ({ ...item }));
}

export function addInventoryItem(input: NewInventoryItem): InventoryItem {
  const item: InventoryItem = {
    id: nextInventoryId,
    name: input.name,
    quantity: input.quantity,
  };

  inventory.push(item);
  nextInventoryId += 1;

  return { ...item };
}

export function resetInventory(): void {
  inventory = seedInventory.map((item) => ({ ...item }));
  nextInventoryId = 4;
}

export interface InventoryItem {
  id: number;
  name: string;
  quantity: number;
}

export interface InventoryResponse {
  items: InventoryItem[];
}

export interface CreateInventoryItemInput {
  name: string;
  quantity: number;
}

const baseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export async function getInventory(): Promise<InventoryItem[]> {
  const response = await fetch(`${baseUrl}/inventory`);

  if (!response.ok) {
    throw new Error("Failed to load inventory.");
  }

  const data: InventoryResponse | InventoryItem[] = await response.json();
  return Array.isArray(data) ? data : data.items;
}

export async function createInventoryItem(
  input: CreateInventoryItemInput,
): Promise<InventoryItem> {
  const response = await fetch(`${baseUrl}/inventory`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("Failed to add inventory item.");
  }

  return response.json() as Promise<InventoryItem>;
}

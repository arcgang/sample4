export interface MerchandiseItem {
  id: string;
  name: string;
  description: string;
  priceUsd: number;
  category: string;
  stock: number;
}

export interface OrderRequest {
  itemId: string;
  quantity: number;
  customerName: string;
  shippingAddress: string;
}

export interface Order {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  totalUsd: number;
  customerName: string;
  shippingAddress: string;
  status: "pending_fulfillment";
  createdAt: string;
}

export interface OrderError {
  error: string;
}

// Platform-curated merchandise catalog
const catalog: MerchandiseItem[] = [
  {
    id: "merch-1",
    name: "FitHub Training T-Shirt",
    description: "Lightweight moisture-wicking training tee",
    priceUsd: 29.99,
    category: "apparel",
    stock: 100,
  },
  {
    id: "merch-2",
    name: "FitHub Compression Shorts",
    description: "Performance compression shorts for high-intensity workouts",
    priceUsd: 39.99,
    category: "apparel",
    stock: 75,
  },
  {
    id: "merch-3",
    name: "FitHub Water Bottle",
    description: "Insulated stainless steel 32oz bottle",
    priceUsd: 19.99,
    category: "accessories",
    stock: 200,
  },
  {
    id: "merch-4",
    name: "FitHub Resistance Bands Set",
    description: "Set of 5 resistance bands for strength training",
    priceUsd: 24.99,
    category: "equipment",
    stock: 60,
  },
  {
    id: "merch-5",
    name: "FitHub Gym Bag",
    description: "Spacious durable gym duffel bag",
    priceUsd: 49.99,
    category: "accessories",
    stock: 40,
  },
];

// In-memory order store (delegates fulfillment externally)
const orders: Order[] = [];
let orderSeq = 1;

export function listMerchandise(): MerchandiseItem[] {
  return catalog;
}

export function placeOrder(req: OrderRequest): Order | OrderError {
  if (!req.itemId || !req.customerName || !req.shippingAddress) {
    return { error: "itemId, customerName, and shippingAddress are required" };
  }
  if (!Number.isInteger(req.quantity) || req.quantity < 1) {
    return { error: "quantity must be a positive integer" };
  }

  const item = catalog.find((m) => m.id === req.itemId);
  if (!item) {
    return { error: `item not found: ${req.itemId}` };
  }
  if (item.stock < req.quantity) {
    return { error: `insufficient stock; available: ${item.stock}` };
  }

  item.stock -= req.quantity;

  const order: Order = {
    id: `order-${orderSeq++}`,
    itemId: item.id,
    itemName: item.name,
    quantity: req.quantity,
    totalUsd: Math.round(item.priceUsd * req.quantity * 100) / 100,
    customerName: req.customerName,
    shippingAddress: req.shippingAddress,
    // Fulfillment is handed off to the existing fitness store pipeline
    status: "pending_fulfillment",
    createdAt: new Date().toISOString(),
  };

  orders.push(order);
  return order;
}

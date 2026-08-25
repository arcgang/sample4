export type FoodCategory =
  | "Proteins"
  | "Grains & Cereals"
  | "Fruits"
  | "Vegetables"
  | "Dairy"
  | "Snacks & Supplements"
  | "Beverages";

export interface FoodItem {
  id: number;
  name: string;
  category: FoodCategory;
  /** Price in whole cents to avoid floating-point money issues */
  priceCents: number;
  description?: string;
}

export interface FoodItemInput {
  name: string;
  category: FoodCategory;
  priceCents: number;
  description?: string;
}

export interface ListFoodResult {
  items: FoodItem[];
  total: number;
  page: number;
  page_size: number;
}

export const FOOD_CATEGORIES: FoodCategory[] = [
  "Proteins",
  "Grains & Cereals",
  "Fruits",
  "Vegetables",
  "Dairy",
  "Snacks & Supplements",
  "Beverages",
];

function isValidCategory(value: unknown): value is FoodCategory {
  return FOOD_CATEGORIES.includes(value as FoodCategory);
}

function validateItem(raw: unknown): FoodItemInput {
  if (raw === null || typeof raw !== "object") {
    throw new ValidationError("item must be an object");
  }
  const obj = raw as Record<string, unknown>;

  const name = obj["name"];
  if (typeof name !== "string" || name.trim() === "") {
    throw new ValidationError("name must be a non-empty string");
  }

  const category = obj["category"];
  if (!isValidCategory(category)) {
    throw new ValidationError(
      `category must be one of: ${FOOD_CATEGORIES.join(", ")}`,
    );
  }

  const priceCents = obj["priceCents"];
  if (
    typeof priceCents !== "number" ||
    !Number.isInteger(priceCents) ||
    priceCents < 0
  ) {
    throw new ValidationError("priceCents must be a non-negative integer");
  }

  const description = obj["description"];
  if (description !== undefined && typeof description !== "string") {
    throw new ValidationError("description must be a string when provided");
  }

  return {
    name: name.trim(),
    category,
    priceCents,
    description: typeof description === "string" ? description : undefined,
  };
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class FoodStore {
  private items: FoodItem[] = [];
  private nextId = 1;

  addOne(raw: unknown): FoodItem {
    const input = validateItem(raw);
    const item: FoodItem = { id: this.nextId++, ...input };
    this.items.push(item);
    return item;
  }

  addBulk(rawItems: unknown): FoodItem[] {
    if (!Array.isArray(rawItems)) {
      throw new ValidationError("bulk upload requires an array of items");
    }
    if (rawItems.length === 0) {
      throw new ValidationError("bulk upload requires at least one item");
    }
    // Validate all before persisting any (all-or-nothing)
    const validated = rawItems.map((r, i) => {
      try {
        return validateItem(r);
      } catch (e) {
        if (e instanceof ValidationError) {
          throw new ValidationError(`item[${i}]: ${e.message}`);
        }
        throw e;
      }
    });
    return validated.map((input) => {
      const item: FoodItem = { id: this.nextId++, ...input };
      this.items.push(item);
      return item;
    });
  }

  list(page: number, pageSize: number): ListFoodResult {
    const offset = (page - 1) * pageSize;
    return {
      items: this.items.slice(offset, offset + pageSize),
      total: this.items.length,
      page,
      page_size: pageSize,
    };
  }

  getCategories(): FoodCategory[] {
    return [...FOOD_CATEGORIES];
  }
}

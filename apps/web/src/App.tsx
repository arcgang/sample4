import { useState, useEffect } from "react";

const API =
  (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL ??
  "http://localhost:3000";

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
  priceCents: number;
  description?: string;
}

type View = "catalog" | "upload";

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function groupByCategory(items: FoodItem[]): Map<FoodCategory, FoodItem[]> {
  const map = new Map<FoodCategory, FoodItem[]>();
  for (const item of items) {
    const existing = map.get(item.category);
    if (existing) {
      existing.push(item);
    } else {
      map.set(item.category, [item]);
    }
  }
  return map;
}

export function App() {
  const [view, setView] = useState<View>("catalog");
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [items, setItems] = useState<FoodItem[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | "">("");

  // Single-item form state
  const [singleName, setSingleName] = useState("");
  const [singleCategory, setSingleCategory] = useState<FoodCategory | "">("");
  const [singlePrice, setSinglePrice] = useState("");
  const [singleDesc, setSingleDesc] = useState("");
  const [singleError, setSingleError] = useState<string | null>(null);
  const [singleSuccess, setSingleSuccess] = useState<string | null>(null);

  // Bulk form state
  const [bulkJson, setBulkJson] = useState("");
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkSuccess, setBulkSuccess] = useState<string | null>(null);

  useEffect(() => {
    void fetchCatalog();
  }, []);

  async function fetchCatalog(): Promise<void> {
    setCatalogError(null);
    try {
      const [catRes, itemsRes] = await Promise.all([
        fetch(`${API}/food/categories`),
        fetch(`${API}/food/items?page=1&page_size=100`),
      ]);
      if (!catRes.ok) throw new Error(`categories: ${catRes.status}`);
      if (!itemsRes.ok) throw new Error(`items: ${itemsRes.status}`);
      const catData = (await catRes.json()) as { categories: FoodCategory[] };
      const itemsData = (await itemsRes.json()) as {
        items: FoodItem[];
        total: number;
      };
      setCategories(catData.categories);
      setItems(itemsData.items);
    } catch (e) {
      setCatalogError(
        e instanceof Error ? e.message : "Failed to load catalog",
      );
    }
  }

  async function handleSingleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setSingleError(null);
    setSingleSuccess(null);

    const priceCents = Math.round(parseFloat(singlePrice) * 100);
    if (!singleName.trim()) {
      setSingleError("Name is required");
      return;
    }
    if (!singleCategory) {
      setSingleError("Category is required");
      return;
    }
    if (isNaN(priceCents) || priceCents < 0) {
      setSingleError("Price must be a non-negative number");
      return;
    }

    try {
      const res = await fetch(`${API}/food/items`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: singleName.trim(),
          category: singleCategory,
          priceCents,
          description: singleDesc.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { detail: string };
        setSingleError(err.detail ?? "Upload failed");
        return;
      }
      const created = (await res.json()) as FoodItem;
      setSingleSuccess(
        `Added "${created.name}" (${formatPrice(created.priceCents)})`,
      );
      setSingleName("");
      setSingleCategory("");
      setSinglePrice("");
      setSingleDesc("");
      void fetchCatalog();
    } catch (e) {
      setSingleError(e instanceof Error ? e.message : "Upload failed");
    }
  }

  async function handleBulkSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setBulkError(null);
    setBulkSuccess(null);

    let parsed: unknown;
    try {
      parsed = JSON.parse(bulkJson);
    } catch {
      setBulkError("Invalid JSON — must be an array of food items");
      return;
    }

    try {
      const res = await fetch(`${API}/food/items/bulk`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed),
      });
      if (!res.ok) {
        const err = (await res.json()) as { detail: string };
        setBulkError(err.detail ?? "Bulk upload failed");
        return;
      }
      const data = (await res.json()) as { total: number };
      setBulkSuccess(
        `Uploaded ${data.total} item${data.total === 1 ? "" : "s"} successfully`,
      );
      setBulkJson("");
      void fetchCatalog();
    } catch (e) {
      setBulkError(e instanceof Error ? e.message : "Bulk upload failed");
    }
  }

  const visibleItems = selectedCategory
    ? items.filter((i) => i.category === selectedCategory)
    : items;
  const grouped = groupByCategory(visibleItems);

  return (
    <main
      style={{
        fontFamily: "sans-serif",
        maxWidth: 900,
        margin: "0 auto",
        padding: "1rem",
      }}
    >
      <h1>Healthy Food Store</h1>
      <nav style={{ marginBottom: "1.5rem" }}>
        <button
          onClick={() => setView("catalog")}
          style={{
            marginRight: "0.5rem",
            fontWeight: view === "catalog" ? "bold" : "normal",
          }}
        >
          Food Catalog
        </button>
        <button
          onClick={() => setView("upload")}
          style={{ fontWeight: view === "upload" ? "bold" : "normal" }}
        >
          Vendor Upload
        </button>
      </nav>

      {view === "catalog" && (
        <section aria-label="Food catalog">
          <h2>Food Catalog</h2>

          {catalogError !== null && (
            <p role="alert" style={{ color: "red" }}>
              {catalogError}
            </p>
          )}

          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="category-filter">Filter by category: </label>
            <select
              id="category-filter"
              value={selectedCategory}
              onChange={(e) =>
                setSelectedCategory(e.target.value as FoodCategory | "")
              }
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {categories.length === 0 && catalogError === null ? (
            <p>Loading catalog…</p>
          ) : items.length === 0 ? (
            <p>
              No food items yet. Vendors can upload items using the Vendor
              Upload tab.
            </p>
          ) : grouped.size === 0 ? (
            <p>No items in this category.</p>
          ) : (
            Array.from(grouped.entries()).map(([category, catItems]) => (
              <section key={category} aria-label={`${category} category`}>
                <h3>{category}</h3>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    marginBottom: "1rem",
                  }}
                >
                  <thead>
                    <tr>
                      <th
                        style={{
                          textAlign: "left",
                          borderBottom: "1px solid #ccc",
                          padding: "0.4rem",
                        }}
                      >
                        Name
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          borderBottom: "1px solid #ccc",
                          padding: "0.4rem",
                        }}
                      >
                        Description
                      </th>
                      <th
                        style={{
                          textAlign: "right",
                          borderBottom: "1px solid #ccc",
                          padding: "0.4rem",
                        }}
                      >
                        Price
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {catItems.map((item) => (
                      <tr key={item.id}>
                        <td style={{ padding: "0.4rem" }}>{item.name}</td>
                        <td style={{ padding: "0.4rem", color: "#555" }}>
                          {item.description ?? "—"}
                        </td>
                        <td style={{ padding: "0.4rem", textAlign: "right" }}>
                          {formatPrice(item.priceCents)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            ))
          )}
        </section>
      )}

      {view === "upload" && (
        <section aria-label="Vendor upload">
          <h2>Vendor Upload</h2>

          <section aria-label="Add single item">
            <h3>Add Single Item</h3>
            <form onSubmit={(e) => void handleSingleSubmit(e)} noValidate>
              <div style={{ marginBottom: "0.75rem" }}>
                <label htmlFor="item-name">Name *</label>
                <br />
                <input
                  id="item-name"
                  type="text"
                  value={singleName}
                  onChange={(e) => setSingleName(e.target.value)}
                  style={{ width: "100%", maxWidth: 400 }}
                />
              </div>
              <div style={{ marginBottom: "0.75rem" }}>
                <label htmlFor="item-category">Category *</label>
                <br />
                <select
                  id="item-category"
                  value={singleCategory}
                  onChange={(e) =>
                    setSingleCategory(e.target.value as FoodCategory | "")
                  }
                  style={{ width: "100%", maxWidth: 400 }}
                >
                  <option value="">— select —</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: "0.75rem" }}>
                <label htmlFor="item-price">Price (USD) *</label>
                <br />
                <input
                  id="item-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={singlePrice}
                  onChange={(e) => setSinglePrice(e.target.value)}
                  placeholder="e.g. 12.99"
                  style={{ width: "100%", maxWidth: 400 }}
                />
              </div>
              <div style={{ marginBottom: "0.75rem" }}>
                <label htmlFor="item-desc">Description</label>
                <br />
                <input
                  id="item-desc"
                  type="text"
                  value={singleDesc}
                  onChange={(e) => setSingleDesc(e.target.value)}
                  style={{ width: "100%", maxWidth: 400 }}
                />
              </div>
              {singleError !== null && (
                <p role="alert" style={{ color: "red" }}>
                  {singleError}
                </p>
              )}
              {singleSuccess !== null && (
                <p role="status" style={{ color: "green" }}>
                  {singleSuccess}
                </p>
              )}
              <button type="submit">Add Item</button>
            </form>
          </section>

          <hr style={{ margin: "2rem 0" }} />

          <section aria-label="Bulk upload">
            <h3>Bulk Upload (JSON)</h3>
            <p style={{ fontSize: "0.9rem", color: "#555" }}>
              Paste a JSON array of items. Each item needs{" "}
              <code>name</code>, <code>category</code>, and{" "}
              <code>priceCents</code> (integer cents).
            </p>
            <form onSubmit={(e) => void handleBulkSubmit(e)} noValidate>
              <div style={{ marginBottom: "0.75rem" }}>
                <label htmlFor="bulk-json">JSON payload *</label>
                <br />
                <textarea
                  id="bulk-json"
                  value={bulkJson}
                  onChange={(e) => setBulkJson(e.target.value)}
                  rows={8}
                  style={{ width: "100%", maxWidth: 600, fontFamily: "monospace" }}
                  placeholder={
                    '[\n  {"name":"Apple","category":"Fruits","priceCents":99},\n  {"name":"Oats","category":"Grains & Cereals","priceCents":399}\n]'
                  }
                />
              </div>
              {bulkError !== null && (
                <p role="alert" style={{ color: "red" }}>
                  {bulkError}
                </p>
              )}
              {bulkSuccess !== null && (
                <p role="status" style={{ color: "green" }}>
                  {bulkSuccess}
                </p>
              )}
              <button type="submit">Upload Items</button>
            </form>
          </section>
        </section>
      )}
    </main>
  );
}

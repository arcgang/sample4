import { FormEvent, useEffect, useState } from "react";
import { createInventoryItem, getInventory, type InventoryItem } from "./api.js";

export function App() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const inventory = await getInventory();
        if (active) {
          setItems(inventory);
          setError(null);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load inventory.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const item = await createInventoryItem({
        name,
        quantity: Number(quantity),
      });

      setItems((currentItems) => [...currentItems, item]);
      setName("");
      setQuantity("1");
      setError(null);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to add inventory item.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main>
      <h1>Fitness Equipment Inventory</h1>
      <form onSubmit={(event) => void handleSubmit(event)}>
        <label htmlFor="inventory-name">Equipment name</label>
        <input
          id="inventory-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />

        <label htmlFor="inventory-quantity">Quantity</label>
        <input
          id="inventory-quantity"
          type="number"
          min="1"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          required
        />

        <button type="submit" disabled={submitting}>
          {submitting ? "Adding..." : "Add inventory"}
        </button>
      </form>

      {loading ? <p>Loading inventory...</p> : null}
      {error ? <p>{error}</p> : null}
      {!loading && !items.length ? <p>No inventory items yet.</p> : null}

      {!loading && items.length ? (
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              {item.name}: {item.quantity}
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  );
}

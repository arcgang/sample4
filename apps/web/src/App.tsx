import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3000";

type Category = "accessory" | "equipment";
type TrainerLevel = "beginner" | "intermediate" | "advanced" | "elite";
type TrainerSpecialty =
  | "strength"
  | "cardio"
  | "yoga"
  | "pilates"
  | "crossfit"
  | "rehabilitation"
  | "nutrition";

interface CatalogItem {
  id: string;
  name: string;
  category: Category;
  description: string;
  price: number;
}

interface TrainerService {
  id: string;
  name: string;
  level: TrainerLevel;
  specialty: TrainerSpecialty;
  description: string;
  hourlyRate: number;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

async function fetchCatalog(category?: Category): Promise<PaginatedResponse<CatalogItem>> {
  const params = new URLSearchParams({ page_size: "100" });
  if (category) params.set("category", category);
  const res = await fetch(`${API_BASE}/catalog?${params}`);
  if (!res.ok) throw new Error(`catalog fetch failed: ${res.status}`);
  return res.json() as Promise<PaginatedResponse<CatalogItem>>;
}

async function fetchServices(): Promise<PaginatedResponse<TrainerService>> {
  const res = await fetch(`${API_BASE}/services?page_size=100`);
  if (!res.ok) throw new Error(`services fetch failed: ${res.status}`);
  return res.json() as Promise<PaginatedResponse<TrainerService>>;
}

function levelBadge(level: TrainerLevel): string {
  const map: Record<TrainerLevel, string> = {
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
    elite: "Elite",
  };
  return map[level];
}

export function App() {
  const [catalogFilter, setCatalogFilter] = useState<Category | "all">("all");
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [services, setServices] = useState<TrainerService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setCatalogLoading(true);
    setCatalogError(null);
    const cat = catalogFilter === "all" ? undefined : catalogFilter;
    fetchCatalog(cat)
      .then((data) => {
        if (!cancelled) {
          setCatalogItems(data.items);
          setCatalogLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setCatalogError(err instanceof Error ? err.message : "Failed to load catalog");
          setCatalogLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [catalogFilter]);

  useEffect(() => {
    let cancelled = false;
    setServicesLoading(true);
    setServicesError(null);
    fetchServices()
      .then((data) => {
        if (!cancelled) {
          setServices(data.items);
          setServicesLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setServicesError(err instanceof Error ? err.message : "Failed to load services");
          setServicesLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main style={{ fontFamily: "sans-serif", maxWidth: 900, margin: "0 auto", padding: "1rem 1.5rem" }}>
      <h1>Fitness Partner Onboarding</h1>

      <section aria-labelledby="catalog-heading">
        <h2 id="catalog-heading">Accessories &amp; Equipment Catalog</h2>
        <div role="group" aria-label="Filter catalog by category" style={{ marginBottom: "1rem" }}>
          {(["all", "accessory", "equipment"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setCatalogFilter(f)}
              aria-pressed={catalogFilter === f}
              style={{
                marginRight: "0.5rem",
                padding: "0.35rem 0.9rem",
                cursor: "pointer",
                fontWeight: catalogFilter === f ? "bold" : "normal",
                borderRadius: 4,
                border: "1px solid #666",
              }}
            >
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {catalogLoading && <p>Loading catalog…</p>}
        {catalogError && <p role="alert" style={{ color: "red" }}>{catalogError}</p>}
        {!catalogLoading && !catalogError && catalogItems.length === 0 && (
          <p>No items found.</p>
        )}
        {!catalogLoading && !catalogError && catalogItems.length > 0 && (
          <ul style={{ listStyle: "none", padding: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
            {catalogItems.map((item) => (
              <li key={item.id} style={{ border: "1px solid #ddd", borderRadius: 6, padding: "0.9rem" }}>
                <strong>{item.name}</strong>
                <span
                  style={{
                    display: "inline-block",
                    marginLeft: "0.5rem",
                    fontSize: "0.75rem",
                    padding: "0.1rem 0.4rem",
                    borderRadius: 3,
                    background: item.category === "equipment" ? "#d4e8ff" : "#d4f5d4",
                    color: "#333",
                  }}
                >
                  {item.category}
                </span>
                <p style={{ margin: "0.4rem 0", fontSize: "0.9rem", color: "#555" }}>{item.description}</p>
                <p style={{ fontWeight: "bold", margin: 0 }}>${item.price.toFixed(2)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <hr style={{ margin: "2rem 0" }} />

      <section aria-labelledby="services-heading">
        <h2 id="services-heading">Trainer Services</h2>

        {servicesLoading && <p>Loading services…</p>}
        {servicesError && <p role="alert" style={{ color: "red" }}>{servicesError}</p>}
        {!servicesLoading && !servicesError && services.length === 0 && (
          <p>No services available.</p>
        )}
        {!servicesLoading && !servicesError && services.length > 0 && (
          <ul style={{ listStyle: "none", padding: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
            {services.map((svc) => (
              <li key={svc.id} style={{ border: "1px solid #ddd", borderRadius: 6, padding: "0.9rem" }}>
                <strong>{svc.name}</strong>
                <span
                  style={{
                    display: "inline-block",
                    marginLeft: "0.5rem",
                    fontSize: "0.75rem",
                    padding: "0.1rem 0.4rem",
                    borderRadius: 3,
                    background: "#ffebd4",
                    color: "#333",
                  }}
                >
                  {levelBadge(svc.level)}
                </span>
                <span
                  style={{
                    display: "inline-block",
                    marginLeft: "0.4rem",
                    fontSize: "0.75rem",
                    padding: "0.1rem 0.4rem",
                    borderRadius: 3,
                    background: "#f0d4ff",
                    color: "#333",
                  }}
                >
                  {svc.specialty}
                </span>
                <p style={{ margin: "0.4rem 0", fontSize: "0.9rem", color: "#555" }}>{svc.description}</p>
                <p style={{ fontWeight: "bold", margin: 0 }}>${svc.hourlyRate}/hr</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

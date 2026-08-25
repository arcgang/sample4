import { useState, useEffect } from "react";
import type { Partner, Accessory, Service } from "./api.js";
import {
  fetchPartners,
  fetchAccessories,
  fetchServices,
  onboardPartner,
} from "./api.js";

type Tab = "partners" | "accessories" | "services" | "onboard";

function LoadingMessage() {
  return <p style={{ color: "#888" }}>Loading…</p>;
}

function ErrorMessage({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={{ color: "#c00", padding: "0.75rem", background: "#fff0f0", borderRadius: 4 }}>
      <strong>Error:</strong> {message}{" "}
      <button onClick={onRetry} style={{ marginLeft: "0.5rem" }}>
        Retry
      </button>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return <p style={{ color: "#888" }}>No {label} found.</p>;
}

function PartnerCard({ partner }: { partner: Partner }) {
  return (
    <div
      style={{
        border: "1px solid #e0e0e0",
        borderRadius: 8,
        padding: "1rem",
        marginBottom: "0.75rem",
        background: "#fafafa",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h3 style={{ margin: "0 0 0.25rem" }}>{partner.name}</h3>
          <span
            style={{
              display: "inline-block",
              background: "#e8f0fe",
              color: "#1a73e8",
              borderRadius: 4,
              padding: "2px 8px",
              fontSize: "0.8rem",
              marginBottom: "0.5rem",
            }}
          >
            {partner.category}
          </span>
          <p style={{ margin: "0.25rem 0 0", color: "#555", fontSize: "0.9rem" }}>{partner.description}</p>
        </div>
        {partner.onboardedAt && (
          <span style={{ fontSize: "0.75rem", color: "#999", whiteSpace: "nowrap", marginLeft: "1rem" }}>
            Onboarded {new Date(partner.onboardedAt).toLocaleDateString()}
          </span>
        )}
      </div>
      <div style={{ marginTop: "0.75rem", display: "flex", gap: "1.5rem", fontSize: "0.8rem", color: "#777" }}>
        <span>{partner.accessoryCatalog.length} accessories</span>
        <span>{partner.serviceCatalog.length} services</span>
      </div>
    </div>
  );
}

function PartnersTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [total, setTotal] = useState(0);

  function load() {
    setLoading(true);
    setError(null);
    fetchPartners()
      .then((data) => {
        setPartners(Array.isArray(data) ? data : (data?.items ?? []));
        setTotal(Array.isArray(data) ? data.length : (data?.total ?? 0));
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Unknown error"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <LoadingMessage />;
  if (error) return <ErrorMessage message={error} onRetry={load} />;
  if (!partners.length) return <EmptyState label="partners" />;

  return (
    <div>
      <p style={{ color: "#555", marginBottom: "1rem" }}>{total} partner{total !== 1 ? "s" : ""} registered</p>
      {partners.map((p) => (
        <PartnerCard key={p.id} partner={p} />
      ))}
    </div>
  );
}

function AccessoriesTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Accessory[]>([]);

  function load() {
    setLoading(true);
    setError(null);
    fetchAccessories()
      .then((data) => setItems(Array.isArray(data) ? data : (data?.items ?? [])))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Unknown error"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <LoadingMessage />;
  if (error) return <ErrorMessage message={error} onRetry={load} />;
  if (!items.length) return <EmptyState label="accessories" />;

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
      <thead>
        <tr style={{ background: "#f5f5f5" }}>
          <th style={th}>Name</th>
          <th style={th}>Description</th>
          <th style={{ ...th, textAlign: "right" }}>Price</th>
        </tr>
      </thead>
      <tbody>
        {items.map((a) => (
          <tr key={a.id} style={{ borderBottom: "1px solid #eee" }}>
            <td style={td}>{a.name}</td>
            <td style={td}>{a.description}</td>
            <td style={{ ...td, textAlign: "right" }}>${a.price.toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ServicesTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Service[]>([]);

  function load() {
    setLoading(true);
    setError(null);
    fetchServices()
      .then((data) => setItems(Array.isArray(data) ? data : (data?.items ?? [])))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Unknown error"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <LoadingMessage />;
  if (error) return <ErrorMessage message={error} onRetry={load} />;
  if (!items.length) return <EmptyState label="services" />;

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
      <thead>
        <tr style={{ background: "#f5f5f5" }}>
          <th style={th}>Name</th>
          <th style={th}>Description</th>
          <th style={{ ...th, textAlign: "right" }}>Duration</th>
        </tr>
      </thead>
      <tbody>
        {items.map((s) => (
          <tr key={s.id} style={{ borderBottom: "1px solid #eee" }}>
            <td style={td}>{s.name}</td>
            <td style={td}>{s.description}</td>
            <td style={{ ...td, textAlign: "right" }}>{s.durationMinutes} min</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function OnboardTab({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<Partner | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    onboardPartner({ name, category, description })
      .then((partner) => {
        setSuccess(partner);
        setName("");
        setCategory("");
        setDescription("");
        onSuccess();
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Unknown error"))
      .finally(() => setSubmitting(false));
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <h2 style={{ marginTop: 0 }}>Onboard a New Partner</h2>
      {success && (
        <div
          style={{
            background: "#e6f4ea",
            color: "#1e7e34",
            padding: "0.75rem",
            borderRadius: 4,
            marginBottom: "1rem",
          }}
        >
          Partner <strong>{success.name}</strong> onboarded successfully (ID: {success.id}).
        </div>
      )}
      {error && (
        <div
          style={{
            background: "#fff0f0",
            color: "#c00",
            padding: "0.75rem",
            borderRadius: 4,
            marginBottom: "1rem",
          }}
        >
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div style={fieldGroup}>
          <label style={label} htmlFor="partner-name">
            Partner name <span style={{ color: "#c00" }}>*</span>
          </label>
          <input
            id="partner-name"
            style={input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. Peak Performance Gym"
          />
        </div>
        <div style={fieldGroup}>
          <label style={label} htmlFor="partner-category">
            Category <span style={{ color: "#c00" }}>*</span>
          </label>
          <input
            id="partner-category"
            style={input}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            placeholder="e.g. Gym, Yoga, Nutrition"
          />
        </div>
        <div style={fieldGroup}>
          <label style={label} htmlFor="partner-description">
            Description <span style={{ color: "#c00" }}>*</span>
          </label>
          <textarea
            id="partner-description"
            style={{ ...input, minHeight: 80, resize: "vertical" }}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            placeholder="Brief description of the partner"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          style={{
            background: submitting ? "#aaa" : "#1a73e8",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            padding: "0.6rem 1.5rem",
            fontSize: "0.95rem",
            cursor: submitting ? "default" : "pointer",
          }}
        >
          {submitting ? "Submitting…" : "Submit Onboarding"}
        </button>
      </form>
    </div>
  );
}

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "0.5rem 0.75rem",
  fontWeight: 600,
  borderBottom: "2px solid #ddd",
};
const td: React.CSSProperties = { padding: "0.5rem 0.75rem" };
const fieldGroup: React.CSSProperties = { marginBottom: "1rem" };
const label: React.CSSProperties = { display: "block", marginBottom: "0.25rem", fontWeight: 500, fontSize: "0.9rem" };
const input: React.CSSProperties = {
  width: "100%",
  padding: "0.5rem",
  border: "1px solid #ccc",
  borderRadius: 4,
  fontSize: "0.95rem",
  boxSizing: "border-box",
};

const TABS: { key: Tab; label: string }[] = [
  { key: "partners", label: "Partner Catalog" },
  { key: "accessories", label: "Accessory Catalog" },
  { key: "services", label: "Service Catalog" },
  { key: "onboard", label: "Onboard Partner" },
];

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>("partners");
  const [partnerRefreshKey, setPartnerRefreshKey] = useState(0);

  function refreshPartners() {
    setPartnerRefreshKey((k) => k + 1);
  }

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", maxWidth: 900, margin: "0 auto", padding: "2rem 1rem" }}>
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: "0 0 0.25rem", color: "#1a1a1a" }}>Fitness Partner Onboarding</h1>
        <p style={{ margin: 0, color: "#666" }}>Manage partners, browse catalogs, and onboard new fitness partners.</p>
      </header>

      <nav style={{ display: "flex", gap: "0.25rem", borderBottom: "2px solid #e0e0e0", marginBottom: "1.5rem" }}>
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              background: "none",
              border: "none",
              borderBottom: activeTab === key ? "2px solid #1a73e8" : "2px solid transparent",
              marginBottom: -2,
              padding: "0.6rem 1rem",
              cursor: "pointer",
              fontWeight: activeTab === key ? 600 : 400,
              color: activeTab === key ? "#1a73e8" : "#555",
              fontSize: "0.95rem",
            }}
          >
            {label}
          </button>
        ))}
      </nav>

      <section>
        {activeTab === "partners" && <PartnersTab key={partnerRefreshKey} />}
        {activeTab === "accessories" && <AccessoriesTab />}
        {activeTab === "services" && <ServicesTab />}
        {activeTab === "onboard" && <OnboardTab onSuccess={refreshPartners} />}
      </section>
    </main>
  );
}

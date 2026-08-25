import { useState, useEffect } from "react";

const API_URL = (import.meta as ImportMeta & { env: Record<string, string> }).env
  .VITE_API_URL ?? "http://localhost:3000";

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Request failed");
  }
  return res.json() as Promise<T>;
}

interface MerchandiseItem {
  id: string;
  name: string;
  description: string;
  priceUsd: number;
  category: string;
  stock: number;
}

interface Order {
  id: string;
  itemName: string;
  quantity: number;
  totalUsd: number;
  status: string;
}

interface Game {
  id: string;
  name: string;
  description: string;
  type: string;
  minPlayers: number;
  maxPlayers: number;
  durationDays: number;
}

interface GameGroup {
  id: string;
  gameId: string;
  gameName: string;
  players: string[];
  status: string;
}

type Tab = "merchandise" | "games";

function MerchandiseTab() {
  const [items, setItems] = useState<MerchandiseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ordering, setOrdering] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<Order | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [customerName, setCustomerName] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiFetch<MerchandiseItem[]>("/merchandise")
      .then((data) => { if (!cancelled) setItems(data); })
      .catch((e: unknown) => { if (!cancelled) setError(String(e)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  async function handleBuy(item: MerchandiseItem) {
    setOrdering(item.id);
    setOrderResult(null);
    setOrderError(null);
    try {
      const order = await apiFetch<Order>("/merchandise/orders", {
        method: "POST",
        body: JSON.stringify({
          itemId: item.id,
          quantity: qty[item.id] ?? 1,
          customerName,
          shippingAddress,
        }),
      });
      setOrderResult(order);
    } catch (e: unknown) {
      setOrderError(String(e));
    } finally {
      setOrdering(null);
    }
  }

  if (loading) return <p>Loading merchandise…</p>;
  if (error) return <p role="alert">Error loading merchandise: {error}</p>;
  if (!items.length) return <p>No merchandise available.</p>;

  return (
    <section>
      <h2>Fitness Merchandise</h2>
      <div style={{ marginBottom: "1rem" }}>
        <label>
          Your name:{" "}
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Jane Doe"
          />
        </label>
        {"  "}
        <label>
          Shipping address:{" "}
          <input
            value={shippingAddress}
            onChange={(e) => setShippingAddress(e.target.value)}
            placeholder="123 Fitness St"
          />
        </label>
      </div>
      {orderResult && (
        <p role="status">
          Order {orderResult.id} placed for {orderResult.itemName} (
          {orderResult.quantity}x) — ${orderResult.totalUsd.toFixed(2)},{" "}
          {orderResult.status.replace("_", " ")}
        </p>
      )}
      {orderError && <p role="alert">Order failed: {orderError}</p>}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {items.map((item) => (
          <li key={item.id} style={{ marginBottom: "1rem", border: "1px solid #ccc", padding: "0.75rem" }}>
            <strong>{item.name}</strong> — ${item.priceUsd.toFixed(2)}
            <br />
            <em>{item.description}</em>
            <br />
            In stock: {item.stock}
            <br />
            <label>
              Qty:{" "}
              <input
                type="number"
                min={1}
                max={item.stock}
                value={qty[item.id] ?? 1}
                onChange={(e) =>
                  setQty((prev) => ({ ...prev, [item.id]: Number(e.target.value) }))
                }
                style={{ width: "4rem" }}
              />
            </label>
            {"  "}
            <button
              onClick={() => handleBuy(item)}
              disabled={ordering === item.id || item.stock === 0}
            >
              {ordering === item.id ? "Placing order…" : "Buy"}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function GamesTab() {
  const [games, setGames] = useState<Game[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [gamesError, setGamesError] = useState<string | null>(null);

  const [groups, setGroups] = useState<GameGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [groupsError, setGroupsError] = useState<string | null>(null);

  const [playerName, setPlayerName] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  function reloadGroups() {
    setLoadingGroups(true);
    setGroupsError(null);
    apiFetch<GameGroup[]>("/games/groups")
      .then(setGroups)
      .catch((e: unknown) => setGroupsError(String(e)))
      .finally(() => setLoadingGroups(false));
  }

  useEffect(() => {
    let cancelled = false;
    apiFetch<Game[]>("/games")
      .then((data) => { if (!cancelled) setGames(data); })
      .catch((e: unknown) => { if (!cancelled) setGamesError(String(e)); })
      .finally(() => { if (!cancelled) setLoadingGames(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    reloadGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreateGroup(gameId: string) {
    setActionError(null);
    setActionStatus(null);
    try {
      const group = await apiFetch<GameGroup>("/games/groups", {
        method: "POST",
        body: JSON.stringify({ gameId, playerName }),
      });
      setActionStatus(`Group ${group.id} created for "${group.gameName}". Share the group ID with friends!`);
      reloadGroups();
    } catch (e: unknown) {
      setActionError(String(e));
    }
  }

  async function handleJoinGroup(groupId: string) {
    setActionError(null);
    setActionStatus(null);
    try {
      const group = await apiFetch<GameGroup>(`/games/groups/${groupId}/join`, {
        method: "POST",
        body: JSON.stringify({ playerName }),
      });
      setActionStatus(`Joined group ${group.id} — ${group.players.length} players now in "${group.gameName}".`);
      reloadGroups();
    } catch (e: unknown) {
      setActionError(String(e));
    }
  }

  return (
    <section>
      <h2>Fitness Games</h2>
      <div style={{ marginBottom: "1rem" }}>
        <label>
          Your player name:{" "}
          <input
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="YourName"
          />
        </label>
      </div>
      {actionStatus && <p role="status">{actionStatus}</p>}
      {actionError && <p role="alert">Error: {actionError}</p>}

      <h3>Games Catalog</h3>
      {loadingGames && <p>Loading games…</p>}
      {gamesError && <p role="alert">Error loading games: {gamesError}</p>}
      {!loadingGames && !gamesError && !games.length && <p>No games available.</p>}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {games.map((game) => (
          <li key={game.id} style={{ marginBottom: "1rem", border: "1px solid #ccc", padding: "0.75rem" }}>
            <strong>{game.name}</strong>
            <br />
            <em>{game.description}</em>
            <br />
            Players: {game.minPlayers}–{game.maxPlayers} · Duration: {game.durationDays} days
            <br />
            <button
              onClick={() => handleCreateGroup(game.id)}
              disabled={!playerName}
            >
              Start a group
            </button>
          </li>
        ))}
      </ul>

      <h3>Active Groups</h3>
      {loadingGroups && <p>Loading groups…</p>}
      {groupsError && <p role="alert">Error loading groups: {groupsError}</p>}
      {!loadingGroups && !groupsError && !groups.length && <p>No groups yet. Start one above!</p>}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {groups.map((group) => (
          <li key={group.id} style={{ marginBottom: "0.75rem", border: "1px solid #ccc", padding: "0.75rem" }}>
            <strong>{group.gameName}</strong> — Group {group.id}
            <br />
            Players ({group.players.length}): {group.players.join(", ")}
            <br />
            Status: {group.status}
            <br />
            {group.status === "waiting" && (
              <button
                onClick={() => handleJoinGroup(group.id)}
                disabled={!playerName}
              >
                Join
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function App() {
  const [tab, setTab] = useState<Tab>("merchandise");

  return (
    <main>
      <h1>FitHub Engagement Platform</h1>
      <nav>
        <button
          onClick={() => setTab("merchandise")}
          aria-current={tab === "merchandise" ? "page" : undefined}
        >
          Merchandise
        </button>
        {" "}
        <button
          onClick={() => setTab("games")}
          aria-current={tab === "games" ? "page" : undefined}
        >
          Games
        </button>
      </nav>
      <hr />
      {tab === "merchandise" && <MerchandiseTab />}
      {tab === "games" && <GamesTab />}
    </main>
  );
}

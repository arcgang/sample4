import { useState, useEffect, useCallback } from "react";

const API_URL = (import.meta as ImportMeta & { env: { VITE_API_URL?: string } })
  .env.VITE_API_URL ?? "http://localhost:3000";

interface Story {
  id: string;
  author: string;
  body: string;
  upvotes: number;
  downvotes: number;
  createdAt: string;
}

interface StoriesPage {
  items: Story[];
  total: number;
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Request failed");
  }
  return res.json() as Promise<T>;
}

export function App() {
  const [stories, setStories] = useState<Story[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [author, setAuthor] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadStories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<StoriesPage>("/social");
      const items = Array.isArray(data) ? data : (data?.items ?? []);
      const count = Array.isArray(data) ? data.length : (data?.total ?? items.length);
      setStories(items);
      setTotal(count);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStories();
  }, [loadStories]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    try {
      const story = await apiFetch<Story>("/social", {
        method: "POST",
        body: JSON.stringify({ author, body }),
      });
      setStories((prev) => [story, ...prev]);
      setTotal((t) => t + 1);
      setAuthor("");
      setBody("");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to post story");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVote(id: string, direction: "up" | "down") {
    try {
      const updated = await apiFetch<Story>(`/social/${id}/vote`, {
        method: "POST",
        body: JSON.stringify({ direction }),
      });
      setStories((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s)),
      );
    } catch {
      // vote errors are non-fatal; ignore silently
    }
  }

  return (
    <main>
      <h1>Social Board</h1>
      <p>Share your fitness stories and experiences with the community.</p>

      <section aria-label="Share a story">
        <h2>Share a Story</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="author">Your name</label>
            <input
              id="author"
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Your name"
              required
            />
          </div>
          <div>
            <label htmlFor="body">Your story</label>
            <textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Share your experience..."
              rows={4}
              required
            />
          </div>
          {submitError && <p role="alert">{submitError}</p>}
          <button type="submit" disabled={submitting}>
            {submitting ? "Posting…" : "Post Story"}
          </button>
        </form>
      </section>

      <section aria-label="Stories">
        <h2>Stories ({total})</h2>
        {loading && <p>Loading…</p>}
        {error && (
          <p role="alert">
            {error}{" "}
            <button onClick={loadStories}>Retry</button>
          </p>
        )}
        {!loading && !error && stories.length === 0 && (
          <p>No stories yet. Be the first to share!</p>
        )}
        {!loading && !error && stories.length > 0 && (
          <ul>
            {stories.map((story) => (
              <li key={story.id}>
                <strong>{story.author}</strong>
                <p>{story.body}</p>
                <div>
                  <button
                    aria-label={`Upvote story by ${story.author}`}
                    onClick={() => handleVote(story.id, "up")}
                  >
                    ▲ {story.upvotes}
                  </button>
                  <button
                    aria-label={`Downvote story by ${story.author}`}
                    onClick={() => handleVote(story.id, "down")}
                  >
                    ▼ {story.downvotes}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

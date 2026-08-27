import { useEffect, useState } from "react";

const API_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

interface Quote {
  id: number;
  text: string;
  author: string;
}

interface Program {
  id: number;
  name: string;
  description: string;
}

interface SignupState {
  loading: boolean;
  success: boolean;
  error: string | null;
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function MotivationPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [quotesLoading, setQuotesLoading] = useState(true);
  const [quotesError, setQuotesError] = useState<string | null>(null);

  const [programs, setPrograms] = useState<Program[]>([]);
  const [programsLoading, setProgramsLoading] = useState(true);
  const [programsError, setProgramsError] = useState<string | null>(null);

  const [selectedProgram, setSelectedProgram] = useState<number | "">("");
  const [email, setEmail] = useState("");
  const [signupState, setSignupState] = useState<SignupState>({
    loading: false,
    success: false,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setQuotesLoading(true);
    fetchJson<{ items: Quote[]; total: number }>("/quotes")
      .then((data) => {
        if (!cancelled) {
          setQuotes(data.items);
          setQuotesLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setQuotesError(err instanceof Error ? err.message : "Failed to load quotes");
          setQuotesLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setProgramsLoading(true);
    fetchJson<{ items: Program[]; total: number }>("/programs")
      .then((data) => {
        if (!cancelled) {
          setPrograms(data.items);
          setProgramsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setProgramsError(err instanceof Error ? err.message : "Failed to load programs");
          setProgramsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (selectedProgram === "") return;
    setSignupState({ loading: true, success: false, error: null });
    postJson("/programs/signup", { programId: selectedProgram, userEmail: email })
      .then(() => {
        setSignupState({ loading: false, success: true, error: null });
        setEmail("");
        setSelectedProgram("");
      })
      .catch((err: unknown) => {
        setSignupState({
          loading: false,
          success: false,
          error: err instanceof Error ? err.message : "Signup failed",
        });
      });
  }

  return (
    <main>
      <h1>Fitness Motivation</h1>

      <section aria-label="Fitness Quotes">
        <h2>Inspirational Quotes</h2>
        {quotesLoading && <p>Loading quotes…</p>}
        {quotesError && <p role="alert">Error: {quotesError}</p>}
        {!quotesLoading && !quotesError && quotes.length === 0 && <p>No quotes available.</p>}
        {!quotesLoading && !quotesError && quotes.length > 0 && (
          <ul>
            {quotes.map((q) => (
              <li key={q.id}>
                <blockquote>
                  <p>{q.text}</p>
                  <footer>— {q.author}</footer>
                </blockquote>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Program Signup">
        <h2>Sign Up for a Program</h2>
        {programsLoading && <p>Loading programs…</p>}
        {programsError && <p role="alert">Error: {programsError}</p>}
        {!programsLoading && !programsError && (
          <form onSubmit={handleSignup} aria-label="Program signup form">
            <div>
              <label htmlFor="program-select">Choose a program</label>
              <select
                id="program-select"
                value={selectedProgram}
                onChange={(e) =>
                  setSelectedProgram(e.target.value === "" ? "" : Number(e.target.value))
                }
                required
              >
                <option value="">Select a program…</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="email-input">Email address</label>
              <input
                id="email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <button type="submit" disabled={signupState.loading}>
              {signupState.loading ? "Signing up…" : "Sign Up"}
            </button>
            {signupState.success && (
              <p role="status">Successfully signed up! Check your email for details.</p>
            )}
            {signupState.error && (
              <p role="alert">Error: {signupState.error}</p>
            )}
          </form>
        )}
      </section>
    </main>
  );
}

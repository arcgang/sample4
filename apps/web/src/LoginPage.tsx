import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  provider: "google";
}

export interface AuthSession {
  user: AuthUser;
  token: string;
  expiresIn: number;
}

export interface LoginInstructions {
  title: string;
  steps: string[];
  supportedProviders: string[];
}

export interface LoginPageProps {
  onLoginSuccess?: (session: AuthSession) => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [instructions, setInstructions] = useState<LoginInstructions | null>(null);
  const [instructionsLoading, setInstructionsLoading] = useState(false);
  const [instructionsError, setInstructionsError] = useState<string | null>(null);

  const [emailInput, setEmailInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    let active = true;
    setInstructionsLoading(true);
    setInstructionsError(null);

    fetch(`${API_URL}/auth/instructions`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error((await res.text()) || "Failed to load login instructions");
        }
        return res.json() as Promise<LoginInstructions>;
      })
      .then((data) => {
        if (active) {
          setInstructions(data);
          setInstructionsLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setInstructionsError(err instanceof Error ? err.message : "Failed to load instructions");
          setInstructionsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleGoogleSignIn(e?: React.FormEvent) {
    if (e) {
      e.preventDefault();
    }
    setLoginLoading(true);
    setLoginError(null);

    const email = emailInput.trim() || "user@gmail.com";
    const name = nameInput.trim() || (email.split("@")[0] || "Fitness Athlete");

    try {
      const res = await fetch(`${API_URL}/auth/google`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          idToken: "simulated_google_id_token",
          email,
          name,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Login failed");
      }

      const data = (await res.json()) as AuthSession;
      setSession(data);
      if (onLoginSuccess) {
        onLoginSuccess(data);
      }
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setLoginLoading(false);
    }
  }

  function handleLogout() {
    setSession(null);
  }

  return (
    <div className="login-page-container">
      <section aria-label="Login instructions">
        <h2>{instructions?.title ?? "Sign in to Fitness App"}</h2>

        {instructionsLoading && <p>Loading instructions…</p>}
        {instructionsError && <p role="alert">{instructionsError}</p>}

        {instructions && !instructionsLoading && !instructionsError && (
          <div>
            <p>Please follow these instructions to access your account:</p>
            <ol>
              {instructions.steps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </div>
        )}
      </section>

      <section aria-label="Google sign-in">
        <h3>Single Sign-On</h3>
        {session ? (
          <div aria-label="Authenticated user status">
            <p>
              Welcome back, <strong>{session.user.name}</strong> ({session.user.email})!
            </p>
            <p>Signed in successfully via Google.</p>
            <button type="button" onClick={handleLogout}>
              Sign Out
            </button>
          </div>
        ) : (
          <form onSubmit={handleGoogleSignIn}>
            <div>
              <label htmlFor="google-email-input">Google Email (optional custom test email)</label>
              <input
                id="google-email-input"
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="athlete@gmail.com"
                disabled={loginLoading}
              />
            </div>
            <div>
              <label htmlFor="google-name-input">Display Name (optional)</label>
              <input
                id="google-name-input"
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Alex Runner"
                disabled={loginLoading}
              />
            </div>
            <button
              type="submit"
              disabled={loginLoading}
              data-testid="google-signin-btn"
              aria-label="Sign in with Google"
            >
              {loginLoading ? "Signing in with Google…" : "Sign in with Google"}
            </button>
          </form>
        )}

        {loginError && <p role="alert">{loginError}</p>}
      </section>
    </div>
  );
}

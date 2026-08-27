import { useState } from "react";
import { WelcomePage } from "./WelcomePage.js";
import type { UserInfo } from "./WelcomePage.js";

const LEVELS = ["Beginner", "Intermediate", "Advanced", "Elite"];

function LoginForm({ onLogin }: { onLogin: (user: UserInfo) => void }) {
  const [name, setName] = useState("");
  const [level, setLevel] = useState(LEVELS[0]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onLogin({ name: trimmed, level });
  }

  return (
    <main>
      <h1>Fitness App — Log In</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Your name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            required
          />
        </div>
        <div>
          <label htmlFor="level">Fitness level</label>
          <select
            id="level"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
          >
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <button type="submit">Log in</button>
      </form>
    </main>
  );
}

export function App() {
  const [user, setUser] = useState<UserInfo | null>(null);

  if (user) {
    return <WelcomePage user={user} onLogout={() => setUser(null)} />;
  }

  return <LoginForm onLogin={setUser} />;
}

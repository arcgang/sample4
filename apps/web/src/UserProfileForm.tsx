import { useState, type FormEvent } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

interface ProfilePayload {
  name: string;
  age: number;
  habits: string[];
  goals: string[];
}

interface Profile extends ProfilePayload {
  id: string;
  createdAt: string;
}

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; profile: Profile }
  | { status: "error"; message: string };

async function submitProfile(payload: ProfilePayload): Promise<Profile> {
  const res = await fetch(`${API_URL}/profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { errors?: string[] };
    throw new Error(body.errors?.join(", ") ?? "Submission failed");
  }
  return res.json() as Promise<Profile>;
}

export function UserProfileForm() {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [habitsRaw, setHabitsRaw] = useState("");
  const [goalsRaw, setGoalsRaw] = useState("");
  const [state, setState] = useState<SubmitState>({ status: "idle" });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setState({ status: "submitting" });
    try {
      const profile = await submitProfile({
        name: name.trim(),
        age: Number(age),
        habits: habitsRaw.split(",").map((s) => s.trim()).filter(Boolean),
        goals: goalsRaw.split(",").map((s) => s.trim()).filter(Boolean),
      });
      setState({ status: "success", profile });
    } catch (err) {
      setState({ status: "error", message: err instanceof Error ? err.message : "Unknown error" });
    }
  }

  if (state.status === "success") {
    return (
      <section aria-label="profile-success">
        <h2>Profile saved!</h2>
        <p>Welcome, <strong>{state.profile.name}</strong>. Your profile ID is {state.profile.id}.</p>
        <button
          type="button"
          onClick={() => {
            setName(""); setAge(""); setHabitsRaw(""); setGoalsRaw("");
            setState({ status: "idle" });
          }}
        >
          Create another profile
        </button>
      </section>
    );
  }

  return (
    <form aria-label="user-profile-form" onSubmit={(e) => { void handleSubmit(e); }}>
      <h2>Create Your Profile</h2>

      {state.status === "error" && (
        <p role="alert">{state.message}</p>
      )}

      <div>
        <label htmlFor="profile-name">Full name</label>
        <input
          id="profile-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="e.g. Jane Smith"
        />
      </div>

      <div>
        <label htmlFor="profile-age">Age</label>
        <input
          id="profile-age"
          type="number"
          min={0}
          max={150}
          value={age}
          onChange={(e) => setAge(e.target.value)}
          required
          placeholder="e.g. 28"
        />
      </div>

      <div>
        <label htmlFor="profile-habits">Habits (comma-separated)</label>
        <input
          id="profile-habits"
          type="text"
          value={habitsRaw}
          onChange={(e) => setHabitsRaw(e.target.value)}
          placeholder="e.g. running, meditation, reading"
        />
      </div>

      <div>
        <label htmlFor="profile-goals">Goals (comma-separated)</label>
        <input
          id="profile-goals"
          type="text"
          value={goalsRaw}
          onChange={(e) => setGoalsRaw(e.target.value)}
          placeholder="e.g. lose 5kg, run a marathon"
        />
      </div>

      <button type="submit" disabled={state.status === "submitting"}>
        {state.status === "submitting" ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}

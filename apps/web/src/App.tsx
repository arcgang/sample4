import { useState, useEffect } from "react";
import { fetchDashboard } from "./api.js";
import type { DashboardData } from "./api.js";

const LEVEL_THRESHOLDS: Record<1 | 2 | 3, string> = {
  1: "1,000 pts",
  2: "5,000 pts",
  3: "10,000 pts",
};

export function App() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchDashboard()
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setLoading(false);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load dashboard");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <main><p>Loading dashboard…</p></main>;
  if (error) return <main><p role="alert">Error: {error}</p></main>;
  if (!data) return <main><p>No dashboard data available.</p></main>;

  const { metrics, level } = data;

  return (
    <main>
      <h1>Gamification Dashboard</h1>

      <section aria-label="level">
        <h2>Your Level</h2>
        <p>
          <span>Level {level}</span>
          {" — reached at "}
          <span>{LEVEL_THRESHOLDS[level]}</span>
        </p>
        <p>Total points: {metrics.points.toLocaleString()}</p>
      </section>

      <section aria-label="metrics">
        <h2>Your Metrics</h2>
        <ul>
          <li>Weight: {metrics.weightKg} kg</li>
          <li>BMI: {metrics.bmi}</li>
          <li>Coaching sessions: {metrics.coachingSessions}</li>
          <li>Distance run: {metrics.kmRun} km</li>
        </ul>
      </section>
    </main>
  );
}

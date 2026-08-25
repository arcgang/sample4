export interface Metrics {
  weightKg: number;
  bmi: number;
  coachingSessions: number;
  kmRun: number;
  points: number;
}

export interface DashboardData {
  userId: string;
  metrics: Metrics;
  level: 1 | 2 | 3;
}

// Seed data keyed by userId — stands in for a real persistence layer.
const seedMetrics: Record<string, Metrics> = {
  default: {
    weightKg: 75,
    bmi: 24.2,
    coachingSessions: 12,
    kmRun: 320,
    points: 5800,
  },
};

export function computeLevel(points: number): 1 | 2 | 3 {
  if (points >= 10000) return 3;
  if (points >= 5000) return 2;
  return 1;
}

export function getDashboard(userId: string): DashboardData {
  const metrics = seedMetrics[userId] ?? seedMetrics["default"];
  return {
    userId,
    metrics,
    level: computeLevel(metrics.points),
  };
}

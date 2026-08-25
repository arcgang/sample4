/// <reference types="vite/client" />

const baseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, options);
  if (!res.ok) throw new Error((await res.text()) || "Request failed");
  return res.json() as Promise<T>;
}

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

export async function fetchDashboard(): Promise<DashboardData> {
  return request<DashboardData>("/dashboard");
}

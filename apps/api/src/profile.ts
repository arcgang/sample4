export interface ProfileInput {
  name: string;
  age: number;
  habits: string[];
  goals: string[];
}

export interface Profile extends ProfileInput {
  id: string;
  createdAt: string;
}

export type ProfileResult =
  | { ok: true; profile: Profile }
  | { ok: false; errors: string[] };

let nextId = 1;

export function createProfile(input: unknown): ProfileResult {
  const errors: string[] = [];

  if (!input || typeof input !== "object") {
    return { ok: false, errors: ["Request body must be an object"] };
  }

  const body = input as Record<string, unknown>;

  if (typeof body.name !== "string" || body.name.trim() === "") {
    errors.push("name is required");
  }
  if (typeof body.age !== "number" || !Number.isInteger(body.age) || body.age < 0 || body.age > 150) {
    errors.push("age must be a non-negative integer up to 150");
  }
  if (!Array.isArray(body.habits) || body.habits.some((h) => typeof h !== "string")) {
    errors.push("habits must be an array of strings");
  }
  if (!Array.isArray(body.goals) || body.goals.some((g) => typeof g !== "string")) {
    errors.push("goals must be an array of strings");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const profile: Profile = {
    id: String(nextId++),
    name: (body.name as string).trim(),
    age: body.age as number,
    habits: body.habits as string[],
    goals: body.goals as string[],
    createdAt: new Date().toISOString(),
  };

  return { ok: true, profile };
}

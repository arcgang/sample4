export interface Quote {
  id: number;
  text: string;
  author: string;
}

export interface Program {
  id: number;
  name: string;
  description: string;
}

export interface Signup {
  programId: number;
  userEmail: string;
}

export interface SignupRecord extends Signup {
  id: number;
  createdAt: string;
}

const QUOTES: Quote[] = [
  { id: 1, text: "The only bad workout is the one that didn't happen.", author: "Unknown" },
  { id: 2, text: "Take care of your body. It's the only place you have to live.", author: "Jim Rohn" },
  { id: 3, text: "Fitness is not about being better than someone else. It's about being better than you used to be.", author: "Unknown" },
  { id: 4, text: "Your body can stand almost anything. It's your mind you have to convince.", author: "Unknown" },
  { id: 5, text: "Success starts with self-discipline.", author: "Unknown" },
];

const PROGRAMS: Program[] = [
  { id: 1, name: "Beginner Strength", description: "A 4-week program to build foundational strength for newcomers." },
  { id: 2, name: "Cardio Blast", description: "High-intensity cardio sessions to boost endurance and burn calories." },
  { id: 3, name: "Flexibility & Mobility", description: "Daily stretching and mobility drills to improve range of motion." },
];

const signups: SignupRecord[] = [];
let nextSignupId = 1;

export function listQuotes(): { items: Quote[]; total: number } {
  return { items: QUOTES, total: QUOTES.length };
}

export function listPrograms(): { items: Program[]; total: number } {
  return { items: PROGRAMS, total: PROGRAMS.length };
}

export function signupForProgram(
  programId: number,
  userEmail: string,
): { signup: SignupRecord } | { error: string; status: number } {
  const program = PROGRAMS.find((p) => p.id === programId);
  if (!program) {
    return { error: `Program with id ${programId} not found`, status: 404 };
  }
  if (!userEmail || !userEmail.includes("@")) {
    return { error: "A valid email address is required", status: 400 };
  }
  const record: SignupRecord = {
    id: nextSignupId++,
    programId,
    userEmail,
    createdAt: new Date().toISOString(),
  };
  signups.push(record);
  return { signup: record };
}

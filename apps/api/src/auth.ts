export interface GoogleSignInInput {
  idToken?: string;
  code?: string;
  email?: string;
  name?: string;
  picture?: string;
}

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

export interface ValidationError {
  field: string;
  message: string;
}

export interface LoginInstructions {
  title: string;
  steps: string[];
  supportedProviders: string[];
}

export function getLoginInstructions(): LoginInstructions {
  return {
    title: "Sign in to Fitness App",
    steps: [
      "Click the 'Sign in with Google' button below.",
      "Select your Google account and authorize access.",
      "You will be redirected automatically to your fitness dashboard.",
    ],
    supportedProviders: ["google"],
  };
}

export function validateGoogleAuthInput(
  input: unknown,
): { valid: true; data: GoogleSignInInput } | { valid: false; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  const raw = input as Record<string, unknown>;

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { valid: false, errors: [{ field: "body", message: "Request body must be an object" }] };
  }

  const hasToken = typeof raw.idToken === "string" && raw.idToken.trim().length > 0;
  const hasCode = typeof raw.code === "string" && raw.code.trim().length > 0;
  const hasEmail = typeof raw.email === "string" && raw.email.trim().length > 0;

  if (!hasToken && !hasCode && !hasEmail) {
    errors.push({
      field: "credential",
      message: "At least one credential field (idToken, code, or email) is required for Google sign-in",
    });
  }

  if (raw.email !== undefined && typeof raw.email !== "string") {
    errors.push({ field: "email", message: "email must be a string" });
  }

  if (raw.name !== undefined && typeof raw.name !== "string") {
    errors.push({ field: "name", message: "name must be a string" });
  }

  if (raw.picture !== undefined && typeof raw.picture !== "string") {
    errors.push({ field: "picture", message: "picture must be a string" });
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      idToken: typeof raw.idToken === "string" ? raw.idToken.trim() : undefined,
      code: typeof raw.code === "string" ? raw.code.trim() : undefined,
      email: typeof raw.email === "string" ? raw.email.trim() : undefined,
      name: typeof raw.name === "string" ? raw.name.trim() : undefined,
      picture: typeof raw.picture === "string" ? raw.picture.trim() : undefined,
    },
  };
}

export function authenticateWithGoogle(input: GoogleSignInInput): AuthSession {
  // Derive user info from provided inputs or simulated Google OAuth token payload
  const email = input.email || "user@gmail.com";
  const name = input.name || (email.split("@")[0] || "Fitness User");
  const id = `google-user-${Buffer.from(email).toString("hex").slice(0, 8)}`;
  const token = `fit_tok_${Buffer.from(`${id}:${Date.now()}`).toString("base64url")}`;

  return {
    user: {
      id,
      email,
      name,
      picture: input.picture,
      provider: "google",
    },
    token,
    expiresIn: 86400,
  };
}

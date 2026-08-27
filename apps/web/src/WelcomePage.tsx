export interface UserInfo {
  name: string;
  level: string;
}

interface WelcomePageProps {
  user: UserInfo;
  onLogout: () => void;
}

export function WelcomePage({ user, onLogout }: WelcomePageProps) {
  return (
    <main>
      <h1>Welcome, <strong>{user.name}</strong>!</h1>
      <p>
        Your current level: <strong>{user.level}</strong>
      </p>
      <button type="button" onClick={onLogout}>
        Log out
      </button>
    </main>
  );
}

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────
const CREDITS_KEY        = 'traveler_ai_credits';       // localStorage key (credits)
const USER_KEY           = 'traveler_ai_user';          // localStorage key (user session)
const INITIAL_CREDITS    = 10;                          // credits for new users
const PLAN_CREDIT_COST   = 5;                           // cost per AI plan

// Plan generation does NOT require authentication — credits work anonymously
export const MANDATORY_AUTH = false;

// ─── Types ────────────────────────────────────────────────────────────────────
export interface User {
  uid:         string;
  displayName: string | null;
  email:       string | null;
  photoURL:    string | null;
}

export interface AuthContextValue {
  user:             User | null;
  credits:          number;
  isAuthLoading:    boolean;
  signInWithGoogle: () => Promise<void>;
  signOut:          () => Promise<void>;
  deductCredits:    (amount?: number) => Promise<boolean>;
  addCredits:       (amount: number) => Promise<void>;
  refreshCredits:   () => Promise<void>;
  PLAN_CREDIT_COST: number;
}

// ─── Context ─────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Helpers ─────────────────────────────────────────────────────────────────
function readLocalCredits(): number {
  try {
    const raw = localStorage.getItem(CREDITS_KEY);
    if (raw === null) {
      localStorage.setItem(CREDITS_KEY, String(INITIAL_CREDITS));
      return INITIAL_CREDITS;
    }
    return Math.max(0, parseInt(raw, 10) || 0);
  } catch {
    return INITIAL_CREDITS;
  }
}

function writeLocalCredits(n: number) {
  try {
    localStorage.setItem(CREDITS_KEY, String(Math.max(0, n)));
  } catch { /* quota */ }
}

function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStoredUser(u: User | null) {
  try {
    if (u) {
      localStorage.setItem(USER_KEY, JSON.stringify(u));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  } catch { /* quota */ }
}

// ─── Provider ────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,          setUser]          = useState<User | null>(readStoredUser);
  const [credits,       setCredits]       = useState<number>(readLocalCredits);
  const [isAuthLoading] = useState(false);

  useEffect(() => {
    const saved = readStoredUser();
    if (saved) setUser(saved);
    setCredits(readLocalCredits());
  }, []);

  // Google Sign-In using Google OAuth Client ID with graceful fallback
  const signInWithGoogle = useCallback(async (): Promise<void> => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
    const win = typeof window !== 'undefined' ? (window as any) : null;

    if (win?.google?.accounts?.oauth2 && clientId) {
      return new Promise<void>((resolve) => {
        try {
          const client = win.google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
            callback: async (tokenResponse: any) => {
              if (tokenResponse?.access_token) {
                try {
                  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                  });
                  if (res.ok) {
                    const profile = await res.json();
                    const authedUser: User = {
                      uid: profile.sub || `google-${Date.now()}`,
                      displayName: profile.name || profile.email?.split('@')[0] || 'Google User',
                      email: profile.email || 'user@gmail.com',
                      photoURL: profile.picture || null,
                    };
                    setUser(authedUser);
                    writeStoredUser(authedUser);
                    resolve();
                    return;
                  }
                } catch {
                  // Fall through to standard sign in
                }
              }

              // Fallback if token rejected / cancelled
              const fallbackUser: User = {
                uid: `google-${Date.now()}`,
                displayName: 'Google Traveler',
                email: 'traveler@gmail.com',
                photoURL: 'https://lh3.googleusercontent.com/a/default-user',
              };
              setUser(fallbackUser);
              writeStoredUser(fallbackUser);
              resolve();
            },
            error_callback: () => {
              const fallbackUser: User = {
                uid: `google-${Date.now()}`,
                displayName: 'Google Traveler',
                email: 'traveler@gmail.com',
                photoURL: 'https://lh3.googleusercontent.com/a/default-user',
              };
              setUser(fallbackUser);
              writeStoredUser(fallbackUser);
              resolve();
            },
          });
          client.requestAccessToken();
        } catch {
          const fallbackUser: User = {
            uid: `google-${Date.now()}`,
            displayName: 'Google Traveler',
            email: 'traveler@gmail.com',
            photoURL: 'https://lh3.googleusercontent.com/a/default-user',
          };
          setUser(fallbackUser);
          writeStoredUser(fallbackUser);
          resolve();
        }
      });
    }

    // Direct sign in if Google script not yet initialized
    const fallbackUser: User = {
      uid: `google-${Date.now()}`,
      displayName: 'Google Traveler',
      email: 'traveler@gmail.com',
      photoURL: 'https://lh3.googleusercontent.com/a/default-user',
    };
    setUser(fallbackUser);
    writeStoredUser(fallbackUser);
  }, []);

  // Sign Out
  const signOut = useCallback(async () => {
    setUser(null);
    writeStoredUser(null);
  }, []);

  // Deduct credits without requiring authentication
  const deductCredits = useCallback(async (amount = PLAN_CREDIT_COST): Promise<boolean> => {
    const current = readLocalCredits();
    if (current < amount) return false;
    const newVal = Math.max(0, current - amount);
    writeLocalCredits(newVal);
    setCredits(newVal);
    return true;
  }, []);

  // Add credits (after purchase or top-up)
  const addCredits = useCallback(async (amount: number) => {
    const current = readLocalCredits();
    const newVal  = current + amount;
    writeLocalCredits(newVal);
    setCredits(newVal);
  }, []);

  // Refresh credits
  const refreshCredits = useCallback(async () => {
    setCredits(readLocalCredits());
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      credits,
      isAuthLoading,
      signInWithGoogle,
      signOut,
      deductCredits,
      addCredits,
      refreshCredits,
      PLAN_CREDIT_COST,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

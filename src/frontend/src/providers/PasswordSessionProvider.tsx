import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const SESSION_KEY = "app_session";
const PASSWORD_KEY = "app_password";
const DEFAULT_PASSWORD = "shw1400";
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

interface Session {
  createdAt: number;
  expiresAt: number;
}

interface PasswordSessionContext {
  isUnlocked: boolean;
  lock: () => void;
  unlock: (password: string) => boolean;
}

const PasswordSessionCtx = createContext<PasswordSessionContext>({
  isUnlocked: false,
  lock: () => {},
  unlock: () => false,
});

export function PasswordSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    // Check for existing valid session on mount
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const session: Session = JSON.parse(raw);
        if (session.expiresAt > Date.now()) {
          setIsUnlocked(true);
        } else {
          localStorage.removeItem(SESSION_KEY);
        }
      }
    } catch {
      localStorage.removeItem(SESSION_KEY);
    }
  }, []);

  const unlock = useCallback((password: string): boolean => {
    const stored = localStorage.getItem(PASSWORD_KEY) ?? DEFAULT_PASSWORD;
    if (password === stored) {
      const now = Date.now();
      const session: Session = {
        createdAt: now,
        expiresAt: now + SESSION_DURATION_MS,
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      setIsUnlocked(true);
      return true;
    }
    return false;
  }, []);

  const lock = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setIsUnlocked(false);
  }, []);

  return (
    <PasswordSessionCtx.Provider value={{ isUnlocked, lock, unlock }}>
      {children}
    </PasswordSessionCtx.Provider>
  );
}

export function usePasswordSession() {
  return useContext(PasswordSessionCtx);
}

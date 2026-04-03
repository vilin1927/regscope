"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

interface AuthState {
  isGuest: boolean;
  userEmail?: string;
  userId?: string;
  authError?: string;
  isLoading: boolean;
}

interface AuthActions {
  handleAuth: (email: string, password: string, mode: "signin" | "signup") => Promise<void>;
  handleGuest: () => void;
  handleSignOut: () => Promise<void>;
}

export function useAuth(): AuthState & AuthActions {
  const { data: session, status } = useSession();
  const [isGuest, setIsGuestState] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("complyradar_guest") === "true";
    }
    return false;
  });
  const [authError, setAuthError] = useState<string>();

  const setIsGuest = (value: boolean) => {
    setIsGuestState(value);
    if (typeof window !== "undefined") {
      if (value) {
        sessionStorage.setItem("complyradar_guest", "true");
      } else {
        sessionStorage.removeItem("complyradar_guest");
      }
    }
  };

  // Clear guest mode when user logs in
  useEffect(() => {
    if (session?.user) {
      setIsGuest(false);
    }
  }, [session]);

  const handleAuth = useCallback(
    async (email: string, password: string, mode: "signin" | "signup") => {
      setAuthError(undefined);
      try {
        if (mode === "signup") {
          // Get referral code from session storage
          const referralCode =
            typeof window !== "undefined"
              ? sessionStorage.getItem("complyradar_referral_code")
              : null;

          // Register first
          const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, referralCode }),
          });

          const data = await res.json();
          if (!res.ok) {
            setAuthError(data.error);
            return;
          }

          // Clear referral code after successful signup
          if (referralCode && typeof window !== "undefined") {
            sessionStorage.removeItem("complyradar_referral_code");
          }

          // Auto sign-in after registration
          const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
          });

          if (result?.error) {
            setAuthError("Registrierung erfolgreich, aber Anmeldung fehlgeschlagen. Bitte melden Sie sich an.");
            return;
          }
        } else {
          const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
          });

          if (result?.error) {
            setAuthError("Ungültige E-Mail oder Passwort");
            return;
          }
        }

        setIsGuest(false);
      } catch {
        setAuthError("Authentifizierungsdienst nicht konfiguriert. Versuchen Sie den Gastmodus.");
      }
    },
    []
  );

  const handleGuest = useCallback(() => {
    setIsGuest(true);
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut({ redirect: false });
    setIsGuest(false);
  }, []);

  return {
    isGuest,
    userEmail: session?.user?.email ?? undefined,
    userId: session?.user?.id ?? undefined,
    authError,
    isLoading: status === "loading",
    handleAuth,
    handleGuest,
    handleSignOut,
  };
}

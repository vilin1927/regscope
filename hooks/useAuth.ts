"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

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
  const [isGuest, setIsGuestState] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("complyradar_guest") === "true";
    }
    return false;
  });
  const [userEmail, setUserEmail] = useState<string>();
  const [userId, setUserId] = useState<string>();
  const [authError, setAuthError] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);

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

  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUserEmail(session.user.email ?? undefined);
          setUserId(session.user.id);
        }
      } catch {
        // Supabase not configured
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserEmail(session.user.email ?? undefined);
        setUserId(session.user.id);
      } else {
        setUserEmail(undefined);
        setUserId(undefined);
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAuth = async (email: string, password: string, mode: "signin" | "signup") => {
    setAuthError(undefined);
    try {
      const result = mode === "signup"
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

      if (result.error) {
        setAuthError(result.error.message);
        return;
      }

      setUserEmail(email);
      setUserId(result.data.user?.id);
      setIsGuest(false);

      // Record referral if signup with referral code
      if (mode === "signup" && typeof window !== "undefined") {
        const referralCode = sessionStorage.getItem("complyradar_referral_code");
        if (referralCode) {
          sessionStorage.removeItem("complyradar_referral_code");
          // Fire-and-forget: record referral in background
          fetch(`/api/referral/validate?code=${encodeURIComponent(referralCode)}`)
            .then((res) => res.json())
            .then((data) => {
              if (data.valid && data.consultantId && result.data.user?.id) {
                supabase.from("referrals").insert({
                  referral_code: referralCode,
                  consultant_id: data.consultantId,
                  customer_user_id: result.data.user.id,
                }).then(() => {});
              }
            })
            .catch(() => {});
        }
      }
    } catch {
      setAuthError("Authentifizierungsdienst nicht konfiguriert. Versuchen Sie den Gastmodus.");
    }
  };

  const handleGuest = () => {
    setIsGuest(true);
    setUserEmail(undefined);
    setUserId(undefined);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsGuest(false);
    setUserEmail(undefined);
    setUserId(undefined);
  };

  return {
    isGuest,
    userEmail,
    userId,
    authError,
    isLoading,
    handleAuth,
    handleGuest,
    handleSignOut,
  };
}

"use client";

import { useState, useEffect, useCallback } from "react";

export type Plan = "free" | "pro" | "expired";
export type TrialStatus = "none" | "active" | "expired";
export type SubscriptionStatus = "free" | "active" | "past_due" | "cancelled" | "expired";

const TRIAL_KEY = "complyradar_trial_v2";
const TRIAL_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function evaluateTrial(startedAtMs: number | null): {
  plan: Plan;
  trialStatus: TrialStatus;
} {
  if (!startedAtMs) return { plan: "free", trialStatus: "none" };
  const elapsed = Date.now() - startedAtMs;
  if (elapsed < TRIAL_DURATION_MS) return { plan: "pro", trialStatus: "active" };
  return { plan: "free", trialStatus: "expired" };
}

export function useSubscription() {
  const [plan, setPlan] = useState<Plan>("free");
  const [trialStatus, setTrialStatus] = useState<TrialStatus>("none");
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>("free");
  const [isLoading, setIsLoading] = useState(true);

  const applyLocal = useCallback(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(TRIAL_KEY);
    const result = evaluateTrial(raw ? parseInt(raw, 10) : null);
    // Only use trial-based plan if no active subscription
    return result;
  }, []);

  // Sync from server — server is source of truth
  const syncFromServer = useCallback(async () => {
    try {
      const res = await fetch("/api/subscription");
      if (!res.ok) {
        // Fall back to trial check
        const trialResult = applyLocal();
        if (trialResult) {
          setPlan(trialResult.plan);
          setTrialStatus(trialResult.trialStatus);
        }
        setIsLoading(false);
        return;
      }

      const { subscription_status, trial_started_at } = await res.json();

      setSubscriptionStatus(subscription_status || "free");

      // Paid subscription takes priority over trial
      if (subscription_status === "active") {
        setPlan("pro");
        setTrialStatus("none");
      } else if (subscription_status === "past_due") {
        // Grace period — still pro
        setPlan("pro");
        setTrialStatus("none");
      } else if (subscription_status === "cancelled" || subscription_status === "expired") {
        setPlan("expired");
        setTrialStatus("expired");
        localStorage.removeItem(TRIAL_KEY);
      } else {
        // No subscription — check trial
        if (trial_started_at) {
          const serverMs = new Date(trial_started_at).getTime();
          localStorage.setItem(TRIAL_KEY, serverMs.toString());
        }
        const trialResult = applyLocal();
        if (trialResult) {
          setPlan(trialResult.plan);
          setTrialStatus(trialResult.trialStatus);
        }
      }

      setIsLoading(false);
    } catch {
      // Network error — fall back to localStorage
      const trialResult = applyLocal();
      if (trialResult) {
        setPlan(trialResult.plan);
        setTrialStatus(trialResult.trialStatus);
      }
      setIsLoading(false);
    }
  }, [applyLocal]);

  useEffect(() => {
    // Immediate: use localStorage for fast first paint
    const trialResult = applyLocal();
    if (trialResult) {
      setPlan(trialResult.plan);
      setTrialStatus(trialResult.trialStatus);
    }
    // Then sync from server
    syncFromServer();
  }, [applyLocal, syncFromServer]);

  const startTrial = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(TRIAL_KEY, Date.now().toString());
      setPlan("pro");
      setTrialStatus("active");
      fetch("/api/trial", { method: "POST" }).catch(() => {});
    }
  }, []);

  const resetTrial = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TRIAL_KEY);
      setTrialStatus("none");
      setPlan("free");
    }
  }, []);

  const startCheckout = useCallback(async (referralCode?: string) => {
    try {
      // Get current locale from URL path
      const localeMatch = window.location.pathname.match(/^\/(en|de)/);
      const locale = localeMatch?.[1] || "de";

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referral_code: referralCode, locale }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "Checkout fehlgeschlagen");
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
      throw err;
    }
  }, []);

  return {
    isPro: plan === "pro",
    plan,
    trialStatus,
    subscriptionStatus,
    isLoading,
    startTrial,
    resetTrial,
    startCheckout,
  };
}

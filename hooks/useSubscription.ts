"use client";

import { useState, useEffect, useCallback } from "react";

type Plan = "free" | "pro";
export type TrialStatus = "none" | "active" | "expired";

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

  const applyLocal = useCallback(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(TRIAL_KEY);
    const result = evaluateTrial(raw ? parseInt(raw, 10) : null);
    setPlan(result.plan);
    setTrialStatus(result.trialStatus);
  }, []);

  // Sync from server — server is source of truth (admin can change it)
  const syncFromServer = useCallback(async () => {
    try {
      const res = await fetch("/api/trial");
      if (!res.ok) return;
      const { trial_started_at } = await res.json();

      if (trial_started_at) {
        const serverMs = new Date(trial_started_at).getTime();
        localStorage.setItem(TRIAL_KEY, serverMs.toString());
      } else {
        localStorage.removeItem(TRIAL_KEY);
      }
      applyLocal();
    } catch {
      // Network error — keep using localStorage value
    }
  }, [applyLocal]);

  useEffect(() => {
    // Immediate: use localStorage for fast first paint
    applyLocal();
    // Then sync from server (admin may have changed it)
    syncFromServer();
    // Keep checking localStorage for local changes
    const interval = setInterval(applyLocal, 1000);
    return () => clearInterval(interval);
  }, [applyLocal, syncFromServer]);

  const startTrial = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(TRIAL_KEY, Date.now().toString());
      setPlan("pro");
      setTrialStatus("active");
      // Sync to Supabase for admin visibility (fire-and-forget)
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

  return {
    isPro: plan === "pro",
    plan,
    trialStatus,
    startTrial,
    resetTrial,
  };
}

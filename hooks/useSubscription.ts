"use client";

import { useState, useEffect, useCallback } from "react";

type Plan = "free" | "pro";
export type TrialStatus = "none" | "active" | "expired";

const TRIAL_KEY = "complyradar_trial_v2";
const TRIAL_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function useSubscription() {
  const [plan, setPlan] = useState<Plan>("free");
  const [trialStatus, setTrialStatus] = useState<TrialStatus>("none");

  const checkTrial = useCallback(() => {
    if (typeof window === "undefined") return;

    const startedAt = localStorage.getItem(TRIAL_KEY);
    if (!startedAt) {
      setTrialStatus("none");
      setPlan("free");
      return;
    }

    const elapsed = Date.now() - parseInt(startedAt, 10);
    if (elapsed < TRIAL_DURATION_MS) {
      setTrialStatus("active");
      setPlan("pro");
    } else {
      setTrialStatus("expired");
      setPlan("free");
    }
  }, []);

  useEffect(() => {
    checkTrial();
    const interval = setInterval(checkTrial, 1000);
    return () => clearInterval(interval);
  }, [checkTrial]);

  const startTrial = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(TRIAL_KEY, Date.now().toString());
      setTrialStatus("active");
      setPlan("pro");
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

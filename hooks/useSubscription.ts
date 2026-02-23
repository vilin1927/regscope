"use client";

import { useState, useEffect, useCallback } from "react";

type Plan = "free" | "pro";

const STORAGE_KEY = "complyradar_plan";

export function useSubscription() {
  const [plan, setPlanState] = useState<Plan>("free");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved === "pro") setPlanState("pro");
    }
  }, []);

  const setPlan = useCallback((next: Plan) => {
    setPlanState(next);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(STORAGE_KEY, next);
    }
  }, []);

  const upgrade = useCallback(() => setPlan("pro"), [setPlan]);
  const downgrade = useCallback(() => setPlan("free"), [setPlan]);

  return {
    isPro: plan === "pro",
    plan,
    upgrade,
    downgrade,
    setPlan,
  };
}

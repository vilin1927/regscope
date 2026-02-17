"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { RiskReport } from "@/types/addons";

export function useRiskAnalysis(scanId: string | undefined) {
  const [report, setReport] = useState<RiskReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>();
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  // Check for cached report, auto-generate if none exists
  useEffect(() => {
    if (!scanId) {
      setReport(null);
      return;
    }

    // Abort any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    let cancelled = false;

    async function loadOrGenerate() {
      setIsLoading(true);
      setError(undefined);

      try {
        // Step 1: Fast cache check
        const checkRes = await fetch("/api/risk-analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scanId, checkOnly: true }),
          signal: controller.signal,
        });

        if (cancelled) return;

        if (checkRes.status === 401 || checkRes.status === 400) {
          setReport(null);
          setIsLoading(false);
          return;
        }

        if (checkRes.ok) {
          const checkData = await checkRes.json();
          if (checkData.cached && checkData.report) {
            setReport(checkData.report);
            setIsLoading(false);
            return;
          }
        }

        // Step 2: No cached report — auto-generate
        setIsLoading(false);
        setIsGenerating(true);

        const genRes = await fetch("/api/risk-analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scanId }),
          signal: controller.signal,
        });

        if (cancelled) return;

        const genData = await genRes.json();
        if (!genRes.ok) {
          throw new Error(genData.error || `Request failed (${genRes.status})`);
        }

        if (mountedRef.current) {
          setReport(genData.report);
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        if (mountedRef.current && !cancelled) {
          setError(
            err instanceof Error ? err.message : "Ein Fehler ist aufgetreten"
          );
        }
      } finally {
        if (mountedRef.current && !cancelled) {
          setIsLoading(false);
          setIsGenerating(false);
        }
      }
    }

    loadOrGenerate();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [scanId]);

  const generate = useCallback(
    async (force = false) => {
      if (!scanId) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsGenerating(true);
      setError(undefined);

      try {
        const res = await fetch("/api/risk-analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scanId, force }),
          signal: controller.signal,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || `Request failed (${res.status})`);
        }

        if (mountedRef.current) {
          setReport(data.report);
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        if (mountedRef.current) {
          setError(
            err instanceof Error ? err.message : "Ein Fehler ist aufgetreten"
          );
        }
      } finally {
        if (mountedRef.current) {
          setIsGenerating(false);
        }
      }
    },
    [scanId]
  );

  const regenerate = useCallback(() => generate(true), [generate]);

  return { report, isLoading, isGenerating, error, generate, regenerate };
}

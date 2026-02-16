"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { RecommendationReport } from "@/types/addons";

export function useRecommendations(scanId: string | undefined) {
  const [report, setReport] = useState<RecommendationReport | null>(null);
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

  // Try to load existing report when scanId changes
  useEffect(() => {
    if (!scanId) {
      setReport(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(undefined);

    fetch("/api/recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scanId }),
    })
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 401 || res.status === 400) {
          setReport(null);
          return;
        }
        const data = await res.json();
        if (!res.ok) {
          setReport(null);
          return;
        }
        if (data.cached && data.report) {
          setReport(data.report);
        }
      })
      .catch(() => {
        // Silently fail on initial load
      })
      .finally(() => {
        if (!cancelled && mountedRef.current) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [scanId]);

  const generate = useCallback(async () => {
    if (!scanId) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsGenerating(true);
    setError(undefined);

    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scanId }),
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
  }, [scanId]);

  return { report, isLoading, isGenerating, error, generate };
}

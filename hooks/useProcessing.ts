"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { MatchedRegulation } from "@/data/regulations/types";
import type { BusinessProfile } from "@/data/questionnaire/types";

interface UseProcessingOptions {
  onComplete: (matched: MatchedRegulation[]) => void;
  onError: (message: string) => void;
}

const TOTAL_STEPS = 5;

export function useProcessing({ onComplete, onError }: UseProcessingOptions) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  // Fix #18: Track mounted state to prevent updates after unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  const startProcessing = useCallback(
    (profile: BusinessProfile) => {
      setProcessingStep(0);
      setIsProcessing(true);

      // Abort any previous request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      // Run animation and API call in parallel
      const animationDone = new Promise<void>((resolve) => {
        let step = 0;
        const interval = setInterval(() => {
          step++;
          if (!mountedRef.current) {
            clearInterval(interval);
            return;
          }
          setProcessingStep(step);
          // Fix #21: Stop at step TOTAL_STEPS - 1 (4), last step set on API complete
          if (step >= TOTAL_STEPS - 1) {
            clearInterval(interval);
            resolve();
          }
        }, 700);
      });

      const apiCall = fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
        signal: controller.signal,
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || `Scan failed (${res.status})`);
        }
        return data.regulations as MatchedRegulation[];
      });

      // Wait for both animation minimum and API response
      Promise.all([animationDone, apiCall])
        .then(([, regulations]) => {
          if (!mountedRef.current) return;
          setProcessingStep(TOTAL_STEPS); // Mark final step as complete
          setTimeout(() => {
            if (!mountedRef.current) return;
            onComplete(regulations);
            setIsProcessing(false);
          }, 500);
        })
        .catch((err) => {
          if (err.name === "AbortError") return;
          if (!mountedRef.current) return;
          setIsProcessing(false);
          onError(err.message || "Ein Fehler ist aufgetreten");
        });
    },
    [onComplete, onError]
  );

  return { isProcessing, processingStep, startProcessing };
}

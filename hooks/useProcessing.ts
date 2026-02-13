"use client";

import { useState, useRef, useCallback } from "react";
import type { MatchedRegulation } from "@/data/regulations/types";
import type { BusinessProfile } from "@/data/questionnaire/types";

interface UseProcessingOptions {
  onComplete: (matched: MatchedRegulation[]) => void;
  onError: (message: string) => void;
}

export function useProcessing({ onComplete, onError }: UseProcessingOptions) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

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
          setProcessingStep(step);
          if (step >= 4) {
            // Stop at step 4 (0-indexed: steps 0-4 done), last step waits for API
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
          setProcessingStep(5); // Mark final step as complete
          setTimeout(() => {
            onComplete(regulations);
            setIsProcessing(false);
          }, 500);
        })
        .catch((err) => {
          if (err.name === "AbortError") return;
          setIsProcessing(false);
          onError(err.message || "Ein Fehler ist aufgetreten");
        });
    },
    [onComplete, onError]
  );

  return { isProcessing, processingStep, startProcessing };
}

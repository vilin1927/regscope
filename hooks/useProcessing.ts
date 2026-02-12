"use client";

import { useState, useEffect } from "react";
import type { MatchedRegulation } from "@/data/regulations/matching-engine";
import type { BusinessProfile } from "@/data/questionnaire/types";

interface UseProcessingOptions {
  onComplete: (matched: MatchedRegulation[]) => void;
  runMatching: (profile: BusinessProfile) => MatchedRegulation[];
}

export function useProcessing({ onComplete, runMatching }: UseProcessingOptions) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [pendingProfile, setPendingProfile] = useState<BusinessProfile | null>(null);

  useEffect(() => {
    if (!isProcessing || !pendingProfile) return;

    let step = 0;
    const interval = setInterval(() => {
      step++;
      setProcessingStep(step);
      if (step >= 5) {
        clearInterval(interval);
        const matched = runMatching(pendingProfile);
        setTimeout(() => {
          onComplete(matched);
          setIsProcessing(false);
          setPendingProfile(null);
        }, 500);
      }
    }, 700);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProcessing, pendingProfile]);

  const startProcessing = (profile: BusinessProfile) => {
    setProcessingStep(0);
    setPendingProfile(profile);
    setIsProcessing(true);
  };

  return { isProcessing, processingStep, startProcessing };
}

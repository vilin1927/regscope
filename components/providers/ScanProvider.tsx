"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { useScanHistory } from "@/hooks/useScanHistory";
import { useProcessing } from "@/hooks/useProcessing";
import type { MatchedRegulation } from "@/data/regulations/types";
import type { BusinessProfile } from "@/data/questionnaire/types";
import type { ScanRecord } from "@/types";

interface ScanContextValue {
  // From useScanHistory
  scanHistory: ScanRecord[];
  matchedRegulations: MatchedRegulation[];
  businessProfile: BusinessProfile;
  complianceChecks: Record<string, boolean>;
  currentScanId: string | null;
  scanLoadError?: string;
  historyLoaded: boolean;
  saveScan: (profile: BusinessProfile, matched: MatchedRegulation[]) => Promise<void>;
  handleViewScan: (scanId: string) => void;
  handleRerunScan: (scanId: string) => BusinessProfile | undefined;
  setMatchedRegulations: (regs: MatchedRegulation[]) => void;
  setBusinessProfile: (profile: BusinessProfile) => void;
  handleComplianceChange: (regulationId: string, checked: boolean) => Promise<void>;
  getComplianceChecksForScan: (scanId: string) => Promise<Record<string, boolean>>;
  resetScan: () => void;
  clearHistory: () => void;

  // From useProcessing
  isProcessing: boolean;
  processingStep: number;
  startProcessing: (profile: BusinessProfile) => void;

  // Local state
  prefillAnswers: BusinessProfile | undefined;
  setPrefillAnswers: (answers: BusinessProfile | undefined) => void;
  processingError: string | undefined;
  setProcessingError: (error: string | undefined) => void;

  // Computed
  hasResults: boolean;
  complianceScore: number | undefined;
}

const ScanContext = createContext<ScanContextValue | null>(null);

interface ScanProviderProps {
  children: ReactNode;
  userId?: string;
  isGuest?: boolean;
  onProcessingComplete: (scanId: string | null) => void;
}

export function ScanProvider({
  children,
  userId,
  isGuest,
  onProcessingComplete,
}: ScanProviderProps) {
  const [prefillAnswers, setPrefillAnswers] = useState<BusinessProfile | undefined>();
  const [processingError, setProcessingError] = useState<string | undefined>();

  const scans = useScanHistory(userId, isGuest);

  const processing = useProcessing({
    onComplete: async (matched) => {
      setProcessingError(undefined);
      scans.setMatchedRegulations(matched);
      await scans.saveScan(scans.businessProfile, matched);
      onProcessingComplete(scans.currentScanId);
    },
    onError: (message) => {
      setProcessingError(message);
    },
  });

  const hasResults = scans.matchedRegulations.length > 0;

  const complianceScore = hasResults
    ? Math.round(
        (Object.values(scans.complianceChecks).filter(Boolean).length /
          scans.matchedRegulations.length) *
          100
      )
    : undefined;

  return (
    <ScanContext.Provider
      value={{
        // useScanHistory
        scanHistory: scans.scanHistory,
        matchedRegulations: scans.matchedRegulations,
        businessProfile: scans.businessProfile,
        complianceChecks: scans.complianceChecks,
        currentScanId: scans.currentScanId,
        scanLoadError: scans.scanLoadError,
        historyLoaded: scans.historyLoaded,
        saveScan: scans.saveScan,
        handleViewScan: scans.handleViewScan,
        handleRerunScan: scans.handleRerunScan,
        setMatchedRegulations: scans.setMatchedRegulations,
        setBusinessProfile: scans.setBusinessProfile,
        handleComplianceChange: scans.handleComplianceChange,
        getComplianceChecksForScan: scans.getComplianceChecksForScan,
        resetScan: scans.resetScan,
        clearHistory: scans.clearHistory,

        // useProcessing
        isProcessing: processing.isProcessing,
        processingStep: processing.processingStep,
        startProcessing: processing.startProcessing,

        // Local state
        prefillAnswers,
        setPrefillAnswers,
        processingError,
        setProcessingError,

        // Computed
        hasResults,
        complianceScore,
      }}
    >
      {children}
    </ScanContext.Provider>
  );
}

export function useScanContext(): ScanContextValue {
  const ctx = useContext(ScanContext);
  if (!ctx) {
    throw new Error("useScanContext must be used within a ScanProvider");
  }
  return ctx;
}

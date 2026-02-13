"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { calculateComplianceScore } from "@/data/regulations/utils";
import type { MatchedRegulation } from "@/data/regulations/types";
import type { BusinessProfile } from "@/data/questionnaire/types";
import type { ScanRecord } from "@/types";

interface ScanHistoryState {
  scanHistory: ScanRecord[];
  matchedRegulations: MatchedRegulation[];
  businessProfile: BusinessProfile;
  complianceChecks: Record<string, boolean>;
  currentScanId: string | null;
  scanLoadError?: string;
}

interface ScanHistoryActions {
  saveScan: (profile: BusinessProfile, matched: MatchedRegulation[]) => Promise<void>;
  handleViewScan: (scanId: string) => void;
  handleRerunScan: (scanId: string) => BusinessProfile | undefined;
  setMatchedRegulations: (regs: MatchedRegulation[]) => void;
  setBusinessProfile: (profile: BusinessProfile) => void;
  handleComplianceChange: (regulationId: string, checked: boolean) => Promise<void>;
  resetScan: () => void;
  clearHistory: () => void;
}

export function useScanHistory(
  userId?: string,
  isGuest?: boolean
): ScanHistoryState & ScanHistoryActions {
  const [scanHistory, setScanHistory] = useState<ScanRecord[]>([]);
  const [matchedRegulations, setMatchedRegulations] = useState<MatchedRegulation[]>([]);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>({});
  const [complianceChecks, setComplianceChecks] = useState<Record<string, boolean>>({});
  const [currentScanId, setCurrentScanId] = useState<string | null>(null);
  const [scanLoadError, setScanLoadError] = useState<string>();

  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  // Load scan history when userId changes
  useEffect(() => {
    if (!userId || isGuest) return;

    const load = async () => {
      try {
        setScanLoadError(undefined);
        const { data, error } = await supabase
          .from("scans")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) {
          console.error("Failed to load scan history:", error.message);
          setScanLoadError("Failed to load scan history");
          return;
        }

        if (data) {
          setScanHistory(
            data.map((scan) => ({
              id: scan.id,
              companyName:
                (scan.business_profile as Record<string, unknown>)?.companyName as string || "Betrieb",
              date: new Date(scan.created_at).toLocaleDateString("de-DE"),
              regulationCount: (scan.matched_regulations as unknown[])?.length || 0,
              complianceScore: Number(scan.compliance_score) || 0,
              businessProfile: scan.business_profile as Record<string, unknown>,
              matchedRegulationIds: ((scan.matched_regulations as Array<{ id: string }>) || []).map(
                (r) => r.id
              ),
              matchedRegulations: scan.matched_regulations as MatchedRegulation[] | undefined,
            }))
          );
        }
      } catch (err) {
        console.error("Failed to load scan history:", err);
        setScanLoadError("Failed to load scan history");
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, isGuest]);

  // Fix #4: Load compliance checks for a specific scan
  const loadComplianceChecks = useCallback(
    async (scanId: string) => {
      if (!userId || isGuest) return;
      try {
        const { data } = await supabase
          .from("compliance_checks")
          .select("regulation_id, checked")
          .eq("scan_id", scanId);

        if (data) {
          const checks: Record<string, boolean> = {};
          for (const row of data) {
            checks[row.regulation_id] = row.checked;
          }
          setComplianceChecks(checks);
        }
      } catch {
        // compliance_checks table may not exist yet — that's ok
      }
    },
    [userId, isGuest, supabase]
  );

  const saveScan = async (profile: BusinessProfile, matched: MatchedRegulation[]) => {
    const localScan: ScanRecord = {
      id: crypto.randomUUID(),
      companyName: (profile.companyName as string) || "Betrieb",
      date: new Date().toLocaleDateString("de-DE"),
      regulationCount: matched.length,
      complianceScore: calculateComplianceScore(matched),
      businessProfile: profile,
      matchedRegulationIds: matched.map((r) => r.id),
      matchedRegulations: matched,
    };

    if (isGuest || !userId) {
      setScanHistory((prev) => [localScan, ...prev]);
      setCurrentScanId(localScan.id);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("scans")
        .insert({
          user_id: userId,
          business_profile: profile,
          matched_regulations: matched,
          compliance_score: calculateComplianceScore(matched),
        })
        .select()
        .single();

      if (error) {
        console.error("Failed to save scan:", error.message);
        // Still keep local scan so user sees results
      } else if (data) {
        localScan.id = data.id;
        localScan.complianceScore = Number(data.compliance_score) || 0;
      }
    } catch (err) {
      console.error("Failed to save scan:", err);
    }

    setScanHistory((prev) => [localScan, ...prev]);
    setCurrentScanId(localScan.id);
  };

  const handleViewScan = (scanId: string) => {
    const scan = scanHistory.find((s) => s.id === scanId);
    if (!scan) return;
    setBusinessProfile(scan.businessProfile);
    setCurrentScanId(scanId);

    // Load full regulations from stored data
    if (scan.matchedRegulations && scan.matchedRegulations.length > 0) {
      setMatchedRegulations(scan.matchedRegulations);
    }

    // Fix #4: Load compliance checks for this specific scan
    loadComplianceChecks(scanId);
  };

  const handleRerunScan = (scanId: string): BusinessProfile | undefined => {
    const scan = scanHistory.find((s) => s.id === scanId);
    return scan?.businessProfile;
  };

  // Fix #3: Save compliance check to the currently viewed scan, not always [0]
  const handleComplianceChange = useCallback(
    async (regulationId: string, checked: boolean) => {
      setComplianceChecks((prev) => ({ ...prev, [regulationId]: checked }));

      if (userId && currentScanId) {
        try {
          if (checked) {
            await supabase.from("compliance_checks").upsert({
              scan_id: currentScanId,
              regulation_id: regulationId,
              checked: true,
              checked_at: new Date().toISOString(),
            });
          } else {
            await supabase
              .from("compliance_checks")
              .delete()
              .eq("scan_id", currentScanId)
              .eq("regulation_id", regulationId);
          }
        } catch (err) {
          console.error("Failed to save compliance check:", err);
        }
      }
    },
    [userId, currentScanId, supabase]
  );

  const resetScan = () => {
    setBusinessProfile({});
    setMatchedRegulations([]);
    setComplianceChecks({});
    setCurrentScanId(null);
  };

  // Fix #9 (partial): Clear local history for guest→auth transitions
  const clearHistory = () => {
    setScanHistory([]);
    resetScan();
  };

  return {
    scanHistory,
    matchedRegulations,
    businessProfile,
    complianceChecks,
    currentScanId,
    scanLoadError,
    saveScan,
    handleViewScan,
    handleRerunScan,
    setMatchedRegulations,
    setBusinessProfile,
    handleComplianceChange,
    resetScan,
    clearHistory,
  };
}

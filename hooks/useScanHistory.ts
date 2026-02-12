"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { carpentryRegulations } from "@/data/regulations/carpentry-regulations";
import {
  matchRegulations,
  calculateComplianceScore,
} from "@/data/regulations/matching-engine";
import type { MatchedRegulation } from "@/data/regulations/matching-engine";
import type { BusinessProfile } from "@/data/questionnaire/types";
import type { ScanRecord } from "@/types";

interface ScanHistoryState {
  scanHistory: ScanRecord[];
  matchedRegulations: MatchedRegulation[];
  businessProfile: BusinessProfile;
  complianceChecks: Record<string, boolean>;
}

interface ScanHistoryActions {
  saveScan: (profile: BusinessProfile, matched: MatchedRegulation[]) => Promise<void>;
  handleViewScan: (scanId: string) => void;
  handleRerunScan: (scanId: string) => BusinessProfile | undefined;
  runMatching: (profile: BusinessProfile) => MatchedRegulation[];
  setMatchedRegulations: (regs: MatchedRegulation[]) => void;
  setBusinessProfile: (profile: BusinessProfile) => void;
  handleComplianceChange: (regulationId: string, checked: boolean) => Promise<void>;
  resetScan: () => void;
}

export function useScanHistory(
  userId?: string,
  isGuest?: boolean
): ScanHistoryState & ScanHistoryActions {
  const [scanHistory, setScanHistory] = useState<ScanRecord[]>([]);
  const [matchedRegulations, setMatchedRegulations] = useState<MatchedRegulation[]>([]);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>({});
  const [complianceChecks, setComplianceChecks] = useState<Record<string, boolean>>({});

  const supabase = createClient();

  // Load scan history when userId changes
  useEffect(() => {
    if (!userId || isGuest) return;

    const load = async () => {
      try {
        const { data } = await supabase
          .from("scans")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(50);

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
            }))
          );
        }
      } catch {
        // Supabase not configured
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, isGuest]);

  const saveScan = async (profile: BusinessProfile, matched: MatchedRegulation[]) => {
    const localScan: ScanRecord = {
      id: crypto.randomUUID(),
      companyName: (profile.companyName as string) || "Betrieb",
      date: new Date().toLocaleDateString("de-DE"),
      regulationCount: matched.length,
      complianceScore: calculateComplianceScore(matched),
      businessProfile: profile,
      matchedRegulationIds: matched.map((r) => r.id),
    };

    if (isGuest || !userId) {
      setScanHistory((prev) => [localScan, ...prev]);
      return;
    }

    try {
      const { data } = await supabase
        .from("scans")
        .insert({
          user_id: userId,
          business_profile: profile,
          matched_regulations: matched.map((r) => ({ id: r.id, status: r.status })),
          compliance_score: calculateComplianceScore(matched),
        })
        .select()
        .single();

      if (data) {
        localScan.id = data.id;
        localScan.complianceScore = Number(data.compliance_score) || 0;
      }
    } catch {
      // Supabase not configured — keep local scan
    }

    setScanHistory((prev) => [localScan, ...prev]);
  };

  const handleViewScan = (scanId: string) => {
    const scan = scanHistory.find((s) => s.id === scanId);
    if (!scan) return;
    setBusinessProfile(scan.businessProfile);
    const matched = matchRegulations(scan.businessProfile, carpentryRegulations);
    setMatchedRegulations(matched);
  };

  const handleRerunScan = (scanId: string): BusinessProfile | undefined => {
    const scan = scanHistory.find((s) => s.id === scanId);
    return scan?.businessProfile;
  };

  const runMatching = (profile: BusinessProfile): MatchedRegulation[] => {
    return matchRegulations(profile, carpentryRegulations);
  };

  const handleComplianceChange = useCallback(
    async (regulationId: string, checked: boolean) => {
      setComplianceChecks((prev) => ({ ...prev, [regulationId]: checked }));

      if (userId && scanHistory.length > 0) {
        try {
          const scanId = scanHistory[0].id;
          if (checked) {
            await supabase.from("compliance_checks").upsert({
              scan_id: scanId,
              regulation_id: regulationId,
              checked: true,
              checked_at: new Date().toISOString(),
            });
          } else {
            await supabase
              .from("compliance_checks")
              .delete()
              .eq("scan_id", scanId)
              .eq("regulation_id", regulationId);
          }
        } catch {
          // Supabase not configured
        }
      }
    },
    [userId, scanHistory, supabase]
  );

  const resetScan = () => {
    setBusinessProfile({});
    setMatchedRegulations([]);
    setComplianceChecks({});
  };

  return {
    scanHistory,
    matchedRegulations,
    businessProfile,
    complianceChecks,
    saveScan,
    handleViewScan,
    handleRerunScan,
    runMatching,
    setMatchedRegulations,
    setBusinessProfile,
    handleComplianceChange,
    resetScan,
  };
}

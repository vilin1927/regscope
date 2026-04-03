"use client";

import { useState, useEffect, useCallback } from "react";
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
  historyLoaded: boolean;
}

interface ScanHistoryActions {
  saveScan: (profile: BusinessProfile, matched: MatchedRegulation[]) => Promise<void>;
  handleViewScan: (scanId: string) => void;
  handleRerunScan: (scanId: string) => BusinessProfile | undefined;
  setMatchedRegulations: (regs: MatchedRegulation[]) => void;
  setBusinessProfile: (profile: BusinessProfile) => void;
  handleComplianceChange: (regulationId: string, checked: boolean) => Promise<void>;
  getComplianceChecksForScan: (scanId: string) => Promise<Record<string, boolean>>;
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
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Load scan history via API
  useEffect(() => {
    if (!userId || isGuest) {
      setHistoryLoaded(true);
      return;
    }

    const load = async () => {
      try {
        setScanLoadError(undefined);
        const res = await fetch("/api/scans");
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();

        const mapped = (data.scans || []).map((scan: Record<string, unknown>) => {
          // Drizzle returns camelCase, Supabase returned snake_case — support both
          const bp = (scan.businessProfile || scan.business_profile) as Record<string, unknown>;
          const mr = (scan.matchedRegulations || scan.matched_regulations) as unknown[];
          const ca = (scan.createdAt || scan.created_at) as string;
          const cs = scan.complianceScore ?? scan.compliance_score;
          return {
            id: scan.id as string,
            companyName: (bp?.companyName as string) || "Betrieb",
            date: new Date(ca).toLocaleDateString("de-DE"),
            regulationCount: mr?.length || 0,
            complianceScore: Number(cs) || 0,
            businessProfile: bp,
            matchedRegulationIds: ((mr as Array<{ id: string }>) || []).map((r) => r.id),
            matchedRegulations: mr as MatchedRegulation[] | undefined,
          };
        });
        setScanHistory(mapped);

        // Auto-select most recent scan
        if (mapped.length > 0 && !currentScanId) {
          const latest = mapped[0];
          setCurrentScanId(latest.id);
          if (latest.matchedRegulations && latest.matchedRegulations.length > 0) {
            setMatchedRegulations(latest.matchedRegulations);
          }
          setBusinessProfile(latest.businessProfile);
          loadComplianceChecksFromApi(latest.id);
        }
      } catch (err) {
        console.error("Failed to load scan history:", err);
        setScanLoadError("Failed to load scan history");
      } finally {
        setHistoryLoaded(true);
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, isGuest]);

  const loadComplianceChecksFromApi = async (scanId: string) => {
    try {
      const res = await fetch(`/api/compliance-checks?scanId=${scanId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.checks) {
        const checks: Record<string, boolean> = {};
        for (const row of data.checks) {
          checks[row.regulationId || row.regulation_id] = row.checked;
        }
        setComplianceChecks(checks);
      }
    } catch {
      // compliance_checks API may not exist yet
    }
  };

  const getComplianceChecksForScan = useCallback(
    async (scanId: string): Promise<Record<string, boolean>> => {
      if (!userId || isGuest) return {};
      try {
        const res = await fetch(`/api/compliance-checks?scanId=${scanId}`);
        if (!res.ok) return {};
        const data = await res.json();
        if (data.checks) {
          const checks: Record<string, boolean> = {};
          for (const row of data.checks) {
            checks[row.regulationId || row.regulation_id] = row.checked;
          }
          return checks;
        }
      } catch {
        // compliance_checks API may not exist yet
      }
      return {};
    },
    [userId, isGuest]
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
      const res = await fetch("/api/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessProfile: profile,
          matchedRegulations: matched,
          complianceScore: calculateComplianceScore(matched),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.scan) {
          localScan.id = data.scan.id;
          localScan.complianceScore = Number(data.scan.compliance_score) || 0;
        }
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

    if (scan.matchedRegulations && scan.matchedRegulations.length > 0) {
      setMatchedRegulations(scan.matchedRegulations);
    }

    loadComplianceChecksFromApi(scanId);
  };

  const handleRerunScan = (scanId: string): BusinessProfile | undefined => {
    const scan = scanHistory.find((s) => s.id === scanId);
    return scan?.businessProfile;
  };

  const handleComplianceChange = useCallback(
    async (regulationId: string, checked: boolean) => {
      setComplianceChecks((prev) => ({ ...prev, [regulationId]: checked }));

      if (userId && currentScanId) {
        try {
          await fetch("/api/compliance-checks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              scanId: currentScanId,
              regulationId,
              checked,
            }),
          });
        } catch (err) {
          console.error("Failed to save compliance check:", err);
        }
      }
    },
    [userId, currentScanId]
  );

  const resetScan = () => {
    setBusinessProfile({});
    setMatchedRegulations([]);
    setComplianceChecks({});
    setCurrentScanId(null);
  };

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
    historyLoaded,
    saveScan,
    handleViewScan,
    handleRerunScan,
    setMatchedRegulations,
    setBusinessProfile,
    handleComplianceChange,
    getComplianceChecksForScan,
    resetScan,
    clearHistory,
  };
}

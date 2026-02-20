"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { DashboardScreen } from "../dashboard/DashboardScreen";
import { QuestionnaireScreen } from "../questionnaire/QuestionnaireScreen";
import { ProcessingScreen } from "../processing/ProcessingScreen";
import { ResultsScreen } from "../results/ResultsScreen";
import { ScanHistoryScreen } from "../scan-history/ScanHistoryScreen";
import { AuthScreen } from "../auth/AuthScreen";
import { SettingsScreen } from "../settings/SettingsScreen";
import { LegalScreen } from "../legal/LegalScreen";
import { RiskAnalysisScreen } from "../risk-analysis/RiskAnalysisScreen";
import { RecommendationsScreen } from "../recommendations/RecommendationsScreen";
import { NewsletterScreen } from "../newsletter/NewsletterScreen";
import { AdminNewsletterScreen } from "../admin/AdminNewsletterScreen";
import { AdminUsersScreen } from "../admin/AdminUsersScreen";
import { useAuth } from "@/hooks/useAuth";
import { useScanHistory } from "@/hooks/useScanHistory";
import { useProcessing } from "@/hooks/useProcessing";
import type { Screen } from "@/types";
import type { BusinessProfile } from "@/data/questionnaire/types";

export function ComplyRadarApp() {
  const [currentScreen, setCurrentScreenState] = useState<Screen>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("complyradar_screen");
      if (saved) return saved as Screen;
    }
    return "auth";
  });
  const [prefillAnswers, setPrefillAnswers] = useState<BusinessProfile>();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [processingError, setProcessingError] = useState<string>();

  const setCurrentScreen = (screen: Screen) => {
    setCurrentScreenState(screen);
    if (typeof window !== "undefined") {
      if (screen === "auth") {
        sessionStorage.removeItem("complyradar_screen");
      } else {
        sessionStorage.setItem("complyradar_screen", screen);
      }
    }
  };

  const auth = useAuth();
  const scans = useScanHistory(auth.userId, auth.isGuest);

  const processing = useProcessing({
    onComplete: (matched) => {
      setProcessingError(undefined);
      scans.setMatchedRegulations(matched);
      scans.saveScan(scans.businessProfile, matched);
      setCurrentScreen("results");
    },
    onError: (message) => {
      setProcessingError(message);
    },
  });

  // Navigate to dashboard once auth resolves
  // Fix #19: Also reset to dashboard if screen requires data we don't have
  useEffect(() => {
    if (auth.isLoading) return;
    if (auth.userId || auth.isGuest) {
      if (currentScreen === "auth") {
        setCurrentScreen("dashboard");
      } else if (
        (currentScreen === "results" && scans.matchedRegulations.length === 0) ||
        (currentScreen === "processing" && !processing.isProcessing)
      ) {
        setCurrentScreen("dashboard");
      }
    } else if (currentScreen !== "impressum" && currentScreen !== "datenschutz") {
      setCurrentScreen("auth");
    }
  }, [auth.isLoading, auth.userId, auth.isGuest]); // eslint-disable-line react-hooks/exhaustive-deps

  const startScan = () => {
    setPrefillAnswers(undefined);
    setCurrentScreen("questionnaire");
  };

  // Fix #17: Remove duplicate setBusinessProfile call
  const handleQuestionnaireComplete = (answers: BusinessProfile) => {
    setProcessingError(undefined);
    scans.resetScan();
    scans.setBusinessProfile(answers);
    processing.startProcessing(answers);
    setCurrentScreen("processing");
  };

  // Fix #9: Clear all scan data on sign out (prevents guest/auth data mixing)
  const handleSignOut = async () => {
    await auth.handleSignOut();
    scans.clearHistory();
    setCurrentScreen("auth");
  };

  const navigate = (screen: Screen) => {
    setSidebarOpen(false);
    if (screen === "questionnaire") {
      startScan();
    } else {
      setCurrentScreen(screen);
    }
  };

  const handleViewScan = (scanId: string) => {
    scans.handleViewScan(scanId);
    setCurrentScreen("results");
  };

  const handleRerunScan = (scanId: string) => {
    const profile = scans.handleRerunScan(scanId);
    if (profile) {
      setPrefillAnswers(profile);
      setCurrentScreen("questionnaire");
    }
  };

  const hasResults = scans.matchedRegulations.length > 0;

  if (currentScreen === "auth") {
    return (
      <AuthScreen
        onAuth={auth.handleAuth}
        onGuest={() => { auth.handleGuest(); setCurrentScreen("dashboard"); }}
        onLegal={(page) => setCurrentScreen(page)}
        error={auth.authError}
      />
    );
  }

  if (
    (currentScreen === "impressum" || currentScreen === "datenschutz") &&
    !auth.userId &&
    !auth.isGuest
  ) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-3xl">
          <LegalScreen
            page={currentScreen}
            onBack={() => setCurrentScreen("auth")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      <Sidebar
        currentScreen={currentScreen}
        onNavigate={navigate}
        hasResults={hasResults}
        userEmail={auth.userEmail}
        isGuest={auth.isGuest}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <Header currentScreen={currentScreen} onMenuToggle={() => setSidebarOpen(true)} />

        <div className="flex-1 p-4 md:p-6 overflow-auto">
          <AnimatePresence mode="wait">
            {currentScreen === "dashboard" && (
              <DashboardScreen
                key="dashboard"
                onStartScan={startScan}
                scanCount={scans.scanHistory.length}
                regulationsFound={scans.scanHistory[0]?.regulationCount ?? 0}
                lastScanDate={scans.scanHistory[0]?.date}
              />
            )}

            {currentScreen === "questionnaire" && (
              <QuestionnaireScreen
                key="questionnaire"
                initialAnswers={prefillAnswers}
                onComplete={handleQuestionnaireComplete}
              />
            )}

            {currentScreen === "processing" && (
              <ProcessingScreen
                key="processing"
                currentStep={processing.processingStep}
                error={processingError}
                onRetry={() => {
                  setProcessingError(undefined);
                  if (Object.keys(scans.businessProfile).length > 0) {
                    processing.startProcessing(scans.businessProfile);
                  } else {
                    setCurrentScreen("questionnaire");
                  }
                }}
              />
            )}

            {currentScreen === "results" && (
              <ResultsScreen
                key="results"
                profile={scans.businessProfile}
                regulations={scans.matchedRegulations}
                complianceChecks={scans.complianceChecks}
                onComplianceChange={scans.handleComplianceChange}
                onReset={() => { scans.resetScan(); startScan(); }}
              />
            )}

            {currentScreen === "scan-history" && (
              <ScanHistoryScreen
                key="scan-history"
                scans={scans.scanHistory}
                onViewScan={handleViewScan}
                onRerunScan={handleRerunScan}
                onStartScan={startScan}
              />
            )}

            {currentScreen === "risk-analysis" && (
              <RiskAnalysisScreen
                key="risk-analysis"
                scanId={scans.currentScanId ?? undefined}
                hasResults={hasResults}
              />
            )}

            {currentScreen === "newsletter" && (
              <NewsletterScreen
                key="newsletter"
                userId={auth.userId}
                isGuest={auth.isGuest}
              />
            )}

            {currentScreen === "recommendations" && (
              <RecommendationsScreen
                key="recommendations"
                scanId={scans.currentScanId ?? undefined}
                hasResults={hasResults}
              />
            )}

            {currentScreen === "admin-newsletter" && (
              <AdminNewsletterScreen key="admin-newsletter" />
            )}

            {currentScreen === "admin-users" && (
              <AdminUsersScreen key="admin-users" />
            )}

            {currentScreen === "settings" && (
              <SettingsScreen
                key="settings"
                userEmail={auth.userEmail}
                isGuest={auth.isGuest}
                onSignOut={handleSignOut}
                onLegal={(page) => setCurrentScreen(page)}
              />
            )}

            {(currentScreen === "impressum" ||
              currentScreen === "datenschutz") && (
              <LegalScreen
                key={currentScreen}
                page={currentScreen}
                onBack={() => setCurrentScreen("settings")}
              />
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

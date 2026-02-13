"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { ShieldAlert, Lightbulb, Mail, Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { MobileGate } from "./MobileGate";
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
import { InPrepScreen } from "../mockups/InPrepScreen";
import { RiskAnalysisMockup } from "../mockups/RiskAnalysisMockup";
import { NewsletterMockup } from "../mockups/NewsletterMockup";
import { RecommendationsMockup } from "../mockups/RecommendationsMockup";
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
  const [isMobile, setIsMobile] = useState(false);
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

  const t = useTranslations("Mockups");
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
  useEffect(() => {
    if (!auth.isLoading && (auth.userId || auth.isGuest)) {
      if (currentScreen === "auth") setCurrentScreen("dashboard");
    }
  }, [auth.isLoading, auth.userId, auth.isGuest, currentScreen]);

  // Mobile check
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const startScan = () => {
    setPrefillAnswers(undefined);
    setCurrentScreen("questionnaire");
  };

  const handleQuestionnaireComplete = (answers: BusinessProfile) => {
    setProcessingError(undefined);
    scans.setBusinessProfile(answers);
    scans.resetScan();
    scans.setBusinessProfile(answers);
    processing.startProcessing(answers);
    setCurrentScreen("processing");
  };

  const handleSignOut = async () => {
    await auth.handleSignOut();
    scans.resetScan();
    setCurrentScreen("auth");
  };

  const navigate = (screen: Screen) => {
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

  if (isMobile) return <MobileGate />;

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
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
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
      />

      <main className="flex-1 flex flex-col min-w-0">
        <Header currentScreen={currentScreen} />

        <div className="flex-1 p-6 overflow-auto">
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
              <InPrepScreen
                key="risk-analysis"
                icon={ShieldAlert}
                color="red"
                title={t("riskAnalysis.title")}
                description={t("riskAnalysis.description")}
                mockup={<RiskAnalysisMockup regulations={hasResults ? scans.matchedRegulations : undefined} />}
              />
            )}

            {currentScreen === "newsletter" && (
              <InPrepScreen
                key="newsletter"
                icon={Mail}
                color="blue"
                title={t("newsletter.title")}
                description={t("newsletter.description")}
                mockup={<NewsletterMockup regulations={hasResults ? scans.matchedRegulations : undefined} />}
              />
            )}

            {currentScreen === "recommendations" && (
              <InPrepScreen
                key="recommendations"
                icon={Lightbulb}
                color="amber"
                title={t("recommendations.title")}
                description={t("recommendations.description")}
                mockup={<RecommendationsMockup regulations={hasResults ? scans.matchedRegulations : undefined} />}
              />
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

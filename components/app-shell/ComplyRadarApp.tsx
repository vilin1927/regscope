"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
import { AdminTemplatesScreen } from "../admin/AdminTemplatesScreen";
import { AdminConsultantsScreen } from "../admin/AdminConsultantsScreen";
import { ConsultantRegisterScreen } from "../consultant/ConsultantRegisterScreen";
import { ConsultantDashboardScreen } from "../consultant/ConsultantDashboardScreen";
import { CompanySearchScreen } from "../company-search/CompanySearchScreen";
import { DisclaimerModal } from "../ui/DisclaimerModal";
import { useAuth } from "@/hooks/useAuth";
import { SubscriptionProvider } from "@/components/providers/SubscriptionProvider";
import { ScanProvider, useScanContext } from "@/components/providers/ScanProvider";
import { pathToScreen, pushUrl } from "@/lib/routes";
import type { Screen } from "@/types";
import type { BusinessProfile, QuestionnaireLayer } from "@/data/questionnaire/types";
import type { CompanyResult } from "@/lib/handelsregister-client";

export function ComplyRadarApp() {
  const auth = useAuth();

  return (
    <SubscriptionProvider>
      <ComplyRadarAppInner auth={auth} />
    </SubscriptionProvider>
  );
}

type AuthResult = ReturnType<typeof useAuth>;

function ComplyRadarAppInner({ auth }: { auth: AuthResult }) {
  const [currentScreen, setCurrentScreenState] = useState<Screen>("auth");
  const [urlScanId, setUrlScanId] = useState<string | undefined>();
  const [hydrated, setHydrated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Restore screen from URL (or fallback to sessionStorage) after hydration
  useEffect(() => {
    const { screen, scanId } = pathToScreen(window.location.pathname);
    // If URL has a real route, use it; otherwise fall back to sessionStorage
    const isDefaultRoute = window.location.pathname.replace(/^\/(en|de)\/?$/, "") === "";
    if (!isDefaultRoute && screen !== "auth") {
      setCurrentScreenState(screen);
      if (scanId) setUrlScanId(scanId);
    } else {
      const saved = sessionStorage.getItem("complyradar_screen");
      if (saved) setCurrentScreenState(saved as Screen);
    }
    setHydrated(true);
  }, []);

  // Listen for browser back/forward
  useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
      if (e.state?.screen) {
        setCurrentScreenState(e.state.screen as Screen);
        setUrlScanId(e.state.scanId);
      } else {
        const { screen, scanId } = pathToScreen(window.location.pathname);
        setCurrentScreenState(screen);
        setUrlScanId(scanId);
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const setCurrentScreen = (screen: Screen, scanId?: string | null) => {
    setCurrentScreenState(screen);
    if (scanId !== undefined) setUrlScanId(scanId ?? undefined);
    if (typeof window !== "undefined") {
      if (screen === "auth") {
        sessionStorage.removeItem("complyradar_screen");
      } else {
        sessionStorage.setItem("complyradar_screen", screen);
      }
      pushUrl(screen, scanId);
    }
  };

  return (
    <ScanProvider
      userId={auth.userId}
      isGuest={auth.isGuest}
      onProcessingComplete={(scanId) => setCurrentScreen("results", scanId)}
    >
      <ComplyRadarAppShell
        auth={auth}
        currentScreen={currentScreen}
        setCurrentScreen={setCurrentScreen}
        urlScanId={urlScanId}
        hydrated={hydrated}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
    </ScanProvider>
  );
}

interface ShellProps {
  auth: AuthResult;
  currentScreen: Screen;
  setCurrentScreen: (screen: Screen, scanId?: string | null) => void;
  urlScanId?: string;
  hydrated: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

function ComplyRadarAppShell({
  auth,
  currentScreen,
  setCurrentScreen,
  urlScanId,
  hydrated,
  sidebarOpen,
  setSidebarOpen,
}: ShellProps) {
  const scan = useScanContext();

  // Deep-link: if URL has a scanId, load that scan on mount
  useEffect(() => {
    if (!hydrated || !urlScanId) return;
    if (scan.scanHistory.length > 0 && scan.currentScanId !== urlScanId) {
      const exists = scan.scanHistory.find((s) => s.id === urlScanId);
      if (exists) {
        scan.handleViewScan(urlScanId);
      }
    }
  }, [hydrated, urlScanId, scan.scanHistory.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Navigate to dashboard once auth resolves
  // Fix #19: Also reset to dashboard if screen requires data we don't have
  useEffect(() => {
    if (!hydrated || auth.isLoading) return;
    if (auth.userId || auth.isGuest) {
      if (currentScreen === "auth") {
        setCurrentScreen("dashboard");
      } else if (
        scan.historyLoaded &&
        !urlScanId &&
        ((currentScreen === "results" && scan.matchedRegulations.length === 0) ||
        (currentScreen === "processing" && !scan.isProcessing))
      ) {
        setCurrentScreen("dashboard");
      }
    } else if (currentScreen !== "impressum" && currentScreen !== "datenschutz") {
      setCurrentScreen("auth");
    }
  }, [hydrated, auth.isLoading, auth.userId, auth.isGuest, scan.historyLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const [dynamicLayers, setDynamicLayers] = useState<QuestionnaireLayer[] | undefined>();
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);

  // Legal disclaimer — tracks which scans have been acknowledged this session
  const [acknowledgedScans, setAcknowledgedScans] = useState<Set<string>>(new Set());
  const needsDisclaimer = currentScreen === "results" && scan.currentScanId && !acknowledgedScans.has(scan.currentScanId || "");

  const handleDisclaimerAccept = () => {
    const sid = scan.currentScanId;
    if (sid) {
      setAcknowledgedScans((prev) => new Set(prev).add(sid));
      if (auth.userId) {
        fetch("/api/disclaimer/acknowledge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scanId: sid }),
        }).catch(() => {});
      }
    }
  };

  const handleDisclaimerDecline = () => {
    setCurrentScreen("scan-history");
  };

  const fetchDynamicQuestions = useCallback(async (gegenstand: string, companyName: string, company: CompanyResult) => {
    setIsGeneratingQuestions(true);
    try {
      const res = await fetch("/api/questionnaire/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gegenstand, companyName }),
      });
      const data = await res.json();
      if (res.ok && data.layers) {
        setDynamicLayers(data.layers);
        // Store industry classification in company context
        if (data.classification) {
          scan.setCompanyContext({
            name: company.name,
            registerNum: company.register_num,
            state: company.state,
            gegenstand: company.gegenstand,
            industryCode: data.classification.industry_code,
            industryLabel: data.classification.industry_label_de,
          });
        }
      } else {
        setDynamicLayers(undefined);
      }
    } catch {
      setDynamicLayers(undefined);
    } finally {
      setIsGeneratingQuestions(false);
    }
  }, [scan]);

  const startScan = () => {
    scan.setPrefillAnswers(undefined);
    scan.resetScan();
    scan.setCompanyContext(undefined);
    setDynamicLayers(undefined);
    setCurrentScreen("company-search");
  };

  const handleCompanyConfirmed = (company: CompanyResult) => {
    scan.setCompanyContext({
      name: company.name,
      registerNum: company.register_num,
      state: company.state,
      gegenstand: company.gegenstand,
    });

    // Pre-fill questionnaire with data from Handelsregister
    const prefill: BusinessProfile = {
      companyName: company.name,
      businessLocation: company.state || "",
      handelsregisterEingetragen: true,
    };
    // Extract legal form from company name
    const nameLower = company.name.toLowerCase();
    if (nameLower.includes("gmbh") && !nameLower.includes("ug")) prefill.legalForm = "gmbh";
    else if (nameLower.includes("ug")) prefill.legalForm = "ug";
    else if (nameLower.includes(" kg")) prefill.legalForm = "kg";
    else if (nameLower.includes("ohg")) prefill.legalForm = "ohg";
    else if (nameLower.includes("gbr") || nameLower.includes("egbr")) prefill.legalForm = "gbr";
    else if (nameLower.includes("e.k.") || nameLower.includes("e.kfm") || nameLower.includes("e.kfr")) prefill.legalForm = "einzelunternehmen";
    else if (nameLower.includes("ag") || nameLower.includes("aktiengesellschaft")) prefill.legalForm = "sonstige";
    // Map state/city to Bundesland — try multiple value formats since AI generates different option values
    const cityToBundesland: Record<string, string[]> = {
      "münchen": ["by", "bayern", "Bayern"], "nürnberg": ["by", "bayern", "Bayern"], "augsburg": ["by", "bayern", "Bayern"], "regensburg": ["by", "bayern", "Bayern"], "würzburg": ["by", "bayern", "Bayern"], "bamberg": ["by", "bayern", "Bayern"], "erlangen": ["by", "bayern", "Bayern"],
      "berlin": ["be", "berlin", "Berlin"],
      "hamburg": ["hh", "hamburg", "Hamburg"],
      "bremen": ["hb", "bremen", "Bremen"],
      "stuttgart": ["bw", "baden-württemberg", "Baden-Württemberg"], "karlsruhe": ["bw", "baden-württemberg", "Baden-Württemberg"], "mannheim": ["bw", "baden-württemberg", "Baden-Württemberg"], "freiburg": ["bw", "baden-württemberg", "Baden-Württemberg"], "heidelberg": ["bw", "baden-württemberg", "Baden-Württemberg"],
      "frankfurt": ["he", "hessen", "Hessen"], "wiesbaden": ["he", "hessen", "Hessen"], "darmstadt": ["he", "hessen", "Hessen"], "kassel": ["he", "hessen", "Hessen"],
      "düsseldorf": ["nw", "nordrhein-westfalen", "Nordrhein-Westfalen"], "köln": ["nw", "nordrhein-westfalen", "Nordrhein-Westfalen"], "dortmund": ["nw", "nordrhein-westfalen", "Nordrhein-Westfalen"], "essen": ["nw", "nordrhein-westfalen", "Nordrhein-Westfalen"], "duisburg": ["nw", "nordrhein-westfalen", "Nordrhein-Westfalen"], "mönchengladbach": ["nw", "nordrhein-westfalen", "Nordrhein-Westfalen"],
      "hannover": ["ni", "niedersachsen", "Niedersachsen"], "braunschweig": ["ni", "niedersachsen", "Niedersachsen"], "oldenburg": ["ni", "niedersachsen", "Niedersachsen"], "celle": ["ni", "niedersachsen", "Niedersachsen"],
      "mainz": ["rp", "rheinland-pfalz", "Rheinland-Pfalz"], "koblenz": ["rp", "rheinland-pfalz", "Rheinland-Pfalz"],
      "saarbrücken": ["sl", "saarland", "Saarland"],
      "dresden": ["sn", "sachsen", "Sachsen"], "leipzig": ["sn", "sachsen", "Sachsen"], "chemnitz": ["sn", "sachsen", "Sachsen"],
      "magdeburg": ["st", "sachsen-anhalt", "Sachsen-Anhalt"], "halle": ["st", "sachsen-anhalt", "Sachsen-Anhalt"],
      "kiel": ["sh", "schleswig-holstein", "Schleswig-Holstein"], "lübeck": ["sh", "schleswig-holstein", "Schleswig-Holstein"],
      "erfurt": ["th", "thüringen", "Thüringen"], "jena": ["th", "thüringen", "Thüringen"],
      "potsdam": ["bb", "brandenburg", "Brandenburg"], "cottbus": ["bb", "brandenburg", "Brandenburg"],
      "schwerin": ["mv", "mecklenburg-vorpommern", "Mecklenburg-Vorpommern"], "rostock": ["mv", "mecklenburg-vorpommern", "Mecklenburg-Vorpommern"],
    };
    if (company.state) {
      const cityLower = company.state.toLowerCase();
      for (const [city, variants] of Object.entries(cityToBundesland)) {
        if (cityLower.includes(city)) {
          // Set all variants — the select will match whichever option value format the AI used
          prefill.bundesland = variants[0]; // abbreviation (most common in AI templates)
          break;
        }
      }
    }
    scan.setPrefillAnswers(prefill);

    if (company.gegenstand) {
      // Generate dynamic questions, then navigate
      fetchDynamicQuestions(company.gegenstand, company.name, company).then(() => {
        setCurrentScreen("questionnaire");
      });
    } else {
      // No Gegenstand — fall back to static questionnaire
      setDynamicLayers(undefined);
      setCurrentScreen("questionnaire");
    }
  };

  const handleSkipCompanySearch = () => {
    scan.setCompanyContext(undefined);
    setDynamicLayers(undefined);
    setCurrentScreen("questionnaire");
  };

  // Fix #17: Remove duplicate setBusinessProfile call
  const handleQuestionnaireComplete = (answers: BusinessProfile) => {
    scan.setProcessingError(undefined);
    scan.resetScan();
    // Inject industry label from AI classification if not already set by user
    if (!answers.industry && scan.companyContext?.industryLabel) {
      answers.industry = scan.companyContext.industryLabel;
    }
    scan.setBusinessProfile(answers);
    scan.startProcessing(answers, scan.companyContext);
    setCurrentScreen("processing");
  };

  // Fix #9: Clear all scan data on sign out (prevents guest/auth data mixing)
  const handleSignOut = async () => {
    await auth.handleSignOut();
    scan.clearHistory();
    setCurrentScreen("auth");
  };

  const navigate = (screen: Screen) => {
    setSidebarOpen(false);
    if (screen === "questionnaire" || screen === "company-search") {
      startScan();
    } else {
      // Include scanId in URL for scan-specific screens
      const scanScreens: Screen[] = ["results", "risk-analysis", "recommendations"];
      const sid = scanScreens.includes(screen) ? scan.currentScanId : null;
      setCurrentScreen(screen, sid);
    }
  };

  const handleViewScan = (scanId: string) => {
    scan.handleViewScan(scanId);
    setCurrentScreen("results", scanId);
  };

  const handleRerunScan = (scanId: string) => {
    const profile = scan.handleRerunScan(scanId);
    if (profile) {
      scan.setPrefillAnswers(profile);
      setCurrentScreen("questionnaire");
    }
  };

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
                onViewResults={(scanId) => {
                  scan.handleViewScan(scanId);
                  setCurrentScreen("results", scanId);
                }}
              />
            )}

            {currentScreen === "company-search" && (
              isGeneratingQuestions ? (
                <motion.div
                  key="generating-questions"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="max-w-md mx-auto text-center py-16"
                >
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-blue-600 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 mb-2">Fragebogen wird erstellt...</h2>
                  <p className="text-sm text-gray-500">Branchenspezifische Fragen werden generiert</p>
                </motion.div>
              ) : (
                <CompanySearchScreen
                  key="company-search"
                  onCompanyConfirmed={handleCompanyConfirmed}
                  onSkip={handleSkipCompanySearch}
                />
              )
            )}

            {currentScreen === "questionnaire" && (
              <QuestionnaireScreen
                key="questionnaire"
                initialAnswers={scan.prefillAnswers}
                dynamicLayers={dynamicLayers}
                onComplete={handleQuestionnaireComplete}
              />
            )}

            {currentScreen === "processing" && (
              <ProcessingScreen
                key="processing"
                currentStep={scan.processingStep}
                error={scan.processingError}
                onRetry={() => {
                  scan.setProcessingError(undefined);
                  if (Object.keys(scan.businessProfile).length > 0) {
                    scan.startProcessing(scan.businessProfile, scan.companyContext);
                  } else {
                    setCurrentScreen("questionnaire");
                  }
                }}
              />
            )}

            {currentScreen === "results" && (
              <ResultsScreen
                key="results"
                onReset={() => { scan.resetScan(); startScan(); }}
                onBack={() => setCurrentScreen("scan-history")}
              />
            )}

            {currentScreen === "scan-history" && (
              <ScanHistoryScreen
                key="scan-history"
                scans={scan.scanHistory}
                onViewScan={handleViewScan}
                onRerunScan={handleRerunScan}
                onStartScan={startScan}
              />
            )}

            {currentScreen === "risk-analysis" && (
              <RiskAnalysisScreen
                key="risk-analysis"
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
              />
            )}

            {currentScreen === "admin-newsletter" && (
              <AdminNewsletterScreen key="admin-newsletter" />
            )}

            {currentScreen === "admin-users" && (
              <AdminUsersScreen key="admin-users" />
            )}

            {currentScreen === "admin-templates" && (
              <AdminTemplatesScreen key="admin-templates" />
            )}

            {currentScreen === "admin-consultants" && (
              <AdminConsultantsScreen key="admin-consultants" />
            )}

            {currentScreen === "consultant-register" && (
              <ConsultantRegisterScreen
                key="consultant-register"
                userEmail={auth.userEmail}
                onRegistered={() => setCurrentScreen("consultant-dashboard")}
              />
            )}

            {currentScreen === "consultant-dashboard" && (
              <ConsultantDashboardScreen key="consultant-dashboard" />
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

      {/* Legal popups */}
      {needsDisclaimer && (
        <DisclaimerModal
          onAccept={handleDisclaimerAccept}
          onDecline={handleDisclaimerDecline}
        />
      )}

    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ScanSearch,
  FileText,
  Settings,
  ChevronRight,
  Building2,
  Globe,
  Shield,
  Loader2,
  Check,
  ExternalLink,
  Download,
  RotateCcw,
  Monitor,
} from "lucide-react";
import {
  demoData,
  regulations,
  calculateRelevance,
  generateWhyApplies,
} from "@/data/regscope-data";

type Screen = "dashboard" | "questionnaire" | "processing" | "results";
type QuestionnaireStep = 1 | 2 | 3;

type Regulation = (typeof regulations)[0];
type MatchedRegulation = Regulation & { relevanceScore: number; whyApplies: string };

interface FormData {
  companyName: string;
  industry: string;
  description: string;
  countries: string[];
  products: string;
  hasEmployees: boolean;
  sellsOnline: boolean;
  complianceFocus: string;
  dataProcessing: string[];
}

const initialFormData: FormData = {
  companyName: "",
  industry: "",
  description: "",
  countries: [],
  products: "",
  hasEmployees: false,
  sellsOnline: false,
  complianceFocus: "",
  dataProcessing: [],
};

export default function RegScopePage() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("dashboard");
  const [questionnaireStep, setQuestionnaireStep] = useState<QuestionnaireStep>(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [processingStep, setProcessingStep] = useState(0);
  const [matchedRegulations, setMatchedRegulations] = useState<MatchedRegulation[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (currentScreen === "processing") {
      const steps = [0, 1, 2, 3];
      let currentStep = 0;

      const interval = setInterval(() => {
        currentStep++;
        setProcessingStep(currentStep);

        if (currentStep >= steps.length) {
          clearInterval(interval);
          const matched = regulations
            .map((reg) => ({
              ...reg,
              relevanceScore: calculateRelevance(reg, {
                industry: formData.industry,
                dataProcessing: formData.dataProcessing,
                sellsOnline: formData.sellsOnline,
                hasEmployees: formData.hasEmployees,
              }),
              whyApplies: generateWhyApplies(reg, formData),
            }))
            .filter((reg) => reg.relevanceScore > 20)
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, 6);

          setMatchedRegulations(matched);
          setTimeout(() => setCurrentScreen("results"), 500);
        }
      }, 800);

      return () => clearInterval(interval);
    }
  }, [currentScreen, formData]);

  const handleStartScan = () => {
    setCurrentScreen("questionnaire");
    setQuestionnaireStep(1);
  };

  const handleNextStep = () => {
    if (questionnaireStep < 3) {
      setQuestionnaireStep((prev) => (prev + 1) as QuestionnaireStep);
    } else {
      setProcessingStep(0);
      setCurrentScreen("processing");
    }
  };

  const handlePrevStep = () => {
    if (questionnaireStep > 1) {
      setQuestionnaireStep((prev) => (prev - 1) as QuestionnaireStep);
    }
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setQuestionnaireStep(1);
    setCurrentScreen("dashboard");
    setMatchedRegulations([]);
  };

  const updateFormData = (field: keyof FormData, value: FormData[keyof FormData]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleCountry = (country: string) => {
    setFormData((prev) => ({
      ...prev,
      countries: prev.countries.includes(country)
        ? prev.countries.filter((c) => c !== country)
        : [...prev.countries, country],
    }));
  };

  const toggleDataProcessing = (option: string) => {
    setFormData((prev) => ({
      ...prev,
      dataProcessing: prev.dataProcessing.includes(option)
        ? prev.dataProcessing.filter((o) => o !== option)
        : [...prev.dataProcessing, option],
    }));
  };

  if (isMobile) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-sm text-center shadow-lg border border-gray-100">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Monitor className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Best Viewed on Desktop</h1>
          <p className="text-gray-600">
            RegScope is a full dashboard experience. Please open on a larger screen.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
              <ScanSearch className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">{demoData.appName}</h1>
              <p className="text-xs text-gray-500">{demoData.tagline}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            <NavItem
              icon={LayoutDashboard}
              label="Dashboard"
              active={currentScreen === "dashboard" || currentScreen === "results"}
              onClick={() => matchedRegulations.length > 0 ? setCurrentScreen("results") : setCurrentScreen("dashboard")}
            />
            <NavItem
              icon={ScanSearch}
              label="New Scan"
              active={currentScreen === "questionnaire" || currentScreen === "processing"}
              onClick={handleStartScan}
            />
            <NavItem icon={FileText} label="Regulations" disabled />
            <NavItem icon={Settings} label="Settings" disabled />
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-blue-600">R</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">raphael@orgonic-art.com</p>
              <p className="text-xs text-gray-500">Orgonic-Art</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6">
          <span className="text-sm font-medium text-gray-900">
            {currentScreen === "dashboard" && "Dashboard"}
            {currentScreen === "questionnaire" && "New Scan"}
            {currentScreen === "processing" && "Analyzing..."}
            {currentScreen === "results" && "Scan Results"}
          </span>
        </header>

        <div className="flex-1 p-6 overflow-auto">
          <AnimatePresence mode="wait">
            {currentScreen === "dashboard" && (
              <DashboardScreen key="dashboard" onStartScan={handleStartScan} />
            )}
            {currentScreen === "questionnaire" && (
              <QuestionnaireScreen
                key="questionnaire"
                step={questionnaireStep}
                formData={formData}
                updateFormData={updateFormData}
                toggleCountry={toggleCountry}
                toggleDataProcessing={toggleDataProcessing}
                onNext={handleNextStep}
                onPrev={handlePrevStep}
              />
            )}
            {currentScreen === "processing" && (
              <ProcessingScreen key="processing" currentStep={processingStep} />
            )}
            {currentScreen === "results" && (
              <ResultsScreen
                key="results"
                formData={formData}
                regulations={matchedRegulations}
                onReset={handleReset}
              />
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon: Icon, label, active, disabled, onClick }: {
  icon: React.ElementType; label: string; active?: boolean; disabled?: boolean; onClick?: () => void;
}) {
  return (
    <li>
      <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          active ? "bg-blue-50 text-blue-700"
            : disabled ? "text-gray-400 cursor-not-allowed"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        }`}
      >
        <Icon className="w-5 h-5" />
        {label}
      </button>
    </li>
  );
}

function DashboardScreen({ onStartScan }: { onStartScan: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to RegScope</h1>
      <p className="text-gray-600 mb-8">Discover EU regulations that may apply to your business</p>

      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 text-white mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold mb-2">Start Your First Scan</h2>
            <p className="text-blue-100 mb-6 max-w-md">
              Answer a few questions about your business and we&apos;ll identify potentially relevant EU regulations.
            </p>
            <button onClick={onStartScan} className="inline-flex items-center gap-2 bg-white text-blue-700 px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
              Start Scan <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="hidden md:flex w-24 h-24 bg-white/10 rounded-2xl items-center justify-center">
            <ScanSearch className="w-12 h-12 text-white/50" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[{ v: "0", l: "Regulations Found" }, { v: "0", l: "Scans Completed" }, { v: "-", l: "Last Scan" }].map((s) => (
          <div key={s.l} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-3xl font-bold text-gray-900">{s.v}</p>
            <p className="text-sm text-gray-500">{s.l}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function QuestionnaireScreen({ step, formData, updateFormData, toggleCountry, toggleDataProcessing, onNext, onPrev }: {
  step: QuestionnaireStep; formData: FormData;
  updateFormData: (field: keyof FormData, value: FormData[keyof FormData]) => void;
  toggleCountry: (c: string) => void; toggleDataProcessing: (o: string) => void;
  onNext: () => void; onPrev: () => void;
}) {
  const isStepValid = () => {
    if (step === 1) return formData.companyName && formData.industry;
    if (step === 2) return formData.countries.length > 0;
    return true;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-900">Step {step} of 3</span>
          <span className="text-sm text-gray-500">
            {step === 1 && "Company Basics"}{step === 2 && "Operations"}{step === 3 && "Compliance Focus"}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${(step / 3) * 100}%` }} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><Building2 className="w-5 h-5 text-blue-600" /></div>
                <div><h2 className="text-lg font-bold text-gray-900">Company Basics</h2><p className="text-sm text-gray-500">Tell us about your business</p></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
                <input type="text" value={formData.companyName} onChange={(e) => updateFormData("companyName", e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="Enter your company name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Industry *</label>
                <select value={formData.industry} onChange={(e) => updateFormData("industry", e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                  <option value="">Select an industry</option>
                  {demoData.industries.map((ind) => <option key={ind.value} value={ind.value}>{ind.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Description</label>
                <textarea value={formData.description} onChange={(e) => updateFormData("description", e.target.value)} rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none" placeholder="Briefly describe what your company does..." />
              </div>
            </motion.div>
          )}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><Globe className="w-5 h-5 text-green-600" /></div>
                <div><h2 className="text-lg font-bold text-gray-900">Operations</h2><p className="text-sm text-gray-500">Where and how do you operate?</p></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Operating Countries *</label>
                <div className="flex flex-wrap gap-2">
                  {demoData.countries.map((c) => (
                    <button key={c.value} onClick={() => toggleCountry(c.value)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${formData.countries.includes(c.value) ? "bg-blue-100 text-blue-700 border-2 border-blue-300" : "bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200"}`}>{c.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Products/Services Offered</label>
                <textarea value={formData.products} onChange={(e) => updateFormData("products", e.target.value)} rows={2} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none" placeholder="What products or services do you offer?" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <ToggleOption label="Has Employees" description="Do you have employees?" checked={formData.hasEmployees} onChange={(v) => updateFormData("hasEmployees", v)} />
                <ToggleOption label="Sells Online" description="Do you sell online?" checked={formData.sellsOnline} onChange={(v) => updateFormData("sellsOnline", v)} />
              </div>
            </motion.div>
          )}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center"><Shield className="w-5 h-5 text-purple-600" /></div>
                <div><h2 className="text-lg font-bold text-gray-900">Compliance Focus</h2><p className="text-sm text-gray-500">What data do you process?</p></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Data Processing Activities</label>
                <div className="grid grid-cols-2 gap-3">
                  {demoData.dataProcessingOptions.map((o) => (
                    <button key={o.value} onClick={() => toggleDataProcessing(o.value)} className={`px-4 py-3 rounded-lg text-sm font-medium text-left transition-colors ${formData.dataProcessing.includes(o.value) ? "bg-purple-100 text-purple-700 border-2 border-purple-300" : "bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200"}`}>{o.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Specific Compliance Areas of Concern</label>
                <textarea value={formData.complianceFocus} onChange={(e) => updateFormData("complianceFocus", e.target.value)} rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none" placeholder="Any specific regulations or areas you're concerned about?" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
          <button onClick={onPrev} disabled={step === 1} className={`px-5 py-2.5 rounded-lg font-medium transition-colors ${step === 1 ? "text-gray-400 cursor-not-allowed" : "text-gray-700 hover:bg-gray-100"}`}>Back</button>
          <button onClick={onNext} disabled={!isStepValid()} className={`px-6 py-2.5 rounded-lg font-semibold transition-colors ${isStepValid() ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
            {step === 3 ? "Analyze My Business" : "Continue"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function ToggleOption({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} className={`p-4 rounded-lg text-left transition-colors ${checked ? "bg-blue-50 border-2 border-blue-300" : "bg-gray-50 border-2 border-transparent hover:bg-gray-100"}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium text-gray-900">{label}</span>
        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${checked ? "bg-blue-600" : "bg-gray-300"}`}>
          {checked && <Check className="w-3 h-3 text-white" />}
        </div>
      </div>
      <p className="text-sm text-gray-500">{description}</p>
    </button>
  );
}

function ProcessingScreen({ currentStep }: { currentStep: number }) {
  const steps = ["Analyzing business profile...", "Searching EUR-Lex database...", "Matching regulations to your business...", "Generating compliance summaries..."];
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="max-w-md mx-auto text-center py-12">
      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Analyzing Your Business</h2>
      <p className="text-gray-500 mb-8">Please wait while we scan EU regulations...</p>
      <div className="space-y-3 text-left">
        {steps.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: currentStep >= i ? 1 : 0.4, x: 0 }} transition={{ delay: i * 0.2 }}
            className={`flex items-center gap-3 p-3 rounded-lg ${currentStep > i ? "bg-green-50" : currentStep === i ? "bg-blue-50" : "bg-gray-50"}`}>
            {currentStep > i ? <Check className="w-5 h-5 text-green-600" /> : currentStep === i ? <Loader2 className="w-5 h-5 text-blue-600 animate-spin" /> : <div className="w-5 h-5 rounded-full border-2 border-gray-300" />}
            <span className={`text-sm ${currentStep >= i ? "text-gray-900" : "text-gray-400"}`}>{s}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function ResultsScreen({ formData, regulations, onReset }: { formData: FormData; regulations: MatchedRegulation[]; onReset: () => void }) {
  const handleExport = () => {
    const toast = document.createElement("div");
    toast.className = "fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg z-50";
    toast.textContent = "Export feature available in the full version.";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Compliance Scan Results</h1>
          <p className="text-gray-500">{regulations.length} potentially relevant regulations found</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExport} className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" /> Export Report
          </button>
          <button onClick={onReset} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            <RotateCcw className="w-4 h-4" /> New Scan
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 mb-6 text-white">
        <h2 className="text-lg font-bold mb-3">Business Profile Summary</h2>
        <p className="text-gray-300 leading-relaxed">
          <strong className="text-white">{formData.companyName || "Your company"}</strong> is a{" "}
          {demoData.industries.find((i) => i.value === formData.industry)?.label.toLowerCase() || "business"}{" "}
          company operating in <strong className="text-white">{formData.countries.length} EU countries</strong>
          {formData.hasEmployees && " with employees"}
          {formData.sellsOnline && " and online sales operations"}.
          {formData.dataProcessing.length > 0 && (
            <>{" "}The company processes {formData.dataProcessing.map((dp) => demoData.dataProcessingOptions.find((o) => o.value === dp)?.label.toLowerCase()).join(", ")}.</>
          )}
        </p>
      </div>

      <h2 className="text-lg font-bold text-gray-900 mb-4">Potentially Relevant Regulations</h2>
      <div className="space-y-4">
        {regulations.map((reg, i) => (
          <motion.div key={reg.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-bold text-gray-900">{reg.title}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${reg.relevanceScore >= 70 ? "bg-red-100 text-red-700" : reg.relevanceScore >= 40 ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-700"}`}>
                {reg.relevanceScore}% Match
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-3">{reg.reference}</p>
            <p className="text-gray-600 mb-4">{reg.summary}</p>
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm text-blue-800"><strong>Why this may apply:</strong> {reg.whyApplies}</p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-end">
              <a href={reg.eurLexUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700">
                View on EUR-Lex <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

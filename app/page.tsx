"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, ScanSearch, FileText, Settings, ChevronRight, Building2,
  Globe, Shield, Loader2, Check, ExternalLink, Download, RotateCcw, Monitor,
  ShieldAlert, Mail, Lightbulb, AlertTriangle, Clock, Users, TrendingUp,
  BookOpen, Bell, Wrench,
} from "lucide-react";
import { demoData, regulations, calculateRelevance, generateWhyApplies } from "@/data/regscope-data";

// ── Types ────────────────────────────────────────────────────────
type Screen = "dashboard" | "questionnaire" | "processing" | "results" | "risk-analysis" | "newsletter" | "recommendations" | "regulations-browse" | "settings";
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
  noCompanyYet: boolean;
  companySize: string;
  targetMarkets: string[];
  complianceStatus: string;
  complianceFocus: string;
  dataProcessing: string[];
}

const initialFormData: FormData = {
  companyName: "", industry: "", description: "", countries: [], products: "",
  hasEmployees: false, sellsOnline: false, noCompanyYet: false,
  companySize: "", targetMarkets: [], complianceStatus: "",
  complianceFocus: "", dataProcessing: [],
};

// ── Risk level helper ────────────────────────────────────────────
function getRiskLevel(score: number) {
  if (score >= 80) return { label: "High Risk", cls: "bg-red-100 text-red-700" };
  if (score >= 60) return { label: "Medium", cls: "bg-amber-100 text-amber-700" };
  return { label: "Low", cls: "bg-green-100 text-green-700" };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Main App
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function RegScopePage() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("dashboard");
  const [questionnaireStep, setQuestionnaireStep] = useState<QuestionnaireStep>(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [processingStep, setProcessingStep] = useState(0);
  const [matchedRegulations, setMatchedRegulations] = useState<MatchedRegulation[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (currentScreen !== "processing") return;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setProcessingStep(step);
      if (step >= 4) {
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
          .filter((r) => r.relevanceScore > 20)
          .sort((a, b) => b.relevanceScore - a.relevanceScore)
          .slice(0, 6);
        setMatchedRegulations(matched);
        setTimeout(() => setCurrentScreen("results"), 500);
      }
    }, 800);
    return () => clearInterval(interval);
  }, [currentScreen, formData]);

  const startScan = () => { setCurrentScreen("questionnaire"); setQuestionnaireStep(1); };
  const nextStep = () => { questionnaireStep < 3 ? setQuestionnaireStep((p) => (p + 1) as QuestionnaireStep) : (setProcessingStep(0), setCurrentScreen("processing")); };
  const prevStep = () => { if (questionnaireStep > 1) setQuestionnaireStep((p) => (p - 1) as QuestionnaireStep); };
  const reset = () => { setFormData(initialFormData); setQuestionnaireStep(1); setCurrentScreen("dashboard"); setMatchedRegulations([]); };
  const update = (field: keyof FormData, value: FormData[keyof FormData]) => setFormData((p) => ({ ...p, [field]: value }));
  const toggleArr = (field: "countries" | "dataProcessing" | "targetMarkets", val: string) => {
    setFormData((p) => {
      const arr = p[field] as string[];
      return { ...p, [field]: arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val] };
    });
  };

  const hasResults = matchedRegulations.length > 0;

  if (isMobile) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-sm text-center shadow-lg border border-gray-100">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4"><Monitor className="w-8 h-8 text-blue-600" /></div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Best Viewed on Desktop</h1>
          <p className="text-gray-600">RegScope is a full dashboard experience. Please open on a larger screen.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
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

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">Core</p>
          <NavItem icon={LayoutDashboard} label="Dashboard" active={currentScreen === "dashboard" || currentScreen === "results"} onClick={() => hasResults ? setCurrentScreen("results") : setCurrentScreen("dashboard")} />
          <NavItem icon={ScanSearch} label="New Scan" active={currentScreen === "questionnaire" || currentScreen === "processing"} onClick={startScan} />

          <p className="px-3 pt-4 pb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">Insights</p>
          <NavItem icon={ShieldAlert} label="Risk Analysis" badge="V2" active={currentScreen === "risk-analysis"} onClick={() => setCurrentScreen("risk-analysis")} />
          <NavItem icon={Lightbulb} label="Recommendations" badge="V2" active={currentScreen === "recommendations"} onClick={() => setCurrentScreen("recommendations")} />
          <NavItem icon={Mail} label="Newsletter" badge="V2" active={currentScreen === "newsletter"} onClick={() => setCurrentScreen("newsletter")} />

          <p className="px-3 pt-4 pb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">Library</p>
          <NavItem icon={FileText} label="Regulations" active={currentScreen === "regulations-browse"} onClick={() => setCurrentScreen("regulations-browse")} />
          <NavItem icon={Settings} label="Settings" active={currentScreen === "settings"} onClick={() => setCurrentScreen("settings")} />
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

      {/* ── Main ────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 shrink-0">
          <span className="text-sm font-medium text-gray-900">
            {currentScreen === "dashboard" && "Dashboard"}
            {currentScreen === "questionnaire" && "New Scan"}
            {currentScreen === "processing" && "Analyzing..."}
            {currentScreen === "results" && "Scan Results"}
            {currentScreen === "risk-analysis" && "Risk Analysis"}
            {currentScreen === "newsletter" && "Newsletter"}
            {currentScreen === "recommendations" && "Recommendations"}
            {currentScreen === "regulations-browse" && "Regulations"}
            {currentScreen === "settings" && "Settings"}
          </span>
        </header>

        <div className="flex-1 p-6 overflow-auto">
          <AnimatePresence mode="wait">
            {currentScreen === "dashboard" && <DashboardScreen key="d" onStartScan={startScan} />}
            {currentScreen === "questionnaire" && <QuestionnaireScreen key="q" step={questionnaireStep} formData={formData} update={update} toggleArr={toggleArr} onNext={nextStep} onPrev={prevStep} />}
            {currentScreen === "processing" && <ProcessingScreen key="p" currentStep={processingStep} />}
            {currentScreen === "results" && <ResultsScreen key="r" formData={formData} regulations={matchedRegulations} onReset={reset} />}
            {currentScreen === "risk-analysis" && <InPrepScreen key="ra" icon={ShieldAlert} color="red" title="Legal Risk Analysis" badge="In Preparation — Coming in V2" description="GPT-5.2 analyzes your business profile against each matched regulation, identifying specific compliance gaps, deadline requirements, and potential penalty exposure. Results are categorized by severity." mockup={<RiskAnalysisMockup />} />}
            {currentScreen === "newsletter" && <InPrepScreen key="nl" icon={Mail} color="blue" title="Regulation Newsletter" badge="In Preparation — Coming in V2" description="The system fetches recent EUR-Lex updates, matches them against your saved profile, generates a personalized digest, and sends it via email. Manual trigger for MVP, automated scheduling planned." mockup={<NewsletterMockup />} />}
            {currentScreen === "recommendations" && <InPrepScreen key="rc" icon={Lightbulb} color="amber" title="Actionable Recommendations" badge="In Preparation — Coming in V2" description="Based on matched regulations and risk analysis, GPT generates a prioritized action list: specific compliance steps, recommended insurance coverage types, suggested timeline, and where to find specialized help." mockup={<RecommendationsMockup />} />}
            {currentScreen === "regulations-browse" && <InPrepScreen key="rb" icon={FileText} color="gray" title="Regulations Database" badge="In Preparation" description="A searchable database of EU regulations relevant to your industry, with direct links to official EUR-Lex sources and AI-generated summaries." />}
            {currentScreen === "settings" && <InPrepScreen key="st" icon={Settings} color="gray" title="Settings" badge="In Preparation" description="Customize your compliance focus areas, notification preferences, and email digest frequency." />}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// ── NavItem ──────────────────────────────────────────────────────
function NavItem({ icon: Icon, label, active, badge, onClick }: {
  icon: React.ElementType; label: string; active?: boolean; badge?: string; onClick?: () => void;
}) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
      <Icon className="w-5 h-5 shrink-0" />
      <span className="flex-1 text-left">{label}</span>
      {badge && <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-purple-100 text-purple-600">{badge}</span>}
    </button>
  );
}

// ── Dashboard ────────────────────────────────────────────────────
function DashboardScreen({ onStartScan }: { onStartScan: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to RegScope</h1>
      <p className="text-gray-600 mb-8">Discover EU regulations that may apply to your business</p>
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 text-white mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold mb-2">Start Your First Scan</h2>
            <p className="text-blue-100 mb-6 max-w-md">Answer a few questions about your business and we&apos;ll identify potentially relevant EU regulations.</p>
            <button onClick={onStartScan} className="inline-flex items-center gap-2 bg-white text-blue-700 px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
              Start Scan <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="hidden md:flex w-24 h-24 bg-white/10 rounded-2xl items-center justify-center"><ScanSearch className="w-12 h-12 text-white/50" /></div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[{ v: "0", l: "Regulations Found", i: FileText }, { v: "0", l: "Scans Completed", i: ScanSearch }, { v: "-", l: "Last Scan", i: Clock }].map((s) => (
          <div key={s.l} className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center shrink-0"><s.i className="w-5 h-5 text-gray-400" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{s.v}</p><p className="text-sm text-gray-500">{s.l}</p></div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ── Questionnaire (V2 with extra fields) ─────────────────────────
function QuestionnaireScreen({ step, formData, update, toggleArr, onNext, onPrev }: {
  step: QuestionnaireStep; formData: FormData;
  update: (f: keyof FormData, v: FormData[keyof FormData]) => void;
  toggleArr: (f: "countries" | "dataProcessing" | "targetMarkets", v: string) => void;
  onNext: () => void; onPrev: () => void;
}) {
  const valid = step === 1 ? (formData.noCompanyYet || (formData.companyName && formData.industry)) : step === 2 ? formData.countries.length > 0 : true;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-900">Step {step} of 3</span>
          <span className="text-sm text-gray-500">{step === 1 && "Company Basics"}{step === 2 && "Operations"}{step === 3 && "Compliance Focus"}</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${(step / 3) * 100}%` }} /></div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><Building2 className="w-5 h-5 text-blue-600" /></div>
                <div><h2 className="text-lg font-bold text-gray-900">Company Basics</h2><p className="text-sm text-gray-500">Tell us about your business</p></div>
              </div>
              {/* No company yet toggle */}
              <label className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200 cursor-pointer">
                <input type="checkbox" checked={formData.noCompanyYet} onChange={(e) => update("noCompanyYet", e.target.checked)} className="w-4 h-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500" />
                <span className="text-sm text-amber-800 font-medium">I don&apos;t have a company yet (planning stage)</span>
              </label>
              {!formData.noCompanyYet && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
                    <input type="text" value={formData.companyName} onChange={(e) => update("companyName", e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="Enter your company name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Industry *</label>
                    <select value={formData.industry} onChange={(e) => update("industry", e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                      <option value="">Select an industry</option>
                      {demoData.industries.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Size</label>
                    <div className="flex gap-2">
                      {demoData.companySizes.map((s) => (
                        <button key={s.value} onClick={() => update("companySize", s.value)} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${formData.companySize === s.value ? "bg-blue-100 text-blue-700 border-2 border-blue-300" : "bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200"}`}>{s.label}</button>
                      ))}
                    </div>
                  </div>
                </>
              )}
              {formData.noCompanyYet && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Planned Industry *</label>
                    <select value={formData.industry} onChange={(e) => update("industry", e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                      <option value="">Select planned industry</option>
                      {demoData.industries.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Business Description</label>
                    <textarea value={formData.description} onChange={(e) => update("description", e.target.value)} rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none" placeholder="Describe your planned business model..." />
                  </div>
                </>
              )}
            </motion.div>
          )}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><Globe className="w-5 h-5 text-green-600" /></div>
                <div><h2 className="text-lg font-bold text-gray-900">Operations</h2><p className="text-sm text-gray-500">Where and how do you operate?</p></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">{formData.noCompanyYet ? "Target Countries *" : "Operating Countries *"}</label>
                <div className="flex flex-wrap gap-2">
                  {demoData.countries.map((c) => (
                    <button key={c.value} onClick={() => toggleArr("countries", c.value)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${formData.countries.includes(c.value) ? "bg-blue-100 text-blue-700 border-2 border-blue-300" : "bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200"}`}>{c.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Target Market</label>
                <div className="flex gap-2">
                  {demoData.targetMarkets.map((m) => (
                    <button key={m.value} onClick={() => toggleArr("targetMarkets", m.value)} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${formData.targetMarkets.includes(m.value) ? "bg-green-100 text-green-700 border-2 border-green-300" : "bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200"}`}>{m.label}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Toggle label="Has Employees" desc="Do you have employees?" checked={formData.hasEmployees} onChange={(v) => update("hasEmployees", v)} />
                <Toggle label="Sells Online" desc="Do you sell online?" checked={formData.sellsOnline} onChange={(v) => update("sellsOnline", v)} />
              </div>
            </motion.div>
          )}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center"><Shield className="w-5 h-5 text-purple-600" /></div>
                <div><h2 className="text-lg font-bold text-gray-900">Compliance Focus</h2><p className="text-sm text-gray-500">What data do you process?</p></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Compliance Status</label>
                <div className="flex gap-2">
                  {demoData.complianceStatuses.map((s) => (
                    <button key={s.value} onClick={() => update("complianceStatus", s.value)} className={`flex-1 py-2.5 rounded-lg text-xs font-medium transition-colors ${formData.complianceStatus === s.value ? "bg-purple-100 text-purple-700 border-2 border-purple-300" : "bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200"}`}>{s.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Data Processing Activities</label>
                <div className="grid grid-cols-2 gap-3">
                  {demoData.dataProcessingOptions.map((o) => (
                    <button key={o.value} onClick={() => toggleArr("dataProcessing", o.value)} className={`px-4 py-3 rounded-lg text-sm font-medium text-left transition-colors ${formData.dataProcessing.includes(o.value) ? "bg-purple-100 text-purple-700 border-2 border-purple-300" : "bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200"}`}>{o.label}</button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
          <button onClick={onPrev} disabled={step === 1} className={`px-5 py-2.5 rounded-lg font-medium transition-colors ${step === 1 ? "text-gray-400 cursor-not-allowed" : "text-gray-700 hover:bg-gray-100"}`}>Back</button>
          <button onClick={onNext} disabled={!valid} className={`px-6 py-2.5 rounded-lg font-semibold transition-colors ${valid ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
            {step === 3 ? (formData.noCompanyYet ? "Generate Pre-launch Checklist" : "Analyze My Business") : "Continue"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function Toggle({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} className={`p-4 rounded-lg text-left transition-colors ${checked ? "bg-blue-50 border-2 border-blue-300" : "bg-gray-50 border-2 border-transparent hover:bg-gray-100"}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium text-gray-900">{label}</span>
        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${checked ? "bg-blue-600" : "bg-gray-300"}`}>{checked && <Check className="w-3 h-3 text-white" />}</div>
      </div>
      <p className="text-sm text-gray-500">{desc}</p>
    </button>
  );
}

// ── Processing ───────────────────────────────────────────────────
function ProcessingScreen({ currentStep }: { currentStep: number }) {
  const steps = ["Analyzing business profile...", "Searching EUR-Lex database...", "Matching regulations to your business...", "Generating compliance summaries..."];
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="max-w-md mx-auto text-center py-12">
      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6"><Loader2 className="w-10 h-10 text-blue-600 animate-spin" /></div>
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

// ── Results (with stats bar, risk badges, key requirements, penalties) ──
function ResultsScreen({ formData, regulations, onReset }: { formData: FormData; regulations: MatchedRegulation[]; onReset: () => void }) {
  const highPriority = regulations.filter((r) => r.relevanceScore >= 80).length;
  const complianceScore = Math.round(100 - (regulations.reduce((a, r) => a + r.relevanceScore, 0) / regulations.length));
  const n = formData.countries.length;
  const countryText = n === 1 ? "1 EU country" : `${n} EU countries`;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Compliance Scan Results</h1>
          <p className="text-gray-500">{regulations.length} potentially relevant regulations found</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { const t = document.createElement("div"); t.className = "fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg z-50"; t.textContent = "Export feature available in the full version."; document.body.appendChild(t); setTimeout(() => t.remove(), 3000); }}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"><Download className="w-4 h-4" /> Export Report</button>
          <button onClick={onReset} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"><RotateCcw className="w-4 h-4" /> New Scan</button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { v: String(regulations.length), l: "Regulations Found", i: FileText, c: "text-blue-600 bg-blue-100" },
          { v: String(highPriority), l: "High Priority", i: AlertTriangle, c: "text-red-600 bg-red-100" },
          { v: countryText, l: "EU Coverage", i: Globe, c: "text-green-600 bg-green-100" },
          { v: `${complianceScore}%`, l: "Compliance Score", i: TrendingUp, c: "text-purple-600 bg-purple-100" },
        ].map((s) => (
          <div key={s.l} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${s.c}`}><s.i className="w-5 h-5" /></div>
            <div><p className="text-lg font-bold text-gray-900">{s.v}</p><p className="text-xs text-gray-500">{s.l}</p></div>
          </div>
        ))}
      </div>

      {/* Business summary */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 mb-6 text-white">
        <h2 className="text-lg font-bold mb-3">Business Profile Summary</h2>
        <p className="text-gray-300 leading-relaxed">
          <strong className="text-white">{formData.companyName || "Your company"}</strong> is a{" "}
          {demoData.industries.find((i) => i.value === formData.industry)?.label.toLowerCase() || "business"}{" "}
          company operating in <strong className="text-white">{countryText}</strong>
          {formData.hasEmployees && " with employees"}
          {formData.sellsOnline && " and online sales operations"}.
          {formData.dataProcessing.length > 0 && (<>{" "}The company processes {formData.dataProcessing.map((dp) => demoData.dataProcessingOptions.find((o) => o.value === dp)?.label.toLowerCase()).join(", ")}.</>)}
        </p>
      </div>

      {/* Regulation cards */}
      <h2 className="text-lg font-bold text-gray-900 mb-4">Potentially Relevant Regulations</h2>
      <div className="space-y-4">
        {regulations.map((reg, i) => {
          const risk = getRiskLevel(reg.relevanceScore);
          return (
            <motion.div key={reg.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h3 className="font-bold text-gray-900">{reg.title}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${reg.relevanceScore >= 70 ? "bg-red-100 text-red-700" : reg.relevanceScore >= 40 ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-700"}`}>{reg.relevanceScore}% Match</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${risk.cls}`}>{risk.label}</span>
              </div>
              <p className="text-sm text-gray-500 mb-3">{reg.reference}</p>
              <p className="text-gray-600 mb-4">{reg.summary}</p>

              {/* Key requirements */}
              {"keyRequirements" in reg && reg.keyRequirements && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">Key Requirements</p>
                  <ul className="space-y-1">
                    {reg.keyRequirements.map((r: string, j: number) => (
                      <li key={j} className="text-sm text-gray-600 flex items-start gap-2"><Check className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Penalty */}
              {"potentialPenalty" in reg && reg.potentialPenalty && (
                <div className="mb-4 p-3 bg-red-50 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800"><strong>Potential Penalty:</strong> {reg.potentialPenalty}</p>
                </div>
              )}

              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm text-blue-800"><strong>Why this may apply:</strong> {reg.whyApplies}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-end">
                <a href={reg.eurLexUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700">View on EUR-Lex <ExternalLink className="w-4 h-4" /></a>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// "In Preparation" Template
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function InPrepScreen({ icon: Icon, color, title, badge, description, mockup }: {
  icon: React.ElementType; color: string; title: string; badge: string; description: string; mockup?: React.ReactNode;
}) {
  const colorMap: Record<string, { bg: string; text: string; badge: string }> = {
    red: { bg: "bg-red-100", text: "text-red-600", badge: "bg-red-100 text-red-700 border-red-200" },
    blue: { bg: "bg-blue-100", text: "text-blue-600", badge: "bg-blue-100 text-blue-700 border-blue-200" },
    amber: { bg: "bg-amber-100", text: "text-amber-600", badge: "bg-amber-100 text-amber-700 border-amber-200" },
    gray: { bg: "bg-gray-100", text: "text-gray-600", badge: "bg-gray-100 text-gray-700 border-gray-200" },
  };
  const c = colorMap[color] || colorMap.gray;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-12 h-12 ${c.bg} rounded-xl flex items-center justify-center`}><Icon className={`w-6 h-6 ${c.text}`} /></div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <span className={`inline-block mt-1 text-xs font-bold px-2.5 py-1 rounded-full border ${c.badge}`}>{badge}</span>
        </div>
      </div>
      <p className="text-gray-600 mb-8 leading-relaxed">{description}</p>
      {mockup && <div className="mb-6">{mockup}</div>}
    </motion.div>
  );
}

// ── Risk Analysis Mockup ─────────────────────────────────────────
function RiskAnalysisMockup() {
  const rows = [
    { reg: "GDPR", severity: "High", gap: "No Data Protection Officer appointed", deadline: "Q2 2026", penalty: "Up to €20M or 4% turnover" },
    { reg: "NIS2 Directive", severity: "High", gap: "No incident reporting process", deadline: "Q3 2026", penalty: "Up to €10M or 2% turnover" },
    { reg: "ePrivacy", severity: "Medium", gap: "Cookie consent mechanism incomplete", deadline: "Q1 2026", penalty: "Up to €500K" },
    { reg: "AI Act", severity: "Low", gap: "AI system risk classification pending", deadline: "Q4 2026", penalty: "Up to €35M or 7% turnover" },
  ];
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead><tr className="bg-gray-50 border-b border-gray-200">
          <th className="text-left px-4 py-3 font-semibold text-gray-700">Regulation</th>
          <th className="text-left px-4 py-3 font-semibold text-gray-700">Severity</th>
          <th className="text-left px-4 py-3 font-semibold text-gray-700">Compliance Gap</th>
          <th className="text-left px-4 py-3 font-semibold text-gray-700">Deadline</th>
          <th className="text-left px-4 py-3 font-semibold text-gray-700">Potential Penalty</th>
        </tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.reg} className="border-b border-gray-100 last:border-0">
              <td className="px-4 py-3 font-medium text-gray-900">{r.reg}</td>
              <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${r.severity === "High" ? "bg-red-100 text-red-700" : r.severity === "Medium" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>{r.severity}</span></td>
              <td className="px-4 py-3 text-gray-600">{r.gap}</td>
              <td className="px-4 py-3 text-gray-600">{r.deadline}</td>
              <td className="px-4 py-3 text-gray-600">{r.penalty}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Newsletter Mockup ────────────────────────────────────────────
function NewsletterMockup() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
      {/* Email preview */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-blue-600 px-5 py-3 flex items-center gap-2"><ScanSearch className="w-4 h-4 text-white" /><span className="text-white font-bold text-sm">RegScope</span></div>
        <div className="p-5">
          <h3 className="font-bold text-gray-900 mb-3">Your Weekly Regulation Update</h3>
          {[
            { title: "GDPR — New amendment on cross-border transfers", tag: "New Amendment", tagCls: "bg-blue-100 text-blue-700" },
            { title: "NIS2 — Implementation deadline approaching", tag: "Deadline", tagCls: "bg-red-100 text-red-700" },
            { title: "AI Act — Updated risk classification guidelines", tag: "Update", tagCls: "bg-amber-100 text-amber-700" },
          ].map((item) => (
            <div key={item.title} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
              <span className="text-sm text-gray-700">{item.title}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${item.tagCls}`}>{item.tag}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Frequency toggle */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Digest Frequency</span>
        <div className="flex gap-2">
          {["Weekly", "Monthly"].map((f) => (
            <button key={f} className={`px-4 py-1.5 rounded-lg text-sm font-medium ${f === "Weekly" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}>{f}</button>
          ))}
        </div>
      </div>
      <button className="w-full py-2.5 bg-gray-200 text-gray-400 rounded-lg font-medium cursor-not-allowed" disabled>Send Test Newsletter</button>
    </div>
  );
}

// ── Recommendations Mockup ───────────────────────────────────────
function RecommendationsMockup() {
  const items = [
    { action: "Appoint a Data Protection Officer (DPO)", timeline: "Immediate", type: "action" },
    { action: "Conduct Data Protection Impact Assessment", timeline: "Within 30 days", type: "action" },
    { action: "Professional indemnity insurance for GDPR liability", timeline: "Within 30 days", type: "insurance" },
    { action: "Implement incident reporting process for NIS2", timeline: "Within 90 days", type: "action" },
    { action: "Cyber liability insurance coverage", timeline: "Within 90 days", type: "insurance" },
  ];
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${item.type === "insurance" ? "bg-amber-100" : "bg-blue-100"}`}>
              {item.type === "insurance" ? <Shield className="w-3.5 h-3.5 text-amber-600" /> : <Check className="w-3.5 h-3.5 text-blue-600" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{item.action}</p>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">{item.timeline}</span>
                {item.type === "insurance" && <span className="text-xs bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-medium">Insurance</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

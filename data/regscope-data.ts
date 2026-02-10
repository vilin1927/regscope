// Proposal data for Orgonic-Art (Raphael) - EU Regulation Discovery Tool

export const proposalDataV1 = {
  stats: [
    { value: "$540", label: "Fixed Price" },
    { value: "5-7", label: "Days Delivery" },
  ],
  pricing: {
    amount: "$540",
    hours: "fixed price",
    deliverables: [
      "Complete source code (Next.js + Supabase)",
      "Working questionnaire with validation",
      "GPT-5.2 business profile generation",
      "Live EUR-Lex regulation search",
      "AI-powered relevance matching",
      "Clean results dashboard",
      "Single-user authentication",
      "Vercel deployment + handoff docs",
    ],
  },
  timeline: [
    {
      phase: "Days 1-2",
      title: "Foundation",
      tasks: [
        "Next.js project setup",
        "Supabase Auth integration",
        "Questionnaire UI & validation",
        "Database schema (minimal)",
      ],
    },
    {
      phase: "Days 3-4",
      title: "AI + EUR-Lex",
      tasks: [
        "OpenAI GPT-5.2 profiling",
        "EUR-Lex REST API search",
        "AI regulation matching",
        "Summary generation",
      ],
    },
    {
      phase: "Days 5-7",
      title: "Dashboard & Deploy",
      tasks: [
        "Results dashboard UI",
        "Mobile responsiveness",
        "Vercel deployment",
        "Testing & handoff",
      ],
    },
  ],
};

export const proposalDataV2 = {
  stats: [
    { value: "$810", label: "Fixed Price" },
    { value: "7", label: "Days Deadline" },
    { value: "9", label: "Days Redline" },
  ],
  pricing: {
    amount: "$810",
    hours: "fixed price",
    breakdown: [
      { item: "Core MVP foundation", price: "$540" },
      { item: "Newsletter (manual trigger)", price: "$150" },
      { item: "Company analysis fallback", price: "$60" },
      { item: "Legal risk analysis", price: "$60" },
    ],
    deliverables: [
      "Everything in Version 1, plus:",
      "Legal risk analysis & severity categorization",
      "Company analysis with web search fallback",
      "Actionable recommendations engine",
      "Newsletter email system (Resend)",
      "Extended questionnaire for better matching",
    ],
  },
  timeline: [
    {
      phase: "Days 1-2",
      title: "Foundation",
      tasks: [
        "Next.js project setup",
        "Supabase Auth integration",
        "Questionnaire UI & validation",
        "Database schema",
      ],
    },
    {
      phase: "Days 3-4",
      title: "AI + EUR-Lex + Enhanced",
      tasks: [
        "OpenAI GPT-5.2 profiling",
        "EUR-Lex REST API search",
        "AI regulation matching",
        "Legal risk analysis prompt",
        "Company analysis fallback logic",
        "Recommendations engine",
      ],
    },
    {
      phase: "Days 5-6",
      title: "Dashboard & Newsletter",
      tasks: [
        "Results dashboard UI",
        "Newsletter email system (Resend)",
        "Scheduled Edge Function (cron)",
        "Mobile responsiveness",
      ],
    },
    {
      phase: "Day 7",
      title: "Deploy & Handoff",
      tasks: [
        "Vercel deployment",
        "Testing & QA",
        "Documentation & handoff",
      ],
    },
  ],
  newFeatures: [
    {
      id: "legal-risk",
      title: "Legal Risk Analysis",
      icon: "shield-alert",
      tag: "$60",
      tagColor: "blue",
      description: "Automatically identifies potential legal problems and compliance risks specific to your business type and EU market.",
      howItWorks: "GPT-5.2 analyzes your business profile against each matched regulation, identifying specific compliance gaps, deadline requirements, and potential penalty exposure. Results are categorized by severity (high/medium/low) with clear explanations.",
    },
    {
      id: "newsletter",
      title: "Regulation Newsletter",
      icon: "mail",
      tag: "$150",
      tagColor: "blue",
      description: "Personalized email digest with new regulations matched to each user's saved profile. Manual trigger for MVP — scalable to automated later.",
      howItWorks: "Admin triggers newsletter via dashboard button. System fetches recent EUR-Lex updates, matches against each opted-in user's profile (industry, countries, data types), generates personalized digest, and sends via Resend. Includes double opt-in consent flow. Future upgrade path: automated weekly/monthly cron scheduling.",
      requirement: "Requires your own domain for email sending (e.g., regscope.eu). DNS verification needed for Resend. I can help set it up.",
    },
    {
      id: "company-analysis",
      title: "Company Analysis (Fallback)",
      icon: "building",
      tag: "$60",
      tagColor: "blue",
      description: "When EUR-Lex has no clear match, the system provides industry insights, expert recommendations, and what similar companies report about the topic.",
      howItWorks: "If EUR-Lex returns few/no results, the system activates OpenAI Web Search to find industry reports, compliance guides, and expert opinions. GPT synthesizes this into actionable context: 'Companies like yours typically face X, Y, Z...'",
    },
    {
      id: "recommendations",
      title: "Actionable Recommendations",
      icon: "lightbulb",
      tag: "Bundled Free",
      tagColor: "green",
      description: "Practical next steps including relevant insurance types, broker suggestions, and compliance action items tailored to your business. Included free with Legal Risk Analysis.",
      howItWorks: "Based on matched regulations and risk analysis, GPT generates a prioritized action list: specific compliance steps, recommended insurance coverage types, suggested timeline, and where to find specialized help (e.g., 'Consider professional indemnity insurance for GDPR liability').",
    },
  ],
  apiCosts: [
    { component: "AI Analysis", model: "GPT-5.2", cost: "~$0.05 - $0.08" },
    { component: "Web Search", model: "OpenAI Search", cost: "~$0.03 per call" },
    { component: "EUR-Lex API", model: "SPARQL", cost: "Free" },
    { component: "Email sending", model: "Resend", cost: "Free (3,000/mo, requires your domain)", url: "https://resend.com/pricing" },
  ],
};

export const proposalData = {
  client: {
    name: "Orgonic-Art",
    contact: "Raphael",
    location: "Germany",
  },
  project: {
    title: "EU Regulation Discovery Tool",
    subtitle: "AI-powered compliance scanning for EU businesses",
    description:
      "A smart tool that analyzes your business profile and automatically identifies potentially relevant EU regulations, complete with summaries and direct links to official sources.",
  },
  approach: [
    {
      title: "Smart Questionnaire",
      description:
        "Intuitive onboarding form that captures business details, operations, and compliance focus areas.",
      icon: "clipboard-list",
    },
    {
      title: "AI Business Profiling",
      description:
        "OpenAI GPT-5.2 analyzes your inputs to build a comprehensive understanding of your regulatory landscape.",
      icon: "brain",
    },
    {
      title: "EUR-Lex Integration",
      description:
        "Direct connection to the official EU law database for accurate, up-to-date regulation data.",
      icon: "database",
    },
    {
      title: "Web Search Integration",
      description:
        "Real-time web search ensures regulation data is current beyond GPT's training cutoff, filling gaps with industry insights and expert sources.",
      icon: "globe",
    },
    {
      title: "AI Matching & Summary",
      description:
        "Intelligent matching algorithm identifies relevant regulations and generates plain-language summaries.",
      icon: "sparkles",
    },
    {
      title: "Clean Dashboard",
      description:
        "Results displayed in a professional, easy-to-navigate interface with export capabilities.",
      icon: "layout-dashboard",
    },
  ],
  techStack: [
    { name: "Next.js 14", category: "Frontend" },
    { name: "React", category: "Frontend" },
    { name: "Tailwind CSS", category: "Styling" },
    { name: "Supabase", category: "Backend + Auth" },
    { name: "OpenAI GPT-5.2", category: "AI" },
    { name: "OpenAI Web Search", category: "Fresh Data" },
    { name: "EUR-Lex REST API", category: "Data Source" },
    { name: "Resend", category: "Email", url: "https://resend.com/pricing" },
    { name: "Vercel", category: "Hosting" },
  ],
  cherryPick: [
    { scope: "Core MVP only", price: "$540" },
    { scope: "MVP + 1 add-on", price: "from $600" },
    { scope: "MVP + 2 add-ons", price: "from $660" },
    { scope: "Full V2 (all features)", price: "$810" },
  ],
};

// Demo data for RegScope
export const demoData = {
  appName: "RegScope",
  tagline: "EU Regulation Discovery",
  user: {
    email: "demo@company.com",
    company: "Demo Company",
  },
  industries: [
    { value: "technology", label: "Technology / Software" },
    { value: "healthcare", label: "Healthcare / Medical" },
    { value: "finance", label: "Finance / Banking" },
    { value: "manufacturing", label: "Manufacturing" },
    { value: "retail", label: "Retail / E-commerce" },
    { value: "energy", label: "Energy / Utilities" },
    { value: "other", label: "Other" },
  ],
  countries: [
    { value: "DE", label: "Germany" },
    { value: "FR", label: "France" },
    { value: "NL", label: "Netherlands" },
    { value: "ES", label: "Spain" },
    { value: "IT", label: "Italy" },
    { value: "PL", label: "Poland" },
    { value: "BE", label: "Belgium" },
    { value: "AT", label: "Austria" },
    { value: "SE", label: "Sweden" },
    { value: "OTHER", label: "Other EU" },
  ],
  dataProcessingOptions: [
    { value: "customer_data", label: "Customer personal data" },
    { value: "employee_data", label: "Employee data" },
    { value: "health_data", label: "Health/medical data" },
    { value: "financial_data", label: "Financial transactions" },
    { value: "location_data", label: "Location tracking" },
    { value: "ai_processing", label: "AI/ML processing" },
  ],
};

// EUR-Lex regulation data with real links
export const regulations = [
  {
    id: "gdpr",
    title: "General Data Protection Regulation (GDPR)",
    reference: "Regulation (EU) 2016/679",
    date: "2016-04-27",
    summary:
      "Comprehensive data protection law governing how personal data of EU residents must be collected, processed, stored, and transferred. Applies to any organization handling EU citizen data.",
    eurLexUrl: "https://eur-lex.europa.eu/eli/reg/2016/679/oj",
    triggers: ["customer_data", "employee_data", "health_data", "location_data"],
    industries: ["all"],
  },
  {
    id: "dsa",
    title: "Digital Services Act (DSA)",
    reference: "Regulation (EU) 2022/2065",
    date: "2022-10-19",
    summary:
      "Regulates digital services and online platforms, establishing accountability for content moderation, transparency requirements, and user safety measures across the EU.",
    eurLexUrl: "https://eur-lex.europa.eu/eli/reg/2022/2065/oj",
    triggers: ["sellsOnline"],
    industries: ["technology", "retail"],
  },
  {
    id: "nis2",
    title: "NIS2 Directive",
    reference: "Directive (EU) 2022/2555",
    date: "2022-12-14",
    summary:
      "Network and Information Security directive requiring essential and important entities to implement cybersecurity risk management measures and report significant incidents.",
    eurLexUrl: "https://eur-lex.europa.eu/eli/dir/2022/2555/oj",
    triggers: ["hasEmployees"],
    industries: ["technology", "energy", "healthcare", "finance"],
  },
  {
    id: "ai_act",
    title: "EU AI Act",
    reference: "Regulation (EU) 2024/1689",
    date: "2024-07-12",
    summary:
      "World's first comprehensive AI regulation establishing rules for AI systems based on risk levels, from minimal to unacceptable risk, with specific requirements for high-risk applications.",
    eurLexUrl: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj",
    triggers: ["ai_processing"],
    industries: ["technology", "healthcare", "finance"],
  },
  {
    id: "dora",
    title: "Digital Operational Resilience Act (DORA)",
    reference: "Regulation (EU) 2022/2554",
    date: "2022-12-14",
    summary:
      "Establishes uniform requirements for the security of network and information systems of financial entities, including ICT risk management and incident reporting.",
    eurLexUrl: "https://eur-lex.europa.eu/eli/reg/2022/2554/oj",
    triggers: ["financial_data"],
    industries: ["finance"],
  },
  {
    id: "product_safety",
    title: "General Product Safety Regulation",
    reference: "Regulation (EU) 2023/988",
    date: "2023-05-10",
    summary:
      "Ensures that products placed on the EU market are safe, establishing safety requirements for consumer products and obligations for economic operators in the supply chain.",
    eurLexUrl: "https://eur-lex.europa.eu/eli/reg/2023/988/oj",
    triggers: [],
    industries: ["manufacturing", "retail"],
  },
  {
    id: "eprivacy",
    title: "ePrivacy Directive",
    reference: "Directive 2002/58/EC",
    date: "2002-07-12",
    summary:
      "Regulates privacy and electronic communications, including rules on cookies, direct marketing, and confidentiality of communications. Often called the 'Cookie Law'.",
    eurLexUrl: "https://eur-lex.europa.eu/eli/dir/2002/58/oj",
    triggers: ["sellsOnline", "location_data"],
    industries: ["all"],
  },
  {
    id: "mdr",
    title: "Medical Devices Regulation",
    reference: "Regulation (EU) 2017/745",
    date: "2017-05-05",
    summary:
      "Establishes rules for placing medical devices on the EU market, ensuring high standards of quality and safety for medical devices and in vitro diagnostic medical devices.",
    eurLexUrl: "https://eur-lex.europa.eu/eli/reg/2017/745/oj",
    triggers: ["health_data"],
    industries: ["healthcare"],
  },
];

// Helper function to calculate relevance score
export function calculateRelevance(
  regulation: (typeof regulations)[0],
  formData: {
    industry: string;
    dataProcessing: string[];
    sellsOnline: boolean;
    hasEmployees: boolean;
  }
): number {
  let score = 0;
  const maxScore = 100;

  // Industry match
  if (
    regulation.industries.includes("all") ||
    regulation.industries.includes(formData.industry)
  ) {
    score += 40;
  }

  // Data processing triggers
  const matchingTriggers = regulation.triggers.filter((trigger) =>
    formData.dataProcessing.includes(trigger)
  );
  score += matchingTriggers.length * 15;

  // Boolean triggers
  if (regulation.triggers.includes("sellsOnline") && formData.sellsOnline) {
    score += 20;
  }
  if (regulation.triggers.includes("hasEmployees") && formData.hasEmployees) {
    score += 10;
  }

  return Math.min(score, maxScore);
}

// Generate "why applies" text based on form data
export function generateWhyApplies(
  regulation: (typeof regulations)[0],
  formData: {
    companyName: string;
    industry: string;
    dataProcessing: string[];
    sellsOnline: boolean;
    hasEmployees: boolean;
    countries: string[];
  }
): string {
  const reasons: string[] = [];

  if (regulation.id === "gdpr") {
    if (formData.dataProcessing.includes("customer_data")) {
      reasons.push("processes customer personal data");
    }
    if (formData.dataProcessing.includes("employee_data")) {
      reasons.push("handles employee information");
    }
    if (formData.countries.length > 0) {
      reasons.push(`operates in ${formData.countries.length} EU countries`);
    }
  }

  if (regulation.id === "dsa" && formData.sellsOnline) {
    reasons.push("operates an online platform/service");
  }

  if (regulation.id === "ai_act" && formData.dataProcessing.includes("ai_processing")) {
    reasons.push("uses AI/ML in business processes");
  }

  if (regulation.id === "dora" && formData.industry === "finance") {
    reasons.push("operates in the financial services sector");
  }

  if (regulation.id === "nis2" && formData.hasEmployees) {
    reasons.push("has employees and IT infrastructure");
  }

  if (reasons.length === 0) {
    reasons.push("operates within the EU market");
  }

  return `Your business ${reasons.join(", ")}, making this regulation potentially applicable.`;
}

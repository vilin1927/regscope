// RegScope — EU Regulation Discovery Tool (Investor Demo Data)

export const demoData = {
  appName: "RegScope",
  tagline: "EU Regulation Discovery",
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
  companySizes: [
    { value: "1-10", label: "1–10" },
    { value: "11-50", label: "11–50" },
    { value: "51-200", label: "51–200" },
    { value: "200+", label: "200+" },
  ],
  targetMarkets: [
    { value: "B2B", label: "B2B" },
    { value: "B2C", label: "B2C" },
    { value: "B2G", label: "B2G" },
  ],
  complianceStatuses: [
    { value: "not_started", label: "Not started" },
    { value: "in_progress", label: "In progress" },
    { value: "partial", label: "Partially compliant" },
    { value: "certified", label: "Certified" },
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

// Regulation data with fixed scores, key requirements, penalties
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
    keyRequirements: [
      "Appoint a Data Protection Officer (DPO)",
      "Maintain records of processing activities",
      "Conduct Data Protection Impact Assessments (DPIA)",
    ],
    potentialPenalty: "Up to €20M or 4% of annual global turnover",
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
    keyRequirements: [
      "Publish transparency reports on content moderation",
      "Implement notice-and-action mechanisms",
      "Provide clear terms of service",
    ],
    potentialPenalty: "Up to 6% of annual global turnover",
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
    keyRequirements: [
      "Implement cybersecurity risk management measures",
      "Report significant incidents within 24 hours",
      "Ensure supply chain security",
    ],
    potentialPenalty: "Up to €10M or 2% of annual global turnover",
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
    keyRequirements: [
      "Classify AI systems by risk level",
      "Implement human oversight for high-risk AI",
      "Maintain technical documentation and logging",
    ],
    potentialPenalty: "Up to €35M or 7% of annual global turnover",
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
    keyRequirements: [
      "Establish ICT risk management framework",
      "Test digital operational resilience regularly",
      "Report major ICT-related incidents",
    ],
    potentialPenalty: "Up to €5M or 1% of average daily turnover",
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
    keyRequirements: [
      "Ensure products meet EU safety standards",
      "Maintain product traceability throughout supply chain",
      "Report dangerous products to authorities",
    ],
    potentialPenalty: "Varies by member state — product recall + fines",
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
    keyRequirements: [
      "Obtain consent for cookies and tracking",
      "Provide opt-out for direct marketing",
      "Ensure confidentiality of communications",
    ],
    potentialPenalty: "Varies by member state — typically up to €500K",
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
    keyRequirements: [
      "Obtain CE marking through conformity assessment",
      "Implement post-market surveillance system",
      "Register devices in EUDAMED database",
    ],
    potentialPenalty: "Varies by member state — product withdrawal + fines",
  },
];

// Fixed relevance scoring — produces realistic scores per the action plan
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

  // Industry match
  if (regulation.industries.includes("all") || regulation.industries.includes(formData.industry)) {
    score += 45;
  }

  // Data processing triggers — higher weight
  const matchingTriggers = regulation.triggers.filter((t) => formData.dataProcessing.includes(t));
  score += matchingTriggers.length * 18;

  // Boolean triggers
  if (regulation.triggers.includes("sellsOnline") && formData.sellsOnline) score += 25;
  if (regulation.triggers.includes("hasEmployees") && formData.hasEmployees) score += 13;

  // Boost known high-relevance regs when conditions clearly met
  if (regulation.id === "gdpr" && matchingTriggers.length >= 2) score += 11;
  if (regulation.id === "eprivacy" && formData.sellsOnline) score += 15;

  return Math.min(score, 100);
}

// Specific, professional "why applies" text
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
  const n = formData.countries.length;
  const countryText = n === 1 ? "1 EU country" : `${n} EU countries`;

  switch (regulation.id) {
    case "gdpr":
      return `You process customer personal data and operate in ${countryText} with employees. GDPR applies directly to your data processing activities.`;
    case "eprivacy":
      return `As an online business in the EU, cookie consent and electronic communications rules apply to your digital presence.`;
    case "dsa":
      return `Digital service providers in the EU must comply with transparency and content moderation obligations under the DSA.`;
    case "ai_act":
      return `Your technology includes AI/ML processing — the EU AI Act's risk classification requirements may apply to your systems.`;
    case "nis2":
      return `Tech companies with employees and IT infrastructure in the EU are within scope of NIS2 cybersecurity requirements.`;
    case "dora":
      return `Financial entities must comply with DORA's ICT risk management and operational resilience requirements.`;
    case "product_safety":
      return `Products placed on the EU market must meet the General Product Safety Regulation's safety and traceability requirements.`;
    case "mdr":
      return `Processing health/medical data brings your operations into scope of the Medical Devices Regulation and related compliance.`;
    default:
      return `Your business operates within the EU market, making this regulation potentially applicable.`;
  }
}

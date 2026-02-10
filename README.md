# RegScope — EU Regulation Discovery Tool

Investor-ready demo for Orgonic-Art. Helps EU businesses discover which regulations apply to them through an interactive questionnaire and AI-powered matching.

**Client:** Raphael @ Orgonic-Art
**Built by:** AutoFlux
**Stack:** Next.js 16, React 19, Tailwind CSS 4, Framer Motion, Lucide Icons
**Deployed on:** Vercel (auto-deploy from `main`)

## What It Does

1. **3-step questionnaire** — Company basics, operations (countries, employees, online sales), compliance focus (data processing activities)
2. **AI-powered scan** — Matches the business profile against 8 EU regulations (GDPR, DSA, NIS2, AI Act, DORA, ePrivacy, Product Safety, MDR)
3. **Results dashboard** — Stats bar, risk badges (High/Medium/Low), key requirements, penalty warnings, EUR-Lex links
4. **V2 preview tabs** — "In Preparation" pages for Risk Analysis, Recommendations, and Newsletter with detailed mockups

## Project Structure

```
regscope/
├── app/
│   ├── page.tsx          # Main app — all screens (dashboard, questionnaire, processing, results, V2 tabs)
│   ├── layout.tsx        # Root layout with metadata
│   └── globals.css       # Tailwind imports
├── data/
│   └── regscope-data.ts  # Regulation database, scoring logic, questionnaire options
├── docs/
│   ├── RegScope_Action_Plan_v2.docx    # Action plan (quick fixes + 5-day rebuild)
│   ├── RegScope_60min_Action_Plan.docx # Original 60-minute action plan
│   ├── RegScope_Product_Spec.docx      # Full product specification
│   └── RegScope_Project_Plan.docx      # Project plan with pricing and timeline
└── package.json
```

## Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## V2 Features (Prototype State)

| Feature | Status | Description |
|---------|--------|-------------|
| Questionnaire V2 | Built | Company size, target market, compliance status, "no company yet" toggle |
| Risk Badges | Built | High (80%+) / Medium (60-79%) / Low (<60%) on every regulation card |
| Key Requirements | Built | 3 bullet points per matched regulation |
| Penalty Warnings | Built | Red callout with penalty amount per regulation |
| Stats Bar | Built | Regulations Found, High Priority, EU Coverage, Compliance Score |
| Risk Analysis | Preview | "In Preparation" tab with severity/gap/deadline table mockup |
| Recommendations | Preview | "In Preparation" tab with prioritized action items + insurance suggestions |
| Newsletter | Preview | "In Preparation" tab with email digest mockup + frequency toggle |
| Settings | Preview | "In Preparation" tab placeholder |

## V2 Pricing (Reference)

| Feature | Price |
|---------|-------|
| Core MVP (V1) | $540 |
| Legal Risk Analysis | $60 |
| Regulation Newsletter | $150 |
| Company Analysis Fallback | $60 |
| Actionable Recommendations | Free |
| **Total V2** | **$810** |

## Regulations Covered

- GDPR (Regulation EU 2016/679)
- Digital Services Act (Regulation EU 2022/2065)
- NIS2 Directive (Directive EU 2022/2555)
- EU AI Act (Regulation EU 2024/1689)
- DORA (Regulation EU 2022/2554)
- General Product Safety (Regulation EU 2023/988)
- ePrivacy Directive (Directive 2002/58/EC)
- Medical Devices Regulation (Regulation EU 2017/745)

## Deployment

Pushes to `main` auto-deploy to Vercel.

```bash
git add . && git commit -m "description" && git push origin main
```

## GitHub

Repository: `vilin1927/regscope`

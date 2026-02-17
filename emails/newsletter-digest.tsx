import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Hr,
} from "@react-email/components";

interface RegulationUpdate {
  title: string;
  category: string;
  riskLevel: "hoch" | "mittel" | "niedrig";
  summary: string;
}

interface NewsletterDigestProps {
  userName?: string;
  locale?: "de" | "en";
  subscribedAreas?: string[];
  complianceScore?: number;
  totalRegulations?: number;
  highPriorityCount?: number;
  updates?: RegulationUpdate[];
  dashboardUrl?: string;
  unsubscribeUrl?: string;
}

const riskColors = {
  hoch: "#dc2626",
  mittel: "#d97706",
  niedrig: "#2563eb",
};

const translations = {
  de: {
    greeting: "Hallo",
    title: "Ihr Vorschriften-Update",
    score: "Score",
    regulations: "Vorschriften",
    urgent: "Dringend",
    yourAreas: "Ihre Bereiche",
    cta: "Zum Dashboard",
    footer:
      "Sie erhalten diese E-Mail, weil Sie den ComplyRadar Vorschriften-Newsletter abonniert haben.",
    unsubscribe: "Newsletter abbestellen",
    noUpdates:
      "Keine neuen Änderungen in Ihren Bereichen. Ihr Betrieb ist auf dem neuesten Stand!",
    riskHigh: "Dringend",
    riskMedium: "Aktualisierung",
    riskLow: "Info",
  },
  en: {
    greeting: "Hello",
    title: "Your Regulation Update",
    score: "Score",
    regulations: "Regulations",
    urgent: "Urgent",
    yourAreas: "Your Areas",
    cta: "Go to Dashboard",
    footer:
      "You receive this email because you subscribed to the ComplyRadar regulation newsletter.",
    unsubscribe: "Unsubscribe",
    noUpdates:
      "No new changes in your selected areas. Your business is up to date!",
    riskHigh: "Urgent",
    riskMedium: "Update",
    riskLow: "Info",
  },
};

const riskLabelKeys = {
  hoch: "riskHigh",
  mittel: "riskMedium",
  niedrig: "riskLow",
} as const;

export default function NewsletterDigest({
  userName = "Nutzer",
  locale = "de",
  subscribedAreas = [],
  complianceScore = 0,
  totalRegulations = 0,
  highPriorityCount = 0,
  updates = [],
  dashboardUrl = "https://smart-lex.de",
  unsubscribeUrl = "#",
}: NewsletterDigestProps) {
  const t = translations[locale];
  const title = t.title;

  return (
    <Html lang={locale}>
      <Head />
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Text style={headerTextStyle}>ComplyRadar</Text>
          </Section>

          {/* Content */}
          <Section style={contentStyle}>
            {/* Greeting */}
            <Text style={greetingStyle}>
              {t.greeting} {userName},
            </Text>
            <Text style={subheadingStyle}>{title}</Text>

            {/* Compliance Score Summary */}
            <Section style={scoreRowStyle}>
              <table
                width="100%"
                cellPadding="0"
                cellSpacing="0"
                role="presentation"
              >
                <tbody>
                  <tr>
                    <td style={scoreBoxStyle}>
                      <Text style={scoreValueStyle}>{complianceScore}%</Text>
                      <Text style={scoreLabelStyle}>{t.score}</Text>
                    </td>
                    <td style={scoreBoxStyle}>
                      <Text style={scoreValueStyle}>{totalRegulations}</Text>
                      <Text style={scoreLabelStyle}>{t.regulations}</Text>
                    </td>
                    <td style={scoreBoxStyle}>
                      <Text style={scoreValueStyle}>{highPriorityCount}</Text>
                      <Text style={scoreLabelStyle}>{t.urgent}</Text>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Section>

            {/* Subscribed Areas */}
            {subscribedAreas.length > 0 && (
              <Section style={{ marginBottom: "20px" }}>
                <Text style={areasLabelStyle}>{t.yourAreas}</Text>
                <Text style={areasTagsStyle}>
                  {subscribedAreas.join(" · ")}
                </Text>
              </Section>
            )}

            {/* Update Cards */}
            {updates.length > 0 ? (
              updates.map((update, i) => (
                <Section key={i} style={updateCardStyle}>
                  <Text style={updateTitleStyle}>{update.title}</Text>
                  <Text
                    style={{
                      ...tagStyle,
                      color: riskColors[update.riskLevel],
                      backgroundColor: `${riskColors[update.riskLevel]}15`,
                    }}
                  >
                    {t[riskLabelKeys[update.riskLevel]]}
                  </Text>
                  <Text style={updateCategoryStyle}>{update.category}</Text>
                  <Text style={updateSummaryStyle}>{update.summary}</Text>
                </Section>
              ))
            ) : (
              <Text style={noUpdatesStyle}>{t.noUpdates}</Text>
            )}

            <Hr style={hrStyle} />

            {/* CTA */}
            <Section
              style={{ textAlign: "center" as const, margin: "24px 0" }}
            >
              <Link href={dashboardUrl} style={ctaStyle}>
                {t.cta}
              </Link>
            </Section>

            <Hr style={hrStyle} />

            {/* Footer */}
            <Text style={footerStyle}>{t.footer}</Text>
            <Text style={footerStyle}>
              <Link href={unsubscribeUrl} style={unsubscribeLinkStyle}>
                {t.unsubscribe}
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const bodyStyle = {
  backgroundColor: "#f8fafc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  margin: 0,
  padding: 0,
};

const containerStyle = {
  maxWidth: "600px",
  margin: "0 auto",
};

const headerStyle = {
  backgroundColor: "#2563eb",
  padding: "20px 24px",
  borderRadius: "12px 12px 0 0",
};

const headerTextStyle = {
  color: "#ffffff",
  fontSize: "18px",
  fontWeight: "700" as const,
  margin: 0,
};

const contentStyle = {
  backgroundColor: "#ffffff",
  padding: "24px",
  borderRadius: "0 0 12px 12px",
  border: "1px solid #e2e8f0",
  borderTop: "none",
};

const greetingStyle = {
  fontSize: "16px",
  color: "#1e293b",
  margin: "0 0 4px 0",
};

const subheadingStyle = {
  fontSize: "20px",
  fontWeight: "700" as const,
  color: "#1e293b",
  margin: "0 0 20px 0",
};

const scoreRowStyle = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  padding: "16px",
  marginBottom: "16px",
};

const scoreBoxStyle = {
  textAlign: "center" as const,
  width: "33.33%",
};

const scoreValueStyle = {
  fontSize: "22px",
  fontWeight: "700" as const,
  color: "#1e293b",
  margin: "0 0 2px 0",
};

const scoreLabelStyle = {
  fontSize: "12px",
  color: "#64748b",
  margin: 0,
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
};

const areasLabelStyle = {
  fontSize: "12px",
  fontWeight: "600" as const,
  color: "#64748b",
  margin: "0 0 6px 0",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
};

const areasTagsStyle = {
  fontSize: "14px",
  color: "#1e293b",
  margin: 0,
};

const updateCardStyle = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  padding: "16px",
  marginBottom: "12px",
};

const updateTitleStyle = {
  fontSize: "14px",
  fontWeight: "600" as const,
  color: "#1e293b",
  margin: "0 0 8px 0",
};

const tagStyle = {
  display: "inline-block" as const,
  fontSize: "11px",
  fontWeight: "600" as const,
  padding: "2px 8px",
  borderRadius: "12px",
  margin: "0 8px 8px 0",
};

const updateCategoryStyle = {
  fontSize: "12px",
  color: "#64748b",
  margin: "0 0 4px 0",
};

const updateSummaryStyle = {
  fontSize: "13px",
  color: "#475569",
  margin: 0,
  lineHeight: "1.5",
};

const noUpdatesStyle = {
  fontSize: "14px",
  color: "#64748b",
  textAlign: "center" as const,
  padding: "24px 0",
};

const hrStyle = {
  borderColor: "#e2e8f0",
  margin: "20px 0",
};

const ctaStyle = {
  display: "inline-block" as const,
  backgroundColor: "#2563eb",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600" as const,
  padding: "12px 24px",
  borderRadius: "8px",
  textDecoration: "none",
};

const footerStyle = {
  fontSize: "12px",
  color: "#94a3b8",
  textAlign: "center" as const,
  margin: "4px 0",
};

const unsubscribeLinkStyle = {
  color: "#94a3b8",
  textDecoration: "underline",
};

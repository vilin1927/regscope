import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Hr,
  Img,
} from "@react-email/components";

interface RegulationUpdate {
  title: string;
  category: string;
  riskLevel: "hoch" | "mittel" | "niedrig";
  summary: string;
}

interface NewsletterDigestProps {
  userName?: string;
  frequency: "weekly" | "monthly";
  updates: RegulationUpdate[];
  dashboardUrl: string;
  unsubscribeUrl: string;
}

const riskColors = {
  hoch: "#dc2626",
  mittel: "#d97706",
  niedrig: "#2563eb",
};

const riskLabels = {
  hoch: "Dringend",
  mittel: "Aktualisierung",
  niedrig: "Info",
};

export default function NewsletterDigest({
  userName = "Nutzer",
  frequency = "weekly",
  updates = [],
  dashboardUrl = "https://regscope-nine.vercel.app",
  unsubscribeUrl = "#",
}: NewsletterDigestProps) {
  const greeting =
    frequency === "weekly"
      ? "Ihr wöchentliches Vorschriften-Update"
      : "Ihr monatliches Vorschriften-Update";

  return (
    <Html lang="de">
      <Head />
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Text style={headerTextStyle}>ComplyRadar</Text>
          </Section>

          {/* Greeting */}
          <Section style={contentStyle}>
            <Text style={greetingStyle}>
              Hallo {userName},
            </Text>
            <Text style={subheadingStyle}>{greeting}</Text>

            {/* Updates */}
            {updates.length > 0 ? (
              updates.map((update, i) => (
                <Section key={i} style={updateCardStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <Text style={updateTitleStyle}>{update.title}</Text>
                  </div>
                  <Text
                    style={{
                      ...tagStyle,
                      color: riskColors[update.riskLevel],
                      backgroundColor: `${riskColors[update.riskLevel]}15`,
                    }}
                  >
                    {riskLabels[update.riskLevel]}
                  </Text>
                  <Text style={updateCategoryStyle}>{update.category}</Text>
                  <Text style={updateSummaryStyle}>{update.summary}</Text>
                </Section>
              ))
            ) : (
              <Text style={noUpdatesStyle}>
                Keine neuen Änderungen in Ihren ausgewählten Bereichen diese
                Periode. Ihr Betrieb ist auf dem neuesten Stand!
              </Text>
            )}

            <Hr style={hrStyle} />

            {/* CTA */}
            <Section style={{ textAlign: "center" as const, margin: "24px 0" }}>
              <Link href={dashboardUrl} style={ctaStyle}>
                Zum Dashboard
              </Link>
            </Section>

            <Hr style={hrStyle} />

            {/* Footer */}
            <Text style={footerStyle}>
              Sie erhalten diese E-Mail, weil Sie den ComplyRadar
              Vorschriften-Newsletter abonniert haben.
            </Text>
            <Text style={footerStyle}>
              <Link href={unsubscribeUrl} style={unsubscribeLinkStyle}>
                Newsletter abbestellen
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

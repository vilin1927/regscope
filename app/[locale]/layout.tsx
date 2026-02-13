import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing } from "@/src/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Fix #13: Dynamic metadata per locale
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isGerman = locale === "de";

  return {
    title: isGerman
      ? "ComplyRadar — Compliance für Handwerksbetriebe"
      : "ComplyRadar — Compliance for Trade Businesses",
    description: isGerman
      ? "Finden Sie heraus, welche Vorschriften für Ihren Handwerksbetrieb gelten. Compliance-Scan für Tischlereien und Schreinereien."
      : "Discover which regulations apply to your trade business. Compliance scanner for carpentry and joinery workshops.",
    // Fix #26: hreflang alternates
    alternates: {
      languages: {
        de: "/de",
        en: "/en",
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

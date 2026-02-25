import { setRequestLocale } from "next-intl/server";
import { ComplyRadarApp } from "@/components/app-shell/ComplyRadarApp";

export default async function CatchAllPage({
  params,
}: {
  params: Promise<{ locale: string; path: string[] }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ComplyRadarApp />;
}

// Generate static params for locale combinations
export function generateStaticParams() {
  return [
    { locale: "de", path: ["dashboard"] },
    { locale: "en", path: ["dashboard"] },
  ];
}

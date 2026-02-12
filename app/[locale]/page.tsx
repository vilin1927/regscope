import { setRequestLocale } from "next-intl/server";
import { ComplyRadarApp } from "@/components/app-shell/ComplyRadarApp";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ComplyRadarApp />;
}

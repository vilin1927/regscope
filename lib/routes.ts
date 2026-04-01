import type { Screen } from "@/types";

/**
 * Maps Screen state ↔ URL paths (shallow routing).
 * Scan-specific screens include the scanId in the URL.
 */

// Screen → URL path (without locale prefix)
export function screenToPath(screen: Screen, scanId?: string | null): string {
  switch (screen) {
    case "auth":
      return "/";
    case "dashboard":
      return "/dashboard";
    case "company-search":
      return "/scan/company";
    case "questionnaire":
      return "/scan/new";
    case "processing":
      return "/scan/processing";
    case "results":
      return scanId ? `/scan/${scanId}/results` : "/scan/results";
    case "risk-analysis":
      return scanId ? `/scan/${scanId}/risk` : "/risk-analysis";
    case "recommendations":
      return scanId ? `/scan/${scanId}/recommendations` : "/recommendations";
    case "scan-history":
      return "/scan-history";
    case "newsletter":
      return "/newsletter";
    case "admin-newsletter":
      return "/admin/newsletter";
    case "admin-users":
      return "/admin/users";
    case "admin-templates":
      return "/admin/templates";
    case "admin-consultants":
      return "/admin/consultants";
    case "consultant-register":
      return "/consultant/register";
    case "consultant-dashboard":
      return "/consultant/dashboard";
    case "settings":
      return "/settings";
    case "impressum":
      return "/impressum";
    case "datenschutz":
      return "/datenschutz";
    default:
      return "/dashboard";
  }
}

// URL path → Screen + optional scanId
export function pathToScreen(pathname: string): { screen: Screen; scanId?: string } {
  // Strip locale prefix (/en, /de)
  const stripped = pathname.replace(/^\/(en|de)/, "") || "/";

  // Scan-specific routes: /scan/:scanId/results, /scan/:scanId/risk, /scan/:scanId/recommendations
  const scanResultsMatch = stripped.match(/^\/scan\/([^/]+)\/results$/);
  if (scanResultsMatch) {
    return { screen: "results", scanId: scanResultsMatch[1] };
  }

  const scanRiskMatch = stripped.match(/^\/scan\/([^/]+)\/risk$/);
  if (scanRiskMatch) {
    return { screen: "risk-analysis", scanId: scanRiskMatch[1] };
  }

  const scanRecsMatch = stripped.match(/^\/scan\/([^/]+)\/recommendations$/);
  if (scanRecsMatch) {
    return { screen: "recommendations", scanId: scanRecsMatch[1] };
  }

  // Static routes
  switch (stripped) {
    case "/":
      return { screen: "auth" };
    case "/dashboard":
      return { screen: "dashboard" };
    case "/scan/company":
      return { screen: "company-search" };
    case "/scan/new":
      return { screen: "questionnaire" };
    case "/scan/processing":
      return { screen: "processing" };
    case "/scan/results":
      return { screen: "results" };
    case "/scan-history":
      return { screen: "scan-history" };
    case "/risk-analysis":
      return { screen: "risk-analysis" };
    case "/recommendations":
      return { screen: "recommendations" };
    case "/newsletter":
      return { screen: "newsletter" };
    case "/admin/newsletter":
      return { screen: "admin-newsletter" };
    case "/admin/users":
      return { screen: "admin-users" };
    case "/admin/templates":
      return { screen: "admin-templates" };
    case "/admin/consultants":
      return { screen: "admin-consultants" };
    case "/consultant/register":
      return { screen: "consultant-register" };
    case "/consultant/dashboard":
      return { screen: "consultant-dashboard" };
    case "/settings":
      return { screen: "settings" };
    case "/impressum":
      return { screen: "impressum" };
    case "/datenschutz":
      return { screen: "datenschutz" };
    default:
      return { screen: "dashboard" };
  }
}

// Get current locale from pathname
export function getLocaleFromPath(): string {
  if (typeof window === "undefined") return "de";
  const match = window.location.pathname.match(/^\/(en|de)/);
  return match?.[1] ?? "de";
}

// Push URL without full page reload
export function pushUrl(screen: Screen, scanId?: string | null): void {
  if (typeof window === "undefined") return;
  const locale = getLocaleFromPath();
  const path = screenToPath(screen, scanId);
  const fullPath = `/${locale}${path === "/" ? "" : path}`;

  // Only push if URL actually changed
  if (window.location.pathname !== fullPath) {
    window.history.pushState({ screen, scanId }, "", fullPath);
  }
}

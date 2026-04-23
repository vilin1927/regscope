import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * F-BUG-02 regression: the consultant dashboard's link/QR icons felt broken
 * because (1) the Link2 icon was decorative-only, (2) copy feedback was a
 * tiny 2s icon swap that users missed, (3) QR was disconnected.
 *
 * Fix: whole pill is one <button type="button"> that copies on click, with
 * a visible toast "Link kopiert!" / "Link copied!". QR is a nested
 * <span role="button"> with stopPropagation so it doesn't trigger the
 * outer copy.
 *
 * Full RTL component rendering would pull in next-intl + framer-motion
 * providers. For pinning the structural invariants that matter (pill is a
 * real button, QR is nested role=button with stopPropagation), static
 * source inspection is sharper and cheaper.
 */
describe("F-BUG-02: consultant dashboard pill structure", () => {
  const source = readFileSync(
    path.resolve(__dirname, "../../components/consultant/ConsultantDashboardScreen.tsx"),
    "utf8"
  );

  it("pill is a <button type='button'> with onClick={copyReferralCode}", () => {
    // The whole blue referral pill must be a real button — was a <div> before.
    // Match the opening of the outer button element.
    expect(source).toMatch(
      /<button[\s\S]*?type="button"[\s\S]*?onClick=\{copyReferralCode\}/
    );
  });

  it("QR toggle is a <span role='button'> with stopPropagation — valid nested-button HTML", () => {
    // Nested <button> inside <button> is invalid. Must use role=button on a span.
    expect(source).toMatch(
      /<span[\s\S]*?role="button"[\s\S]*?tabIndex=\{0\}[\s\S]*?onClick=\{\(e\)\s*=>\s*\{[\s\S]*?e\.stopPropagation\(\)[\s\S]*?setShowQR/
    );
  });

  it("QR toggle is keyboard-accessible (Enter/Space handler)", () => {
    expect(source).toMatch(/onKeyDown=\{[\s\S]*?e\.key === "Enter"[\s\S]*?e\.key === " "[\s\S]*?setShowQR/);
  });

  it("toast is rendered inside AnimatePresence and uses the copySuccess i18n key", () => {
    expect(source).toMatch(/<AnimatePresence>[\s\S]*?\{copied && \([\s\S]*?motion\.div[\s\S]*?t\("copySuccess"\)/);
  });

  it("toast has role='status' and aria-live='polite' for screen-reader announcements", () => {
    expect(source).toMatch(/role="status"[\s\S]*?aria-live="polite"/);
  });

  it("copy URL builds from smart-lex.de (not complyradar.de)", () => {
    expect(source).toMatch(/https:\/\/smart-lex\.de\/de\?ref=\$\{[^}]*referral_code\}/);
    expect(source).not.toMatch(/complyradar\.de\/de\?ref=/);
  });

  it("clipboard fallback (textarea trick) is preserved for non-HTTPS contexts", () => {
    // The navigator.clipboard API can throw on insecure contexts — fallback must stay.
    expect(source).toMatch(/document\.createElement\("textarea"\)[\s\S]*?document\.execCommand\("copy"\)/);
  });
});

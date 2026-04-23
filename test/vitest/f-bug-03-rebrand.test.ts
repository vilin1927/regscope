import { describe, it, expect } from "vitest";
import deMessages from "../../messages/de.json";
import enMessages from "../../messages/en.json";

/**
 * F-BUG-03 regression: user-facing "ComplyRadar" strings needed to become
 * "Smart Lex" to match the live smart-lex.de domain. Raphael's investor
 * literally saw "Welcome to ComplyRadar" during the demo — embarrassing.
 *
 * This test locks down which keys must say "Smart Lex" (product brand) vs
 * which are allowed to still say "ComplyRadar" (legal entity, out-of-scope
 * strings tracked under separate issues). If someone adds a new user-facing
 * brand string with "ComplyRadar", this test fires.
 */

// Keys that MUST NOT contain "ComplyRadar" — they render in the UI.
const PRODUCT_BRAND_KEYS_DE = [
  ["App", "name"],
  ["Dashboard", "welcome"],
  ["Auth", "welcomeTitle"],
  ["Mobile", "description"],
  ["Paywall", "proTitle"],
] as const;

// Namespaces where "ComplyRadar" is explicitly allowed as the legal entity
// name (Impressum, Datenschutz) until Raphael confirms GmbH re-registration.
const LEGAL_NAMESPACE = "Legal";

function getNested(obj: unknown, path: readonly string[]): string | undefined {
  let current: unknown = obj;
  for (const key of path) {
    if (typeof current !== "object" || current === null) return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "string" ? current : undefined;
}

describe("F-BUG-03: Smart Lex rebrand (user-facing strings)", () => {
  for (const keyPath of PRODUCT_BRAND_KEYS_DE) {
    it(`de.json: ${keyPath.join(".")} must say "Smart Lex", not "ComplyRadar"`, () => {
      const value = getNested(deMessages, keyPath);
      expect(value, `key ${keyPath.join(".")} must exist`).toBeDefined();
      expect(value).not.toMatch(/ComplyRadar/);
      expect(value).toMatch(/Smart Lex/);
    });

    it(`en.json: ${keyPath.join(".")} must say "Smart Lex", not "ComplyRadar"`, () => {
      const value = getNested(enMessages, keyPath);
      expect(value, `key ${keyPath.join(".")} must exist`).toBeDefined();
      expect(value).not.toMatch(/ComplyRadar/);
      expect(value).toMatch(/Smart Lex/);
    });
  }

  it("Legal namespace is the ONLY place 'ComplyRadar' may still appear in de.json", () => {
    const offenders: string[] = [];
    function walk(obj: Record<string, unknown>, path: string[] = []) {
      for (const [k, v] of Object.entries(obj)) {
        if (typeof v === "string" && v.includes("ComplyRadar") && path[0] !== LEGAL_NAMESPACE) {
          offenders.push([...path, k].join("."));
        } else if (typeof v === "object" && v !== null) {
          walk(v as Record<string, unknown>, [...path, k]);
        }
      }
    }
    walk(deMessages as Record<string, unknown>);
    expect(offenders, `found non-legal ComplyRadar strings: ${offenders.join(", ")}`).toEqual([]);
  });

  it("Legal namespace is the ONLY place 'ComplyRadar' may still appear in en.json", () => {
    const offenders: string[] = [];
    function walk(obj: Record<string, unknown>, path: string[] = []) {
      for (const [k, v] of Object.entries(obj)) {
        if (typeof v === "string" && v.includes("ComplyRadar") && path[0] !== LEGAL_NAMESPACE) {
          offenders.push([...path, k].join("."));
        } else if (typeof v === "object" && v !== null) {
          walk(v as Record<string, unknown>, [...path, k]);
        }
      }
    }
    walk(enMessages as Record<string, unknown>);
    expect(offenders, `found non-legal ComplyRadar strings: ${offenders.join(", ")}`).toEqual([]);
  });
});

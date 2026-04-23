import { describe, it, expect } from "vitest";
import { toConsultant, toReferral, toHelpRequest } from "../../lib/consultant-mappers";

/**
 * F-BUG-04 regression: Drizzle ORM returns camelCase field names, but
 * lib/consultant-types.ts + all UI consumers expect snake_case. Silent
 * undefineds caused the consultant dashboard copy-link button to copy an
 * empty `?ref=` URL — the actual root cause of Raphael's "nothing happens"
 * F-BUG-02 report.
 *
 * These tests pin the mapper contract. If someone removes a field or
 * changes casing at the boundary, it fails here rather than in the wild.
 */

// Type cast: we're testing the mapper's runtime behavior, not its input types.
// The real mapper accepts Drizzle InferSelectModel shapes — we pass equivalent
// shapes for the test without pulling in the full Drizzle schema.
const asRow = <T>(x: T) => x as never;

describe("F-BUG-04: consultant-mappers map Drizzle camelCase → snake_case", () => {
  describe("toConsultant", () => {
    const drizzleRow = {
      id: "c-1",
      userId: "u-1",
      name: "Vlad Test Berater",
      email: "vlad@example.com",
      phone: "+49 123",
      bio: "bio text",
      tags: ["arbeitssicherheit", "datenschutz"],
      referralCode: "4GXVBMDB",
      commissionRateInitial: "30.00", // Drizzle numeric returns string
      commissionRateRecurring: "10.00",
      isActive: true,
      createdAt: new Date("2026-04-01T12:00:00Z"),
      updatedAt: new Date("2026-04-10T15:00:00Z"),
    };

    it("maps referralCode → referral_code (F-BUG-04 smoking gun)", () => {
      expect(toConsultant(asRow(drizzleRow)).referral_code).toBe("4GXVBMDB");
    });

    it("maps commissionRateInitial/Recurring → commission_rate_initial/recurring as numbers", () => {
      const out = toConsultant(asRow(drizzleRow));
      expect(out.commission_rate_initial).toBe(30);
      expect(out.commission_rate_recurring).toBe(10);
      expect(typeof out.commission_rate_initial).toBe("number");
    });

    it("maps isActive → is_active", () => {
      expect(toConsultant(asRow(drizzleRow)).is_active).toBe(true);
    });

    it("maps userId → user_id", () => {
      expect(toConsultant(asRow(drizzleRow)).user_id).toBe("u-1");
    });

    it("serializes Date fields to ISO strings", () => {
      const out = toConsultant(asRow(drizzleRow));
      expect(out.created_at).toBe("2026-04-01T12:00:00.000Z");
      expect(out.updated_at).toBe("2026-04-10T15:00:00.000Z");
    });

    it("passes through tags array", () => {
      expect(toConsultant(asRow(drizzleRow)).tags).toEqual(["arbeitssicherheit", "datenschutz"]);
    });

    it("coerces nullable phone/bio to undefined when missing", () => {
      const out = toConsultant(asRow({ ...drizzleRow, phone: null, bio: null }));
      expect(out.phone).toBeUndefined();
      expect(out.bio).toBeUndefined();
    });
  });

  describe("toReferral", () => {
    it("maps all fields referralCode → referral_code, consultantId → consultant_id, customerUserId → customer_user_id", () => {
      const row = {
        id: "r-1",
        referralCode: "CODE1234",
        consultantId: "c-1",
        customerUserId: "u-2",
        status: "active",
        commissionInitial: "0",
        commissionRecurring: "0",
        lastCommissionAt: null,
        createdAt: new Date("2026-04-15T10:00:00Z"),
      };
      const out = toReferral(asRow(row));
      expect(out).toEqual({
        id: "r-1",
        referral_code: "CODE1234",
        consultant_id: "c-1",
        customer_user_id: "u-2",
        status: "active",
        created_at: "2026-04-15T10:00:00.000Z",
      });
    });
  });

  describe("toHelpRequest", () => {
    it("maps all fields including nullable consultant_id + contact_revealed", () => {
      const row = {
        id: "h-1",
        customerUserId: "u-3",
        consultantId: null,
        category: "Arbeitsrecht",
        message: "Brauche Hilfe",
        status: "pending",
        contactRevealed: false,
        customerEmail: "kunde@example.com",
        customerPhone: null,
        createdAt: new Date("2026-04-20T09:00:00Z"),
        updatedAt: new Date("2026-04-20T09:00:00Z"),
      };
      const out = toHelpRequest(asRow(row));
      expect(out).toEqual({
        id: "h-1",
        customer_user_id: "u-3",
        consultant_id: null,
        category: "Arbeitsrecht",
        message: "Brauche Hilfe",
        status: "pending",
        contact_revealed: false,
        customer_email: "kunde@example.com",
        customer_phone: undefined,
        created_at: "2026-04-20T09:00:00.000Z",
        updated_at: "2026-04-20T09:00:00.000Z",
      });
    });
  });
});

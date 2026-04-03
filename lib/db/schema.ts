import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  numeric,
  jsonb,
  integer,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// ============================================================
// AUTH TABLES (replaces Supabase auth.users)
// ============================================================

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================
// CORE TABLES
// ============================================================

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    language: text("language").notNull().default("de"),
    trialStartedAt: timestamp("trial_started_at", { withTimezone: true }),
    contactConsentGiven: boolean("contact_consent_given").notNull().default(false),
    // M2 Stripe fields
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    subscriptionStatus: text("subscription_status").notNull().default("free"),
    subscriptionPeriodEnd: timestamp("subscription_period_end", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_profiles_stripe_customer_id").on(table.stripeCustomerId),
  ]
);

export const scans = pgTable(
  "scans",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    businessProfile: jsonb("business_profile").notNull().default({}),
    matchedRegulations: jsonb("matched_regulations").notNull().default([]),
    complianceScore: numeric("compliance_score").notNull().default("0"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_scans_user_id").on(table.userId),
    index("idx_scans_created_at").on(table.createdAt),
  ]
);

export const complianceChecks = pgTable(
  "compliance_checks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    scanId: uuid("scan_id")
      .notNull()
      .references(() => scans.id, { onDelete: "cascade" }),
    regulationId: text("regulation_id").notNull(),
    checked: boolean("checked").notNull().default(false),
    checkedAt: timestamp("checked_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("compliance_checks_scan_regulation_unique").on(
      table.scanId,
      table.regulationId
    ),
    index("idx_compliance_checks_scan_id").on(table.scanId),
  ]
);

// ============================================================
// AI REPORT TABLES
// ============================================================

export const riskReports = pgTable(
  "risk_reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    scanId: uuid("scan_id")
      .notNull()
      .references(() => scans.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    report: jsonb("report").notNull().default({}),
    status: text("status").notNull().default("complete"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("risk_reports_scan_user_unique").on(table.scanId, table.userId),
    index("idx_risk_reports_scan_id").on(table.scanId),
    index("idx_risk_reports_user_id").on(table.userId),
  ]
);

export const recommendations = pgTable(
  "recommendations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    scanId: uuid("scan_id")
      .notNull()
      .references(() => scans.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    report: jsonb("report").notNull().default({}),
    status: text("status").notNull().default("complete"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("recommendations_scan_user_unique").on(table.scanId, table.userId),
    index("idx_recommendations_scan_id").on(table.scanId),
    index("idx_recommendations_user_id").on(table.userId),
  ]
);

// ============================================================
// NEWSLETTER
// ============================================================

export const newsletterPreferences = pgTable(
  "newsletter_preferences",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" })
      .unique(),
    optedIn: boolean("opted_in").notNull().default(false),
    frequency: text("frequency").notNull().default("weekly"),
    areas: text("areas").array().notNull().default([]),
    locale: text("locale").notNull().default("de"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_newsletter_preferences_user_id").on(table.userId),
  ]
);

// ============================================================
// INDUSTRY TEMPLATES (public, cacheable)
// ============================================================

export const industryTemplates = pgTable(
  "industry_templates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    industryCode: text("industry_code").notNull().unique(),
    industryLabel: text("industry_label").notNull(),
    questions: jsonb("questions").notNull(),
    gegenstandSample: text("gegenstand_sample"),
    usageCount: integer("usage_count").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_industry_templates_code").on(table.industryCode),
  ]
);

// ============================================================
// CONSULTANT / REFERRAL SYSTEM
// ============================================================

export const consultants = pgTable(
  "consultants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" })
      .unique(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    bio: text("bio"),
    tags: text("tags").array().notNull().default([]),
    referralCode: text("referral_code").notNull().unique(),
    commissionRateInitial: numeric("commission_rate_initial", { precision: 5, scale: 2 })
      .notNull()
      .default("30.00"),
    commissionRateRecurring: numeric("commission_rate_recurring", { precision: 5, scale: 2 })
      .notNull()
      .default("10.00"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_consultants_user_id").on(table.userId),
    index("idx_consultants_referral_code").on(table.referralCode),
  ]
);

export const referrals = pgTable(
  "referrals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    referralCode: text("referral_code").notNull(),
    consultantId: uuid("consultant_id")
      .notNull()
      .references(() => consultants.id, { onDelete: "cascade" }),
    customerUserId: uuid("customer_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" })
      .unique(),
    status: text("status").notNull().default("active"),
    // M2 Stripe commission tracking
    commissionInitial: numeric("commission_initial").notNull().default("0"),
    commissionRecurring: numeric("commission_recurring").notNull().default("0"),
    lastCommissionAt: timestamp("last_commission_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_referrals_consultant_id").on(table.consultantId),
    index("idx_referrals_customer_user_id").on(table.customerUserId),
  ]
);

export const helpRequests = pgTable(
  "help_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    customerUserId: uuid("customer_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    consultantId: uuid("consultant_id").references(() => consultants.id, {
      onDelete: "set null",
    }),
    category: text("category").notNull(),
    message: text("message"),
    status: text("status").notNull().default("pending"),
    contactRevealed: boolean("contact_revealed").notNull().default(false),
    customerEmail: text("customer_email"),
    customerPhone: text("customer_phone"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_help_requests_consultant_id").on(table.consultantId),
    index("idx_help_requests_customer_user_id").on(table.customerUserId),
    index("idx_help_requests_status").on(table.status),
  ]
);

// ============================================================
// LEGAL COMPLIANCE
// ============================================================

export const disclaimerAcknowledgments = pgTable(
  "disclaimer_acknowledgments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    scanId: text("scan_id").notNull(),
    acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_disclaimer_ack_user").on(table.userId),
  ]
);

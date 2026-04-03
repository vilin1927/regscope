CREATE TABLE "compliance_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scan_id" uuid NOT NULL,
	"regulation_id" text NOT NULL,
	"checked" boolean DEFAULT false NOT NULL,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consultants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"bio" text,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"referral_code" text NOT NULL,
	"commission_rate_initial" numeric(5, 2) DEFAULT '30.00' NOT NULL,
	"commission_rate_recurring" numeric(5, 2) DEFAULT '10.00' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "consultants_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "consultants_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE "disclaimer_acknowledgments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"scan_id" text NOT NULL,
	"acknowledged_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "help_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_user_id" uuid NOT NULL,
	"consultant_id" uuid,
	"category" text NOT NULL,
	"message" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"contact_revealed" boolean DEFAULT false NOT NULL,
	"customer_email" text,
	"customer_phone" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "industry_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"industry_code" text NOT NULL,
	"industry_label" text NOT NULL,
	"questions" jsonb NOT NULL,
	"gegenstand_sample" text,
	"usage_count" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "industry_templates_industry_code_unique" UNIQUE("industry_code")
);
--> statement-breakpoint
CREATE TABLE "newsletter_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"opted_in" boolean DEFAULT false NOT NULL,
	"frequency" text DEFAULT 'weekly' NOT NULL,
	"areas" text[] DEFAULT '{}' NOT NULL,
	"locale" text DEFAULT 'de' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "newsletter_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"language" text DEFAULT 'de' NOT NULL,
	"trial_started_at" timestamp with time zone,
	"contact_consent_given" boolean DEFAULT false NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"subscription_status" text DEFAULT 'free' NOT NULL,
	"subscription_period_end" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scan_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"report" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'complete' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referral_code" text NOT NULL,
	"consultant_id" uuid NOT NULL,
	"customer_user_id" uuid NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"commission_initial" numeric DEFAULT '0' NOT NULL,
	"commission_recurring" numeric DEFAULT '0' NOT NULL,
	"last_commission_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "referrals_customer_user_id_unique" UNIQUE("customer_user_id")
);
--> statement-breakpoint
CREATE TABLE "risk_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scan_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"report" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'complete' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"business_profile" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"matched_regulations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"compliance_score" numeric DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"email_verified" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "compliance_checks" ADD CONSTRAINT "compliance_checks_scan_id_scans_id_fk" FOREIGN KEY ("scan_id") REFERENCES "public"."scans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultants" ADD CONSTRAINT "consultants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disclaimer_acknowledgments" ADD CONSTRAINT "disclaimer_acknowledgments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "help_requests" ADD CONSTRAINT "help_requests_customer_user_id_users_id_fk" FOREIGN KEY ("customer_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "help_requests" ADD CONSTRAINT "help_requests_consultant_id_consultants_id_fk" FOREIGN KEY ("consultant_id") REFERENCES "public"."consultants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_preferences" ADD CONSTRAINT "newsletter_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_scan_id_scans_id_fk" FOREIGN KEY ("scan_id") REFERENCES "public"."scans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_consultant_id_consultants_id_fk" FOREIGN KEY ("consultant_id") REFERENCES "public"."consultants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_customer_user_id_users_id_fk" FOREIGN KEY ("customer_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_reports" ADD CONSTRAINT "risk_reports_scan_id_scans_id_fk" FOREIGN KEY ("scan_id") REFERENCES "public"."scans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_reports" ADD CONSTRAINT "risk_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scans" ADD CONSTRAINT "scans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "compliance_checks_scan_regulation_unique" ON "compliance_checks" USING btree ("scan_id","regulation_id");--> statement-breakpoint
CREATE INDEX "idx_compliance_checks_scan_id" ON "compliance_checks" USING btree ("scan_id");--> statement-breakpoint
CREATE INDEX "idx_consultants_user_id" ON "consultants" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_consultants_referral_code" ON "consultants" USING btree ("referral_code");--> statement-breakpoint
CREATE INDEX "idx_disclaimer_ack_user" ON "disclaimer_acknowledgments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_help_requests_consultant_id" ON "help_requests" USING btree ("consultant_id");--> statement-breakpoint
CREATE INDEX "idx_help_requests_customer_user_id" ON "help_requests" USING btree ("customer_user_id");--> statement-breakpoint
CREATE INDEX "idx_help_requests_status" ON "help_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_industry_templates_code" ON "industry_templates" USING btree ("industry_code");--> statement-breakpoint
CREATE INDEX "idx_newsletter_preferences_user_id" ON "newsletter_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_profiles_stripe_customer_id" ON "profiles" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "recommendations_scan_user_unique" ON "recommendations" USING btree ("scan_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_recommendations_scan_id" ON "recommendations" USING btree ("scan_id");--> statement-breakpoint
CREATE INDEX "idx_recommendations_user_id" ON "recommendations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_referrals_consultant_id" ON "referrals" USING btree ("consultant_id");--> statement-breakpoint
CREATE INDEX "idx_referrals_customer_user_id" ON "referrals" USING btree ("customer_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "risk_reports_scan_user_unique" ON "risk_reports" USING btree ("scan_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_risk_reports_scan_id" ON "risk_reports" USING btree ("scan_id");--> statement-breakpoint
CREATE INDEX "idx_risk_reports_user_id" ON "risk_reports" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_scans_user_id" ON "scans" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_scans_created_at" ON "scans" USING btree ("created_at");
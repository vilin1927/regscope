/**
 * Import data from Supabase export into self-hosted PostgreSQL.
 * Run: DATABASE_URL=postgresql://... node scripts/import-postgres.mjs
 * Input: scripts/data-export.json
 */
import pg from "pg";
import { readFileSync } from "fs";
import bcrypt from "bcryptjs";

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("Set DATABASE_URL env var");
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function main() {
  const raw = readFileSync("scripts/data-export.json", "utf-8");
  const data = JSON.parse(raw);

  console.log("=== IMPORTING DATA INTO POSTGRESQL ===\n");

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Import users (from auth.users → users table)
    // Password hashes not available — set a placeholder that forces reset
    const placeholderHash = await bcrypt.hash("MUST_RESET_PASSWORD", 12);
    console.log(`Importing ${data.users.length} users...`);
    for (const user of data.users) {
      await client.query(
        `INSERT INTO users (id, email, password_hash, email_verified, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $5)
         ON CONFLICT (id) DO NOTHING`,
        [
          user.id,
          user.email,
          placeholderHash,
          user.email_confirmed_at || null,
          user.created_at,
        ]
      );
    }
    console.log(`  Done: ${data.users.length} users`);

    // 2. Import profiles
    const profileRows = data.tables.profiles?.rows || [];
    console.log(`Importing ${profileRows.length} profiles...`);
    for (const row of profileRows) {
      await client.query(
        `INSERT INTO profiles (id, language, trial_started_at, contact_consent_given, created_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING`,
        [
          row.id,
          row.language || "de",
          row.trial_started_at || null,
          row.contact_consent_given || false,
          row.created_at,
        ]
      );
    }
    console.log(`  Done: ${profileRows.length} profiles`);

    // 3. Import scans
    const scanRows = data.tables.scans?.rows || [];
    console.log(`Importing ${scanRows.length} scans...`);
    for (const row of scanRows) {
      await client.query(
        `INSERT INTO scans (id, user_id, business_profile, matched_regulations, compliance_score, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING`,
        [
          row.id,
          row.user_id,
          JSON.stringify(row.business_profile),
          JSON.stringify(row.matched_regulations),
          row.compliance_score,
          row.created_at,
        ]
      );
    }
    console.log(`  Done: ${scanRows.length} scans`);

    // 4. Import compliance_checks
    const checkRows = data.tables.compliance_checks?.rows || [];
    console.log(`Importing ${checkRows.length} compliance_checks...`);
    for (const row of checkRows) {
      await client.query(
        `INSERT INTO compliance_checks (id, scan_id, regulation_id, checked, checked_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING`,
        [row.id, row.scan_id, row.regulation_id, row.checked, row.checked_at]
      );
    }
    console.log(`  Done: ${checkRows.length} compliance_checks`);

    // 5. Import risk_reports
    const rrRows = data.tables.risk_reports?.rows || [];
    console.log(`Importing ${rrRows.length} risk_reports...`);
    for (const row of rrRows) {
      await client.query(
        `INSERT INTO risk_reports (id, scan_id, user_id, report, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING`,
        [
          row.id,
          row.scan_id,
          row.user_id,
          JSON.stringify(row.report),
          row.status || "complete",
          row.created_at,
        ]
      );
    }
    console.log(`  Done: ${rrRows.length} risk_reports`);

    // 6. Import recommendations
    const recRows = data.tables.recommendations?.rows || [];
    console.log(`Importing ${recRows.length} recommendations...`);
    for (const row of recRows) {
      await client.query(
        `INSERT INTO recommendations (id, scan_id, user_id, report, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING`,
        [
          row.id,
          row.scan_id,
          row.user_id,
          JSON.stringify(row.report),
          row.status || "complete",
          row.created_at,
        ]
      );
    }
    console.log(`  Done: ${recRows.length} recommendations`);

    // 7. Import newsletter_preferences
    const nlRows = data.tables.newsletter_preferences?.rows || [];
    console.log(`Importing ${nlRows.length} newsletter_preferences...`);
    for (const row of nlRows) {
      await client.query(
        `INSERT INTO newsletter_preferences (id, user_id, opted_in, frequency, areas, locale, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO NOTHING`,
        [
          row.id,
          row.user_id,
          row.opted_in,
          row.frequency || "weekly",
          row.areas || [],
          row.locale || "de",
          row.created_at,
          row.updated_at,
        ]
      );
    }
    console.log(`  Done: ${nlRows.length} newsletter_preferences`);

    // 8. Import industry_templates
    const itRows = data.tables.industry_templates?.rows || [];
    console.log(`Importing ${itRows.length} industry_templates...`);
    for (const row of itRows) {
      await client.query(
        `INSERT INTO industry_templates (id, industry_code, industry_label, questions, gegenstand_sample, usage_count, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO NOTHING`,
        [
          row.id,
          row.industry_code,
          row.industry_label,
          JSON.stringify(row.questions),
          row.gegenstand_sample || null,
          row.usage_count || 1,
          row.created_at,
          row.updated_at,
        ]
      );
    }
    console.log(`  Done: ${itRows.length} industry_templates`);

    // 9. Import consultants
    const conRows = data.tables.consultants?.rows || [];
    console.log(`Importing ${conRows.length} consultants...`);
    for (const row of conRows) {
      await client.query(
        `INSERT INTO consultants (id, user_id, name, email, phone, bio, tags, referral_code, commission_rate_initial, commission_rate_recurring, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (id) DO NOTHING`,
        [
          row.id,
          row.user_id,
          row.name,
          row.email,
          row.phone || null,
          row.bio || null,
          row.tags || [],
          row.referral_code,
          row.commission_rate_initial || row.commission_rate || 30,
          row.commission_rate_recurring || 10,
          row.is_active !== false,
          row.created_at,
          row.updated_at,
        ]
      );
    }
    console.log(`  Done: ${conRows.length} consultants`);

    // 10. Import referrals
    const refRows = data.tables.referrals?.rows || [];
    console.log(`Importing ${refRows.length} referrals...`);
    for (const row of refRows) {
      await client.query(
        `INSERT INTO referrals (id, referral_code, consultant_id, customer_user_id, status, commission_initial, commission_recurring, last_commission_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO NOTHING`,
        [
          row.id,
          row.referral_code,
          row.consultant_id,
          row.customer_user_id,
          row.status || "active",
          row.commission_initial || 0,
          row.commission_recurring || 0,
          row.last_commission_at || null,
          row.created_at,
        ]
      );
    }
    console.log(`  Done: ${refRows.length} referrals`);

    // 11. Import help_requests
    const hrRows = data.tables.help_requests?.rows || [];
    console.log(`Importing ${hrRows.length} help_requests...`);
    for (const row of hrRows) {
      await client.query(
        `INSERT INTO help_requests (id, customer_user_id, consultant_id, category, message, status, contact_revealed, customer_email, customer_phone, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id) DO NOTHING`,
        [
          row.id,
          row.customer_user_id,
          row.consultant_id || null,
          row.category,
          row.message || null,
          row.status || "pending",
          row.contact_revealed || false,
          row.customer_email || null,
          row.customer_phone || null,
          row.created_at,
          row.updated_at,
        ]
      );
    }
    console.log(`  Done: ${hrRows.length} help_requests`);

    // 12. Import disclaimer_acknowledgments
    const daRows = data.tables.disclaimer_acknowledgments?.rows || [];
    console.log(`Importing ${daRows.length} disclaimer_acknowledgments...`);
    for (const row of daRows) {
      await client.query(
        `INSERT INTO disclaimer_acknowledgments (id, user_id, scan_id, acknowledged_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO NOTHING`,
        [row.id, row.user_id, row.scan_id, row.acknowledged_at]
      );
    }
    console.log(`  Done: ${daRows.length} disclaimer_acknowledgments`);

    await client.query("COMMIT");

    // Verify row counts
    console.log("\n=== VERIFICATION ===");
    const tables = [
      "users", "profiles", "scans", "compliance_checks", "risk_reports",
      "recommendations", "newsletter_preferences", "industry_templates",
      "consultants", "referrals", "help_requests", "disclaimer_acknowledgments",
    ];
    for (const table of tables) {
      const res = await client.query(`SELECT count(*) FROM ${table}`);
      console.log(`${table}: ${res.rows[0].count} rows`);
    }

    console.log("\nImport complete. All users have placeholder passwords — send reset emails.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Import failed, rolled back:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);

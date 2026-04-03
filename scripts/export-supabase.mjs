/**
 * Export ALL data from Supabase for migration to self-hosted PostgreSQL.
 * Run: SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/export-supabase.mjs
 * Output: scripts/data-export.json
 */
import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "fs";

const SUPABASE_URL = "https://omwrwwqnbknvrjwxnjxx.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error("Set SUPABASE_SERVICE_ROLE_KEY env var");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const TABLES = [
  "profiles",
  "scans",
  "compliance_checks",
  "risk_reports",
  "recommendations",
  "newsletter_preferences",
  "industry_templates",
  "consultants",
  "referrals",
  "help_requests",
  "disclaimer_acknowledgments",
];

async function main() {
  const exportData = { exportedAt: new Date().toISOString(), users: [], tables: {} };

  // 1. Export auth users
  console.log("Exporting auth users...");
  const { data: authData, error: authErr } = await supabase.auth.admin.listUsers();
  if (authErr) {
    console.error("Failed to export auth users:", authErr.message);
    process.exit(1);
  }
  exportData.users = authData.users.map((u) => ({
    id: u.id,
    email: u.email,
    created_at: u.created_at,
    email_confirmed_at: u.email_confirmed_at,
    last_sign_in_at: u.last_sign_in_at,
  }));
  console.log(`  ${exportData.users.length} users exported`);

  // 2. Export each table
  for (const table of TABLES) {
    console.log(`Exporting ${table}...`);
    const { data, error } = await supabase.from(table).select("*");
    if (error) {
      console.error(`  FAILED: ${error.message}`);
      exportData.tables[table] = { error: error.message, rows: [] };
    } else {
      exportData.tables[table] = { rows: data, count: data.length };
      console.log(`  ${data.length} rows`);
    }
  }

  // 3. Write to file
  const outputPath = "scripts/data-export.json";
  writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
  console.log(`\nExported to ${outputPath}`);

  // 4. Summary
  console.log("\n=== EXPORT SUMMARY ===");
  console.log(`Users: ${exportData.users.length}`);
  let totalRows = 0;
  for (const table of TABLES) {
    const t = exportData.tables[table];
    const count = t.error ? "FAILED" : t.count;
    totalRows += t.count || 0;
    console.log(`${table}: ${count}`);
  }
  console.log(`Total data rows: ${totalRows}`);
}

main().catch(console.error);

// Re-export requireAdmin from the new auth system.
// Admin routes now use direct DB queries instead of a Supabase service role client.
export { requireAdmin } from "@/lib/db/auth-checks";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  createSupabaseServerClient,
  requireAuth,
} from "@/lib/api-helpers";

/**
 * Verify the current session user is admin.
 * Returns { adminSupabase } on success or a NextResponse error.
 */
export async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { userId, error } = await requireAuth(supabase);
  if (!userId) {
    return { error: NextResponse.json({ error }, { status: 401 }) };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const adminEmails = (process.env.ADMIN_EMAIL || "").split(",").map((e) => e.trim().toLowerCase());
  if (!user?.email || !adminEmails.includes(user.email.toLowerCase())) {
    return {
      error: NextResponse.json({ error: "Zugriff verweigert" }, { status: 403 }),
    };
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return {
      error: NextResponse.json(
        { error: "Service-Role-Schlüssel nicht konfiguriert" },
        { status: 500 }
      ),
    };
  }

  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey
  );

  return { adminSupabase, error: null };
}

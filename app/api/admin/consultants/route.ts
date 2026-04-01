import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

// GET — admin: list all consultants with referral counts
export async function GET() {
  const { adminSupabase, error } = await requireAdmin();
  if (error) return error;

  const { data: consultants, error: fetchError } = await adminSupabase!
    .from("consultants")
    .select("*")
    .order("created_at", { ascending: false });

  if (fetchError) {
    console.error("Admin consultants fetch error:", fetchError);
    return NextResponse.json({ error: "Fehler beim Laden" }, { status: 500 });
  }

  // Get referral counts + commission totals per consultant
  const { data: referralData } = await adminSupabase!
    .from("referrals")
    .select("consultant_id, commission_initial, commission_recurring");

  const countMap: Record<string, number> = {};
  const commissionMap: Record<string, { initial: number; recurring: number }> = {};
  (referralData || []).forEach((r) => {
    countMap[r.consultant_id] = (countMap[r.consultant_id] || 0) + 1;
    if (!commissionMap[r.consultant_id]) commissionMap[r.consultant_id] = { initial: 0, recurring: 0 };
    commissionMap[r.consultant_id].initial += r.commission_initial || 0;
    commissionMap[r.consultant_id].recurring += r.commission_recurring || 0;
  });

  // Get help request counts per consultant
  const { data: helpCounts } = await adminSupabase!
    .from("help_requests")
    .select("consultant_id, status");

  const helpMap: Record<string, { total: number; pending: number }> = {};
  (helpCounts || []).forEach((h) => {
    if (!h.consultant_id) return;
    if (!helpMap[h.consultant_id]) helpMap[h.consultant_id] = { total: 0, pending: 0 };
    helpMap[h.consultant_id].total++;
    if (h.status === "pending") helpMap[h.consultant_id].pending++;
  });

  const enriched = (consultants || []).map((c) => ({
    ...c,
    referral_count: countMap[c.id] || 0,
    help_request_count: helpMap[c.id]?.total || 0,
    pending_requests: helpMap[c.id]?.pending || 0,
    commission_owed: (commissionMap[c.id]?.initial || 0) + (commissionMap[c.id]?.recurring || 0),
    commission_initial_total: commissionMap[c.id]?.initial || 0,
    commission_recurring_total: commissionMap[c.id]?.recurring || 0,
  }));

  return NextResponse.json({ consultants: enriched });
}

// PATCH — admin: update consultant (commission rate, active status)
export async function PATCH(request: Request) {
  const { adminSupabase, error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const { consultantId, commission_rate_initial, commission_rate_recurring, is_active } = body;

  if (!consultantId) {
    return NextResponse.json({ error: "Berater-ID erforderlich" }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (commission_rate_initial !== undefined) updates.commission_rate_initial = commission_rate_initial;
  if (commission_rate_recurring !== undefined) updates.commission_rate_recurring = commission_rate_recurring;
  if (is_active !== undefined) updates.is_active = is_active;

  const { data, error: updateError } = await adminSupabase!
    .from("consultants")
    .update(updates)
    .eq("id", consultantId)
    .select()
    .single();

  if (updateError) {
    console.error("Admin consultant update error:", updateError);
    return NextResponse.json({ error: "Aktualisierung fehlgeschlagen" }, { status: 500 });
  }

  return NextResponse.json({ consultant: data });
}

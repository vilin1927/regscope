import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/api-helpers";

// GET — returns list of expertise tags that have at least one active consultant
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: consultants } = await supabase
      .from("consultants")
      .select("tags")
      .eq("is_active", true);

    const tagSet = new Set<string>();
    (consultants || []).forEach((c) => {
      (c.tags || []).forEach((tag: string) => tagSet.add(tag));
    });

    return NextResponse.json({ tags: Array.from(tagSet) });
  } catch (err) {
    console.error("Active tags error:", err);
    return NextResponse.json({ tags: [] });
  }
}

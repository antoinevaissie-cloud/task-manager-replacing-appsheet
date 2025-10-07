import { NextResponse } from "next/server";

import { getSupabaseClient } from "@/lib/supabase/client";

export async function GET(request: Request) {
  const supabase = getSupabaseClient();
  const url = new URL(request.url);
  const daysParam = url.searchParams.get("days");
  const limit = Number.parseInt(daysParam ?? "14", 10);
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 90) : 14;

  const { data, error } = await supabase
    .from("daily_stats")
    .select("*")
    .order("stat_date", { ascending: false })
    .limit(safeLimit);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ stats: data ?? [] });
}

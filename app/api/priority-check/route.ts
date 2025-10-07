import { NextResponse } from "next/server";

import { getSupabaseClient } from "@/lib/supabase/client";
import { PRIORITY_LIMITS } from "@/lib/utils/priorityHelpers";
import { TaskPriority } from "@/types/task";
import { taskRowToTask, TaskRow } from "@/lib/supabase/mappers";

const ALLOWED_PRIORITIES: TaskPriority[] = ["P1", "P2", "P3", "P4"];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const priority = url.searchParams.get("priority") as TaskPriority | null;

  if (!priority || !ALLOWED_PRIORITIES.includes(priority)) {
    return NextResponse.json({ message: "Invalid priority" }, { status: 400 });
  }

  const supabase = getSupabaseClient();
  const limit = PRIORITY_LIMITS[priority];

  const countQuery = supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("status", "open")
    .eq("urgency", priority);

  const listQuery = supabase
    .from("tasks")
    .select("*")
    .eq("status", "open")
    .eq("urgency", priority)
    .order("due_date", { ascending: true })
    .limit(25);

  const [{ count, error: countError }, { data: listData, error: listError }] = await Promise.all([
    countQuery,
    listQuery,
  ]);

  if (countError || listError) {
    return NextResponse.json(
      { message: countError?.message ?? listError?.message ?? "Failed to fetch priority usage" },
      { status: 500 },
    );
  }

  const tasksAtPriority = (listData as TaskRow[] | null)?.map(taskRowToTask) ?? [];
  const current = count ?? 0;
  const allowed = limit === undefined || current < limit;

  return NextResponse.json({ allowed, current, limit: limit ?? null, tasksAtPriority });
}

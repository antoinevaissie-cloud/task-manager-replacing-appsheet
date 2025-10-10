import { NextResponse } from "next/server";
import dayjs from "dayjs";

import { getSupabaseClient } from "@/lib/supabase/client";
import { PRIORITY_LIMITS } from "@/lib/utils/priorityHelpers";
import { TaskPriority, TaskStatus } from "@/types/task";
import {
  taskRowToTask,
  taskToInsertRow,
  TaskRow,
} from "@/lib/supabase/mappers";

const ALLOWED_PRIORITIES: TaskPriority[] = ["P1", "P2", "P3", "P4"];
const ALLOWED_STATUSES: TaskStatus[] = ["open", "completed", "archived", "waiting"];

export async function GET(request: Request) {
  const supabase = getSupabaseClient();
  const url = new URL(request.url);
  const statusParam = url.searchParams.get("status");
  const includeArchived = url.searchParams.get("includeArchived") === "true";
  const dueBefore = url.searchParams.get("dueBefore");
  const dueAfter = url.searchParams.get("dueAfter");

  let query = supabase
    .from("tasks")
    .select("*")
    .order("due_date", { ascending: true })
    .order("created_at", { ascending: false });

  if (statusParam && ALLOWED_STATUSES.includes(statusParam as TaskStatus)) {
    query = query.eq("status", statusParam);
  }

  if (!includeArchived) {
    query = query.neq("status", "archived");
  }

  if (dueBefore) {
    query = query.lte("due_date", dueBefore);
  }

  if (dueAfter) {
    query = query.gte("due_date", dueAfter);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  const tasks = (data as TaskRow[] | null)?.map(taskRowToTask) ?? [];
  return NextResponse.json({ tasks });
}

interface CreateTaskBody {
  title?: string;
  description?: string | null;
  urgency?: TaskPriority;
  dueDate?: string;
  notes?: string | null;
  context?: string | null;
  projectId?: string | null;
  urls?: string[] | null;
  tags?: string[] | null;
  someday?: boolean;
  followUpItem?: boolean;
  force?: boolean;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as CreateTaskBody | null;

  if (!body) {
    return NextResponse.json({ message: "Invalid JSON payload" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const urgency = body.urgency ?? "P3";
  const dueDate =
    typeof body.dueDate === "string" && body.dueDate.trim().length > 0
      ? body.dueDate.trim()
      : body.someday
        ? null
        : dayjs().format("YYYY-MM-DD");
  const projectId =
    typeof body.projectId === "string" && body.projectId.trim().length > 0
      ? body.projectId.trim()
      : null;
  const urls = Array.isArray(body.urls)
    ? body.urls
        .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
        .filter((entry) => entry.length > 0)
    : null;

  if (!title) {
    return NextResponse.json({ message: "Task title is required" }, { status: 400 });
  }

  if (!ALLOWED_PRIORITIES.includes(urgency)) {
    return NextResponse.json({ message: "Invalid priority value" }, { status: 400 });
  }

  const supabase = getSupabaseClient();
  const limit = PRIORITY_LIMITS[urgency];

  if (limit !== undefined && body.force !== true) {
    const { count, error: countError } = await supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("status", "open")
      .eq("urgency", urgency);

    if (countError) {
      return NextResponse.json({ message: countError.message }, { status: 500 });
    }

    if ((count ?? 0) >= limit) {
      return NextResponse.json(
        {
          message: `Priority ${urgency} limit reached`,
          limit,
          current: count ?? 0,
        },
        { status: 409 },
      );
    }
  }

  const insertPayload = taskToInsertRow({
    title,
    description: body.description ?? null,
    urgency,
    status: body.someday ? "waiting" : "open",
    dueDate,
    notes: body.notes ?? null,
    context: body.context ?? null,
    projectId,
    urls,
    tags: body.tags ?? null,
    someday: body.someday ?? false,
    followUpItem: body.followUpItem ?? false,
    rolloverCount: 0,
    rescheduleCount: 0,
  });

  const { data, error } = await supabase
    .from("tasks")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json({ message: error?.message ?? "Failed to create task" }, { status: 500 });
  }

  const task = taskRowToTask(data as TaskRow);
  return NextResponse.json({ task }, { status: 201 });
}

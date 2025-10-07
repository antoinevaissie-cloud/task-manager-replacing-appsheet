import { NextResponse } from "next/server";
import dayjs from "dayjs";

import { getSupabaseClient } from "@/lib/supabase/client";
import { PRIORITY_LIMITS } from "@/lib/utils/priorityHelpers";
import { Task, TaskPriority } from "@/types/task";
import {
  taskPatchToUpdateRow,
  taskRowToTask,
  TaskRow,
} from "@/lib/supabase/mappers";

interface UpdateTaskBody extends Partial<Task> {
  force?: boolean;
  priorityReason?: string | null;
}

export async function PATCH(request: Request, context: unknown) {
  const { params } = (context ?? {}) as { params?: { id: string } };
  const id = params?.id;

  if (!id) {
    return NextResponse.json({ message: "Missing task identifier" }, { status: 400 });
  }
  const supabase = getSupabaseClient();
  const body = (await request.json().catch(() => null)) as UpdateTaskBody | null;

  if (!body) {
    return NextResponse.json({ message: "Invalid JSON payload" }, { status: 400 });
  }

  const { data: existingData, error: fetchError } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError) {
    return NextResponse.json({ message: fetchError.message }, { status: 404 });
  }

  const existing = taskRowToTask(existingData as TaskRow);

  if (body.urgency && body.urgency !== existing.urgency && body.force !== true) {
    const limit = PRIORITY_LIMITS[body.urgency];
    if (limit !== undefined) {
      const { count, error: countError } = await supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("status", "open")
        .eq("urgency", body.urgency as TaskPriority)
        .neq("id", id);

      if (countError) {
        return NextResponse.json({ message: countError.message }, { status: 500 });
      }

      if ((count ?? 0) >= limit) {
        return NextResponse.json(
          {
            message: `Priority ${body.urgency} limit reached`,
            limit,
            current: count ?? 0,
          },
          { status: 409 },
        );
      }
    }
  }

  const patch: Partial<Task> = { ...body };
  delete (patch as Record<string, unknown>).force;
  delete (patch as Record<string, unknown>).priorityReason;

  if (patch.status === "completed" && !patch.completedAt) {
    patch.completedAt = dayjs().toISOString();
  }

  if (patch.status && patch.status !== "completed") {
    patch.completedAt = patch.completedAt ?? null;
  }

  const updatePayload = taskPatchToUpdateRow(patch);
  updatePayload.last_rolled_over_at = patch.lastRolledOverAt ?? updatePayload.last_rolled_over_at ?? null;
  updatePayload.last_rescheduled_at = patch.lastRescheduledAt ?? updatePayload.last_rescheduled_at ?? null;

  const { data: updatedData, error: updateError } = await supabase
    .from("tasks")
    .update(updatePayload)
    .eq("id", id)
    .select("*")
    .single();

  if (updateError || !updatedData) {
    return NextResponse.json({ message: updateError?.message ?? "Failed to update task" }, { status: 500 });
  }

  if (patch.urgency && patch.urgency !== existing.urgency) {
    await supabase.from("priority_changes").insert({
      task_id: id,
      from_priority: existing.urgency,
      to_priority: patch.urgency,
      reason: body.priorityReason ?? null,
    });
  }

  const updatedTask = taskRowToTask(updatedData as TaskRow);
  return NextResponse.json({ task: updatedTask });
}

interface DeleteBody {
  reason?: string | null;
}

export async function DELETE(request: Request, context: unknown) {
  const { params } = (context ?? {}) as { params?: { id: string } };
  const id = params?.id;

  if (!id) {
    return NextResponse.json({ message: "Missing task identifier" }, { status: 400 });
  }
  const supabase = getSupabaseClient();
  const body = (await request.json().catch(() => ({}))) as DeleteBody;
  const reason = body?.reason ?? "Manual archive";

  const { data: existingData, error: fetchError } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !existingData) {
    return NextResponse.json({ message: "Task not found" }, { status: 404 });
  }

  const existing = existingData as TaskRow;

  const { data: updatedData, error: updateError } = await supabase
    .from("tasks")
    .update({ status: "archived" })
    .eq("id", id)
    .select("*")
    .single();

  if (updateError || !updatedData) {
    return NextResponse.json({ message: updateError?.message ?? "Failed to archive task" }, { status: 500 });
  }

  if (existing.status !== "archived") {
    await supabase.from("graveyard").insert({
      task_id: id,
      reason,
    });
  }

  const updatedTask = taskRowToTask(updatedData as TaskRow);
  return NextResponse.json({ task: updatedTask });
}

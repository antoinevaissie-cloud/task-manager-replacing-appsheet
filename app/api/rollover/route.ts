import { NextResponse } from "next/server";
import dayjs from "dayjs";

import { getSupabaseClient } from "@/lib/supabase/client";
import { taskRowToTask, TaskRow } from "@/lib/supabase/mappers";
import {
  determineRealityStage,
  shouldTriggerRealityCheck,
} from "@/lib/utils/realityCheck";

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");

  if (!secret || token !== secret) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseClient();
  const today = dayjs().startOf("day");
  const yesterday = today.subtract(1, "day");

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("status", "open")
    .eq("someday", false)
    .eq("follow_up_item", false)
    .lte("due_date", yesterday.format("YYYY-MM-DD"));

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  const tasks = (data as TaskRow[] | null) ?? [];

  if (tasks.length === 0) {
    return NextResponse.json({ rolledOver: 0, autoArchived: 0, tasks: [] });
  }

  const rolledTasks: TaskRow[] = [];
  let autoArchived = 0;

  for (const task of tasks) {
    const newRolloverCount = (task.rollover_count ?? 0) + 1;
    const nextStage = determineRealityStage(newRolloverCount);
    const shouldArchive = nextStage === "auto_archive";
    const currentTask = taskRowToTask(task);
    const triggerRealityCheck = shouldTriggerRealityCheck(currentTask, nextStage);
    let realityStage = shouldArchive ? "auto_archive" : nextStage;
    let realityDueAt = shouldArchive ? null : task.reality_check_due_at;
    if (!shouldArchive && nextStage === "none") {
      realityDueAt = null;
      realityStage = "none";
    } else if (triggerRealityCheck) {
      realityDueAt = dayjs().toISOString();
    }
    const updatePayload: Partial<TaskRow> = {
      due_date: today.format("YYYY-MM-DD"),
      rollover_count: newRolloverCount,
      last_rolled_over_at: dayjs().toISOString(),
      reality_check_stage: realityStage,
      reality_check_due_at: realityDueAt,
      ...(shouldArchive ? { status: "archived" as TaskRow["status"] } : {}),
    };

    const { data: updatedRow, error: updateError } = await supabase
      .from("tasks")
      .update(updatePayload)
      .eq("id", task.id)
      .select("*")
      .single();

    if (updateError || !updatedRow) {
      return NextResponse.json({ message: updateError?.message ?? "Failed to rollover task" }, { status: 500 });
    }

    const { error: historyError } = await supabase.from("rollover_history").insert({
      task_id: task.id,
      from_date: task.due_date,
      to_date: today.format("YYYY-MM-DD"),
      priority: task.urgency,
      automatic: true,
    });

    if (historyError) {
      return NextResponse.json({ message: historyError.message }, { status: 500 });
    }

    if (shouldArchive) {
      autoArchived += 1;
      await supabase.from("graveyard").insert({
        task_id: task.id,
        reason: "Auto-archived after 10 rollovers",
      });
      await supabase.from("reality_check_events").insert({
        task_id: task.id,
        stage: "auto_archive",
        decision: "auto_archive",
        decision_at: dayjs().toISOString(),
      });
    }

    rolledTasks.push(updatedRow as TaskRow);
  }

  return NextResponse.json({
    rolledOver: rolledTasks.length,
    autoArchived,
    tasks: rolledTasks.map(taskRowToTask),
  });
}

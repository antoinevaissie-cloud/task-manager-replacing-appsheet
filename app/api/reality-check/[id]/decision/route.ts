import { NextResponse } from "next/server";
import dayjs from "dayjs";

import { getSupabaseClient } from "@/lib/supabase/client";
import { taskRowToTask, taskPatchToUpdateRow, TaskRow } from "@/lib/supabase/mappers";
import { getLowerPriority } from "@/lib/utils/realityCheck";
import { TaskPriority } from "@/types/task";

interface DecisionBody {
  decision: "keep" | "downgrade" | "someday" | "archive";
  notes?: string;
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const supabase = getSupabaseClient();
  const body = (await request.json().catch(() => null)) as DecisionBody | null;

  if (!body || !body.decision) {
    return NextResponse.json({ message: "Invalid decision payload" }, { status: 400 });
  }

  const { data: taskRow, error: fetchError } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !taskRow) {
    return NextResponse.json({ message: "Task not found" }, { status: 404 });
  }

  const task = taskRowToTask(taskRow as TaskRow);
  if (task.realityCheckStage === "none" || task.realityCheckStage === "auto_archive") {
    return NextResponse.json({ message: "Task does not require a reality check" }, { status: 400 });
  }

  const updates = taskPatchToUpdateRow({});
  let additionalMessage: string | undefined;

  switch (body.decision) {
    case "keep": {
      updates.reality_check_due_at = dayjs().add(1, "day").toISOString();
      updates.reality_check_stage = task.realityCheckStage;
      additionalMessage = "Task kept for review tomorrow";
      break;
    }
    case "downgrade": {
      const nextPriority = getLowerPriority(task.urgency as TaskPriority);
      updates.urgency = nextPriority;
      updates.reality_check_stage = "none";
      updates.reality_check_due_at = null;
      additionalMessage = `Priority downgraded to ${nextPriority}`;
      break;
    }
    case "someday": {
      updates.someday = true;
      updates.reality_check_stage = "none";
      updates.reality_check_due_at = null;
      additionalMessage = "Moved to Someday";
      break;
    }
    case "archive": {
      updates.status = "archived";
      updates.reality_check_stage = "none";
      updates.reality_check_due_at = null;
      additionalMessage = "Task archived";
      const { error: graveyardError } = await supabase.from("graveyard").insert({
        task_id: id,
        reason: "Archived via reality check",
      });
      if (graveyardError) {
        return NextResponse.json({ message: graveyardError.message }, { status: 500 });
      }
      break;
    }
    default:
      return NextResponse.json({ message: "Unsupported decision" }, { status: 400 });
  }

  const { data: updatedTaskRow, error: updateError } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (updateError || !updatedTaskRow) {
    return NextResponse.json({ message: updateError?.message ?? "Failed to apply decision" }, { status: 500 });
  }

  await supabase.from("reality_check_events").insert({
    task_id: id,
    stage: task.realityCheckStage,
    decision: body.decision,
    decision_at: dayjs().toISOString(),
    notes: body.notes ?? null,
  });

  const updatedTask = taskRowToTask(updatedTaskRow as TaskRow);

  return NextResponse.json({
    task: updatedTask,
    message: additionalMessage,
  });
}

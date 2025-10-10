"use client";

import { useEffect, useMemo } from "react";
import dayjs from "dayjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

import { useTaskStore } from "@/lib/store/taskStore";
import { RealityCheckModal } from "@/components/modals/RealityCheckModal";
import type { Task } from "@/types/task";

interface DecisionPayload {
  decision: "keep" | "downgrade" | "someday" | "archive";
  notes?: string;
}

export function RealityCheckManager() {
  const tasks = useTaskStore((state) => state.tasks);
  const pendingRealityTaskIds = useTaskStore((state) => state.pendingRealityTaskIds);
  const setPendingRealityTaskIds = useTaskStore((state) => state.setPendingRealityTaskIds);
  const activeRealityTaskId = useTaskStore((state) => state.activeRealityTaskId);
  const setActiveRealityTaskId = useTaskStore((state) => state.setActiveRealityTaskId);
  const upsertTask = useTaskStore((state) => state.upsertTask);

  const queryClient = useQueryClient();

  useEffect(() => {
    const now = dayjs();
    const pendingIds = tasks
      .filter((task) =>
        task.realityCheckStage !== "none" &&
        task.realityCheckStage !== "auto_archive" &&
        (!task.realityCheckDueAt || dayjs(task.realityCheckDueAt).isSame(now, "minute") || dayjs(task.realityCheckDueAt).isBefore(now)),
      )
      .map((task) => task.id);
    setPendingRealityTaskIds(pendingIds);
  }, [tasks, setPendingRealityTaskIds]);

  useEffect(() => {
    if (pendingRealityTaskIds.length === 0) {
      if (activeRealityTaskId) setActiveRealityTaskId(null);
      return;
    }
    if (!activeRealityTaskId || !pendingRealityTaskIds.includes(activeRealityTaskId)) {
      setActiveRealityTaskId(pendingRealityTaskIds[0]);
    }
  }, [pendingRealityTaskIds, activeRealityTaskId, setActiveRealityTaskId]);

  const activeTask: Task | undefined = useMemo(
    () => tasks.find((task) => task.id === activeRealityTaskId),
    [tasks, activeRealityTaskId],
  );

  const decisionMutation = useMutation({
    mutationFn: async ({ taskId, decision, notes }: { taskId: string } & DecisionPayload) => {
      const response = await fetch(`/api/reality-check/${taskId}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, notes }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.message ?? "Failed to submit decision");
      }

      return (await response.json()) as { task: Task; message?: string };
    },
    onSuccess: (payload) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      upsertTask(payload.task);
      if (payload.message) {
        toast.success(payload.message);
      } else {
        toast.success("Reality check logged");
      }
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Failed to submit decision");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const handleDecision = async (decision: DecisionPayload["decision"], notes?: string) => {
    if (!activeTask) return;
    await decisionMutation.mutateAsync({ taskId: activeTask.id, decision, notes });
    setActiveRealityTaskId(null);
  };

  if (!activeTask) {
    return null;
  }

  const actions = [
    {
      key: "keep",
      label: "Keep and review tomorrow",
      onSelect: () => handleDecision("keep"),
    },
    activeTask.urgency !== "P4"
      ? {
          key: "downgrade",
          label: "Downgrade priority",
          onSelect: () => handleDecision("downgrade"),
        }
      : null,
    {
      key: "someday",
      label: "Move to Someday",
      onSelect: () => handleDecision("someday"),
    },
    {
      key: "archive",
      label: "Archive task",
      onSelect: () => handleDecision("archive"),
      intent: "danger" as const,
    },
  ].filter(Boolean) as Array<{ key: string; label: string; onSelect: () => void; intent?: "primary" | "secondary" | "danger" }>;

  return (
    <RealityCheckModal
      open
      stage={activeTask.realityCheckStage}
      taskTitle={activeTask.title}
      rolloverCount={activeTask.rolloverCount}
      description={
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            {activeTask.someday
              ? "Someday task"
              : activeTask.dueDate
                ? `Due ${dayjs(activeTask.dueDate).format("MMM D, YYYY")}`
                : "No due date"} · Priority {activeTask.urgency}
          </p>
          {activeTask.notes ? <p className="text-xs text-muted-foreground">Notes: {activeTask.notes}</p> : null}
        </div>
      }
      actions={actions}
      onDismiss={activeTask.realityCheckStage === "warning" ? () => handleDecision("keep") : undefined}
    />
  );
}

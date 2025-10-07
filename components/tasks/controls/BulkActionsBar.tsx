"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTaskStore } from "@/lib/store/taskStore";
import { useTaskMutations } from "@/lib/hooks/useTasks";
import { Task, TaskPriority } from "@/types/task";
import { PRIORITY_LIMITS, priorityLabels } from "@/lib/utils/priorityHelpers";
import dayjs from "dayjs";

const PRIORITY_OPTIONS: TaskPriority[] = ["P1", "P2", "P3", "P4"];

export function BulkActionsBar() {
  const selectedTaskIds = useTaskStore((state) => state.selectedTaskIds);
  const clearSelection = useTaskStore((state) => state.clearSelection);
  const tasks = useTaskStore((state) => state.tasks);
  const { updateTask } = useTaskMutations();
  const [isProcessing, setProcessing] = useState(false);

  const selectedCount = selectedTaskIds.size;
  if (selectedCount === 0) return null;

  const performBulkUpdate = async (
    updates: Partial<Task> | ((taskId: string) => Partial<Task>),
    successMessage: string,
  ) => {
    setProcessing(true);
    try {
      const promises = Array.from(selectedTaskIds).map((id) => {
        const patch = typeof updates === "function" ? updates(id) : updates;
        return updateTask.mutateAsync({ id, updates: patch });
      });
      await Promise.all(promises);
      toast.success(successMessage);
      clearSelection();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Bulk update failed";
      toast.error(message);
    } finally {
      setProcessing(false);
    }
  };

  const completeTasks = () =>
    performBulkUpdate(
      {
        status: "completed",
        completedAt: dayjs().toISOString(),
      },
      "Tasks completed",
    );

  const moveToSomeday = () =>
    performBulkUpdate(
      {
        someday: true,
        status: "open",
      },
      "Tasks moved to Someday",
    );

  const rescheduleTomorrow = () =>
    performBulkUpdate((taskId) => {
      const task = tasks.find((item) => item.id === taskId);
      return {
        dueDate: dayjs().add(1, "day").format("YYYY-MM-DD"),
        rescheduleCount: (task?.rescheduleCount ?? 0) + 1,
        lastRescheduledAt: dayjs().toISOString(),
      };
    }, "Tasks rescheduled");

  const changePriority = async (priority: TaskPriority) => {
    const limit = PRIORITY_LIMITS[priority];
    if (limit !== undefined) {
      const openAtPriority = tasks.filter((task) => task.status === "open" && task.urgency === priority);
      if (openAtPriority.length + selectedCount > limit) {
        toast.error(
          `${priorityLabels[priority]} limit exceeded. Select fewer tasks or downgrade existing ones first.`,
        );
        return;
      }
    }

    await performBulkUpdate({ urgency: priority }, `Priority changed to ${priorityLabels[priority]}`);
  };

  return (
    <div className="sticky top-20 z-30 flex items-center justify-between gap-3 rounded-xl border bg-background/95 px-4 py-3 shadow-lg backdrop-blur">
      <span className="text-sm font-medium">
        {selectedCount} task{selectedCount > 1 ? "s" : ""} selected
      </span>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={completeTasks} disabled={isProcessing}>
          Complete
        </Button>
        <Button variant="secondary" size="sm" onClick={moveToSomeday} disabled={isProcessing}>
          Move to Someday
        </Button>
        <Button variant="secondary" size="sm" onClick={rescheduleTomorrow} disabled={isProcessing}>
          +1 day
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={isProcessing}>
              Change Priority
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Select priority</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {PRIORITY_OPTIONS.map((option) => (
              <DropdownMenuItem key={option} onSelect={() => changePriority(option)}>
                {priorityLabels[option]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="ghost" size="sm" onClick={clearSelection} disabled={isProcessing}>
          Clear
        </Button>
      </div>
    </div>
  );
}

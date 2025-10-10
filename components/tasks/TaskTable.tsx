"use client";

import dayjs from "dayjs";
import { Checkbox } from "@/components/ui/checkbox";
import { useTaskStore } from "@/lib/store/taskStore";
import { Task } from "@/types/task";
import { cn } from "@/lib/utils";
import { priorityBadgeClasses } from "@/lib/utils/priorityHelpers";
import { QuickActions } from "@/components/tasks/QuickActions";

const URGENCY_ORDER: Record<Task["urgency"], number> = { P1: 0, P2: 1, P3: 2, P4: 3 };

interface TaskGroup {
  key: string;
  label: string;
  anchor: string;
  isOverdue: boolean;
  tasks: Task[];
}

interface TaskTableProps {
  groups: TaskGroup[];
  showDateHeaders?: boolean;
}

const formatDateLabel = (iso: string | null | undefined) => {
  if (!iso) return "No date";
  return dayjs(iso).format("M/D/YYYY");
};

export function TaskTable({ groups, showDateHeaders = true }: TaskTableProps) {
  const selectedIds = useTaskStore((state) => state.selectedTaskIds);
  const toggleTaskSelection = useTaskStore((state) => state.toggleTaskSelection);
  const setActiveTaskId = useTaskStore((state) => state.setActiveTaskId);

  const renderGroupRows = (group: TaskGroup) => {
    const sorted = [...group.tasks].sort((a, b) => {
      const urgencyDiff = URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency];
      if (urgencyDiff !== 0) return urgencyDiff;
      if (a.dueDate !== b.dueDate) return (a.dueDate ?? "").localeCompare(b.dueDate ?? "");
      return a.title.localeCompare(b.title);
    });

    return sorted.map((task) => {
      const isSelected = selectedIds.has(task.id);
      const badgeClasses = priorityBadgeClasses[task.urgency];
      const formattedDueDate = task.someday ? "Someday" : formatDateLabel(task.dueDate);
      const statusLabel = task.status.charAt(0).toUpperCase() + task.status.slice(1);

      const badgeText = task.urgency === "P1" ? "❗P1" : task.urgency;

      return (
        <tr
          key={task.id}
          className={cn(
            "border-b border-border/70 text-sm transition hover:bg-muted/30",
            isSelected && "bg-primary/5",
          )}
        >
          <td className="w-10 px-2 py-2">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => toggleTaskSelection(task.id)}
              aria-label={`Select ${task.title}`}
            />
          </td>
          <td className="w-20 px-2 py-2">
            <span
              className={cn(
                "inline-flex min-w-[3.5rem] items-center justify-center rounded-full border px-2 py-1 text-xs font-semibold uppercase tracking-wide",
                badgeClasses,
              )}
            >
              {badgeText}
            </span>
          </td>
          <td className="px-2 py-2">
            <button
              type="button"
              onClick={() => setActiveTaskId(task.id)}
              className="w-full truncate text-left text-sm font-medium leading-tight text-foreground hover:underline"
            >
              {task.title}
            </button>
            {task.projectId ? (
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{task.projectId}</p>
            ) : null}
          </td>
          <td className="w-28 px-2 py-2 text-xs uppercase tracking-wide text-muted-foreground">{statusLabel}</td>
          <td className="w-28 px-2 py-2 text-sm text-muted-foreground">{formattedDueDate}</td>
          <td className="w-[240px] px-2 py-2 align-middle">
            <div className="flex justify-end">
              <QuickActions task={task} variant="table" />
            </div>
          </td>
        </tr>
      );
    });
  };

  if (groups.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
        No tasks to display.
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] divide-y divide-border text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="w-10 px-2 py-2 text-left font-semibold">Select</th>
              <th className="w-20 px-2 py-2 text-left font-semibold">Priority</th>
              <th className="px-2 py-2 text-left font-semibold">Title</th>
              <th className="w-28 px-2 py-2 text-left font-semibold">Status</th>
              <th className="w-28 px-2 py-2 text-left font-semibold">Due</th>
              <th className="w-[220px] px-2 py-2 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          {groups.map((group) => (
            <tbody key={group.key} className="divide-y divide-border">
              {showDateHeaders ? (
                <tr id={`due-${group.anchor}`} className="bg-muted/30">
                  <td colSpan={6} className="px-3 py-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-base font-semibold text-foreground">{group.label}</span>
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">
                        ({group.tasks.length}){group.isOverdue ? " • Overdue" : ""}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : null}
              {renderGroupRows(group)}
            </tbody>
          ))}
        </table>
      </div>
    </div>
  );
}

import { cn } from "@/lib/utils";
import { Task } from "@/types/task";
import { QuickActions } from "./QuickActions";
import { formatDisplayDate, isPastDue } from "@/lib/utils/dateHelpers";
import { normalizeStatus } from "@/lib/utils/status";
import { priorityBadgeClasses, priorityLabels } from "@/lib/utils/priorityHelpers";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useTaskStore } from "@/lib/store/taskStore";
import type { ReactNode } from "react";

interface TaskItemProps {
  task: Task;
  allowSelection?: boolean;
  draggableHandle?: ReactNode;
  onClick?: (task: Task) => void;
  showDescription?: boolean;
}

export function TaskItem({
  task,
  allowSelection = false,
  draggableHandle,
  onClick,
  showDescription = true,
}: TaskItemProps) {
  const badgeClasses = priorityBadgeClasses[task.urgency];
  const normalizedStatus = normalizeStatus(task.status);
  const isOverdue = isPastDue(task.dueDate);
  const priorityLabel = priorityLabels[task.urgency];
  const badgeText = task.urgency === "P1" ? "❗P1" : task.urgency;
  const selectedIds = useTaskStore((state) => state.selectedTaskIds);
  const toggleTaskSelection = useTaskStore((state) => state.toggleTaskSelection);
  const isSelected = selectedIds.has(task.id);
  const scheduleLabel = task.someday || normalizedStatus === "waiting"
    ? "Someday"
    : task.dueDate
      ? `Due ${formatDisplayDate(task.dueDate)}`
      : "No due date";

  return (
    <article
      className={cn(
        "rounded-lg border bg-card p-4 shadow-sm transition",
        isSelected && "border-primary/60 bg-primary/5",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-1 items-start gap-3">
          {allowSelection ? (
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => toggleTaskSelection(task.id)}
              aria-label={`Select ${task.title}`}
              className="mt-1"
            />
          ) : null}
          {draggableHandle ? (
            <span className="mt-1 cursor-grab text-muted-foreground" aria-hidden>
              {draggableHandle}
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => onClick?.(task)}
            className="flex-1 space-y-1 text-left"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold uppercase tracking-wide",
                  badgeClasses,
                )}
              >
                {badgeText}
              </span>
              <p className="text-sm font-semibold leading-none">{task.title}</p>
              {task.projectId ? (
                <Badge variant="outline" className="text-[11px] uppercase tracking-wide">
                  {task.projectId}
                </Badge>
              ) : null}
              {task.followUpItem ? (
                <Badge variant="secondary" className="text-[11px] uppercase tracking-wide">
                  Follow-up
                </Badge>
              ) : null}
            </div>
            {showDescription && task.description ? (
              <p className="text-sm text-muted-foreground">{task.description}</p>
            ) : null}
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>{priorityLabel}</span>
              <span className="capitalize">{task.status}</span>
              <span>
                {scheduleLabel}
                {isOverdue && normalizedStatus === "open" ? (
                  <span className="ml-1 text-red-500">• Overdue</span>
                ) : null}
              </span>
              {task.rolloverCount > 0 ? <span>Rolled {task.rolloverCount}×</span> : null}
            </div>
          </button>
        </div>
        {normalizedStatus === "open" || normalizedStatus === "waiting" ? <QuickActions task={task} /> : null}
      </div>
    </article>
  );
}

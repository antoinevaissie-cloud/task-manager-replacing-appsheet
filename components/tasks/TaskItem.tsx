import { cn } from "@/lib/utils";
import { Task } from "@/types/task";
import { QuickActions } from "./QuickActions";
import { formatDisplayDate, isPastDue } from "@/lib/utils/dateHelpers";
import { priorityColors, priorityLabels } from "@/lib/utils/priorityHelpers";
import { Checkbox } from "@/components/ui/checkbox";
import { useTaskStore } from "@/lib/store/taskStore";
import type { ReactNode } from "react";

interface TaskItemProps {
  task: Task;
  allowSelection?: boolean;
  draggableHandle?: ReactNode;
  onClick?: (task: Task) => void;
}

export function TaskItem({ task, allowSelection = false, draggableHandle, onClick }: TaskItemProps) {
  const badgeColor = priorityColors[task.urgency];
  const isOverdue = isPastDue(task.dueDate);
  const selectedIds = useTaskStore((state) => state.selectedTaskIds);
  const toggleTaskSelection = useTaskStore((state) => state.toggleTaskSelection);
  const isSelected = selectedIds.has(task.id);

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
            <div className="flex items-center gap-2">
              <span className={cn("h-2 w-2 rounded-full", badgeColor)} aria-hidden />
              <p className="text-sm font-medium leading-none">{task.title}</p>
            </div>
            {task.description ? (
              <p className="text-sm text-muted-foreground">{task.description}</p>
            ) : null}
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>{priorityLabels[task.urgency]}</span>
              <span className="capitalize">{task.status}</span>
              <span>
                Due {formatDisplayDate(task.dueDate)}
                {isOverdue && task.status === "open" ? (
                  <span className="ml-1 text-red-500">• Overdue</span>
                ) : null}
              </span>
              {task.rolloverCount > 0 ? <span>Rolled {task.rolloverCount}×</span> : null}
            </div>
          </button>
        </div>
        {task.status === "open" ? <QuickActions task={task} /> : null}
      </div>
    </article>
  );
}

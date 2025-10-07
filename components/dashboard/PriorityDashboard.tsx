import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Task, TaskPriority } from "@/types/task";
import { PRIORITY_LIMITS, priorityLabels } from "@/lib/utils/priorityHelpers";
import { useTaskStore } from "@/lib/store/taskStore";

interface PriorityDashboardProps {
  tasks: Task[];
}

const PRIORITIES: TaskPriority[] = ["P1", "P2", "P3", "P4"];

export function PriorityDashboard({ tasks }: PriorityDashboardProps) {
  const priorityFilter = useTaskStore((state) => state.priorityFilter);
  const setPriorityFilter = useTaskStore((state) => state.setPriorityFilter);

  const counts = tasks.reduce<Record<TaskPriority, number>>(
    (acc, task) => {
      if (task.status === "open") {
        acc[task.urgency] += 1;
      }
      return acc;
    },
    { P1: 0, P2: 0, P3: 0, P4: 0 },
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Priority Usage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {PRIORITIES.map((priority) => {
          const limit = PRIORITY_LIMITS[priority];
          const value = counts[priority];
          const percentage = limit ? Math.min(100, Math.round((value / limit) * 100)) : 0;

          const isAtLimit = limit !== undefined && value >= limit;
          const isActiveFilter = priorityFilter === priority;

          return (
            <button
              key={priority}
              onClick={() => setPriorityFilter(isActiveFilter ? "all" : priority)}
              className="w-full space-y-1 rounded-lg border border-transparent p-2 text-left transition hover:border-muted"
            >
              <div className="flex items-center justify-between text-sm">
                <span className={isActiveFilter ? "font-semibold text-foreground" : undefined}>
                  {priorityLabels[priority]}
                </span>
                <span
                  className={
                    isAtLimit
                      ? "text-xs font-semibold text-destructive"
                      : "text-xs text-muted-foreground"
                  }
                >
                  {limit ? `${value} of ${limit}` : `${value} active`}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${
                    isAtLimit ? "bg-destructive" : isActiveFilter ? "bg-primary" : "bg-primary/70"
                  }`}
                  style={{ width: limit ? `${percentage}%` : "8px" }}
                />
              </div>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}

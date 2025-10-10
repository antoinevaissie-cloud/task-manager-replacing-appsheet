import type { Task, TaskPriority } from "@/types/task";

export const PRIORITY_LIMITS: Record<TaskPriority, number | undefined> = {
  P1: 3,
  P2: 5,
  P3: 10,
  P4: undefined,
};

export const priorityLabels: Record<TaskPriority, string> = {
  P1: "Critical",
  P2: "High",
  P3: "Medium",
  P4: "Low",
};

export const priorityColors: Record<TaskPriority, string> = {
  P1: "bg-red-500",
  P2: "bg-orange-500",
  P3: "bg-amber-400",
  P4: "bg-gray-400",
};

export const priorityBadgeClasses: Record<TaskPriority, string> = {
  P1: "bg-red-600 text-red-50 border-red-700",
  P2: "bg-orange-500 text-white border-orange-600",
  P3: "bg-amber-400 text-amber-950 border-amber-500",
  P4: "bg-slate-200 text-slate-900 border-slate-300",
};

export const getPriorityLimit = (priority: TaskPriority): number | undefined =>
  PRIORITY_LIMITS[priority];

export const getPriorityUsage = (
  tasks: Task[],
): Record<TaskPriority, number> => {
  return tasks.reduce(
    (acc, task) => {
      if (task.status === "open") {
        acc[task.urgency] += 1;
      }
      return acc;
    },
    { P1: 0, P2: 0, P3: 0, P4: 0 } as Record<TaskPriority, number>,
  );
};

export const canAddTaskAtPriority = (
  priority: TaskPriority,
  usage: Record<TaskPriority, number>,
): boolean => {
  const limit = getPriorityLimit(priority);
  if (limit === undefined) return true;
  return usage[priority] < limit;
};

export const describePrioritySlot = (
  priority: TaskPriority,
  usage: Record<TaskPriority, number>,
): string => {
  const limit = getPriorityLimit(priority);
  if (limit === undefined) {
    return `${usage[priority]} active`;
  }
  return `${usage[priority]} / ${limit} used`;
};

import dayjs from "dayjs";
import type { Task } from "@/types/task";

export const shouldRolloverTask = (task: Task, referenceDate = dayjs()): boolean => {
  if (task.status !== "open") return false;
  if (!task.dueDate) return false;
  const due = dayjs(task.dueDate);
  return due.isBefore(referenceDate, "day");
};

export const incrementRollover = (task: Task, referenceDate = dayjs()) => ({
  ...task,
  dueDate: referenceDate.format("YYYY-MM-DD"),
  rolloverCount: task.rolloverCount + 1,
  lastRolledOverAt: referenceDate.toISOString(),
});

export const requiresRealityCheck = (task: Task): boolean => {
  return task.rolloverCount >= 3 && task.rolloverCount < 10;
};

export const isAutoArchiveThreshold = (task: Task): boolean => {
  return task.rolloverCount >= 10;
};

import dayjs from "dayjs";
import { RealityCheckStage, Task, TaskPriority } from "@/types/task";

export const REALITY_THRESHOLDS = {
  warning: 3,
  alert: 5,
  intervention: 7,
  autoArchive: 10,
} as const;

export const determineRealityStage = (rolloverCount: number): RealityCheckStage => {
  if (rolloverCount >= REALITY_THRESHOLDS.autoArchive) return "auto_archive";
  if (rolloverCount >= REALITY_THRESHOLDS.intervention) return "intervention";
  if (rolloverCount >= REALITY_THRESHOLDS.alert) return "alert";
  if (rolloverCount >= REALITY_THRESHOLDS.warning) return "warning";
  return "none";
};

export const getLowerPriority = (priority: TaskPriority): TaskPriority => {
  switch (priority) {
    case "P1":
      return "P2";
    case "P2":
      return "P3";
    case "P3":
      return "P4";
    default:
      return "P4";
  }
};

export const shouldTriggerRealityCheck = (task: Task, nextStage: RealityCheckStage) => {
  if (nextStage === "none" || nextStage === "auto_archive") return false;
  if (task.realityCheckStage !== nextStage) return true;
  if (!task.realityCheckDueAt) return true;
  return dayjs(task.realityCheckDueAt).isBefore(dayjs());
};

import { Task, TaskStatus } from "@/types/task";

const KNOWN_STATUSES: TaskStatus[] = ["open", "completed", "archived", "waiting"];

export const normalizeStatus = (value: string | null | undefined): TaskStatus => {
  if (!value) return "open";
  const normalized = value.toString().toLowerCase() as TaskStatus;
  return KNOWN_STATUSES.includes(normalized) ? normalized : "open";
};

export const normalizeTask = (task: Task): Task => ({
  ...task,
  status: normalizeStatus(task.status),
});

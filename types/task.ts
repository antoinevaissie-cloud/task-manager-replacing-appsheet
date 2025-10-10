export type TaskPriority = "P1" | "P2" | "P3" | "P4";

export type TaskStatus = "open" | "completed" | "archived" | "waiting";

export type RealityCheckStage =
  | "none"
  | "warning"
  | "alert"
  | "intervention"
  | "auto_archive";

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  urgency: TaskPriority;
  status: TaskStatus;
  dueDate: string | null; // ISO date string when scheduled
  rolloverCount: number;
  rescheduleCount: number;
  lastRolledOverAt?: string | null;
  lastRescheduledAt?: string | null;
  tags?: string[] | null;
  context?: string | null;
  projectId?: string | null;
  urls?: string[] | null;
  someday: boolean;
  followUpItem: boolean;
  notes?: string | null;
  realityCheckStage: RealityCheckStage;
  realityCheckDueAt?: string | null;
  sortOrder?: number | null;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
}

export interface PriorityLimitState {
  priority: TaskPriority;
  limit: number;
  used: number;
}

export interface PriorityCheckResponse {
  allowed: boolean;
  current: number;
  limit: number;
  tasksAtPriority: Task[];
}

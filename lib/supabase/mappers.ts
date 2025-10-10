import { RealityCheckStage, Task, TaskPriority, TaskStatus } from "@/types/task";
import { normalizeStatus } from "@/lib/utils/status";

export interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  urgency: TaskPriority;
  status: TaskStatus;
  due_date: string | null;
  rollover_count: number;
  reschedule_count: number;
  last_rolled_over_at: string | null;
  last_rescheduled_at: string | null;
  tags: string[] | null;
  context: string | null;
  project_id: string | null;
  someday: boolean;
  follow_up_item: boolean;
  notes: string | null;
  reality_check_stage: RealityCheckStage;
  reality_check_due_at: string | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  urls: string[] | null;
}

export interface TaskInsertRow {
  title: string;
  description?: string | null;
  urgency: TaskPriority;
  status?: TaskStatus;
  due_date: string | null;
  rollover_count?: number;
  reschedule_count?: number;
  last_rolled_over_at?: string | null;
  last_rescheduled_at?: string | null;
  tags?: string[] | null;
  context?: string | null;
  project_id?: string | null;
  someday?: boolean;
  follow_up_item?: boolean;
  notes?: string | null;
  reality_check_stage?: RealityCheckStage;
  reality_check_due_at?: string | null;
  sort_order?: number | null;
  completed_at?: string | null;
  urls?: string[] | null;
}

export type TaskUpdateRow = Partial<TaskInsertRow>;

export const taskRowToTask = (row: TaskRow): Task => ({
  id: row.id,
  title: row.title,
  description: row.description,
  urgency: row.urgency,
  status: normalizeStatus(row.status),
  dueDate: row.due_date,
  rolloverCount: row.rollover_count,
  rescheduleCount: row.reschedule_count,
  lastRolledOverAt: row.last_rolled_over_at,
  lastRescheduledAt: row.last_rescheduled_at,
  tags: row.tags,
  context: row.context,
  projectId: row.project_id,
  someday: row.someday,
  followUpItem: row.follow_up_item,
  notes: row.notes,
  realityCheckStage: row.reality_check_stage,
  realityCheckDueAt: row.reality_check_due_at,
  sortOrder: row.sort_order,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  completedAt: row.completed_at,
  urls: row.urls,
});

export const taskToInsertRow = (task: {
  title: string;
  description?: string | null;
  urgency: TaskPriority;
  status?: TaskStatus;
  dueDate: string | null;
  rolloverCount?: number;
  rescheduleCount?: number;
  tags?: string[] | null;
  context?: string | null;
  projectId?: string | null;
  someday?: boolean;
  followUpItem?: boolean;
  notes?: string | null;
  urls?: string[] | null;
  sortOrder?: number | null;
  completedAt?: string | null;
}): TaskInsertRow => ({
  title: task.title,
  description: task.description ?? null,
  urgency: task.urgency,
  status: task.status,
  due_date: task.dueDate,
  rollover_count: task.rolloverCount,
  reschedule_count: task.rescheduleCount,
  tags: task.tags ?? null,
  context: task.context ?? null,
  project_id: task.projectId ?? null,
  someday: task.someday,
  follow_up_item: task.followUpItem,
  notes: task.notes ?? null,
  reality_check_stage: task.realityCheckStage ?? "none",
  reality_check_due_at: task.realityCheckDueAt ?? null,
  sort_order: task.sortOrder ?? null,
  completed_at: task.completedAt ?? null,
  urls: task.urls ?? null,
});

export const taskPatchToUpdateRow = (patch: Partial<Task>): TaskUpdateRow => {
  const update: TaskUpdateRow = {};
  if (patch.title !== undefined) update.title = patch.title;
  if (patch.description !== undefined) update.description = patch.description;
  if (patch.urgency !== undefined) update.urgency = patch.urgency;
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.dueDate !== undefined) update.due_date = patch.dueDate;
  if (patch.rolloverCount !== undefined) update.rollover_count = patch.rolloverCount;
  if (patch.rescheduleCount !== undefined) update.reschedule_count = patch.rescheduleCount;
  if (patch.lastRolledOverAt !== undefined) update.last_rolled_over_at = patch.lastRolledOverAt;
  if (patch.lastRescheduledAt !== undefined) update.last_rescheduled_at = patch.lastRescheduledAt;
  if (patch.tags !== undefined) update.tags = patch.tags;
  if (patch.context !== undefined) update.context = patch.context;
  if (patch.projectId !== undefined) update.project_id = patch.projectId;
  if (patch.someday !== undefined) update.someday = patch.someday;
  if (patch.followUpItem !== undefined) update.follow_up_item = patch.followUpItem;
  if (patch.notes !== undefined) update.notes = patch.notes;
  if (patch.urls !== undefined) update.urls = patch.urls;
  if (patch.realityCheckStage !== undefined) update.reality_check_stage = patch.realityCheckStage;
  if (patch.realityCheckDueAt !== undefined) update.reality_check_due_at = patch.realityCheckDueAt;
  if (patch.sortOrder !== undefined) update.sort_order = patch.sortOrder;
  if (patch.completedAt !== undefined) update.completed_at = patch.completedAt;
  return update;
};

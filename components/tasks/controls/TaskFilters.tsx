"use client";

import { ChangeEvent } from "react";
import { useTaskStore } from "@/lib/store/taskStore";
import { TaskPriority, TaskStatus } from "@/types/task";

const PRIORITY_OPTIONS: Array<{ value: TaskPriority | "all"; label: string }> = [
  { value: "all", label: "All priorities" },
  { value: "P1", label: "Critical" },
  { value: "P2", label: "High" },
  { value: "P3", label: "Medium" },
  { value: "P4", label: "Low" },
];

const STATUS_OPTIONS: Array<{ value: TaskStatus | "all"; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "open", label: "Open" },
  { value: "completed", label: "Completed" },
  { value: "waiting", label: "Waiting" },
  { value: "archived", label: "Archived" },
];

export function TaskFilters() {
  const priorityFilter = useTaskStore((state) => state.priorityFilter);
  const statusFilter = useTaskStore((state) => state.statusFilter);
  const setPriorityFilter = useTaskStore((state) => state.setPriorityFilter);
  const setStatusFilter = useTaskStore((state) => state.setStatusFilter);
  const onPriorityChange = (event: ChangeEvent<HTMLSelectElement>) =>
    setPriorityFilter(event.target.value as TaskPriority | "all");
  const onStatusChange = (event: ChangeEvent<HTMLSelectElement>) =>
    setStatusFilter(event.target.value as TaskStatus | "all");

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4 shadow-sm text-sm">
      <label className="space-y-1">
        <span className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Priority</span>
        <select
          value={priorityFilter}
          onChange={onPriorityChange}
          className="rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {PRIORITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1">
        <span className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</span>
        <select
          value={statusFilter}
          onChange={onStatusChange}
          className="rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

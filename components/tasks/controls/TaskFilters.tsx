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
  const searchQuery = useTaskStore((state) => state.searchQuery);
  const priorityFilter = useTaskStore((state) => state.priorityFilter);
  const statusFilter = useTaskStore((state) => state.statusFilter);
  const setSearchQuery = useTaskStore((state) => state.setSearchQuery);
  const setPriorityFilter = useTaskStore((state) => state.setPriorityFilter);
  const setStatusFilter = useTaskStore((state) => state.setStatusFilter);

  const onSearchChange = (event: ChangeEvent<HTMLInputElement>) => setSearchQuery(event.target.value);
  const onPriorityChange = (event: ChangeEvent<HTMLSelectElement>) =>
    setPriorityFilter(event.target.value as TaskPriority | "all");
  const onStatusChange = (event: ChangeEvent<HTMLSelectElement>) =>
    setStatusFilter(event.target.value as TaskStatus | "all");

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex w-full items-center gap-2 sm:max-w-md">
        <label htmlFor="task-search" className="sr-only">
          Search tasks
        </label>
        <input
          id="task-search"
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Search by title or notes"
          className="flex-1 rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
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
    </div>
  );
}

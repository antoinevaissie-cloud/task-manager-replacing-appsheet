"use client";

import { useMemo } from "react";
import { TaskForm } from "./TaskForm";
import { TaskList } from "./TaskList";
import { useTaskStore } from "@/lib/store/taskStore";
import { PriorityDashboard } from "@/components/dashboard/PriorityDashboard";
import { AnalyticsSummary } from "@/components/dashboard/AnalyticsSummary";
import { useTasksData } from "@/lib/hooks/useTasks";
import { TaskFilters } from "@/components/tasks/controls/TaskFilters";
import { BulkActionsBar } from "@/components/tasks/controls/BulkActionsBar";

export function TaskBoard() {
  const { isLoading } = useTasksData();
  const { tasks } = useTaskStore();
  const error = useTaskStore((state) => state.error);
  const searchQuery = useTaskStore((state) => state.searchQuery);
  const priorityFilter = useTaskStore((state) => state.priorityFilter);
  const statusFilter = useTaskStore((state) => state.statusFilter);
  const selectedTaskIds = useTaskStore((state) => state.selectedTaskIds);
  const selectAll = useTaskStore((state) => state.selectAll);
  const clearSelection = useTaskStore((state) => state.clearSelection);
  const setActiveTaskId = useTaskStore((state) => state.setActiveTaskId);

  const grouped = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const matchesFilter = (taskTitle: string, notes?: string | null) => {
      if (!normalizedQuery) return true;
      return (
        taskTitle.toLowerCase().includes(normalizedQuery) ||
        (notes ? notes.toLowerCase().includes(normalizedQuery) : false)
      );
    };

    const priorityMatch = (priority: string) => priorityFilter === "all" || priority === priorityFilter;
    const statusMatch = (status: string) => statusFilter === "all" || status === statusFilter;

    const filtered = tasks.filter(
      (task) => matchesFilter(task.title, task.notes) && priorityMatch(task.urgency) && statusMatch(task.status),
    );

    const activeTasks = filtered.filter((task) => task.status === "open" && !task.someday);
    const completed = filtered.filter((task) => task.status === "completed");

    return { activeTasks, completed };
  }, [tasks, searchQuery, priorityFilter, statusFilter]);

  const showLoadingState = isLoading && tasks.length === 0;
  const anySelected = selectedTaskIds.size > 0;
  const visibleOpenIds = grouped.activeTasks.map((task) => task.id);

  const handleSelectAll = () => {
    if (anySelected) {
      clearSelection();
      return;
    }
    selectAll(visibleOpenIds);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
      <div className="space-y-6">
        {anySelected ? <BulkActionsBar /> : null}

        <TaskFilters />

        <section className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight">Add a task</h2>
            <p className="text-sm text-muted-foreground">
              Capture quickly; limits and rollovers keep the board honest.
            </p>
          </div>
          <div className="mt-4">
            <TaskForm />
          </div>
        </section>

        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {grouped.activeTasks.length} active task{grouped.activeTasks.length === 1 ? "" : "s"}
          </h3>
          <button
            className="text-xs font-medium uppercase tracking-wide text-primary transition hover:text-primary/80"
            onClick={handleSelectAll}
          >
            {anySelected ? "Clear selection" : "Select all"}
          </button>
        </div>

        {showLoadingState ? (
          <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            Loading tasks…
          </div>
        ) : (
          <>
          <TaskList
            tasks={grouped.activeTasks}
            title="Active tasks"
            emptyState="No active tasks. Add one above or review the Graveyard for inspiration."
            enableSelection
            enableReorder
            onTaskClick={(task) => setActiveTaskId(task.id)}
            emptyAction={
              <button
                type="button"
                className="font-medium text-primary underline underline-offset-4"
                onClick={() => {
                  setActiveTaskId(null);
                  document.getElementById("task-title")?.focus();
                }}
              >
                Press Cmd/Ctrl+K to capture a task instantly.
              </button>
            }
          />

          <TaskList
            tasks={grouped.completed}
            title="Recently completed"
            emptyState="Complete tasks to see a history here."
            onTaskClick={(task) => setActiveTaskId(task.id)}
            emptyAction={<span className="text-muted-foreground">Celebrate progress by checking off tasks in the list above.</span>}
          />
          </>
        )}
      </div>

      <div className="hidden space-y-6 lg:block">
        <PriorityDashboard tasks={tasks} />
        <AnalyticsSummary />
      </div>
    </div>
  );
}

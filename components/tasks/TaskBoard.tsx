"use client";

import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { useTaskStore } from "@/lib/store/taskStore";
import { useTasksData } from "@/lib/hooks/useTasks";
import { TaskFilters } from "@/components/tasks/controls/TaskFilters";
import { BulkActionsBar } from "@/components/tasks/controls/BulkActionsBar";
import { TaskTable } from "@/components/tasks/TaskTable";

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
  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const matchesFilter = (taskTitle: string, description?: string | null, notes?: string | null) => {
      if (!normalizedQuery) return true;
      return (
        taskTitle.toLowerCase().includes(normalizedQuery) ||
        (description ? description.toLowerCase().includes(normalizedQuery) : false) ||
        (notes ? notes.toLowerCase().includes(normalizedQuery) : false)
      );
    };

    const priorityMatch = (priority: string) => priorityFilter === "all" || priority === priorityFilter;
    const statusMatch = (status: string) => statusFilter === "all" || status === statusFilter;

    const filtered = tasks.filter(
      (task) =>
        matchesFilter(task.title, task.description ?? null, task.notes) &&
        priorityMatch(task.urgency) &&
        statusMatch(task.status),
    );

    const activeTasks = filtered.filter((task) => task.status === "open" && !task.someday);

    const groupsMap = activeTasks.reduce<Map<string, typeof activeTasks>>((acc, task) => {
      const key = task.dueDate ?? "no-date";
      const current = acc.get(key) ?? [];
      current.push(task);
      acc.set(key, current);
      return acc;
    }, new Map());

    const sortedKeys = Array.from(groupsMap.keys()).sort((a, b) => {
      if (a === "no-date") return 1;
      if (b === "no-date") return -1;
      return dayjs(a).diff(dayjs(b));
    });

    const activeGroups = sortedKeys.map((key) => {
      const groupTasks = groupsMap.get(key) ?? [];
      const isNoDate = key === "no-date";
      const label = isNoDate ? "No due date" : dayjs(key).format("M/D/YYYY");
      const anchor = isNoDate ? "no-date" : key;
      const isOverdue = !isNoDate && dayjs(key).isBefore(dayjs(), "day");
      return {
        key,
        label,
        anchor,
        isOverdue,
        tasks: groupTasks,
      };
    });

    return { activeTasks, activeGroups };
  }, [tasks, searchQuery, priorityFilter, statusFilter]);

  const { activeTasks, activeGroups } = grouped;

  useEffect(() => {
    if (selectedGroupKey === null) {
      if (activeGroups.length === 0) {
        setSelectedGroupKey("all");
        return;
      }
      const todayKey = activeGroups.find((group) =>
        group.key !== "no-date" && dayjs(group.key).isSame(dayjs(), "day"),
      )?.key;
      setSelectedGroupKey(todayKey ?? activeGroups[0].key);
      return;
    }

    if (selectedGroupKey !== "all" && !activeGroups.some((group) => group.key === selectedGroupKey)) {
      if (activeGroups.length === 0) {
        setSelectedGroupKey("all");
      } else {
        setSelectedGroupKey(activeGroups[0].key);
      }
    }
  }, [selectedGroupKey, activeGroups]);

  const effectiveSelectedKey = selectedGroupKey ?? (activeGroups.length > 0 ? activeGroups[0].key : "all");
  const isAllView = effectiveSelectedKey === "all";
  const selectedGroup = !isAllView
    ? activeGroups.find((group) => group.key === effectiveSelectedKey)
    : null;
  const displayedTasks = isAllView ? activeTasks : selectedGroup?.tasks ?? [];

  const headerLabel = isAllView ? "All active tasks" : selectedGroup?.label ?? "No due date";
  const headerCount = displayedTasks.length;
  const totalActiveCount = activeTasks.length;

  const showLoadingState = isLoading && tasks.length === 0;
  const anySelected = selectedTaskIds.size > 0;
  const visibleOpenIds = displayedTasks.map((task) => task.id);

  const handleSelectAll = () => {
    if (anySelected) {
      clearSelection();
      return;
    }
    selectAll(visibleOpenIds);
  };

  const navBaseClasses = "flex items-center justify-between rounded-md px-3 py-2 text-sm transition";

  const tableGroups = isAllView ? activeGroups : selectedGroup ? [selectedGroup] : [];

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)]">
      <aside className="space-y-4 rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Open tasks</h2>
          <span className="text-xs text-muted-foreground">{totalActiveCount}</span>
        </div>
        {totalActiveCount === 0 ? (
          <p className="text-xs text-muted-foreground">No open tasks yet.</p>
        ) : (
          <nav className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => setSelectedGroupKey("all")}
              className={`${navBaseClasses} ${
                isAllView
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <span>All</span>
              <span className="text-xs">{totalActiveCount}</span>
            </button>
            {activeGroups.map((group) => (
              <button
                key={group.key}
                type="button"
                onClick={() => setSelectedGroupKey(group.key)}
                className={`${navBaseClasses} ${
                  effectiveSelectedKey === group.key
                    ? "bg-primary text-primary-foreground shadow"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span>{group.label}</span>
                <span className="text-xs">{group.tasks.length}</span>
              </button>
            ))}
          </nav>
        )}
      </aside>

      <div className="space-y-4">
        {anySelected ? <BulkActionsBar /> : null}

        <TaskFilters />

        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{headerLabel}</h3>
            <p className="text-xs text-muted-foreground">
              {headerCount} task{headerCount === 1 ? "" : "s"}
            </p>
          </div>
          {displayedTasks.length > 0 ? (
            <button
              className="text-xs font-medium uppercase tracking-wide text-primary transition hover:text-primary/80"
              onClick={handleSelectAll}
            >
              {anySelected ? "Clear selection" : "Select all"}
            </button>
          ) : null}
        </div>

        {showLoadingState ? (
          <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            Loading tasks…
          </div>
        ) : tableGroups.length > 0 ? (
          <TaskTable groups={tableGroups} />
        ) : (
          <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            No active tasks. Add one above or review the Someday list.
          </div>
        )}
      </div>
    </div>
  );
}

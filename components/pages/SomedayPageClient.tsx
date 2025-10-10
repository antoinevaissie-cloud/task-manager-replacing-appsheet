"use client";

import { TaskList } from "@/components/tasks/TaskList";
import { useTasksData } from "@/lib/hooks/useTasks";
import { useTaskStore } from "@/lib/store/taskStore";

export function SomedayPageClient() {
  const { isLoading } = useTasksData();
  const tasks = useTaskStore((state) => state.tasks);
  const searchQuery = useTaskStore((state) => state.searchQuery);
  const setActiveTaskId = useTaskStore((state) => state.setActiveTaskId);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const somedayTasks = tasks.filter((task) => {
    const isSomeday = task.someday || task.status === "waiting";
    if (!isSomeday) return false;
    if (!normalizedQuery) return true;
    const haystack = [task.title, task.description ?? "", task.notes ?? ""];
    return haystack.some((value) => value.toLowerCase().includes(normalizedQuery));
  });

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">Someday</p>
        <h1 className="text-3xl font-semibold tracking-tight">Ideas on standby</h1>
        <p className="text-sm text-muted-foreground">
          Park long-range ideas here until you are ready to bring them back into the active loop.
        </p>
      </header>

      {isLoading && somedayTasks.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">Loading…</div>
      ) : (
        <TaskList
          tasks={somedayTasks}
          title="Someday queue"
          emptyState="Nothing parked right now. Capture future ideas as they pop up."
          onTaskClick={(task) => setActiveTaskId(task.id)}
        />
      )}
    </main>
  );
}

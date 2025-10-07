"use client";

import { TaskList } from "@/components/tasks/TaskList";
import { useTasksData } from "@/lib/hooks/useTasks";
import { useTaskStore } from "@/lib/store/taskStore";

export function CompletedPageClient() {
  const { isLoading } = useTasksData();
  const tasks = useTaskStore((state) => state.tasks);
  const setActiveTaskId = useTaskStore((state) => state.setActiveTaskId);

  const completed = tasks.filter((task) => task.status === "completed");

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">Completed</p>
        <h1 className="text-3xl font-semibold tracking-tight">Celebrated wins</h1>
        <p className="text-sm text-muted-foreground">
          Completed tasks move here automatically so you can review progress and reclaim confidence.
        </p>
      </header>

      {isLoading && completed.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">Loading…</div>
      ) : (
        <TaskList
          tasks={completed}
          title="Recently completed"
          emptyState="Finish tasks to build your win history."
          onTaskClick={(task) => setActiveTaskId(task.id)}
        />
      )}
    </main>
  );
}

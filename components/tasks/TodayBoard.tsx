"use client";

import dayjs from "dayjs";
import { useMemo } from "react";
import { useTaskStore } from "@/lib/store/taskStore";
import { TaskList } from "./TaskList";
import { useTasksData } from "@/lib/hooks/useTasks";

export function TodayBoard() {
  const { isLoading } = useTasksData();
  const tasks = useTaskStore((state) => state.tasks);
  const error = useTaskStore((state) => state.error);
  const setActiveTaskId = useTaskStore((state) => state.setActiveTaskId);

  const { overdue, today, upcoming, completed } = useMemo(() => {
    const startOfDay = dayjs().startOf("day");
    const overdueTasks = [];
    const todayTasks = [];
    const upcomingTasks = [];
    const completedToday = [];

    for (const task of tasks) {
      const due = dayjs(task.dueDate);
      if (task.status === "completed") {
        if (task.completedAt && dayjs(task.completedAt).isSame(startOfDay, "day")) {
          completedToday.push(task);
        }
        continue;
      }

      if (due.isBefore(startOfDay, "day")) {
        overdueTasks.push(task);
      } else if (due.isSame(startOfDay, "day")) {
        todayTasks.push(task);
      } else {
        upcomingTasks.push(task);
      }
    }

    return {
      overdue: overdueTasks,
      today: todayTasks,
      upcoming: upcomingTasks,
      completed: completedToday,
    };
  }, [tasks]);

  return (
    <div className="space-y-8">
      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <header className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight">Today&apos;s focus</h2>
          <p className="text-sm text-muted-foreground">
            {today.length > 0
              ? `You have ${today.length} task${today.length > 1 ? "s" : ""} scheduled for today.`
              : isLoading
                ? "Loading today\'s tasks…"
                : "No tasks due today. Pull something forward or review the backlog."}
          </p>
        </header>
      </section>

      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <TaskList
        tasks={overdue}
        title="Overdue"
        emptyState="All caught up — nothing overdue."
        onTaskClick={(task) => setActiveTaskId(task.id)}
      />

      <TaskList
        tasks={today}
        title="Due today"
        emptyState="No tasks are due today."
        onTaskClick={(task) => setActiveTaskId(task.id)}
      />

      <TaskList
        tasks={upcoming}
        title="Upcoming"
        emptyState="The rest of the week is clear."
        onTaskClick={(task) => setActiveTaskId(task.id)}
      />

      <TaskList
        tasks={completed}
        title="Completed today"
        emptyState="Complete a task to see it here."
        onTaskClick={(task) => setActiveTaskId(task.id)}
      />
    </div>
  );
}

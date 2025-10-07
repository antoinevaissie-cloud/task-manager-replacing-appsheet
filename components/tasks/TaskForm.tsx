"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useTaskStore } from "@/lib/store/taskStore";
import type { TaskPriority } from "@/types/task";
import { PRIORITY_LIMITS, priorityLabels } from "@/lib/utils/priorityHelpers";
import { today } from "@/lib/utils/dateHelpers";
import { useTaskMutations } from "@/lib/hooks/useTasks";

const PRIORITIES: TaskPriority[] = ["P1", "P2", "P3", "P4"];

interface TaskFormProps {
  onCreated?: () => void;
}

export function TaskForm({ onCreated }: TaskFormProps) {
  const tasks = useTaskStore((state) => state.tasks);
  const { createTask } = useTaskMutations();
  const inputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("P3");
  const [dueDate, setDueDate] = useState(() => today().format("YYYY-MM-DD"));
  const [error, setError] = useState<string | null>(null);

  const priorityUsage = useMemo(() => {
    return PRIORITIES.reduce<Record<TaskPriority, number>>((acc, value) => {
      acc[value] = tasks.filter(
        (task) => task.urgency === value && task.status === "open",
      ).length;
      return acc;
    }, { P1: 0, P2: 0, P3: 0, P4: 0 });
  }, [tasks]);

  const isAtLimit = (() => {
    const limit = PRIORITY_LIMITS[priority];
    if (limit === undefined) return false;
    return priorityUsage[priority] >= limit;
  })();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if ((event.metaKey || event.ctrlKey) && key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }

      if (key === "escape" && document.activeElement === inputRef.current) {
        event.preventDefault();
        setTitle("");
        inputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) return;

    setError(null);

    const limit = PRIORITY_LIMITS[priority];
    const currentCount = priorityUsage[priority];
    if (limit !== undefined && currentCount >= limit) {
      setError(
        `${priorityLabels[priority]} is at capacity. Resolve or downgrade existing tasks before adding another.`,
      );
      return;
    }

    createTask.mutate(
      {
        title: title.trim(),
        urgency: priority,
        dueDate,
      },
      {
        onSuccess: () => {
          onCreated?.();
          setTitle("");
          setPriority("P3");
          setDueDate(today().format("YYYY-MM-DD"));
        },
        onError: (mutationError) => {
          setError(mutationError instanceof Error ? mutationError.message : "Failed to add task");
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="task-title">
          Task title
        </label>
        <input
          id="task-title"
          ref={inputRef}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="What needs to happen?"
          required
        />
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="space-y-2 text-sm font-medium">
          <span>Priority</span>
          <select
            className="min-w-[160px] rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={priority}
            onChange={(event) => setPriority(event.target.value as TaskPriority)}
          >
            {PRIORITIES.map((value) => {
              const limit = PRIORITY_LIMITS[value];
              const currentCount = priorityUsage[value];
              return (
                <option key={value} value={value}>
                  {priorityLabels[value]} {limit ? `( ${currentCount}/${limit} )` : "(Unlimited)"}
                </option>
              );
            })}
          </select>
        </label>

        <label className="space-y-2 text-sm font-medium">
          <span>Due date</span>
          <input
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            className="rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
      </div>

      <div className="space-y-2">
        <Button type="submit" disabled={createTask.isPending || !title.trim() || isAtLimit}>
          {createTask.isPending ? "Adding…" : "Add task"}
        </Button>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {createTask.error && !error ? (
          <p className="text-sm text-destructive">
            {createTask.error instanceof Error ? createTask.error.message : "Failed to add task"}
          </p>
        ) : null}
      </div>
    </form>
  );
}

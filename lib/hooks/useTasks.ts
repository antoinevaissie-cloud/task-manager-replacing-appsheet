"use client";

import { useEffect } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "react-hot-toast";

import { useTaskStore } from "@/lib/store/taskStore";
import { Task, TaskPriority } from "@/types/task";
import { normalizeTask } from "@/lib/utils/status";

const TASKS_QUERY_KEY = ["tasks"];

interface CreateTaskPayload {
  title: string;
  urgency: TaskPriority;
  dueDate: string | null;
  description?: string | null;
  notes?: string | null;
  context?: string | null;
  projectId?: string | null;
  urls?: string[] | null;
  tags?: string[] | null;
  someday?: boolean;
  followUpItem?: boolean;
  force?: boolean;
}

interface UpdateTaskPayload {
  id: string;
  updates: Partial<Task> & { force?: boolean; priorityReason?: string | null };
}

interface ArchiveTaskPayload {
  id: string;
  reason?: string | null;
}

const fetchTasks = async (): Promise<Task[]> => {
  const response = await fetch("/api/tasks", { cache: "no-store" });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody?.message ?? "Failed to fetch tasks");
  }
  const payload = (await response.json()) as { tasks: Task[] };
  return payload.tasks;
};

export function useTasksData() {
  const setTasks = useTaskStore((state) => state.setTasks);
  const setError = useTaskStore((state) => state.setError);
  const setLoading = useTaskStore((state) => state.setLoading);

  const query = useQuery({
    queryKey: TASKS_QUERY_KEY,
    queryFn: fetchTasks,
  });

  useEffect(() => {
    setLoading(query.isLoading);
  }, [query.isLoading, setLoading]);

  useEffect(() => {
    if (query.isError) {
      setError(query.error instanceof Error ? query.error.message : "Failed to load tasks");
    } else {
      setError(undefined);
    }
  }, [query.isError, query.error, setError]);

  useEffect(() => {
    if (query.data) {
      setTasks(query.data);
    }
  }, [query.data, setTasks]);

  return query;
}

export function useTaskMutations() {
  const queryClient = useQueryClient();
  const setTasks = useTaskStore((state) => state.setTasks);
  const upsertTask = useTaskStore((state) => state.upsertTask);
  const mutateTask = useTaskStore((state) => state.mutateTask);
  const removeTask = useTaskStore((state) => state.removeTask);

  const createTask = useMutation({
    mutationFn: async (payload: CreateTaskPayload) => {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody?.message ?? "Failed to create task");
      }

      const body = (await response.json()) as { task: Task };
      return body.task;
    },
    onSuccess: (task) => {
      const normalized = normalizeTask(task);
      queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, (current) => {
        const next = current ? current.filter((existing) => existing.id !== normalized.id) : [];
        return [normalized, ...next];
      });
      upsertTask(normalized);
      toast.success("Task added");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Failed to create task";
      toast.error(message);
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, updates }: UpdateTaskPayload) => {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody?.message ?? "Failed to update task");
      }

      const body = (await response.json()) as { task: Task };
      return body.task;
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });
      const previous = queryClient.getQueryData<Task[]>(TASKS_QUERY_KEY) ?? [];
      const optimistic = previous.map((task) =>
        task.id === id
          ? normalizeTask({ ...task, ...updates, updatedAt: new Date().toISOString() })
          : task,
      );
      queryClient.setQueryData(TASKS_QUERY_KEY, optimistic);
      mutateTask(id, (current) => ({ ...current, ...updates, updatedAt: new Date().toISOString() }));
      return { previous };
    },
    onError: (error, _variables, context) => {
      const message = error instanceof Error ? error.message : "Failed to update task";
      toast.error(message);
      if (context?.previous) {
        queryClient.setQueryData(TASKS_QUERY_KEY, context.previous);
        setTasks(context.previous);
      }
    },
    onSuccess: (task) => {
      const normalized = normalizeTask(task);
      queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, (current) => {
        if (!current) return [normalized];
        return current.map((existing) => (existing.id === normalized.id ? normalized : existing));
      });
      upsertTask(normalized);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });

  const archiveTask = useMutation({
    mutationFn: async ({ id, reason }: ArchiveTaskPayload) => {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody?.message ?? "Failed to archive task");
      }

      const body = (await response.json()) as { task: Task };
      return body.task;
    },
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });
      const previous = queryClient.getQueryData<Task[]>(TASKS_QUERY_KEY) ?? [];
      const optimistic = previous.filter((task) => task.id !== id);
      queryClient.setQueryData(TASKS_QUERY_KEY, optimistic);
      removeTask(id);
      return { previous };
    },
    onError: (error, _variables, context) => {
      const message = error instanceof Error ? error.message : "Failed to archive task";
      toast.error(message);
      if (context?.previous) {
        queryClient.setQueryData(TASKS_QUERY_KEY, context.previous);
        setTasks(context.previous);
      }
    },
    onSuccess: (task) => {
      queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, (current) => {
        const next = current ? current.filter((existing) => existing.id !== task.id) : [];
        return next;
      });
      removeTask(task.id);
      toast.success("Task archived");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });

  return { createTask, updateTask, archiveTask };
}

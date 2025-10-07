import { create } from "zustand";
import { Task, TaskPriority, TaskStatus } from "@/types/task";

type TaskStoreState = {
  tasks: Task[];
  isLoading: boolean;
  error?: string;
  selectedTaskIds: Set<string>;
  searchQuery: string;
  priorityFilter: TaskPriority | "all";
  statusFilter: TaskStatus | "all";
  activeTaskId?: string | null;
  pendingRealityTaskIds: string[];
  activeRealityTaskId?: string | null;
  setTasks: (tasks: Task[]) => void;
  upsertTask: (task: Task) => void;
  removeTask: (taskId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (message?: string) => void;
  mutateTask: (taskId: string, updater: (task: Task) => Task) => void;
  toggleTaskSelection: (taskId: string) => void;
  clearSelection: () => void;
  selectAll: (taskIds: string[]) => void;
  setSearchQuery: (query: string) => void;
  setPriorityFilter: (priority: TaskPriority | "all") => void;
  setStatusFilter: (status: TaskStatus | "all") => void;
  reorderTasks: (orderedIds: string[]) => void;
  setActiveTaskId: (taskId: string | null) => void;
  setPendingRealityTaskIds: (taskIds: string[]) => void;
  shiftRealityQueue: () => void;
  setActiveRealityTaskId: (taskId: string | null) => void;
};

export const useTaskStore = create<TaskStoreState>((set) => ({
  tasks: [],
  isLoading: false,
  error: undefined,
  selectedTaskIds: new Set(),
  searchQuery: "",
  priorityFilter: "all",
  statusFilter: "all",
  activeTaskId: null,
  pendingRealityTaskIds: [],
  activeRealityTaskId: null,
  setTasks: (tasks) => set({ tasks }),
  upsertTask: (task) =>
    set((state) => {
      const existingIndex = state.tasks.findIndex((t) => t.id === task.id);
      if (existingIndex === -1) {
        return { tasks: [task, ...state.tasks] };
      }

      const nextTasks = [...state.tasks];
      nextTasks[existingIndex] = task;
      return { tasks: nextTasks };
    }),
  removeTask: (taskId) =>
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== taskId),
    })),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (message) => set({ error: message }),
  mutateTask: (taskId, updater) =>
    set((state) => {
      const index = state.tasks.findIndex((task) => task.id === taskId);
      if (index === -1) return state;

      const nextTasks = [...state.tasks];
      const original = nextTasks[index];
      const updatedTask = updater(original);
      nextTasks[index] = updatedTask;

      return { tasks: nextTasks };
    }),
  toggleTaskSelection: (taskId) =>
    set((state) => {
      const next = new Set(state.selectedTaskIds);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return { selectedTaskIds: next };
    }),
  clearSelection: () => set({ selectedTaskIds: new Set() }),
  selectAll: (taskIds) => set({ selectedTaskIds: new Set(taskIds) }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setPriorityFilter: (priority) => set({ priorityFilter: priority }),
  setStatusFilter: (status) => set({ statusFilter: status }),
  reorderTasks: (orderedIds) =>
    set((state) => {
      const idToTask = new Map(state.tasks.map((task) => [task.id, task]));
      const reordered = orderedIds
        .map((id, index) => {
          const task = idToTask.get(id);
          if (!task) return null;
          return { ...task, sortOrder: index };
        })
        .filter(Boolean) as Task[];

      const untouched = state.tasks.filter((task) => !orderedIds.includes(task.id));
      return {
        tasks: [...reordered, ...untouched],
      };
    }),
  setActiveTaskId: (taskId) => set({ activeTaskId: taskId }),
  setPendingRealityTaskIds: (taskIds) => set({ pendingRealityTaskIds: taskIds }),
  shiftRealityQueue: () =>
    set((state) => {
      const [, ...rest] = state.pendingRealityTaskIds;
      return { pendingRealityTaskIds: rest };
    }),
  setActiveRealityTaskId: (taskId) => set({ activeRealityTaskId: taskId }),
}));

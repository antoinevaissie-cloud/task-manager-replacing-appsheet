"use client";

import { ReactNode, useEffect } from "react";
import dayjs from "dayjs";
import { toast } from "react-hot-toast";

import { useTaskStore } from "@/lib/store/taskStore";
import { useTaskMutations } from "@/lib/hooks/useTasks";
import { nextMonday } from "@/lib/utils/dateHelpers";
import { normalizeStatus } from "@/lib/utils/status";

export function ShortcutProvider({ children }: { children: ReactNode }) {
  const selectedTaskIds = useTaskStore((state) => state.selectedTaskIds);
  const clearSelection = useTaskStore((state) => state.clearSelection);
  const setActiveTaskId = useTaskStore((state) => state.setActiveTaskId);
  const tasks = useTaskStore((state) => state.tasks);
  const { updateTask, archiveTask } = useTaskMutations();

  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      if (key === "escape") {
        clearSelection();
        setActiveTaskId(null);
        return;
      }

      const selectedIds = Array.from(selectedTaskIds);
      if (selectedIds.length === 0) return;

      const activeElement = document.activeElement as HTMLElement | null;
      const isEditableTarget = Boolean(
        activeElement &&
          (activeElement.tagName === "INPUT" ||
            activeElement.tagName === "TEXTAREA" ||
            activeElement.isContentEditable ||
            activeElement.getAttribute("role") === "textbox"),
      );

      const selectedTasks = tasks.filter((task) => selectedTaskIds.has(task.id));

      const completeSelected = async () => {
        try {
          await Promise.all(
            selectedTasks
              .filter((task) => normalizeStatus(task.status) !== "completed")
              .map((task) =>
                updateTask.mutateAsync({
                  id: task.id,
                  updates: {
                    status: "completed",
                    completedAt: dayjs().toISOString(),
                  },
                }),
              ),
          );
          toast.success("Selected tasks completed");
          clearSelection();
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to complete tasks";
          toast.error(message);
        }
      };

      const moveSelectedToSomeday = async () => {
        const candidates = selectedTasks.filter(
          (task) => !task.someday && normalizeStatus(task.status) === "open",
        );
        if (candidates.length === 0) {
          toast.error("Select open tasks to move to Someday");
          return;
        }
        try {
          await Promise.all(
            candidates.map((task) =>
              updateTask.mutateAsync({
                id: task.id,
                updates: {
                  someday: true,
                  status: "waiting",
                  dueDate: null,
                  lastRescheduledAt: dayjs().toISOString(),
                },
              }),
            ),
          );
          toast.success(`Moved ${candidates.length} task${candidates.length > 1 ? "s" : ""} to Someday`);
          clearSelection();
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to move tasks";
          toast.error(message);
        }
      };

      const rescheduleSelected = async () => {
        const promptValue = window.prompt(
          "Reschedule to: T = tomorrow, W = next week, or YYYY-MM-DD",
          "T",
        );
        if (!promptValue) return;
        const normalized = promptValue.trim().toLowerCase();

        let computeDate: (taskDue: string | null) => string | null = () => null;

        if (normalized === "t" || normalized === "tomorrow") {
          computeDate = (taskDue) => {
            const base = taskDue ? dayjs(taskDue) : dayjs();
            return base.add(1, "day").format("YYYY-MM-DD");
          };
        } else if (normalized === "w" || normalized === "week") {
          computeDate = () => nextMonday().format("YYYY-MM-DD");
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
          if (!dayjs(normalized, "YYYY-MM-DD", true).isValid()) {
            toast.error("Enter date as YYYY-MM-DD");
            return;
          }
          computeDate = () => dayjs(normalized).format("YYYY-MM-DD");
        } else {
          toast.error("Unknown reschedule option");
          return;
        }

        const candidates = selectedTasks.filter(
          (task) => normalizeStatus(task.status) !== "archived",
        );
        if (candidates.length === 0) {
          toast.error("No eligible tasks selected");
          return;
        }

        try {
          await Promise.all(
            candidates.map((task) => {
              const nextDue = computeDate(task.dueDate);
              if (!nextDue) return Promise.resolve();
              return updateTask.mutateAsync({
                id: task.id,
                updates: {
                  dueDate: nextDue,
                  rescheduleCount: task.rescheduleCount + 1,
                  lastRescheduledAt: dayjs().toISOString(),
                  status: "open",
                  someday: false,
                },
              });
            }),
          );
          toast.success("Tasks rescheduled");
          clearSelection();
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to reschedule";
          toast.error(message);
        }
      };

      if ((event.metaKey || event.ctrlKey) && key === "enter") {
        event.preventDefault();
        await completeSelected();
        return;
      }

      if (!event.metaKey && !event.ctrlKey && !event.altKey) {
        if (key === "c" && !isEditableTarget) {
          event.preventDefault();
          await completeSelected();
          return;
        }

        if ((key === "s" || key === "m") && !isEditableTarget) {
          event.preventDefault();
          await moveSelectedToSomeday();
          return;
        }

        if (key === "r" && !isEditableTarget) {
          event.preventDefault();
          await rescheduleSelected();
          return;
        }
      }

      if (key === "delete" || key === "backspace") {
        event.preventDefault();
        if (!confirm(`Archive ${selectedIds.length} task${selectedIds.length > 1 ? "s" : ""}?`)) {
          return;
        }
        try {
          await Promise.all(selectedIds.map((id) => archiveTask.mutateAsync({ id })));
          toast.success("Selected tasks archived");
          clearSelection();
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to archive tasks";
          toast.error(message);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedTaskIds,
    updateTask,
    archiveTask,
    clearSelection,
    setActiveTaskId,
    tasks,
  ]);

  return <>{children}</>;
}

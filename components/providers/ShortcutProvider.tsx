"use client";

import { ReactNode, useEffect } from "react";
import dayjs from "dayjs";
import { toast } from "react-hot-toast";

import { useTaskStore } from "@/lib/store/taskStore";
import { useTaskMutations } from "@/lib/hooks/useTasks";

export function ShortcutProvider({ children }: { children: ReactNode }) {
  const selectedTaskIds = useTaskStore((state) => state.selectedTaskIds);
  const clearSelection = useTaskStore((state) => state.clearSelection);
  const setActiveTaskId = useTaskStore((state) => state.setActiveTaskId);
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

      if ((event.metaKey || event.ctrlKey) && key === "enter") {
        event.preventDefault();
        try {
          await Promise.all(
            selectedIds.map((id) =>
              updateTask.mutateAsync({
                id,
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
        return;
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
  }, [selectedTaskIds, updateTask, archiveTask, clearSelection, setActiveTaskId]);

  return <>{children}</>;
}

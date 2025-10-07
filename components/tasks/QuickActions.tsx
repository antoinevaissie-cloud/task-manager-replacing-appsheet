"use client";

import { useState } from "react";
import dayjs from "dayjs";
import { toast } from "react-hot-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useTaskStore } from "@/lib/store/taskStore";
import { PRIORITY_LIMITS } from "@/lib/utils/priorityHelpers";
import { nextMonday } from "@/lib/utils/dateHelpers";
import { useTaskMutations } from "@/lib/hooks/useTasks";
import { Task } from "@/types/task";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CalendarClock,
  Check,
  FastForward,
} from "lucide-react";

interface QuickActionsProps {
  task: Task;
}

const ACTIONS = [
  { key: "raise", label: "Increase Priority", icon: ArrowUp },
  { key: "lower", label: "Decrease Priority", icon: ArrowDown },
  { key: "next-day", label: "Next Day", icon: ArrowRight },
  { key: "two-days", label: "Two Days", icon: FastForward },
  { key: "next-week", label: "Next Week", icon: CalendarClock },
  { key: "complete", label: "Complete", icon: Check },
] as const;

export function QuickActions({ task }: QuickActionsProps) {
  const tasks = useTaskStore((state) => state.tasks);
  const { updateTask } = useTaskMutations();
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const handleAction = async (action: (typeof ACTIONS)[number]) => {
    if (pendingAction) return;
    setPendingAction(action.key);

    try {
      switch (action.key) {
        case "raise": {
          const priorityOrder: Task["urgency"][] = ["P1", "P2", "P3", "P4"];
          const currentIndex = priorityOrder.indexOf(task.urgency);
          if (currentIndex <= 0) {
            setPendingAction(null);
            return;
          }
          const nextPriority = priorityOrder[currentIndex - 1];
          const limit = PRIORITY_LIMITS[nextPriority];
          if (limit !== undefined) {
            const usage = tasks.filter(
              (candidate) => candidate.status === "open" && candidate.urgency === nextPriority,
            ).length;
            if (usage >= limit) {
              toast.error(`${nextPriority} is at capacity. Resolve a task before upgrading another.`);
              setPendingAction(null);
              return;
            }
          }

          await updateTask.mutateAsync({ id: task.id, updates: { urgency: nextPriority } });
          toast.success("Priority raised");
          break;
        }
        case "lower": {
          const priorityOrder: Task["urgency"][] = ["P1", "P2", "P3", "P4"];
          const currentIndex = priorityOrder.indexOf(task.urgency);
          if (currentIndex === -1 || currentIndex === priorityOrder.length - 1) {
            setPendingAction(null);
            return;
          }
          const nextPriority = priorityOrder[currentIndex + 1];
          await updateTask.mutateAsync({ id: task.id, updates: { urgency: nextPriority } });
          toast.success("Priority lowered");
          break;
        }
        case "next-day": {
          const tomorrow = dayjs(task.dueDate).add(1, "day").format("YYYY-MM-DD");
          await updateTask.mutateAsync({
            id: task.id,
            updates: {
              dueDate: tomorrow,
              rescheduleCount: task.rescheduleCount + 1,
              lastRescheduledAt: dayjs().toISOString(),
            },
          });
          toast.success("Moved to tomorrow");
          break;
        }
        case "two-days": {
          const twoDays = dayjs(task.dueDate).add(2, "day").format("YYYY-MM-DD");
          await updateTask.mutateAsync({
            id: task.id,
            updates: {
              dueDate: twoDays,
              rescheduleCount: task.rescheduleCount + 1,
              lastRescheduledAt: dayjs().toISOString(),
            },
          });
          toast.success("Pushed by two days");
          break;
        }
        case "next-week": {
          await updateTask.mutateAsync({
            id: task.id,
            updates: {
              dueDate: nextMonday().format("YYYY-MM-DD"),
              rescheduleCount: task.rescheduleCount + 1,
              lastRescheduledAt: dayjs().toISOString(),
            },
          });
          toast.success("Scheduled for next week");
          break;
        }
        case "complete": {
          await updateTask.mutateAsync({
            id: task.id,
            updates: {
              status: "completed",
              completedAt: dayjs().toISOString(),
            },
          });
          toast((t) => (
            <div className="flex items-center gap-3 rounded-md bg-card px-4 py-3 text-sm shadow">
              <span className="font-medium">Task completed</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  updateTask.mutate({
                    id: task.id,
                    updates: { status: "open", completedAt: null },
                  });
                  toast.dismiss(t.id);
                }}
              >
                Undo
              </Button>
            </div>
          ));
          break;
        }
        default:
          break;
      }
    } catch {
      // errors already surfaced via mutation hook toasts
    } finally {
      setPendingAction(null);
    }
  };

  const isBusy = pendingAction !== null || updateTask.isPending;

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-1">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Tooltip key={action.key}>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={action.label}
                  onClick={() => void handleAction(action)}
                  disabled={isBusy}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{action.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

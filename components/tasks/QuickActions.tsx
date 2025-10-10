"use client";

import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { toast } from "react-hot-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useTaskStore } from "@/lib/store/taskStore";
import { nextMonday, today } from "@/lib/utils/dateHelpers";
import { normalizeStatus } from "@/lib/utils/status";
import { useTaskMutations } from "@/lib/hooks/useTasks";
import { Task } from "@/types/task";
import { Archive, CalendarClock, Check, Moon, SquarePen, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionsProps {
  task: Task;
  variant?: "card" | "table" | "modal";
}

type QuickActionKey =
  | "details"
  | "reschedule"
  | "complete"
  | "someday"
  | "archive";

export function QuickActions({ task, variant = "card" }: QuickActionsProps) {
  const setActiveTaskId = useTaskStore((state) => state.setActiveTaskId);
  const { updateTask, archiveTask } = useTaskMutations();
  const [pendingAction, setPendingAction] = useState<QuickActionKey | null>(null);
  const [customDate, setCustomDate] = useState<string>(task.dueDate ?? dayjs().format("YYYY-MM-DD"));
  const [customDateDialogOpen, setCustomDateDialogOpen] = useState(false);

  useEffect(() => {
    setCustomDate(task.dueDate ?? dayjs().format("YYYY-MM-DD"));
  }, [task.dueDate]);

  const buttonSize = useMemo(() => {
    if (variant === "table") return "icon-xs" as const;
    if (variant === "modal") return "icon-sm" as const;
    return "icon" as const;
  }, [variant]);

  const layoutClasses = useMemo(() => {
    const base = "flex flex-wrap items-center gap-1 text-muted-foreground";
    if (variant === "table") return `${base} justify-end`;
    if (variant === "modal") return `${base} justify-start`;
    return base;
  }, [variant]);

  const buttonTone =
    variant === "table"
      ? "text-muted-foreground hover:text-foreground"
      : "text-foreground/80 hover:text-foreground";

  const closeCustomDialog = () => setCustomDateDialogOpen(false);

  const isBusy = pendingAction !== null || updateTask.isPending || archiveTask.isPending;

  const baseForSchedule = task.dueDate ? dayjs(task.dueDate) : dayjs();

  const handleDetails = () => {
    if (variant === "modal") return;
    setPendingAction("details");
    setActiveTaskId(task.id);
    setPendingAction(null);
  };

  const applySchedule = async (value: string, successMessage: string) => {
    setPendingAction("reschedule");
    try {
      await updateTask.mutateAsync({
        id: task.id,
        updates: {
          dueDate: value,
          rescheduleCount: task.rescheduleCount + 1,
          lastRescheduledAt: dayjs().toISOString(),
          someday: false,
          status: "open",
        },
      });
      toast.success(successMessage);
    } finally {
      setPendingAction(null);
    }
  };

  const handleTomorrow = () => void applySchedule(baseForSchedule.add(1, "day").format("YYYY-MM-DD"), "Moved to tomorrow");

  const handleNextWeek = () => {
    const date = nextMonday().format("YYYY-MM-DD");
    void applySchedule(date, "Scheduled for next week");
  };

  const handleCustomSave = async () => {
    if (!customDate) {
      toast.error("Choose a new date");
      return;
    }
    await applySchedule(customDate, "Rescheduled");
    closeCustomDialog();
  };

  const handleComplete = async () => {
    setPendingAction("complete");
    try {
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
    } finally {
      setPendingAction(null);
    }
  };

  const status = normalizeStatus(task.status);
  const isSomedayTask = task.someday || status === "waiting";

  const handleSomedayToggle = async () => {
    setPendingAction("someday");
    const makeSomeday = !isSomedayTask;
    try {
      await updateTask.mutateAsync({
        id: task.id,
        updates: {
          someday: makeSomeday,
          status: makeSomeday ? "waiting" : "open",
          dueDate: makeSomeday ? null : task.dueDate ?? today().format("YYYY-MM-DD"),
          lastRescheduledAt: dayjs().toISOString(),
        },
      });
      toast.success(makeSomeday ? "Moved to Someday" : "Returned to active");
    } finally {
      setPendingAction(null);
    }
  };

  const handleArchive = async () => {
    if (pendingAction || !confirm("Archive task? (Can be restored from Graveyard)")) {
      return;
    }
    setPendingAction("archive");
    try {
      await archiveTask.mutateAsync({ id: task.id, reason: "Archived via quick actions" });
    } finally {
      setPendingAction(null);
    }
  };

  const shouldShowSomeday = status !== "archived" && status !== "completed";
  const shouldShowComplete = status === "open";

  return (
    <TooltipProvider>
      <div className={cn(layoutClasses)}>
        {variant !== "modal" ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size={buttonSize}
                variant="ghost"
                aria-label="View details"
                onClick={handleDetails}
                disabled={isBusy}
                className={buttonTone}
              >
                <SquarePen className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Open details</TooltipContent>
          </Tooltip>
        ) : null}

        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  size={buttonSize}
                  variant="ghost"
                  aria-label="Reschedule task"
                  disabled={isBusy}
                  className={buttonTone}
                >
                  <CalendarClock className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">Reschedule</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onSelect={handleTomorrow}>Tomorrow</DropdownMenuItem>
            <DropdownMenuItem onSelect={handleNextWeek}>Next week</DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                setCustomDateDialogOpen(true);
              }}
            >
              Custom date…
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {shouldShowSomeday ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size={buttonSize}
                variant="ghost"
                aria-label={isSomedayTask ? "Return to active" : "Move to Someday"}
                onClick={() => void handleSomedayToggle()}
                disabled={isBusy}
                className={buttonTone}
              >
                {isSomedayTask ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {isSomedayTask ? "Return to active" : "Move to Someday"}
            </TooltipContent>
          </Tooltip>
        ) : null}

        {shouldShowComplete ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size={buttonSize}
                variant="ghost"
                aria-label="Mark complete"
                onClick={() => void handleComplete()}
                disabled={isBusy}
                className={buttonTone}
              >
                <Check className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Mark complete</TooltipContent>
          </Tooltip>
        ) : null}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size={buttonSize}
              variant="ghost"
              aria-label="Archive task"
              onClick={() => void handleArchive()}
              disabled={isBusy}
              className={buttonTone}
            >
              <Archive className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Archive</TooltipContent>
        </Tooltip>
      </div>

      <Dialog open={customDateDialogOpen} onOpenChange={setCustomDateDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Pick a new due date</DialogTitle>
            <DialogDescription>Choose when you want to see this task again.</DialogDescription>
          </DialogHeader>
          <Input
            type="date"
            value={customDate ?? ""}
            onChange={(event) => setCustomDate(event.target.value)}
          />
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="ghost" onClick={closeCustomDialog} disabled={isBusy}>
              Cancel
            </Button>
            <Button onClick={() => void handleCustomSave()} disabled={isBusy || !customDate}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}

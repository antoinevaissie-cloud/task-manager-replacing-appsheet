"use client";

import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { toast } from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useTaskStore } from "@/lib/store/taskStore";
import { useTaskMutations } from "@/lib/hooks/useTasks";
import { Task, TaskPriority } from "@/types/task";
import { priorityLabels } from "@/lib/utils/priorityHelpers";

export function TaskDetailSheet() {
  const activeTaskId = useTaskStore((state) => state.activeTaskId);
  const setActiveTaskId = useTaskStore((state) => state.setActiveTaskId);
  const tasks = useTaskStore((state) => state.tasks);
  const { updateTask, archiveTask } = useTaskMutations();

  const task = useMemo(() => tasks.find((item) => item.id === activeTaskId), [tasks, activeTaskId]);

  const [draft, setDraft] = useState<Task | null>(task ?? null);
  const [isSaving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(task ? { ...task } : null);
  }, [task]);

  if (!task) {
    return null;
  }

  const close = () => setActiveTaskId(null);

  const handleChange = <K extends keyof Task>(key: K, value: Task[K]) => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSave = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      await updateTask.mutateAsync({
        id: draft.id,
        updates: {
          title: draft.title,
          description: draft.description,
          notes: draft.notes,
          urgency: draft.urgency,
          dueDate: draft.dueDate,
          context: draft.context,
          tags: draft.tags,
        },
      });
      toast.success("Task updated");
      close();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update task";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Archive this task?")) return;
    try {
      await archiveTask.mutateAsync({ id: task.id, reason: "Archived from detail view" });
      toast.success("Task archived");
      close();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to archive task";
      toast.error(message);
    }
  };

  return (
    <Dialog open={Boolean(task)} onOpenChange={(open) => (!open ? close() : undefined)}>
      <DialogContent className="max-w-lg space-y-4">
        <DialogHeader>
          <DialogTitle>Edit task</DialogTitle>
          <DialogDescription>Adjust details, notes, or priority. Changes save when you press Save.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title-edit">Title</Label>
            <Input
              id="task-title-edit"
              value={draft?.title ?? ""}
              onChange={(event) => handleChange("title", event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-desc-edit">Description</Label>
            <Textarea
              id="task-desc-edit"
              value={draft?.description ?? ""}
              onChange={(event) => handleChange("description", event.target.value)}
              placeholder="Optional description or checklist"
              rows={3}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">
              <span>Priority</span>
              <select
                value={draft?.urgency ?? task.urgency}
                onChange={(event) => handleChange("urgency", event.target.value as TaskPriority)}
                className="rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {(["P1", "P2", "P3", "P4"] as TaskPriority[]).map((value) => (
                  <option key={value} value={value}>
                    {priorityLabels[value]}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium">
              <span>Due date</span>
              <Input
                type="date"
                value={draft?.dueDate ?? dayjs().format("YYYY-MM-DD")}
                onChange={(event) => handleChange("dueDate", event.target.value)}
              />
            </label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-notes-edit">Notes</Label>
            <Textarea
              id="task-notes-edit"
              value={draft?.notes ?? ""}
              onChange={(event) => handleChange("notes", event.target.value)}
              placeholder="Add additional context, links, or checklists"
              rows={4}
            />
          </div>

          <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
            <p>
              Created {dayjs(task.createdAt).format("MMM D, YYYY hh:mm a")} • Updated {dayjs(task.updatedAt).format("MMM D, YYYY hh:mm a")}
            </p>
            {task.rolloverCount > 0 ? <p>Rolled over {task.rolloverCount}× so far.</p> : null}
            {task.rescheduleCount > 0 ? <p>Rescheduled {task.rescheduleCount}×.</p> : null}
          </div>
        </div>

        <DialogFooter className="flex justify-between gap-3 sm:justify-between">
          <Button variant="destructive" onClick={handleDelete} disabled={archiveTask.isPending}>
            Archive task
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || updateTask.isPending}>
              {isSaving || updateTask.isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
